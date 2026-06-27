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

    //
    // -----------------------------
    // API ROUTES
    // -----------------------------
    //

    // VENDORS + PRODUCTS + SERVICES + EXPLORE + FULL VENDOR PAGE
    if (
      path.startsWith("/api/network/vendors") ||
      path.startsWith("/api/network/services") ||
      path.startsWith("/api/network/products") ||
      path.startsWith("/api/network/explore") ||
      path.startsWith("/api/network/vendor")
    ) {
      return vendors.handle(request, env);
    }

    // NETWORK (auth + profiles + pay)
    if (path.startsWith("/api/network")) {
      return network.handle(request, env);
    }

    // STAFF PORTAL
    if (path.startsWith("/api/staff")) {
      return staff.handle(request, env);
    }

    // WORKSHOPS (legacy)
    if (
      path.startsWith("/api/workshops") ||
      path.startsWith("/api/availability") ||
      path.startsWith("/api/book") ||
      path.startsWith("/api/user/bookings")
    ) {
      return workshops.handle(request, env);
    }

    // PAYMENTS
    if (path.startsWith("/api/paypal")) {
      return payments.handle(request, env);
    }

    // FAST ROLL — CLIENT
    if (path.startsWith("/api/client")) {
      return client.handle(request, env);
    }

    // FAST ROLL — RIDER
    if (path.startsWith("/api/rider")) {
      return rider.handle(request, env);
    }

    // FAST ROLL — ORDERS (tips, delivery)
    if (
      path.startsWith("/api/order") ||
      path.startsWith("/api/client/tip-post")
    ) {
      return orders.handle(request, env);
    }

    //
    // -----------------------------
    // STATIC FILES FROM R2
    // -----------------------------
    //

    // Normalize path
    let key = path === "/" ? "index.html" : path.slice(1);

    // Try to fetch the file from R2
    const object = await env.R2.get(key);

    if (object) {
      return new Response(object.body, {
        headers: {
          "Content-Type": getMimeType(key),
          "Cache-Control": "public, max-age=3600"
        }
      });
    }

    // If file not found, fallback to index.html (SPA)
    const fallback = await env.R2.get("index.html");
    if (fallback) {
      return new Response(fallback.body, {
        headers: { "Content-Type": "text/html" }
      });
    }

    return new Response("Not found", { status: 404 });
  }
};

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
