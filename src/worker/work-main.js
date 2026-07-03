// work-main.js
import { corsHeaders, json, getMimeType } from "./work-utils.js";
import { handleNetworkRoutes } from "./work-network.js";
import { handleResponseRoutes } from "./work-response.js";
import { handleSafetyRoutes } from "./work-safety.js";

export default {
  async fetch(request, env) {
    const db = env.DB_cloud || null;   // 🔥 Prevent crash
    const url = new URL(request.url);
    const path = url.pathname;

    // 🔥 OPTIONS always return CORS
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders() });
    }

    // 🔥 API ROUTES (wrapped in try/catch)
    try {
      const responseResult = await handleResponseRoutes(path, request, db, url);
      if (responseResult) return wrap(responseResult);

      const safetyResult = await handleSafetyRoutes(path, request, db, url);
      if (safetyResult) return wrap(safetyResult);

      const networkResult = await handleNetworkRoutes(path, request, db, url);
      if (networkResult) return wrap(networkResult);
    } catch (err) {
      return wrap(json({ error: "Worker crashed", detail: err.message }, 500));
    }

    // 🔥 STATIC (R2)
    let key = path === "/" ? "index.html" : path.slice(1);
    const object = await env.R2.get(key);

    if (object) {
      return wrap(
        new Response(object.body, {
          headers: {
            "Content-Type": getMimeType(key),
            "Cache-Control": "public, max-age=3600"
          }
        })
      );
    }

    const fallback = await env.R2.get("index.html");
    if (fallback) {
      return wrap(
        new Response(fallback.body, {
          headers: { "Content-Type": "text/html" }
        })
      );
    }

    return wrap(new Response("Not found", { status: 404 }));
  }
};

// 🔥 ALWAYS add CORS to every response
function wrap(res) {
  const headers = new Headers(res.headers);
  headers.set("Access-Control-Allow-Origin", "*");
  headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Content-Type, X-User-Email, X-User-Id");

  return new Response(res.body, {
    status: res.status,
    headers
  });
}
