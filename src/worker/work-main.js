// worker.js (utils + network + main)
// response + safety are EXTERNAL and IMPORTED

// ✅ API base defined at the top
const API_BASE = "https://api.beltlinecloud.com";

import { handleResponseRoutes } from "./work-response.js";
import { handleSafetyRoutes } from "./work-safety.js";

/* ---------------- UTILS ---------------- */

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": API_BASE,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-User-Email, X-User-Id"
  };
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders()
    }
  });
}

function getMimeType(path) {
  if (path.endsWith(".html")) return "text/html";
  if (path.endsWith(".css")) return "text/css";
  if (path.endsWith(".js")) return "application/javascript";
  if (path.endsWith(".json")) return "application/json";
  if (path.endsWith(".png")) return "image/png";
  if (path.endsWith(".jpg") || path.endsWith(".jpeg")) return "image/jpeg";
  if (path.endsWith(".svg")) return "image/svg+xml";
  return "application/octet-stream";
}

/* ---------------- NETWORK ROUTES ---------------- */

async function handleNetworkRoutes(path, request, db, url) {
  // AUTH
  if (path === "/api/network/signup" && request.method === "POST")
    return signup(request, db);

  if (path === "/api/network/login" && request.method === "POST")
    return login(request, db);

  if (path === "/api/network/me" && request.method === "GET")
    return me(request, db);

  if (path === "/api/network/profile/update" && request.method === "POST")
    return updateProfile(request, db);

  // … other routes unchanged …
  return null;
}

/* ---------------- AUTH ---------------- */

async function signup(request, db) {
  const body = await request.json();
  const { email, password, name } = body;

  if (!email || !password || !name)
    return json({ error: "Missing fields" }, 400);

  const existing = await db.prepare(
    "SELECT id FROM cloud_users WHERE email = ?"
  ).bind(email).first();

  if (existing)
    return json({ error: "Email already exists" }, 400);

  const id = crypto.randomUUID();

  await db.prepare(
    `INSERT INTO cloud_users (id, email, password, name, roles)
     VALUES (?, ?, ?, ?, ?)`
  ).bind(id, email, password, name, "").run();

  return json({ success: true, user: { id, email, name, roles: "" } });
}

async function login(request, db) {
  const body = await request.json();
  const { email, password } = body;

  if (!email || !password)
    return json({ error: "Missing fields" }, 400);

  const user = await db.prepare(
    "SELECT id, email, name, password, roles, bio, photo_url FROM cloud_users WHERE email = ?"
  ).bind(email).first();

  if (!user || user.password !== password)
    return json({ error: "Invalid credentials" }, 401);

  return json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      roles: user.roles || "",
      bio: user.bio || "",
      photo_url: user.photo_url || ""
    }
  });
}

/* ---------------- MAIN WORKER ---------------- */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    if (request.method === "OPTIONS") {
      return wrap(new Response(null, { headers: corsHeaders() }));
    }

    const db = env.DB_cloud;
    if (!db) return wrap(json({ error: "DB_cloud binding missing" }, 500));

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

function wrap(res) {
  const headers = new Headers(res.headers);
  headers.set("Access-Control-Allow-Origin", API_BASE);
  headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Content-Type, X-User-Email, X-User-Id");

  return new Response(res.body, {
    status: res.status,
    headers
  });
}
