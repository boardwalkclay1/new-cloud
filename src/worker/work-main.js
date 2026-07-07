// worker.js — FIXED VERSION (NO REDESIGN)

import { handleNetwork } from "./work-network.js";
import { handleResponseRoutes } from "./work-response.js";
import { handleSafetyRoutes } from "./work-safety.js";

const FRONTEND_DOMAIN = "https://beltlinecloud.com";

/* CORS */
function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": FRONTEND_DOMAIN,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-User-Email, X-User-Id",
    "Access-Control-Max-Age": "86400"
  };
}

function wrap(res) {
  const headers = new Headers(res.headers);
  Object.entries(corsHeaders()).forEach(([k, v]) => headers.set(k, v));
  return new Response(res.body, { status: res.status, headers });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    if (request.method === "OPTIONS")
      return new Response(null, { status: 204, headers: corsHeaders() });

    const db = env.DB_cloud;
    if (!db)
      return wrap(new Response(JSON.stringify({ error: "DB missing" }), { status: 500 }));

    try {

      /* ---------------------------------------------------------
         CLOUD USER LOGIN — FIXED (returns JSON, not redirect)
      --------------------------------------------------------- */
      if (path === "/api/users/login" && request.method === "POST") {
        const body = await request.json();

        const { results } = await db.prepare(
          `SELECT * FROM cloud_users WHERE email = ? AND password = ?`
        ).bind(body.email, body.password).all();

        if (!results.length) {
          return wrap(new Response(JSON.stringify({
            success: false,
            error: "Invalid credentials"
          }), { status: 401 }));
        }

        const user = results[0];

        return wrap(new Response(JSON.stringify({
          success: true,
          user
        }), { status: 200 }));
      }

      /* ---------------------------------------------------------
         RESPONSE MEMBER VERIFY — JSON (unchanged)
      --------------------------------------------------------- */
      if (path === "/api/response/member/verify" && request.method === "POST") {
        const body = await request.json();

        await db.prepare(
          `UPDATE cloud_response_members SET status = ? WHERE id = ?`
        ).bind(body.approved ? "active" : "rejected", body.memberId).run();

        return wrap(new Response(JSON.stringify({
          success: true,
          status: body.approved ? "active" : "rejected"
        }), { status: 200 }));
      }

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

      /* ---------------------------------------------------------
         NETWORK ROUTES
      --------------------------------------------------------- */
      const r3 = await handleNetwork(path, request, db, url);
      if (r3) return wrap(r3);

    } catch (err) {
      return wrap(new Response(JSON.stringify({
        error: "Worker crashed",
        detail: err.message
      }), { status: 500 }));
    }

    /* ---------------------------------------------------------
       STATIC FILES (R2)
    --------------------------------------------------------- */
    let key = path === "/" ? "index.html" : path.slice(1);
    const object = await env.R2.get(key);

    if (object)
      return wrap(new Response(object.body, {
        headers: {
          "Content-Type": getMimeType(key),
          "Cache-Control": "public, max-age=3600"
        }
      }));

    const fallback = await env.R2.get("index.html");
    if (fallback)
      return wrap(new Response(fallback.body, {
        headers: { "Content-Type": "text/html" }
      }));

    return wrap(new Response("Not found", { status: 404 }));
  }
};
