export default {
  async fetch(request, env) {
    const db = env.DB_cloud;
    const url = new URL(request.url);
    const path = url.pathname;

    // CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders() });
    }

    //
    // ============================================================
    // EVENTS — NEW SYSTEM
    // ============================================================
    //

    if (path.startsWith("/api/events/list"))
      return listEvents(db);

    if (path.startsWith("/api/events/get"))
      return getEvent(url, db);

    if (path.startsWith("/api/events/create") && request.method === "POST")
      return createEvent(request, db);

    //
    // ============================================================
    // NETWORK — SPECIFIC ROUTES
    // ============================================================
    //

    if (path.startsWith("/api/network/products"))
      return listProducts(db);

    if (path.startsWith("/api/network/services"))
      return listServices(db);

    if (path.startsWith("/api/network/explore"))
      return explore(db);

    //
    // ============================================================
    // VENDORS
    // ============================================================
    //

    if (path.startsWith("/api/network/vendors"))
      return listVendors(db);

    if (path.startsWith("/api/network/vendor"))
      return getVendor(url, db);

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
    // FAST ROLL — CLIENT
    // ============================================================
    //

    if (path.startsWith("/api/client"))
      return clientHandler(request, db);

    //
    // ============================================================
    // FAST ROLL — RIDER
    // ============================================================
    //

    if (path.startsWith("/api/rider"))
      return riderHandler(request, db);

    //
    // ============================================================
    // FAST ROLL — ORDERS
    // ============================================================
    //

    if (
      path.startsWith("/api/order") ||
      path.startsWith("/api/client/tip-post")
    ) {
      return ordersHandler(request, db);
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
    `INSERT INTO cloud_events (id, title, description, location, date, price)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).bind(
    id,
    body.title,
    body.description,
    body.location,
    body.datetime,
    body.price
  ).run();

  return json({ success: true, id });
}

//
// ============================================================
// NETWORK HANDLERS
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

async function me() {
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
// NETWORK — VENDORS / PRODUCTS / SERVICES / EXPLORE
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

async function listProducts(db) {
  const { results } = await db.prepare(
    "SELECT * FROM network_products WHERE active = 1"
  ).all();
  return json(results);
}

async function listServices(db) {
  const { results } = await db.prepare(
    "SELECT * FROM network_services WHERE active = 1"
  ).all();
  return json(results);
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
// PAYMENTS (PLACEHOLDERS)
// ============================================================
//

async function pay() { return json({ ok: true }); }
async function capture() { return json({ ok: true }); }

//
// ============================================================
// OTHER HANDLERS
// ============================================================
//

async function staffHandler() { return json({ ok: true }); }
async function workshopsHandler() { return json({ ok: true }); }
async function paypalHandler() { return json({ ok: true }); }
async function clientHandler() { return json({ ok: true }); }
async function riderHandler() { return json({ ok: true }); }
async function ordersHandler() { return json({ ok: true }); }

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
