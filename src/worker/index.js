import * as network from "./routes/network.js";
import * as vendors from "./routes/vendors.js";
import * as staff from "./routes/staff.js";
import * as workshops from "./routes/workshops.js";
import * as payments from "./routes/payments.js";
import * as client from "./routes/client.js";
import * as rider from "./routes/rider.js";
import * as orders from "./routes/orders.js";

import { getAssetFromKV } from "@cloudflare/kv-asset-handler";

export default {
  async fetch(request, env, ctx) {
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
    // STATIC FILES (FRONTEND)
    // -----------------------------
    //

    try {
      return await getAssetFromKV(
        { request, waitUntil: ctx.waitUntil.bind(ctx) },
        {
          ASSET_NAMESPACE: env.__STATIC_CONTENT,
          ASSET_MANIFEST: env.__STATIC_CONTENT_MANIFEST,
        }
      );
    } catch (err) {
      // fallback to index.html for SPA routes
      try {
        return await getAssetFromKV(
          {
            request: new Request(`${url.origin}/index.html`, request),
            waitUntil: ctx.waitUntil.bind(ctx),
          },
          {
            ASSET_NAMESPACE: env.__STATIC_CONTENT,
            ASSET_MANIFEST: env.__STATIC_CONTENT_MANIFEST,
          }
        );
      } catch (e) {
        return new Response("Not found", { status: 404 });
      }
    }
  },
};
