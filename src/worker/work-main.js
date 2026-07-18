// worker.js — FINAL + CLOUD AUTH + CLOUD MESSAGING + NETWORK + RESPONSE + SAFETY

import { handleNetwork } from "./work-network.js";
import { handleResponseRoutes } from "./work-response.js";
import { handleSafetyRoutes } from "./work-safety.js";
import { handleWorkMessage } from "./work-message.js";
import { handleAuth } from "./work-auth.js";   // ⭐ NEW AUTH ENGINE

const FRONTEND_DOMAIN = "https://beltlinecloud.com";

/* ---------------------------------------------------------
   CORS
--------------------------------------------------------- */
function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": FRONTEND_DOMAIN,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers":
      "Content-Type, Authorization, X-User-Email, X-User-Id, X-Vendor-Email",
    "Access-Control-Max-Age": "86400"
  };
}

function wrap(res) {
  const headers = new Headers(res.headers || {});
  Object.entries(corsHeaders()).forEach(([k, v]) => headers.set(k, v));
  return new Response(res.body, { status: res.status, headers });
}

/* ---------------------------------------------------------
   SHA-256 → hex
--------------------------------------------------------- */
async function sha256Hex(str) {
  const data = new TextEncoder().encode(str);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

/* ---------------------------------------------------------
   WORKER ENTRY
--------------------------------------------------------- */
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    // CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders() });
    }

    const db = env.DB_cloud;
    if (!db) {
      return wrap(
        new Response(JSON.stringify({ error: "DB missing" }), {
          status: 500,
          headers: { "Content-Type": "application/json" }
        })
      );
    }

    try {
      /* ---------------------------------------------------------
         CLOUD AUTH (SIGNUP + VERIFY + LOGIN)
      --------------------------------------------------------- */
      const auth = await handleAuth(path, request, db, url, env);
      if (auth) return wrap(auth);

      /* ---------------------------------------------------------
         CLOUD USER LOGIN — ORIGINAL HASHED ROUTE
         (kept for legacy compatibility)
      --------------------------------------------------------- */
      if (path === "/api/users/login" && request.method === "POST") {
        const body = await request.json();
        const { email, password } = body;

        const { results } = await db
          .prepare(
            `SELECT id, email, passwordHash, name, photoUrl, bio, roles, createdAt
             FROM cloud_users
             WHERE email = ?`
          )
          .bind(email)
          .all();

        if (!results.length) {
          return wrap(
            new Response(
              JSON.stringify({
                success: false,
                error: "Invalid credentials"
              }),
              {
                status: 401,
                headers: { "Content-Type": "application/json" }
              }
            )
          );
        }

        const user = results[0];
        const incomingHash = await sha256Hex(password);

        if (incomingHash !== user.passwordHash) {
          return wrap(
            new Response(
              JSON.stringify({
                success: false,
                error: "Invalid credentials"
              }),
              {
                status: 401,
                headers: { "Content-Type": "application/json" }
              }
            )
          );
        }

        user.roles = user.roles ? user.roles.split(",") : [];

        return wrap(
          new Response(
            JSON.stringify({
              success: true,
              user
            }),
            {
              status: 200,
              headers: { "Content-Type": "application/json" }
            }
          )
        );
      }

      /* ---------------------------------------------------------
         CLOUD MESSAGING
      --------------------------------------------------------- */
      const wm = await handleWorkMessage(path, request, db, url, env);
      if (wm) return wrap(wm);

      /* ---------------------------------------------------------
         NETWORK API (PUBLIC + STAFF + VENDOR + CHECKOUT)
      --------------------------------------------------------- */
      const net = await handleNetwork(path, request, db, url, env);
      if (net) return wrap(net);

      /* ---------------------------------------------------------
         RESPONSE ROUTES
      --------------------------------------------------------- */
      const r1 = await handleResponseRoutes(path, request, db, url);
      if (r1) return wrap(r1);

      /* ---------------------------------------------------------
         SAFETY ROUTES
      --------------------------------------------------------- */
      const r2 = await handleSafetyRoutes(path, request, db, url);
      if (r2) return wrap(r2);

    } catch (err) {
      return wrap(
        new Response(
          JSON.stringify({
            error: "Worker crashed",
            detail: err.message
          }),
          {
            status: 500,
            headers: { "Content-Type": "application/json" }
          }
        )
      );
    }

    /* ---------------------------------------------------------
       STATIC FILES (R2)
    --------------------------------------------------------- */
    let key = path === "/" ? "index.html" : path.slice(1);
    const object = await env.R2.get(key);

    if (object) {
      return wrap(
        new Response(object.body, {
          headers: {
            "Content-Type": "text/html",
            "Cache-Control": "public, max-age=3600"
          },
          status: 200
        })
      );
    }

    const fallback = await env.R2.get("index.html");
    if (fallback) {
      return wrap(
        new Response(fallback.body, {
          headers: { "Content-Type": "text/html" },
          status: 200
        })
      );
    }

    return wrap(
      new Response("Not found", {
        status: 404,
        headers: { "Content-Type": "text/plain" }
      })
    );
  }
};
