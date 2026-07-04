// work-network.js
// FULL NETWORK BACKEND — PUBLIC + STAFF + VENDOR + CHECKOUT

export async function handleNetwork(path, request, db, url) {

  /* -----------------------------
     PUBLIC NETWORK FEEDS
  ----------------------------- */

  if (path === "/api/network/products" && request.method === "GET")
    return getAll(db, "network_products");

  if (path === "/api/network/services" && request.method === "GET")
    return getAll(db, "network_services");

  if (path === "/api/network/workshops" && request.method === "GET")
    return getAll(db, "network_workshops");

  if (path === "/api/network/apps" && request.method === "GET")
    return getAll(db, "network_apps");

  if (path === "/api/network/vendors" && request.method === "GET")
    return getAll(db, "network_vendors");

  if (path === "/api/network/vendor" && request.method === "GET")
    return getVendorFull(db, url);


  /* -----------------------------
     VENDOR CRUD — PRODUCTS
  ----------------------------- */

  if (path === "/api/network/product/create" && request.method === "POST")
    return createItem(request, db, "network_products");

  if (path === "/api/network/product/delete" && request.method === "POST")
    return deleteItem(request, db, "network_products");


  /* -----------------------------
     VENDOR CRUD — SERVICES
  ----------------------------- */

  if (path === "/api/network/service/create" && request.method === "POST")
    return createItem(request, db, "network_services");

  if (path === "/api/network/service/delete" && request.method === "POST")
    return deleteItem(request, db, "network_services");


  /* -----------------------------
     VENDOR CRUD — WORKSHOPS
  ----------------------------- */

  if (path === "/api/network/workshop/create" && request.method === "POST")
    return createItem(request, db, "network_workshops");

  if (path === "/api/network/workshop/delete" && request.method === "POST")
    return deleteItem(request, db, "network_workshops");


  /* -----------------------------
     VENDOR CRUD — APP
  ----------------------------- */

  if (path === "/api/network/app" && request.method === "GET")
    return getVendorApp(db, url);

  if (path === "/api/network/app/save" && request.method === "POST")
    return saveVendorApp(request, db);


  /* -----------------------------
     STAFF SYSTEM
  ----------------------------- */

  if (path === "/api/staff/login" && request.method === "POST")
    return staffLogin(request, db);

  if (path === "/api/staff/me" && request.method === "GET")
    return staffMe(db, url);

  if (path === "/api/staff/profile/update" && request.method === "POST")
    return staffUpdateProfile(request, db);

  if (path === "/api/staff/profile/publish" && request.method === "POST")
    return staffPublishProfile(request, db);

  if (path === "/api/staff/orders" && request.method === "GET")
    return staffOrders(db, url);

  if (path === "/api/staff/payouts" && request.method === "GET")
    return staffPayouts(db, url);


  /* -----------------------------
     CHECKOUT
  ----------------------------- */

  if (path === "/api/network/checkout/create" && request.method === "POST")
    return createCheckout(request, db);


  return null;
}


/* ---------------------------------------------------------
   HELPERS
--------------------------------------------------------- */

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}

async function getAll(db, table) {
  const rows = await db.prepare(`SELECT * FROM ${table}`).all();
  return json(rows.results || []);
}

async function createItem(request, db, table) {
  const body = await request.json();
  const id = crypto.randomUUID();

  const keys = Object.keys(body);
  const values = Object.values(body);

  const placeholders = keys.map(() => "?").join(",");
  const columns = keys.join(",");

  await db.prepare(
    `INSERT INTO ${table} (id, ${columns}) VALUES (?, ${placeholders})`
  ).bind(id, ...values).run();

  return json({ success: true, id });
}

async function deleteItem(request, db, table) {
  const body = await request.json();
  const { id } = body;

  await db.prepare(
    `DELETE FROM ${table} WHERE id = ?`
  ).bind(id).run();

  return json({ success: true });
}


/* ---------------------------------------------------------
   VENDOR FULL PAGE
--------------------------------------------------------- */

async function getVendorFull(db, url) {
  const id = url.searchParams.get("id");
  if (!id) return json({ error: "Missing id" }, 400);

  const vendor = await db.prepare(
    "SELECT * FROM network_vendors WHERE id = ?"
  ).bind(id).first();

  if (!vendor) return json({ error: "Vendor not found" }, 404);

  const products = await db.prepare(
    "SELECT * FROM network_products WHERE vendorId = ?"
  ).bind(id).all();

  const services = await db.prepare(
    "SELECT * FROM network_services WHERE vendorId = ?"
  ).bind(id).all();

  const workshops = await db.prepare(
    "SELECT * FROM network_workshops WHERE vendorId = ?"
  ).bind(id).all();

  const app = await db.prepare(
    "SELECT * FROM network_apps WHERE vendorId = ?"
  ).bind(id).first();

  return json({
    vendor,
    products: products.results || [],
    services: services.results || [],
    workshops: workshops.results || [],
    app: app || null
  });
}


/* ---------------------------------------------------------
   VENDOR APP
--------------------------------------------------------- */

async function getVendorApp(db, url) {
  const vendor = url.searchParams.get("vendor");
  if (!vendor) return json({ error: "Missing vendor" }, 400);

  const app = await db.prepare(
    "SELECT * FROM network_apps WHERE vendorId = ?"
  ).bind(vendor).first();

  return json(app || {});
}

async function saveVendorApp(request, db) {
  const body = await request.json();
  const { vendorId, name, url, description } = body;

  const existing = await db.prepare(
    "SELECT id FROM network_apps WHERE vendorId = ?"
  ).bind(vendorId).first();

  if (existing) {
    await db.prepare(
      `UPDATE network_apps SET name=?, url=?, description=? WHERE vendorId=?`
    ).bind(name, url, description, vendorId).run();
  } else {
    await db.prepare(
      `INSERT INTO network_apps (id, vendorId, name, url, description)
       VALUES (?, ?, ?, ?, ?)`
    ).bind(crypto.randomUUID(), vendorId, name, url, description).run();
  }

  return json({ success: true });
}


/* ---------------------------------------------------------
   STAFF SYSTEM
--------------------------------------------------------- */

async function staffLogin(request, db) {
  const body = await request.json();
  const { email } = body;

  const staff = await db.prepare(
    "SELECT * FROM network_vendors WHERE email = ?"
  ).bind(email).first();

  if (!staff) return json({ error: "Invalid staff login" }, 401);

  return json({ success: true, staff });
}

async function staffMe(db, url) {
  const email = url.searchParams.get("email");

  const staff = await db.prepare(
    "SELECT * FROM network_vendors WHERE email = ?"
  ).bind(email).first();

  return json(staff || {});
}

async function staffUpdateProfile(request, db) {
  const body = await request.json();
  const { email, name, bio, tags, paypal, active, shareLocation, types } = body;

  await db.prepare(
    `UPDATE network_vendors
     SET name=?, bio=?, tags=?, paypal=?, active=?, shareLocation=?, types=?
     WHERE email=?`
  ).bind(name, bio, tags, paypal, active, shareLocation, types, email).run();

  return json({ success: true });
}

async function staffPublishProfile(request, db) {
  const body = await request.json();
  const { email } = body;

  await db.prepare(
    `UPDATE network_vendors SET published=1 WHERE email=?`
  ).bind(email).run();

  return json({ success: true });
}

async function staffOrders(db, url) {
  const email = url.searchParams.get("email");

  const rows = await db.prepare(
    "SELECT * FROM network_orders WHERE vendorId = ?"
  ).bind(email).all();

  return json(rows.results || []);
}

async function staffPayouts(db, url) {
  const email = url.searchParams.get("email");

  const rows = await db.prepare(
    "SELECT * FROM network_payouts WHERE vendorId = ?"
  ).bind(email).all();

  return json(rows.results || []);
}


/* ---------------------------------------------------------
   CHECKOUT
--------------------------------------------------------- */

async function createCheckout(request, db) {
  const body = await request.json();
  const id = crypto.randomUUID();

  await db.prepare(
    `INSERT INTO network_orders (id, vendorId, itemType, itemId, quantity, paymentStatus)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).bind(id, body.vendorId, body.itemType, body.itemId, body.quantity, "pending").run();

  return json({
    success: true,
    redirectUrl: `https://fast-roll.pages.dev/?orderId=${id}`
  });
}
