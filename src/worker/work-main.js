// worker.js

import { handleNetwork } from "./network-api.js";
import { handleResponseRoutes } from "./work-response.js";
import { handleSafetyRoutes } from "./work-safety.js";

const FRONTEND_DOMAIN = "https://beltlinecloud.com";

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

function redirect(url) {
  return new Response(null, {
    status: 302,
    headers: {
      "Location": url,
      ...corsHeaders()
    }
  });
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
      // LOGIN → DASHBOARD
      if (path === "/api/users/login" && request.method === "POST") {
        const body = await request.json();

        const { results } = await db.prepare(
          `SELECT * FROM cloud_users WHERE email = ? AND password = ?`
        ).bind(body.email, body.password).all();

        if (!results.length)
          return wrap(new Response(JSON.stringify({ error: "Invalid credentials" }), { status: 401 }));

        const user = results[0];
        return redirect(`${FRONTEND_DOMAIN}/cloud/dashboard.html?userId=${user.id}`);
      }

      // RESPONSE MEMBER VERIFY → RESPONSE DASHBOARD
      if (path === "/api/response/member/verify" && request.method === "POST") {
        const body = await request.json();

        await db.prepare(
          `UPDATE cloud_response_members SET status = ? WHERE id = ?`
        ).bind(body.approved ? "active" : "rejected", body.memberId).run();

        if (body.approved) {
          return redirect(`${FRONTEND_DOMAIN}/cloud/response/dashboard.html?memberId=${body.memberId}`);
        }

        return redirect(`${FRONTEND_DOMAIN}/cloud/response/rejected.html`);
      }

      const r1 = await handleResponseRoutes(path, request, db, url);
      if (r1) return wrap(r1);

      const r2 = await handleSafetyRoutes(path, request, db, url);
      if (r2) return wrap(r2);

      const r3 = await handleNetwork(path, request, db, url);
      if (r3) return wrap(r3);

    } catch (err) {
      return wrap(new Response(JSON.stringify({
        error: "Worker crashed",
        detail: err.message
      }), { status: 500 }));
    }

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
