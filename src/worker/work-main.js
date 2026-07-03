// worker.js  (single file: utils + network + main)

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
  if (path.startsWith("/api/network/signup") && request.method === "POST")
    return signup(request, db);

  if (path.startsWith("/api/network/login") && request.method === "POST")
    return login(request, db);

  if (path.startsWith("/api/network/me"))
    return me(request, db);

  if (path.startsWith("/api/network/profile/update") && request.method === "POST")
    return updateProfile(request, db);

  // NETWORK: VENDORS / PRODUCTS / SERVICES / WORKSHOPS / ORDERS
  if (path.startsWith("/api/network/vendors"))
    return listVendors(db);

  if (path.startsWith("/api/network/vendor") && request.method === "GET")
    return getVendor(url, db);

  if (path.startsWith("/api/network/vendor/create") && request.method === "POST")
    return createVendor(request, db);

  if (path.startsWith("/api/network/vendor/update") && request.method === "POST")
    return updateVendor(request, db);

  if (path.startsWith("/api/network/vendor/delete") && request.method === "POST")
    return deleteVendor(request, db);

  if (path.startsWith("/api/network/products") && request.method === "GET")
    return listProducts(db);

  if (path.startsWith("/api/network/product/create") && request.method === "POST")
    return createProduct(request, db);

  if (path.startsWith("/api/network/product/update") && request.method === "POST")
    return updateProduct(request, db);

  if (path.startsWith("/api/network/product/delete") && request.method === "POST")
    return deleteProduct(request, db);

  if (path.startsWith("/api/network/services") && request.method === "GET")
    return listServices(db);

  if (path.startsWith("/api/network/service/create") && request.method === "POST")
    return createService(request, db);

  if (path.startsWith("/api/network/service/update") && request.method === "POST")
    return updateService(request, db);

  if (path.startsWith("/api/network/service/delete") && request.method === "POST")
    return deleteService(request, db);

  if (path.startsWith("/api/network/workshop/create") && request.method === "POST")
    return createWorkshop(request, db);

  if (path.startsWith("/api/network/workshop/update") && request.method === "POST")
    return updateWorkshop(request, db);

  if (path.startsWith("/api/network/workshop/delete") && request.method === "POST")
    return deleteWorkshop(request, db);

  if (path.startsWith("/api/network/explore"))
    return explore(db);

  // EVENTS
  if (path.startsWith("/api/events/list"))
    return listEvents(db);

  if (path.startsWith("/api/events/get"))
    return getEvent(url, db);

  if (path.startsWith("/api/events/create") && request.method === "POST")
    return createEvent(request, db);

  if (path.startsWith("/api/events/update") && request.method === "POST")
    return updateEvent(request, db);

  if (path.startsWith("/api/events/delete") && request.method === "POST")
    return deleteEvent(request, db);

  // FASTROLL / STAFF / CIVIC handlers would plug in here

  return null;
}

/* AUTH / PROFILE */

async function signup(request, db) {
  const body = await request.json();
  const { email, password, name } = body;
  if (!email || !password || !name) return json({ error: "Missing fields" }, 400);

  const existing = await db.prepare(
    "SELECT id FROM cloud_users WHERE email = ?"
  ).bind(email).first();
  if (existing) return json({ error: "Email already exists" }, 400);

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
  if (!email || !password) return json({ error: "Missing fields" }, 400);

  const user = await db.prepare(
    "SELECT id, email, name, password, roles FROM cloud_users WHERE email = ?"
  ).bind(email).first();

  if (!user || user.password !== password)
    return json({ error: "Invalid credentials" }, 401);

  const safeUser = {
    id: user.id,
    email: user.email,
    name: user.name,
    roles: user.roles || ""
  };

  return json({ user: safeUser });
}

async function me(request, db) {
  const email = request.headers.get("X-User-Email");
  if (!email) return json({ error: "Missing email" }, 400);

  const user = await db.prepare(
    "SELECT id, email, name, roles FROM cloud_users WHERE email = ?"
  ).bind(email).first();

  if (!user) return json({ error: "User not found" }, 404);

  const safeUser = {
    id: user.id,
    email: user.email,
    name: user.name,
    roles: user.roles || ""
  };

  return json({ user: safeUser });
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

/* NETWORK HANDLERS (vendors/products/services/workshops) */

async function listVendors(db) {
  const { results } = await db.prepare(
    "SELECT * FROM network_vendors"
  ).all();
  return json(results);
}

async function getVendor(url, db) {
  const id = url.searchParams.get("id");
  if (!id) return json({ error: "Missing id" }, 400);

  const vendor = await db.prepare(
    "SELECT * FROM network_vendors WHERE id = ?"
  ).bind(id).first();

  const products = await db.prepare(
    "SELECT * FROM network_products WHERE vendorId = ?"
  ).bind(id).all();

  const services = await db.prepare(
    "SELECT * FROM network_services WHERE vendorId = ?"
  ).bind(id).all();

  const workshops = await db.prepare(
    "SELECT * FROM network_workshops WHERE vendorId = ?"
  ).bind(id).all();

  return json({
    vendor,
    products: products.results,
    services: services.results,
    workshops: workshops.results
  });
}

async function createVendor(request, db) {
  const body = await request.json();
  const id = crypto.randomUUID();

  await db.prepare(
    `INSERT INTO network_vendors (id, name)
     VALUES (?, ?)`
  ).bind(id, body.name || "").run();

  return json({ success: true, id });
}

async function updateVendor(request, db) {
  const body = await request.json();
  const { id, name } = body;
  if (!id) return json({ error: "Missing id" }, 400);

  await db.prepare(
    `UPDATE network_vendors SET name = ? WHERE id = ?`
  ).bind(name || "", id).run();

  return json({ success: true });
}

async function deleteVendor(request, db) {
  const body = await request.json();
  const { id } = body;
  if (!id) return json({ error: "Missing id" }, 400);

  await db.prepare(
    "DELETE FROM network_vendors WHERE id = ?"
  ).bind(id).run();

  return json({ success: true });
}

async function listProducts(db) {
  const { results } = await db.prepare(
    "SELECT * FROM network_products"
  ).all();
  return json(results);
}

async function createProduct(request, db) {
  const body = await request.json();
  const id = crypto.randomUUID();

  await db.prepare(
    `INSERT INTO network_products (id, vendorId, name, price)
     VALUES (?, ?, ?, ?)`
  ).bind(
    id,
    body.vendorId,
    body.name || "",
    Number(body.price || 0)
  ).run();

  return json({ success: true, id });
}

async function updateProduct(request, db) {
  const body = await request.json();
  const { id, name, price } = body;
  if (!id) return json({ error: "Missing id" }, 400);

  await db.prepare(
    `UPDATE network_products SET name = ?, price = ? WHERE id = ?`
  ).bind(name || "", Number(price || 0), id).run();

  return json({ success: true });
}

async function deleteProduct(request, db) {
  const body = await request.json();
  const { id } = body;
  if (!id) return json({ error: "Missing id" }, 400);

  await db.prepare(
    "DELETE FROM network_products WHERE id = ?"
  ).bind(id).run();

  return json({ success: true });
}

async function listServices(db) {
  const { results } = await db.prepare(
    "SELECT * FROM network_services"
  ).all();
  return json(results);
}

async function createService(request, db) {
  const body = await request.json();
  const id = crypto.randomUUID();

  await db.prepare(
    `INSERT INTO network_services (id, vendorId, name, price)
     VALUES (?, ?, ?, ?)`
  ).bind(
    id,
    body.vendorId,
    body.name || "",
    Number(body.price || 0)
  ).run();

  return json({ success: true, id });
}

async function updateService(request, db) {
  const body = await request.json();
  const { id, name, price } = body;
  if (!id) return json({ error: "Missing id" }, 400);

  await db.prepare(
    `UPDATE network_services SET name = ?, price = ? WHERE id = ?`
  ).bind(name || "", Number(price || 0), id).run();

  return json({ success: true });
}

async function deleteService(request, db) {
  const body = await request.json();
  const { id } = body;
  if (!id) return json({ error: "Missing id" }, 400);

  await db.prepare(
    "DELETE FROM network_services WHERE id = ?"
  ).bind(id).run();

  return json({ success: true });
}

async function createWorkshop(request, db) {
  const body = await request.json();
  const id = crypto.randomUUID();

  await db.prepare(
    `INSERT INTO network_workshops (id, vendorId, title, price)
     VALUES (?, ?, ?, ?)`
  ).bind(
    id,
    body.vendorId,
    body.title || "",
    Number(body.price || 0)
  ).run();

  return json({ success: true, id });
}

async function updateWorkshop(request, db) {
  const body = await request.json();
  const { id, title, price } = body;
  if (!id) return json({ error: "Missing id" }, 400);

  await db.prepare(
    `UPDATE network_workshops SET title = ?, price = ? WHERE id = ?`
  ).bind(title || "", Number(price || 0), id).run();

  return json({ success: true });
}

async function deleteWorkshop(request, db) {
  const body = await request.json();
  const { id } = body;
  if (!id) return json({ error: "Missing id" }, 400);

  await db.prepare(
    "DELETE FROM network_workshops WHERE id = ?"
  ).bind(id).run();

  return json({ success: true });
}

async function explore(db) {
  const vendors = await db.prepare(
    "SELECT * FROM network_vendors LIMIT 10"
  ).all();
  const products = await db.prepare(
    "SELECT * FROM network_products LIMIT 10"
  ).all();
  const services = await db.prepare(
    "SELECT * FROM network_services LIMIT 10"
  ).all();

  return json({
    vendors: vendors.results,
    products: products.results,
    services: services.results
  });
}

/* EVENTS */

async function listEvents(db) {
  const { results } = await db.prepare(
    "SELECT * FROM cloud_events ORDER BY date ASC"
  ).all();
  return json(results);
}

async function getEvent(url, db) {
  const id = url.searchParams.get("id");
  if (!id) return json({ error: "Missing id" }, 400);

  const event = await db.prepare(
    "SELECT * FROM cloud_events WHERE id = ?"
  ).bind(id).first();

  if (!event) return json({ error: "Event not found" }, 404);
  return json(event);
}

async function createEvent(request, db) {
  const body = await request.json();
  const id = crypto.randomUUID();

  await db.prepare(
    `INSERT INTO cloud_events (id, title, description, location, date, price, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`
  ).bind(
    id,
    body.title,
    body.description || "",
    body.location || "",
    body.date || "",
    Number(body.price || 0)
  ).run();

  return json({ success: true, id });
}

async function updateEvent(request, db) {
  const body = await request.json();
  const { id, title, description, location, date, price } = body;
  if (!id) return json({ error: "Missing id" }, 400);

  await db.prepare(
    `UPDATE cloud_events
     SET title = ?, description = ?, location = ?, date = ?, price = ?
     WHERE id = ?`
  ).bind(
    title || "",
    description || "",
    location || "",
    date || "",
    Number(price || 0),
    id
  ).run();

  return json({ success: true });
}

async function deleteEvent(request, db) {
  const body = await request.json();
  const { id } = body;
  if (!id) return json({ error: "Missing id" }, 400);

  await db.prepare(
    "DELETE FROM cloud_events WHERE id = ?"
  ).bind(id).run();

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

    const db = env.DB_cloud;
    if (!db) {
      return wrap(json({ error: "DB_cloud binding missing" }, 500));
    }

    try {
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
