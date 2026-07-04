// worker.js (utils + network + main)

const API_BASE = "https://api.beltlinecloud.com";
const FRONTEND_DOMAIN = "https://beltlinecloud.com";

import { handleResponseRoutes } from "./work-response.js";
import { handleSafetyRoutes } from "./work-safety.js";

/* ---------------- UTILS ---------------- */

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": FRONTEND_DOMAIN,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-User-Email, X-User-Id",
    "Access-Control-Max-Age": "86400"
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
  if (path === "/api/network/signup" && request.method === "POST")
    return signup(request, db);

  if (path === "/api/network/login" && request.method === "POST")
    return login(request, db);

  if (path === "/api/network/me" && request.method === "GET")
    return me(request, db);

  if (path === "/api/network/profile/update" && request.method === "POST")
    return updateProfile(request, db);

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

  // HASH PASSWORD
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const passwordHash = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");

  await db.prepare(
    `INSERT INTO cloud_users (id, email, passwordHash, name, roles)
     VALUES (?, ?, ?, ?, ?)`
  ).bind(id, email, passwordHash, name, "").run();

  return json({
    success: true,
    user: {
      id,
      email,
      name,
      roles: "",
      bio: "",
      photoUrl: "",
      responderProfile: null,
      vendorProfile: null,
      fastrollClient: null,
      fastrollRider: null,
      eventHostProfile: null
    }
  });
}

async function login(request, db) {
  const body = await request.json();
  const { email, password } = body;

  if (!email || !password)
    return json({ error: "Missing fields" }, 400);

  const user = await db.prepare(
    "SELECT id, email, name, passwordHash, roles FROM cloud_users WHERE email = ?"
  ).bind(email).first();

  if (!user)
    return json({ error: "Invalid credentials" }, 401);

  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const incomingHash = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");

  if (incomingHash !== user.passwordHash)
    return json({ error: "Invalid credentials" }, 401);

  return json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      roles: user.roles || "",
      bio: "",
      photoUrl: "",
      responderProfile: null,
      vendorProfile: null,
      fastrollClient: null,
      fastrollRider: null,
      eventHostProfile: null
    }
  });
}

async function me(request, db) {
  const email = request.headers.get("X-User-Email");
  if (!email) return json({ error: "Missing email" }, 400);

  const user = await db.prepare(
    "SELECT id, email, name, roles FROM cloud_users WHERE email = ?"
  ).bind(email).first();

  if (!user) return json({ error: "User not found" }, 404);

  return json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      roles: user.roles || "",
      bio: "",
      photoUrl: "",
      responderProfile: null,
      vendorProfile: null,
      fastrollClient: null,
      fastrollRider: null,
      eventHostProfile: null
    }
  });
}

async function updateProfile(request, db) {
  const body = await request.json();
  const { id, name, roles } = body;

  if (!id) return json({ error: "Missing id" }, 400);

  await db.prepare(
    `UPDATE cloud_users SET name = ?, roles = ? WHERE id = ?`
  ).bind(name || "", roles || "", id).run();

  return json({ success: true });
}

/* ---------------- MAIN WORKER ---------------- */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    /* OPTIONS — REQUIRED FOR CORS */
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders()
      });
    }

    const db = env.DB_cloud;
    if (!db) return json({ error: "DB_cloud binding missing" }, 500);

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

    /* STATIC FILES */
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

/* ---------------- WRAP CORS ---------------- */

function wrap(res) {
  const headers = new Headers(res.headers);

  headers.set("Access-Control-Allow-Origin", FRONTEND_DOMAIN);
  headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-User-Email, X-User-Id");
  headers.set("Access-Control-Max-Age", "86400");

  return new Response(res.body, {
    status: res.status,
    headers
  });
}
