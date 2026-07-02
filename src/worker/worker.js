export default {
  async fetch(request, env) {
    const db = env.DB_cloud;
    const url = new URL(request.url);
    const path = url.pathname;

    // GLOBAL EXTENSION / BACKUP HOOK (for future backup.js or extensions)
    await extensionHook(request, env, db);

    // CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders() });
    }

    //
    // ============================================================
    // EVENTS — FULL SYSTEM
    // ============================================================
    //

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

    //
    // ============================================================
    // NETWORK — VENDORS / PRODUCTS / SERVICES / WORKSHOPS (FULL CRUD)
    // ============================================================
    //

    // VENDORS — READ
    if (path.startsWith("/api/network/vendors"))
      return listVendors(db);

    if (path.startsWith("/api/network/vendor") && request.method === "GET")
      return getVendor(url, db);

    // VENDORS — CRUD
    if (path.startsWith("/api/network/vendor/create") && request.method === "POST")
      return createVendor(request, db);

    if (path.startsWith("/api/network/vendor/update") && request.method === "POST")
      return updateVendor(request, db);

    if (path.startsWith("/api/network/vendor/delete") && request.method === "POST")
      return deleteVendor(request, db);

    // PRODUCTS — READ
    if (path.startsWith("/api/network/products") && request.method === "GET")
      return listProducts(db);

    // PRODUCTS — CRUD
    if (path.startsWith("/api/network/product/create") && request.method === "POST")
      return createProduct(request, db);

    if (path.startsWith("/api/network/product/update") && request.method === "POST")
      return updateProduct(request, db);

    if (path.startsWith("/api/network/product/delete") && request.method === "POST")
      return deleteProduct(request, db);

    // SERVICES — READ
    if (path.startsWith("/api/network/services") && request.method === "GET")
      return listServices(db);

    // SERVICES — CRUD
    if (path.startsWith("/api/network/service/create") && request.method === "POST")
      return createService(request, db);

    if (path.startsWith("/api/network/service/update") && request.method === "POST")
      return updateService(request, db);

    if (path.startsWith("/api/network/service/delete") && request.method === "POST")
      return deleteService(request, db);

    // WORKSHOPS — CRUD (network_workshops)
    if (path.startsWith("/api/network/workshop/create") && request.method === "POST")
      return createWorkshop(request, db);

    if (path.startsWith("/api/network/workshop/update") && request.method === "POST")
      return updateWorkshop(request, db);

    if (path.startsWith("/api/network/workshop/delete") && request.method === "POST")
      return deleteWorkshop(request, db);

    // EXPLORE
    if (path.startsWith("/api/network/explore"))
      return explore(db);

    //
    // ============================================================
    // NETWORK — GENERAL (AUTH, PROFILE, PAY)
    // ============================================================
    //

    if (path.startsWith("/api/network/signup") && request.method === "POST")
      return signup(request, db);

    if (path.startsWith("/api/network/login") && request.method === "POST")
      return login(request, db);

    if (path.startsWith("/api/network/me"))
      return me(request, db);

    if (path.startsWith("/api/network/profile/update") && request.method === "POST")
      return updateProfile(request, db);

    if (path.startsWith("/api/network/pay") && request.method === "POST")
      return pay(request, db);

    if (path.startsWith("/api/network/pay/capture") && request.method === "POST")
      return capture(request, db);

    //
    // ============================================================
    // FAST ROLL — FULL SYSTEM (CLIENT / RIDER / ORDERS)
    // ============================================================
    //

    // CLIENT
    if (path.startsWith("/api/client"))
      return clientHandler(request, db, url);

    // RIDER
    if (path.startsWith("/api/rider"))
      return riderHandler(request, db, url);

    // ORDERS + TIPS
    if (path.startsWith("/api/order") || path.startsWith("/api/client/tip-post"))
      return ordersHandler(request, db, url);

    //
    // ============================================================
    // STAFF PORTAL
    // ============================================================
    //

    if (path.startsWith("/api/staff"))
      return staffHandler(request, db);

    //
    // ============================================================
    // WORKSHOPS (LEGACY)
    // ============================================================
    //

    if (
      path.startsWith("/api/workshops") ||
      path.startsWith("/api/availability") ||
      path.startsWith("/api/book") ||
      path.startsWith("/api/user/bookings")
    ) {
      return workshopsHandler(request, db);
    }

    //
    // ============================================================
    // PAYMENTS
    // ============================================================
    //

    if (path.startsWith("/api/paypal"))
      return paypalHandler(request, db);

    //
    // ============================================================
    // DASHBOARD / CLOUD FALLBACK API (NOTIFICATIONS, USER)
    // ============================================================
    //

    if (path.startsWith("/api/notifications")) {
      return new Response(JSON.stringify({
        ok: true,
        notifications: []
      }), {
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders()
        }
      });
    }

    if (path.startsWith("/api/user")) {
      return new Response(JSON.stringify({
        ok: true,
        user: null
      }), {
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders()
        }
      });
    }

    if (path.startsWith("/api/")) {
      return new Response(JSON.stringify({
        ok: false,
        message: "API route not implemented yet"
      }), {
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders()
        }
      });
    }

    //
    // ============================================================
    // STATIC FILES (R2)
    // ============================================================
    //

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

    return new Response("Not found", {
      status: 404,
      headers: corsHeaders()
    });
  }
};

//
// ============================================================
// EXTENSION / BACKUP HOOK
// ============================================================
//

async function extensionHook(request, env, db) {
  try {
    if (typeof globalThis.cloudBackupHook === "function") {
      await globalThis.cloudBackupHook(request, env, db);
    }
  } catch (e) {
    // silent; backup is optional
  }
}

//
// ============================================================
// EVENTS — HANDLERS
// ============================================================
//

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
    body.datetime || "",
    Number(body.price || 0)
  ).run();

  return json({ success: true, id });
}

async function updateEvent(request, db) {
  const body = await request.json();
  const { id, title, description, location, datetime, price } = body;

  if (!id) return json({ error: "Missing id" }, 400);

  await db.prepare(
    `UPDATE cloud_events
     SET title = ?, description = ?, location = ?, date = ?, price = ?
     WHERE id = ?`
  ).bind(
    title || "",
    description || "",
    location || "",
    datetime || "",
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

//
// ============================================================
// NETWORK — VENDORS / PRODUCTS / SERVICES / WORKSHOPS
// ============================================================
//

async function listVendors(db) {
  const { results } = await db.prepare(
    "SELECT * FROM network_vendors WHERE active = 1"
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

// VENDOR CRUD
async function createVendor(request, db) {
  const body = await request.json();
  const id = crypto.randomUUID();

  await db.prepare(
    `INSERT INTO network_vendors (id, name, bio, photoUrl, category, tags, active, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, 1, datetime('now'))`
  ).bind(
    id,
    body.name || "",
    body.bio || "",
    body.photoUrl || "",
    body.category || "",
    body.tags || ""
  ).run();

  return json({ success: true, id });
}

async function updateVendor(request, db) {
  const body = await request.json();
  const { id, name, bio, photoUrl, category, tags, active } = body;

  if (!id) return json({ error: "Missing id" }, 400);

  await db.prepare(
    `UPDATE network_vendors
     SET name = ?, bio = ?, photoUrl = ?, category = ?, tags = ?, active = ?
     WHERE id = ?`
  ).bind(
    name || "",
    bio || "",
    photoUrl || "",
    category || "",
    tags || "",
    active ? 1 : 0,
    id
  ).run();

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

// PRODUCT CRUD
async function listProducts(db) {
  const { results } = await db.prepare(
    "SELECT * FROM network_products WHERE active = 1"
  ).all();
  return json(results);
}

async function createProduct(request, db) {
  const body = await request.json();
  const id = crypto.randomUUID();

  await db.prepare(
    `INSERT INTO network_products (id, vendorId, name, description, price, active, createdAt)
     VALUES (?, ?, ?, ?, ?, 1, datetime('now'))`
  ).bind(
    id,
    body.vendorId,
    body.name || "",
    body.description || "",
    Number(body.price || 0)
  ).run();

  return json({ success: true, id });
}

async function updateProduct(request, db) {
  const body = await request.json();
  const { id, name, description, price, active } = body;

  if (!id) return json({ error: "Missing id" }, 400);

  await db.prepare(
    `UPDATE network_products
     SET name = ?, description = ?, price = ?, active = ?
     WHERE id = ?`
  ).bind(
    name || "",
    description || "",
    Number(price || 0),
    active ? 1 : 0,
    id
  ).run();

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

// SERVICE CRUD
async function listServices(db) {
  const { results } = await db.prepare(
    "SELECT * FROM network_services WHERE active = 1"
  ).all();
  return json(results);
}

async function createService(request, db) {
  const body = await request.json();
  const id = crypto.randomUUID();

  await db.prepare(
    `INSERT INTO network_services (id, vendorId, name, description, price, active, createdAt)
     VALUES (?, ?, ?, ?, ?, 1, datetime('now'))`
  ).bind(
    id,
    body.vendorId,
    body.name || "",
    body.description || "",
    Number(body.price || 0)
  ).run();

  return json({ success: true, id });
}

async function updateService(request, db) {
  const body = await request.json();
  const { id, name, description, price, active } = body;

  if (!id) return json({ error: "Missing id" }, 400);

  await db.prepare(
    `UPDATE network_services
     SET name = ?, description = ?, price = ?, active = ?
     WHERE id = ?`
  ).bind(
    name || "",
    description || "",
    Number(price || 0),
    active ? 1 : 0,
    id
  ).run();

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

// WORKSHOP CRUD
async function createWorkshop(request, db) {
  const body = await request.json();
  const id = crypto.randomUUID();

  await db.prepare(
    `INSERT INTO network_workshops (id, vendorId, title, description, date, price, maxSeats, active, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, 1, datetime('now'))`
  ).bind(
    id,
    body.vendorId,
    body.title || "",
    body.description || "",
    body.date || "",
    Number(body.price || 0),
    Number(body.maxSeats || 0)
  ).run();

  return json({ success: true, id });
}

async function updateWorkshop(request, db) {
  const body = await request.json();
  const { id, title, description, date, price, maxSeats, active } = body;

  if (!id) return json({ error: "Missing id" }, 400);

  await db.prepare(
    `UPDATE network_workshops
     SET title = ?, description = ?, date = ?, price = ?, maxSeats = ?, active = ?
     WHERE id = ?`
  ).bind(
    title || "",
    description || "",
    date || "",
    Number(price || 0),
    Number(maxSeats || 0),
    active ? 1 : 0,
    id
  ).run();

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
    "SELECT * FROM network_vendors WHERE active = 1 LIMIT 10"
  ).all();

  const products = await db.prepare(
    "SELECT * FROM network_products WHERE active = 1 LIMIT 10"
  ).all();

  const services = await db.prepare(
    "SELECT * FROM network_services WHERE active = 1 LIMIT 10"
  ).all();

  return json({
    vendors: vendors.results,
    products: products.results,
    services: services.results
  });
}

//
// ============================================================
// NETWORK — AUTH / PROFILE
// ============================================================
//

async function signup(request, db) {
  const body = await request.json();
  const { email, password, name } = body;

  if (!email || !password || !name)
    return json({ error: "Missing fields" }, 400);

  const existing = await db.prepare(
    "SELECT id FROM cloud_users WHERE email = ?"
  ).bind(email).first();

  if (existing) return json({ error: "Email already exists" }, 400);

  const id = crypto.randomUUID();
  const passwordHash = await hash(password);

  await db.prepare(
    `INSERT INTO cloud_users (id, email, passwordHash, name, photoUrl, bio, roles, createdAt)
     VALUES (?, ?, ?, ?, '', '', '', datetime('now'))`
  ).bind(id, email, passwordHash, name).run();

  return json({ success: true, id });
}

async function login(request, db) {
  const body = await request.json();
  const { email, password } = body;

  const user = await db.prepare(
    "SELECT * FROM cloud_users WHERE email = ?"
  ).bind(email).first();

  if (!user) return json({ error: "Invalid login" }, 401);

  const valid = await verify(password, user.passwordHash);
  if (!valid) return json({ error: "Invalid login" }, 401);

  return json({ success: true, user });
}

async function me(request, db) {
  return json({ ok: true });
}

async function updateProfile(request, db) {
  const body = await request.json();
  const { bio, interests, photo, roles } = body;

  const userId = "owner-001";

  let rolesValue = "";
  if (Array.isArray(roles)) rolesValue = roles.join(",");
  else if (typeof roles === "string") rolesValue = roles;
  else {
    const existing = await db.prepare(
      "SELECT roles FROM cloud_users WHERE id = ?"
    ).bind(userId).first();
    rolesValue = existing?.roles || "";
  }

  await db.prepare(
    `UPDATE cloud_users
     SET bio = ?, photoUrl = ?, roles = ?
     WHERE id = ?`
  ).bind(
    bio || "",
    photo || "",
    rolesValue,
    userId
  ).run();

  return json({ success: true });
}

//
// ============================================================
// FAST ROLL — CLIENT / RIDER / ORDERS
// ============================================================
//

async function clientHandler(request, db, url) {
  if (request.method === "POST") {
    const body = await request.json();
    const action = url.searchParams.get("action") || body.action;

    if (action === "signup") {
      const id = crypto.randomUUID();
      await db.prepare(
        `INSERT INTO fast_clients (id, name, phone, email, createdAt)
         VALUES (?, ?, ?, ?, datetime('now'))`
      ).bind(
        id,
        body.name || "",
        body.phone || "",
        body.email || ""
      ).run();
      return json({ success: true, id });
    }

    if (action === "update") {
      await db.prepare(
        `UPDATE fast_clients
         SET name = ?, phone = ?, email = ?
         WHERE id = ?`
      ).bind(
        body.name || "",
        body.phone || "",
        body.email || "",
        body.id
      ).run();
      return json({ success: true });
    }

    if (action === "tip") {
      return json({ success: true });
    }
  }

  if (request.method === "GET") {
    const id = url.searchParams.get("id");
    if (!id) return json({ error: "Missing id" }, 400);

    const client = await db.prepare(
      "SELECT * FROM fast_clients WHERE id = ?"
    ).bind(id).first();

    return json(client || {});
  }

  return json({ ok: true });
}

async function riderHandler(request, db, url) {
  if (request.method === "POST") {
    const body = await request.json();
    const action = url.searchParams.get("action") || body.action;

    if (action === "signup") {
      const id = crypto.randomUUID();
      await db.prepare(
        `INSERT INTO fast_riders (id, name, phone, vehicle, active, createdAt)
         VALUES (?, ?, ?, ?, 1, datetime('now'))`
      ).bind(
        id,
        body.name || "",
        body.phone || "",
        body.vehicle || ""
      ).run();
      return json({ success: true, id });
    }

    if (action === "update") {
      await db.prepare(
        `UPDATE fast_riders
         SET name = ?, phone = ?, vehicle = ?, active = ?
         WHERE id = ?`
      ).bind(
        body.name || "",
        body.phone || "",
        body.vehicle || "",
        body.active ? 1 : 0,
        body.id
      ).run();
      return json({ success: true });
    }

    if (action === "status") {
      await db.prepare(
        `UPDATE fast_riders
         SET status = ?
         WHERE id = ?`
      ).bind(
        body.status || "",
        body.id
      ).run();
      return json({ success: true });
    }
  }

  if (request.method === "GET") {
    const id = url.searchParams.get("id");
    if (!id) return json({ error: "Missing id" }, 400);

    const rider = await db.prepare(
      "SELECT * FROM fast_riders WHERE id = ?"
    ).bind(id).first();

    return json(rider || {});
  }

  return json({ ok: true });
}

async function ordersHandler(request, db, url) {
  if (request.method === "POST") {
    const body = await request.json();
    const action = url.searchParams.get("action") || body.action;

    if (action === "create") {
      const id = crypto.randomUUID();
      await db.prepare(
        `INSERT INTO fast_orders (id, clientId, riderId, pickup, dropoff, status, price, createdAt)
         VALUES (?, ?, ?, ?, ?, 'pending', ?, datetime('now'))`
      ).bind(
        id,
        body.clientId,
        body.riderId || null,
        body.pickup || "",
        body.dropoff || "",
        Number(body.price || 0)
      ).run();
      return json({ success: true, id });
    }

    if (action === "update") {
      await db.prepare(
        `UPDATE fast_orders
         SET status = ?, riderId = ?
         WHERE id = ?`
      ).bind(
        body.status || "pending",
        body.riderId || null,
        body.id
      ).run();
      return json({ success: true });
    }

    if (action === "complete") {
      await db.prepare(
        `UPDATE fast_orders
         SET status = 'completed'
         WHERE id = ?`
      ).bind(body.id).run();
      return json({ success: true });
    }
  }

  if (request.method === "GET") {
    const clientId = url.searchParams.get("clientId");
    const riderId = url.searchParams.get("riderId");

    if (clientId) {
      const { results } = await db.prepare(
        "SELECT * FROM fast_orders WHERE clientId = ? ORDER BY createdAt DESC"
      ).bind(clientId).all();
      return json(results);
    }

    if (riderId) {
      const { results } = await db.prepare(
        "SELECT * FROM fast_orders WHERE riderId = ? ORDER BY createdAt DESC"
      ).bind(riderId).all();
      return json(results);
    }
  }

  return json({ ok: true });
}

//
// ============================================================
// PAYMENTS (PLACEHOLDERS)
// ============================================================
//

async function pay(request, db) { return json({ ok: true }); }
async function capture(request, db) { return json({ ok: true }); }

//
// ============================================================
// OTHER HANDLERS
// ============================================================
//

async function staffHandler(request, db) { return json({ ok: true }); }
async function workshopsHandler(request, db) { return json({ ok: true }); }
async function paypalHandler(request, db) { return json({ ok: true }); }

//
// ============================================================
// HELPERS
// ============================================================
//

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "https://beltlinecloud.com",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Credentials": "true"
  };
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders()
    }
  });
}

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

async function hash(str) {
  const data = new TextEncoder().encode(str);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(digest)]
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

async function verify(str, hashValue) {
  return (await hash(str)) === hashValue;
}
