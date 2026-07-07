// worker.js — FULL FIXED VERSION (ALL IMPORTS KEPT)

import { handleNetwork } from "./work-network.js";
import { handleResponseRoutes } from "./work-response.js";
import { handleSafetyRoutes } from "./work-safety.js";
import { getMimeType } from "./mime.js";   // ← YOU HAD THIS BEFORE, KEEPING IT
import { handleVendorRoutes } from "./work-vendor.js"; // ← KEEPING YOUR VENDOR ROUTES
import { handleRiderRoutes } from "./work-rider.js";   // ← KEEPING YOUR RIDER ROUTES

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
         CLOUD USER LOGIN — FIXED + CONNECTED TO REAL TABLE
      --------------------------------------------------------- */
      if (path === "/api/users/login" && request.method === "POST") {
        const body = await request.json();
        const { email, password } = body;

        // YOUR REAL TABLE: cloud_users
        const { results } = await db.prepare(
          `SELECT id, email, password, name, photoUrl, bio, createdAt
           FROM cloud_users
           WHERE email = ?`
        ).bind(email).all();

        if (!results.length) {
          return wrap(new Response(JSON.stringify({
            success: false,
            error: "Invalid credentials"
          }), { status: 401 }));
        }

        const user = results[0];

        // RAW PASSWORD CHECK (matches your DB)
        if (user.password !== password) {
          return wrap(new Response(JSON.stringify({
            success: false,
            error: "Invalid credentials"
          }), { status: 401 }));
        }

        // RETURN ONLY WHAT CLOUD NEEDS
        return wrap(new Response(JSON.stringify({
          success: true,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            photoUrl: user.photoUrl,
            bio: user.bio,
            createdAt: user.createdAt
          }
        }), { status: 200 }));
      }

      /* ---------------------------------------------------------
         RESPONSE MEMBER VERIFY
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

      /* ---------------------------------------------------------
         VENDOR ROUTES (KEPT)
      --------------------------------------------------------- */
      const r4 = await handleVendorRoutes(path, request, db, url);
      if (r4) return wrap(r4);

      /* ---------------------------------------------------------
         RIDER ROUTES (KEPT)
      --------------------------------------------------------- */
      const r5 = await handleRiderRoutes(path, request, db, url);
      if (r5) return wrap(r5);

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
