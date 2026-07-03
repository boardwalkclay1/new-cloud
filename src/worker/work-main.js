// 🔥 Bind Worker to your custom domain
export const routes = [
  {
    pattern: "https://api.beltlinecloud.com/*",
    zone_name: "beltlinecloud.com"
  }
];

// work-main.js
import { corsHeaders, json, getMimeType } from "./work-utils.js";
import { handleNetworkRoutes } from "./work-network.js";
import { handleResponseRoutes } from "./work-response.js";
import { handleSafetyRoutes } from "./work-safety.js";

export default {
  async fetch(request, env) {
    const db = env.DB_cloud;
    const url = new URL(request.url);
    const path = url.pathname;

    await extensionHook(request, env, db);

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders() });
    }

    // RESPONSE UNIT
    const responseResult = await handleResponseRoutes(path, request, db, url);
    if (responseResult) return responseResult;

    // SAFETY + LOST & FOUND
    const safetyResult = await handleSafetyRoutes(path, request, db, url);
    if (safetyResult) return safetyResult;

    // NETWORK / FASTROLL / EVENTS / CIVIC
    const networkResult = await handleNetworkRoutes(path, request, db, url);
    if (networkResult) return networkResult;

    // STATIC (R2)
    let key = path === "/" ? "index.html" : path.slice(1);
    const object = await env.R2.get(key);

    if (object) {
      return new Response(object.body, {
        headers: {
          ...corsHeaders(),
          "Content-Type": getMimeType(key),
          "Cache-Control": "public, max-age=3600"
        }
      });
    }

    const fallback = await env.R2.get("index.html");
    if (fallback) {
      return new Response(fallback.body, {
        headers: {
          ...corsHeaders(),
          "Content-Type": "text/html"
        }
      });
    }

    return new Response("Not found", { status: 404, headers: corsHeaders() });
  }
};

async function extensionHook(request, env, db) {
  try {
    if (typeof globalThis.cloudBackupHook === "function") {
      await globalThis.cloudBackupHook(request, env, db);
    }
  } catch (e) {}
}
