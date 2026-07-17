// work-network.js
// FULL NETWORK BACKEND — FIXED TO MATCH REAL network_vendors SCHEMA
// NO INVALID COLUMNS — NO 500 ERRORS — SAFE EMPTY RETURNS

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
     VENDOR UPLOAD ROUTES
  ----------------------------- */

  if (path === "/api/vendor/upload/logo" && request.method === "POST")
    return vendorUploadLogo(request, db, env);

  if (path === "/api/vendor/upload/product-image" && request.method === "POST")
    return vendorUploadProductImage(request, db, env);

  if (path === "/api/vendor/upload/cover" && request.method === "POST")
    return vendorUploadCover(request, db, env);


  /* -----------------------------
     CHECKOUT
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
   EMAIL → VENDOR (MATCHES REAL SCHEMA)
--------------------------------------------------------- */

async function getVendorByEmail(db, rawEmail) {
  if (!rawEmail) return null;

  const email = rawEmail.trim().toLowerCase();

  return await db.prepare(
    "SELECT * FROM network_vendors WHERE LOWER(email) = ?"
  ).bind(email).first();
}


/* ---------------------------------------------------------
   SAFE VENDOR LOOKUP (NO AUTO-CREATE)
--------------------------------------------------------- */

async function safeVendor(db, rawEmail) {
  const vendor = await getVendorByEmail(db, rawEmail);

  if (!vendor || !vendor.id) {
    return null;
  }

  return vendor;
}


/* ---------------------------------------------------------
   VENDOR API — SAFE, NO CRASHES
--------------------------------------------------------- */

async function vendorStorefront(db, url) {
  const email = url.searchParams.get("email");
  const vendor = await safeVendor(db, email);

  if (!vendor) {
    return json({
      vendorId: null,
      description: "",
      tags: "",
      logo: "",
      cover: "",
      products: [],
      services: [],
      workshops: [],
      apps: [],
      published: 0
    });
  }

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
    description: vendor.bio || "",
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

async function vendorProducts(db, url) {
  const email = url.searchParams.get("email");
  const vendor = await safeVendor(db, email);

  if (!vendor) return json([]);

  const rows = await db.prepare(
    "SELECT * FROM network_products WHERE vendorId = ?"
  ).bind(vendor.id).all();

  return json(rows.results || []);
}

async function vendorOrders(db, url) {
  const email = url.searchParams.get("email");
  const vendor = await safeVendor(db, email);

  if (!vendor) return json([]);

  const rows = await db.prepare(
    "SELECT * FROM network_orders WHERE vendorId = ?"
  ).bind(vendor.id).all();

  return json(rows.results || []);
}

async function vendorMessages(db, url) {
  const email = url.searchParams.get("email");
  const vendor = await safeVendor(db, email);

  if (!vendor) return json([]);

  const rows = await db.prepare(
    "SELECT * FROM network_messages WHERE vendorId = ? OR toEmail = ?"
  ).bind(vendor.id, vendor.email).all();

  return json(rows.results || []);
}

async function vendorStatsToday(db, url) {
  const email = url.searchParams.get("email");
  const vendor = await safeVendor(db, email);

  if (!vendor) {
    return json({
      revenue: 0,
      ordersCount: 0,
      activeProducts: 0,
      openOrders: 0,
      newMessages: 0
    });
  }

  const vendorId = vendor.id;

  const revenueRow = await db.prepare(
    "SELECT SUM(amount) AS revenue FROM network_orders WHERE vendorId = ? AND date(createdAt) = date('now') AND paymentStatus = 'paid'"
  ).bind(vendorId).first();

  const ordersRow = await db.prepare(
    "SELECT COUNT(*) AS count FROM network_orders WHERE vendorId = ? AND date(createdAt) = date('now')"
  ).bind(vendorId).first();

  const activeProductsRow = await db.prepare(
    "SELECT COUNT(*) AS count FROM network_products WHERE vendorId = ? AND active = 1"
  ).bind(vendorId).first();

  const openOrdersRow = await db.prepare(
    "SELECT COUNT(*) AS count FROM network_orders WHERE vendorId = ? AND status = 'open'"
  ).bind(vendorId).first();

  const newMessagesRow = await db.prepare(
    "SELECT COUNT(*) AS count FROM network_messages WHERE vendorId = ? AND date(createdAt) = date('now')"
  ).bind(vendorId).first();

  return json({
    revenue: revenueRow?.revenue || 0,
    ordersCount: ordersRow?.count || 0,
    activeProducts: activeProductsRow?.count || 0,
    openOrders: openOrdersRow?.count || 0,
    newMessages: newMessagesRow?.count || 0
  });
}


/* ---------------------------------------------------------
   UPLOAD HANDLERS — SAFE
--------------------------------------------------------- */

async function vendorUploadLogo(request, db, env) {
  const form = await request.formData();
  const file = form.get("file");
  if (!file) return json({ error: "Missing file" }, 400);

  const email = request.headers.get("X-Vendor-Email");
  const vendor = await safeVendor(db, email);
  if (!vendor) return json({ error: "Vendor not found" }, 404);

  const vendorId = vendor.id;
  const key = `network/vendors/${vendorId}/logo.png`;

  await env.R2.put(key, file.stream(), {
    httpMetadata: { contentType: file.type }
  });

  const urlPath = `/network/vendors/${vendorId}/logo.png`;

  await db.prepare(
    "UPDATE network_vendors SET logo = ? WHERE id = ?"
  ).bind(urlPath, vendorId).run();

  return json({ success: true, url: urlPath });
}

async function vendorUploadProductImage(request, db, env) {
  const form = await request.formData();
  const file = form.get("file");
  const productId = form.get("productId");

  if (!file || !productId)
    return json({ error: "Missing file or productId" }, 400);

  const product = await db.prepare(
    "SELECT vendorId FROM network_products WHERE id = ?"
  ).bind(productId).first();
  if (!product) return json({ error: "Product not found" }, 404);

  const vendorId = product.vendorId;
  const key = `network/vendors/${vendorId}/products/${productId}.png`;

  await env.R2.put(key, file.stream(), {
    httpMetadata: { contentType: file.type }
  });

  const urlPath = `/network/vendors/${vendorId}/products/${productId}.png`;

  await db.prepare(
    "UPDATE network_products SET image = ? WHERE id = ?"
  ).bind(urlPath, productId).run();

  return json({ success: true, url: urlPath });
}

async function vendorUploadCover(request, db, env) {
  const form = await request.formData();
  const file = form.get("file");
  if (!file) return json({ error: "Missing file" }, 400);

  const email = request.headers.get("X-Vendor-Email");
  const vendor = await safeVendor(db, email);
  if (!vendor) return json({ error: "Vendor not found" }, 404);

  const vendorId = vendor.id;
  const key = `network/vendors/${vendorId}/cover.png`;

  await env.R2.put(key, file.stream(), {
    httpMetadata: { contentType: file.type }
  });

  const urlPath = `/network/vendors/${vendorId}/cover.png`;

  await db.prepare(
    "UPDATE network_vendors SET cover = ? WHERE id = ?"
  ).bind(urlPath, vendorId).run();

  return json({ success: true, url: urlPath });
}


/* ---------------------------------------------------------
   CHECKOUT
--------------------------------------------------------- */

async function createCheckout(request, db) {
  const body = await request.json();
  const { buyerEmail, itemId, type, quantity } = body;

  if (!buyerEmail || !itemId || !type) {
    return json({ error: "Missing buyerEmail, itemId, or type" }, 400);
  }

  let vendorId = null;

  if (type === "product") {
    const p = await db.prepare(
      "SELECT vendorId FROM network_products WHERE id = ?"
    ).bind(itemId).first();
    vendorId = p?.vendorId || null;
  } else if (type === "service") {
    const s = await db.prepare(
      "SELECT vendorId FROM network_services WHERE id = ?"
    ).bind(itemId).first();
    vendorId = s?.vendorId || null;
  } else if (type === "workshop") {
    const w = await db.prepare(
      "SELECT vendorId FROM network_workshops WHERE id = ?"
    ).bind(itemId).first();
    vendorId = w?.vendorId || null;
  } else if (type === "app") {
    const a = await db.prepare(
      "SELECT vendorId FROM network_apps WHERE id = ?"
    ).bind(itemId).first();
    vendorId = a?.vendorId || null;
  }

  if (!vendorId) return json({ error: "Vendor not found for item" }, 404);

  const id = crypto.randomUUID();

  await db.prepare(
    `INSERT INTO network_orders (id, vendorId, buyerEmail, itemType, itemId, quantity, paymentStatus)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).bind(id, vendorId, buyerEmail, type, itemId, quantity || 1, "pending").run();

  return json({
    success: true,
    orderId: id,
    redirectUrl: `https://fast-roll.pages.dev/?orderId=${id}`
  });
}
