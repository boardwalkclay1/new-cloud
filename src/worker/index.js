import * as network from "./routes/network.js";
import * as vendors from "./routes/vendors.js";
import * as staff from "./routes/staff.js";
import * as workshops from "./routes/workshops.js";
import * as payments from "./routes/payments.js";
import * as client from "./routes/client.js";
import * as rider from "./routes/rider.js";
import * as orders from "./routes/orders.js";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    //
    // ============================================================
    // CORS — MUST COME FIRST
    // ============================================================
    //
    const cors = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    };

    // Preflight
    if (method === "OPTIONS") {
      return new Response(null, { status: 204, headers: cors });
    }

    //
    // ============================================================
    // API ROUTES
    // ============================================================
    //

    try {
      // NETWORK — SPECIFIC
      if (path.startsWith("/api/network/products")) {
        return withCORS(await network.handle(request, env), cors);
      }

      if (path.startsWith("/api/network/services")) {
        return withCORS(await network.handle(request, env), cors);
      }

      if (path.startsWith("/api/network/explore")) {
        return withCORS(await network.handle(request, env), cors);
      }

      // VENDORS
      if (path.startsWith("/api/network/vendors")) {
        return withCORS(await vendors.handle(request, env), cors);
      }

      if (path.startsWith("/api/network/vendor")) {
        return withCORS(await vendors.handle(request, env), cors);
      }

      // NETWORK — GENERAL
      if (path.startsWith("/api/network")) {
        return withCORS(await network.handle(request, env), cors);
      }

      // STAFF
      if (path.startsWith("/api/staff")) {
        return withCORS(await staff.handle(request, env), cors);
      }

      // WORKSHOPS (LEGACY)
      if (
        path.startsWith("/api/workshops") ||
        path.startsWith("/api/availability") ||
        path.startsWith("/api/book") ||
        path.startsWith("/api/user/bookings")
      ) {
        return withCORS(await workshops.handle(request, env), cors);
      }

      // PAYMENTS
      if (path.startsWith("/api/paypal")) {
        return withCORS(await payments.handle(request, env), cors);
      }

      // CLIENT
      if (path.startsWith("/api/client")) {
        return withCORS(await client.handle(request, env), cors);
      }

      // RIDER
      if (path.startsWith("/api/rider")) {
        return withCORS(await rider.handle(request, env), cors);
      }

      // ORDERS
      if (
        path.startsWith("/api/order") ||
        path.startsWith("/api/client/tip-post")
      ) {
        return withCORS(await orders.handle(request, env), cors);
      }

      //
      // ============================================================
      // STATIC FILES (R2)
      // ============================================================
      //

      let key = path === "/" ? "index.html" : path.slice(1);

      // Support folder paths → index.html
      if (key.endsWith("/")) key += "index.html";

      const object = await env.R2.get(key);

      if (object) {
        return new Response(object.body, {
          headers: {
            ...cors,
            "Content-Type": getMimeType(key),
            "Cache-Control": "public, max-age=3600",
          },
        });
      }

      // Fallback to root index.html
      const fallback = await env.R2.get("index.html");
      if (fallback) {
        return new Response(fallback.body, {
          headers: { ...cors, "Content-Type": "text/html" },
        });
      }

      return new Response("Not found", { status: 404, headers: cors });

    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }
  },
};

// Attach CORS to API responses
function withCORS(response, cors) {
  const headers = new Headers(response.headers);
  for (const [k, v] of Object.entries(cors)) headers.set(k, v);
  return new Response(response.body, { status: response.status, headers });
}

// MIME TYPES
function getMimeType(path) {
  if (path.endsWith(".html")) return "text/html";
  if (path.endsWith(".js")) return "application/javascript";
  if (path.endsWith(".css")) return "text/css";
  if (path.endsWith(".json")) return "application/json";
  if (path.endsWith(".png")) return "image/png";
  if (path.endsWith(".jpg") || path.endsWith(".jpeg")) return "image/jpeg";
  if (path.endsWith(".svg")) return "image/svg+xml";
  if (path.endsWith(".webp")) return "image/webp";
  return "application/octet-stream";
}
