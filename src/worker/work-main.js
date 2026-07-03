// worker.js  (utils + network + main)
// response + safety are EXTERNAL and IMPORTED

import { handleResponseRoutes } from "./work-response.js";
import { handleSafetyRoutes } from "./work-safety.js";

/* ---------------- UTILS ---------------- */

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
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

  // VENDORS / PRODUCTS / SERVICES / WORKSHOPS
  if (path === "/api/network/vendors" && request.method === "GET")
    return listVendors(db);

  if (path === "/api/network/vendor" && request.method === "GET")
    return getVendor(url, db);

  if (path === "/api/network/vendor/create" && request.method === "POST")
    return createVendor(request, db);

  if (path === "/api/network/vendor/update" && request.method === "POST")
    return updateVendor(request, db);

  if (path === "/api/network/vendor/delete" && request.method === "POST")
    return deleteVendor(request, db);

  if (path === "/api/network/products" && request.method === "GET")
    return listProducts(db);

  if (path === "/api/network/product/create" && request.method === "POST")
    return createProduct(request, db);

  if (path === "/api/network/product/update" && request.method === "POST")
    return updateProduct(request, db);

  if (path === "/api/network/product/delete" && request.method === "POST")
    return deleteProduct(request, db);

  if (path === "/api/network/services" && request.method === "GET")
    return listServices(db);

  if (path === "/api/network/service/create" && request.method === "POST")
    return createService(request, db);

  if (path === "/api/network/service/update" && request.method === "POST")
    return updateService(request, db);

  if (path === "/api/network/service/delete" && request.method === "POST")
    return deleteService(request, db);

  if (path === "/api/network/workshop/create" && request.method === "POST")
    return createWorkshop(request, db);

  if (path === "/api/network/workshop/update" && request.method === "POST")
    return updateWorkshop(request, db);

  if (path === "/api/network/workshop/delete" && request.method === "POST")
    return deleteWorkshop(request, db);

  if (path === "/api/network/explore" && request.method === "GET")
    return explore(db);

  // EVENTS
  if (path === "/api/events/list" && request.method === "GET")
    return listEvents(db);

  if (path === "/api/events/get" && request.method === "GET")
    return getEvent(url, db);

  if (path === "/api/events/create" && request.method === "POST")
    return createEvent(request, db);

  if (path === "/api/events/update" && request.method === "POST")
    return updateEvent(request, db);

  if (path === "/api/events/delete" && request.method === "POST")
    return deleteEvent(request, db);

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
    "SELECT id, email, name, password, roles FROM cloud_users WHERE email = ?"
  ).bind(email).first();

  if (!user || user.password !== password)
    return json({ error: "Invalid credentials" }, 401);

  return json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      roles: user.roles || ""
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
      roles: user.roles || ""
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

    // CORS preflight
    if (request.method === "OPTIONS") {
      return wrap(new Response(null, { headers: corsHeaders() }));
    }

    // DB binding
    const db = env.DB_cloud;
    if (!db) return wrap(json({ error: "DB_cloud binding missing" }, 500));

    try {
      // RESPONSE ROUTES (external)
      const responseResult = await handleResponseRoutes(path, request, db, url);
      if (responseResult) return wrap(responseResult);

      // SAFETY ROUTES (external)
      const safetyResult = await handleSafetyRoutes(path, request, db, url);
      if (safetyResult) return wrap(safetyResult);

      // NETWORK ROUTES (this file)
      const networkResult = await handleNetworkRoutes(path, request, db, url);
      if (networkResult) return wrap(networkResult);

    } catch (err) {
      return wrap(json({ error: "Worker crashed", detail: err.message }, 500));
    }

    // STATIC (R2)
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
  headers.set("Access-Control-Allow-Origin", "*");
  headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Content-Type, X-User-Email, X-User-Id");

  return new Response(res.body, {
    status: res.status,
    headers
  });
}
