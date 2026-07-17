// work-network.js — FINAL WORKING VERSION
// FULL NETWORK BACKEND — PUBLIC + STAFF + VENDOR + CHECKOUT + UPLOADS
// MATCHES D1 SCHEMA EXACTLY

export async function handleNetwork(path, request, db, url, env) {

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
     STAFF SYSTEM (NETWORK VENDORS)
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
     VENDOR API FOR STAFF.JS
  ----------------------------- */

  if (path === "/api/vendor/storefront" && request.method === "GET")
    return vendorStorefront(db, url);

  if (path === "/api/vendor/earnings" && request.method === "GET")
    return vendorEarnings(db, url);

  if (path === "/api/vendor/payout/status" && request.method === "GET")
    return vendorPayoutStatus(db, url);

  if (path === "/api/vendor/ads" && request.method === "GET")
    return vendorAds(db, url);

  if (path === "/api/vendor/phonebook" && request.method === "GET")
    return vendorPhonebook(db, url);

  if (path === "/api/vendor/products" && request.method === "GET")
    return vendorProducts(db, url);

  if (path === "/api/vendor/orders" && request.method === "GET")
    return vendorOrders(db, url);

  if (path === "/api/vendor/messages" && request.method === "GET")
    return vendorMessages(db, url);

  if (path === "/api/vendor/stats/today" && request.method === "GET")
    return vendorStatsToday(db, url);

  if (path === "/api/vendor/products/update" && request.method === "POST")
    return vendorProductUpdate(request, db);

  if (path === "/api/vendor/products/toggle" && request.method === "POST")
    return vendorProductToggle(request, db);


  /* -----------------------------
     VENDOR UPLOAD ROUTES (UUID-BASED)
  ----------------------------- */

  if (path === "/api/vendor/upload/logo" && request.method === "POST")
    return vendorUploadLogo(request, db, env);

  if (path === "/api/vendor/upload/product-image" && request.method === "POST")
    return vendorUploadProductImage(request, db, env);

  if (path === "/api/vendor/upload/cover" && request.method === "POST")
    return vendorUploadCover(request, db, env);


  /* -----------------------------
     CHECKOUT (CUSTOMER.JS)
  ----------------------------- */

  if (path === "/api/network/checkout" && request.method === "POST")
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
  const vendorId = url.searchParams.get("id");
  if (!vendorId) return json({ error: "Missing id" }, 400);

  const vendor = await db.prepare(
    "SELECT * FROM network_vendors WHERE id = ?"
  ).bind(vendorId).first();

  if (!vendor) return json({ error: "Vendor not found" }, 404);

  const products = await db.prepare(
    "SELECT * FROM network_products WHERE vendorId = ?"
  ).bind(vendorId).all();

  const services = await db.prepare(
    "SELECT * FROM network_services WHERE vendorId = ?"
  ).bind(vendorId).all();

  const workshops = await db.prepare(
    "SELECT * FROM network_workshops WHERE vendorId = ?"
  ).bind(vendorId).all();

  const app = await db.prepare(
    "SELECT * FROM network_apps WHERE vendorId = ?"
  ).bind(vendorId).first();

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
  const vendorId = url.searchParams.get("vendor");
  if (!vendorId) return json({ error: "Missing vendor" }, 400);

  const app = await db.prepare(
    "SELECT * FROM network_apps WHERE vendorId = ?"
  ).bind(vendorId).first();

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
   STAFF SYSTEM (NETWORK VENDORS)
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
  const { vendorId, name, bio, tags, paypal, active, shareLocation, types } = body;

  await db.prepare(
    `UPDATE network_vendors
     SET name=?, bio=?, tags=?, paypal=?, active=?, shareLocation=?, types=?
     WHERE id=?`
  ).bind(name, bio, tags, paypal, active, shareLocation, types, vendorId).run();

  return json({ success: true });
}

async function staffPublishProfile(request, db) {
  const body = await request.json();
  const { vendorId } = body;

  await db.prepare(
    `UPDATE network_vendors SET published=1 WHERE id=?`
  ).bind(vendorId).run();

  return json({ success: true });
}

async function staffOrders(db, url) {
  const vendorId = url.searchParams.get("vendorId");

  const rows = await db.prepare(
    "SELECT * FROM network_orders WHERE vendorId = ?"
  ).bind(vendorId).all();

  return json(rows.results || []);
}

async function staffPayouts(db, url) {
  const vendorId = url.searchParams.get("vendorId");

  const rows = await db.prepare(
    "SELECT * FROM network_payouts WHERE vendorId = ?"
  ).bind(vendorId).all();

  return json(rows.results || []);
}


/* ---------------------------------------------------------
   VENDOR API FOR STAFF.JS
--------------------------------------------------------- */

async function vendorStorefront(db, url) {
  const email = url.searchParams.get("email");
  if (!email) return json({ error: "Missing email" }, 400);

  const vendor = await db.prepare(
    "SELECT * FROM network_vendors WHERE email = ?"
  ).bind(email).first();

  if (!vendor) return json({ error: "Vendor not found" }, 404);

  const vendorId = vendor.id;

  const products = await db.prepare(
    "SELECT * FROM network_products WHERE vendorId = ?"
  ).bind(vendorId).all();

  const services = await db.prepare(
    "SELECT * FROM network_services WHERE vendorId = ?"
  ).bind(vendorId).all();

  const workshops = await db.prepare(
    "SELECT * FROM network_workshops WHERE vendorId = ?"
  ).bind(vendorId).all();

  const apps = await db.prepare(
    "SELECT * FROM network_apps WHERE vendorId = ?"
  ).bind(vendorId).all();

  return json({
    vendorId,
    description: vendor.description || "",
    tags: vendor.tags || "",
    logo: vendor.logo || "",
    cover: vendor.cover || "",
    products: products.results || [],
    services: services.results || [],
    workshops: workshops.results || [],
    apps: apps.results || [],
    published: vendor.published || 0
  });
}

async function vendorEarnings(db, url) {
  const email = url.searchParams.get("email");
  if (!email) return json({ error: "Missing email" }, 400);

  const vendor = await db.prepare(
    "SELECT id FROM network_vendors WHERE email = ?"
  ).bind(email).first();

  if (!vendor) return json({ error: "Vendor not found" }, 404);

  const vendorId = vendor.id;

  const rows = await db.prepare(
    "SELECT total, period FROM network_earnings WHERE vendorId = ?"
  ).bind(vendorId).all();

  const results = rows.results || [];
  let today = 0, week = 0, month = 0, total = 0;

  for (const r of results) {
    if (r.period === "today") today = r.total;
    else if (r.period === "week") week = r.total;
    else if (r.period === "month") month = r.total;
    else if (r.period === "total") total = r.total;
  }

  return json({ today, week, month, total });
}

async function vendorPayoutStatus(db, url) {
  const email = url.searchParams.get("email");
  if (!email) return json({ error: "Missing email" }, 400);

  const vendor = await db.prepare(
    "SELECT id FROM network_vendors WHERE email = ?"
  ).bind(email).first();

  if (!vendor) return json({ error: "Vendor not found" }, 404);

  const vendorId = vendor.id;

  const row = await db.prepare(
    "SELECT * FROM network_payout_status WHERE vendorId = ?"
  ).bind(vendorId).first();

  if (!row) {
    return json({
      connected: false,
      method: null,
      email: null,
      venmo: false
    });
  }

  return json({
    connected: !!row.connected,
    method: row.method,
    email: row.payoutEmail,
    venmo: !!row.venmo
  });
}

async function vendorAds(db, url) {
  const email = url.searchParams.get("email");
  if (!email) return json({ error: "Missing email" }, 400);

  const vendor = await db.prepare(
    "SELECT id FROM network_vendors WHERE email = ?"
  ).bind(email).first();

  if (!vendor) return json({ error: "Vendor not found" }, 404);

  const vendorId = vendor.id;

  const rows = await db.prepare(
    "SELECT * FROM network_ads WHERE vendorId = ?"
  ).bind(vendorId).all();

  return json(rows.results || []);
}

async function vendorPhonebook(db, url) {
  const email = url.searchParams.get("email");
  if (!email) return json({ error: "Missing email" }, 400);

  const vendor = await db.prepare(
    "SELECT id FROM network_vendors WHERE email = ?"
  ).bind(email).first();

  if (!vendor) return json({ error: "Vendor not found" }, 404);

  const vendorId = vendor.id;

  const row = await db.prepare(
    "SELECT * FROM network_phonebook WHERE vendorId = ?"
  ).bind(vendorId).first();

  if (!row) return json({ error: "Not found" }, 404);
  return json(row);
}

async function vendorProducts(db, url) {
  const email = url.searchParams.get("email");
  if (!email) return json({ error: "Missing email" }, 400);

  const vendor = await db.prepare(
    "SELECT id FROM network_vendors WHERE email = ?"
  ).bind(email).first();

  if (!vendor) return json({ error: "Vendor not found" }, 404);

  const vendorId = vendor.id;

  const rows = await db.prepare(
    `SELECT id, vendorId, name, description, price, photoUrl, tags, active, createdAt
     FROM network_products WHERE vendorId = ?`
  ).bind(vendorId).all();

  return json(rows.results || []);
}

async function vendorOrders(db, url) {
  const email = url.searchParams.get("email");
  if (!email) return json({ error: "Missing email" }, 400);

  const vendor = await db.prepare(
    "SELECT id FROM network_vendors WHERE email = ?"
  ).bind(email).first();

  if (!vendor) return json({ error: "Vendor not found" }, 404);

  const vendorId = vendor.id;

  const rows = await db.prepare(
    `SELECT id, vendorId, buyerEmail, itemType, itemId, quantity, amount, paymentStatus, status, createdAt
     FROM network_orders WHERE vendorId = ?
     ORDER BY createdAt DESC`
  ).bind(vendorId).all();

  return json(rows.results || []);
}

async function vendorMessages(db, url) {
  const email = url.searchParams.get("email");
  if (!email) return json({ error: "Missing email" }, 400);

  const vendor = await db.prepare(
    "SELECT id FROM network_vendors WHERE email = ?"
  ).bind(email).first();

  if (!vendor) return json({ error: "Vendor not found" }, 404);

  const vendorId = vendor.id;

  const rows = await db.prepare(
    `SELECT id, vendorId, fromEmail, toEmail, body, preview, createdAt
     FROM network_messages
     WHERE vendorId = ? OR toEmail = ?
     ORDER BY createdAt DESC`
  ).bind(vendorId, email).all();

  return json(rows.results || []);
}

async function vendorStatsToday(db, url) {
  const email = url.searchParams.get("email");
  if (!email) return json({ error: "Missing email" }, 400);

  const vendor = await db.prepare(
    "SELECT id FROM network_vendors WHERE email = ?"
  ).bind(email).first();

  if
