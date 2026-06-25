// worker.js — Beltline Cloud Worker Version (DB_network binding, full vendor system)

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    // PUBLIC WORKSHOPS
    if (path === "/api/staff" && request.method === "GET") return listStaff(env);
    if (path === "/api/staff/profile" && request.method === "GET") return staffProfile(url, env);
    if (path === "/api/availability" && request.method === "GET") return getAvailability(url, env);
    if (path === "/api/book" && request.method === "POST") return createBooking(request, env);
    if (path === "/api/paypal/capture" && request.method === "POST") return captureOrder(request, env);
    if (path === "/api/user/bookings" && request.method === "GET") return userBookings(url, env);

    // ADMIN (workshops / payouts)
    if (path === "/api/admin/bookings" && request.method === "GET")
      return admin(request, env, () => listBookings(env));
    if (path === "/api/admin/payouts" && request.method === "GET")
      return admin(request, env, () => listPayouts(env));
    if (path === "/api/admin/payouts/mark-paid" && request.method === "POST")
      return admin(request, env, () => markPayoutPaid(request, env));
    if (path === "/api/admin/availability/set" && request.method === "POST")
      return admin(request, env, () => setAvailability(request, env));

    // NETWORK AUTH + PROFILE
    if (path === "/api/network/signup" && request.method === "POST") return networkSignup(request, env);
    if (path === "/api/network/login" && request.method === "POST") return networkLogin(request, env);
    if (path === "/api/network/me" && request.method === "GET") return networkMe(request, env);
    if (path === "/api/network/profile/update" && request.method === "POST") return networkProfileUpdate(request, env);

    // NETWORK PUBLIC (old)
    if (path === "/api/network/list" && request.method === "GET") return listNetworkProfiles(env);
    if (path === "/api/network/profile" && request.method === "GET") return getNetworkProfile(url, env);
    if (path === "/api/network/pay" && request.method === "POST") return networkPay(request, env);
    if (path === "/api/network/pay/capture" && request.method === "POST") return networkCapture(request, env);

    // NETWORK PUBLIC — NEW FEEDS
    if (path === "/api/network/vendors" && request.method === "GET") return listVendors(env);
    if (path === "/api/network/services" && request.method === "GET") return listServices(env);
    if (path === "/api/network/products" && request.method === "GET") return listProducts(env);
    if (path === "/api/network/explore" && request.method === "GET") return listExplore(env);
    if (path === "/api/network/vendor" && request.method === "GET") return getVendorFull(url, env);
    if (path === "/api/network/workshops" && request.method === "GET") return listWorkshops(env);

    // STAFF PORTAL (Network)
    if (path === "/api/staff/me" && request.method === "GET") return staffMe(request, env);
    if (path === "/api/staff/profile/update" && request.method === "POST") return staffUpdateProfile(request, env);
    if (path === "/api/staff/products" && request.method === "GET") return staffProducts(request, env);
    if (path === "/api/staff/product/create" && request.method === "POST") return staffCreateProduct(request, env);
    if (path === "/api/staff/product/update" && request.method === "POST") return staffUpdateProduct(request, env);
    if (path === "/api/staff/product/delete" && request.method === "POST") return staffDeleteProduct(request, env);
    if (path === "/api/staff/orders" && request.method === "GET") return staffOrders(request, env);
    if (path === "/api/staff/payouts" && request.method === "GET") return staffPayouts(request, env);

    // ADMIN NETWORK
    if (path === "/api/admin/network/profiles" && request.method === "GET")
      return admin(request, env, () => adminListProfiles(env));
    if (path === "/api/admin/network/products" && request.method === "GET")
      return admin(request, env, () => adminListProducts(env));
    if (path === "/api/admin/network/block" && request.method === "POST")
      return admin(request, env, () => adminBlockProfile(request, env));
    if (path === "/api/admin/network/commission" && request.method === "POST")
      return admin(request, env, () => adminSetCommission(request, env));
    if (path === "/api/admin/network/free-window" && request.method === "POST")
      return admin(request, env, () => adminSetFreeWindow(request, env));
    if (path === "/api/admin/network/analytics" && request.method === "GET")
      return admin(request, env, () => adminAnalytics(env));

    return new Response("Not found", { status: 404 });
  }
};

// ========== UTILITIES ==========

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}

function admin(request, env, handler) {
  if (request.headers.get("x-admin-token") !== env.ADMIN_TOKEN)
    return new Response("Unauthorized", { status: 401 });
  return handler();
}

async function notifyEvent(type, to, data, env) {
  if (!env.EMAIL_WEBHOOK_URL || !to) return;
  await fetch(env.EMAIL_WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type, to, data })
  });
}

async function paypalToken(env) {
  const creds = btoa(`${env.PAYPAL_CLIENT_ID}:${env.PAYPAL_SECRET}`);
  const res = await fetch("https://api-m.paypal.com/v1/oauth2/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${creds}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: "grant_type=client_credentials"
  });
  const data = await res.json();
  return data.access_token;
}

function hashPassword(password) {
  // simple hash placeholder; replace with real hashing in production
  return btoa(password);
}

function generateToken(userId) {
  return btoa(`${userId}:${Date.now()}`);
}

async function getUserFromToken(request, env) {
  const auth = request.headers.get("Authorization") || "";
  if (!auth) return null;
  const [userId] = atob(auth).split(":");
  if (!userId) return null;
  const user = await env.DB_network.prepare(
    "SELECT * FROM network_users WHERE id = ?"
  ).bind(userId).first();
  return user || null;
}

// ========== NETWORK AUTH + PROFILE ==========

async function networkSignup(request, env) {
  const body = await request.json();
  const { email, password, name } = body;

  if (!email || !password || !name)
    return json({ error: "Missing fields" }, 400);

  const existing = await env.DB_network.prepare(
    "SELECT id FROM network_users WHERE email = ?"
  ).bind(email).first();
  if (existing) return json({ error: "Email already exists" }, 400);

  const id = crypto.randomUUID();
  const passwordHash = hashPassword(password);

  await env.DB_network.prepare(
    `INSERT INTO network_users (id, email, passwordHash, name, photoUrl, bio, createdAt)
     VALUES (?, ?, ?, ?, '', '', datetime('now'))`
  ).bind(id, email, passwordHash, name).run();

  const token = generateToken(id);
  return json({ success: true, token });
}

async function networkLogin(request, env) {
  const body = await request.json();
  const { email, password } = body;

  if (!email || !password)
    return json({ error: "Missing fields" }, 400);

  const user = await env.DB_network.prepare(
    "SELECT * FROM network_users WHERE email = ?"
  ).bind(email).first();

  if (!user) return json({ error: "Invalid login" }, 401);
  if (user.passwordHash !== hashPassword(password))
    return json({ error: "Invalid login" }, 401);

  const token = generateToken(user.id);
  return json({ success: true, token });
}

async function networkMe(request, env) {
  const user = await getUserFromToken(request, env);
  if (!user) return json({ error: "Unauthorized" }, 401);
  return json({
    id: user.id,
    email: user.email,
    name: user.name,
    photoUrl: user.photoUrl,
    bio: user.bio
  });
}

async function networkProfileUpdate(request, env) {
  const user = await getUserFromToken(request, env);
  if (!user) return json({ error: "Unauthorized" }, 401);

  const body = await request.json();
  const { name, photoUrl, bio } = body;

  await env.DB_network.prepare(
    "UPDATE network_users SET name = ?, photoUrl = ?, bio = ? WHERE id = ?"
  ).bind(name || "", photoUrl || "", bio || "", user.id).run();

  return json({ success: true });
}

// ========== NETWORK PUBLIC (OLD) ==========

async function listNetworkProfiles(env) {
  const { results } = await env.DB_network.prepare(
    "SELECT id, name, bio, photoUrl FROM network_users"
  ).all();
  return json(results);
}

async function getNetworkProfile(url, env) {
  const id = url.searchParams.get("id");
  if (!id) return json({ error: "Missing id" }, 400);
  const profile = await env.DB_network.prepare(
    "SELECT id, name, bio, photoUrl FROM network_users WHERE id = ?"
  ).bind(id).first();
  if (!profile) return json({ error: "Not found" }, 404);
  return json(profile);
}

// ========== NETWORK FEEDS (FULL VENDOR SYSTEM) ==========

async function listVendors(env) {
  const { results } = await env.DB_network.prepare(
    `SELECT v.id, v.name, v.bio, v.photoUrl, v.tags, v.categories
     FROM network_vendors v
     WHERE v.active = 1`
  ).all();
  return json(results);
}

async function listServices(env) {
  const { results } = await env.DB_network.prepare(
    `SELECT s.id, s.vendorId, s.name, s.description, s.price, s.photoUrl, s.featured
     FROM network_services s
     WHERE s.active = 1`
  ).all();
  return json(results);
}

async function listProducts(env) {
  const { results } = await env.DB_network.prepare(
    `SELECT p.id, p.vendorId, p.name, p.description, p.price, p.photoUrl, p.featured
     FROM network_products p
     WHERE p.active = 1`
  ).all();
  return json(results);
}

async function listExplore(env) {
  const { results } = await env.DB_network.prepare(
    `SELECT id, title, description
     FROM network_explore
     ORDER BY createdAt DESC
     LIMIT 50`
  ).all();
  return json(results);
}

async function getVendorFull(url, env) {
  const id = url.searchParams.get("id");
  if (!id) return json({ error: "Missing id" }, 400);

  const vendor = await env.DB_network.prepare(
    "SELECT * FROM network_vendors WHERE id = ?"
  ).bind(id).first();
  if (!vendor) return json({ error: "Not found" }, 404);

  const products = await env.DB_network.prepare(
    "SELECT * FROM network_products WHERE vendorId = ? AND active = 1"
  ).bind(id).all();

  const services = await env.DB_network.prepare(
    "SELECT * FROM network_services WHERE vendorId = ? AND active = 1"
  ).bind(id).all();

  const workshops = await env.DB_network.prepare(
    "SELECT * FROM network_workshops WHERE vendorId = ? AND active = 1"
  ).bind(id).all();

  return json({
    vendor,
    products: products.results || [],
    services: services.results || [],
    workshops: workshops.results || []
  });
}

async function listWorkshops(env) {
  const { results } = await env.DB_network.prepare(
    `SELECT w.id, w.title, w.schedule, v.name AS hostName
     FROM network_workshops w
     JOIN network_vendors v ON v.id = w.vendorId
     WHERE w.active = 1`
  ).all();
  return json(results);
}

// ========== NETWORK PAY + FAST ROLL HOOK ==========

async function networkPay(request, env) {
  const body = await request.json();
  const { vendorId, productId } = body;

  if (!vendorId || !productId)
    return json({ error: "Missing fields" }, 400);

  const product = await env.DB_network.prepare(
    "SELECT * FROM network_products WHERE id = ? AND active = 1"
  ).bind(productId).first();
  if (!product) return json({ error: "Product not found" }, 404);

  const price = product.price || 0;

  const token = await paypalToken(env);
  const orderRes = await fetch("https://api-m.paypal.com/v2/checkout/orders", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          amount: { currency_code: "USD", value: price.toString() },
          description: `Network Product — ${product.name}`
        }
      ],
      application_context: {
        return_url: `${env.SITE_URL}/network/public/pages/product.html?paypal=return`,
        cancel_url: `${env.SITE_URL}/network/public/pages/product.html?paypal=cancel`
      }
    })
  });

  const order = await orderRes.json();
  const orderId = order.id;

  const id = crypto.randomUUID();
  await env.DB_network.prepare(
    `INSERT INTO network_orders
     (id, vendorId, productId, price, paypalOrderId, status, createdAt)
     VALUES (?, ?, ?, ?, ?, 'pending', datetime('now'))`
  ).bind(id, vendorId, productId, price, orderId).run();

  const approveLink = order.links.find(l => l.rel === "approve")?.href;
  return json({ orderId: id, approveUrl: approveLink });
}

async function networkCapture(request, env) {
  const body = await request.json();
  const { orderId } = body;
  if (!orderId) return json({ error: "Missing orderId" }, 400);

  const orderRow = await env.DB_network.prepare(
    "SELECT * FROM network_orders WHERE id = ?"
  ).bind(orderId).first();
  if (!orderRow) return json({ error: "Order not found" }, 404);

  const token = await paypalToken(env);
  const res = await fetch(
    `https://api-m.paypal.com/v2/checkout/orders/${orderRow.paypalOrderId}/capture`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    }
  );
  const data = await res.json();

  await env.DB_network.prepare(
    "UPDATE network_orders SET status = 'paid' WHERE id = ?"
  ).bind(orderId).run();

  return json({ success: true, paypal: data });
}

// ========== STAFF (legacy workshops) ==========

async function listStaff(env) {
  const { results } = await env.DB_network.prepare(
    "SELECT * FROM staff WHERE active = 1"
  ).all();
  return json(results);
}

async function staffProfile(url, env) {
  const id = url.searchParams.get("id");
  if (!id) return json({ error: "Missing id" }, 400);
  const staff = await env.DB_network.prepare("SELECT * FROM staff WHERE id = ?")
    .bind(id)
    .first();
  if (!staff) return json({ error: "Not found" }, 404);
  return json(staff);
}

// AVAILABILITY
async function getAvailability(url, env) {
  const staffId = url.searchParams.get("staffId");
  const discipline = url.searchParams.get("discipline");
  const date = url.searchParams.get("date");

  let query = "SELECT * FROM availability WHERE isBooked = 0";
  const params = [];
  if (staffId) {
    query += " AND staffId = ?";
    params.push(staffId);
  }
  if (discipline) {
    query += " AND discipline = ?";
    params.push(discipline);
  }
  if (date) {
    query += " AND date = ?";
    params.push(date);
  }

  const stmt = env.DB_network.prepare(query);
  const bound = params.length ? stmt.bind(...params) : stmt;
  const { results } = await bound.all();
  return json(results);
}

async function setAvailability(request, env) {
  const body = await request.json();
  const { staffId, discipline, slots } = body;

  if (!staffId || !discipline || !Array.isArray(slots))
    return json({ error: "Invalid payload" }, 400);

  const now = new Date().toISOString();
  const stmt = env.DB_network.prepare(
    `INSERT INTO availability (id, staffId, discipline, date, time, isBooked, createdAt)
     VALUES (?, ?, ?, ?, ?, 0, ?)`
  );

  for (const s of slots) {
    await stmt
      .bind(crypto.randomUUID(), staffId, discipline, s.date, s.time, now)
      .run();
  }

  return json({ ok: true });
}

// BOOKING
async function createBooking(request, env) {
  const body = await request.json();
  const { name, email, discipline, instructor, date, time, notes, phone } = body;

  if (!name || !email || !discipline || !instructor || !date || !time)
    return json({ error: "Missing fields" }, 400);

  const price = instructor === "clay" ? 200 : 80;
  const instructorId = instructor === "clay" ? "staff_clay" : "staff_team";

  const slot = await env.DB_network.prepare(
    `SELECT * FROM availability
     WHERE staffId = ? AND discipline = ? AND date = ? AND time = ? AND isBooked = 0`
  )
    .bind(instructorId, discipline, date, time)
    .first();

  if (slot) {
    await env.DB_network.prepare(
      "UPDATE availability SET isBooked = 1 WHERE id = ?"
    )
      .bind(slot.id)
      .run();
  }

  const token = await paypalToken(env);

  const orderRes = await fetch("https://api-m.paypal.com/v2/checkout/orders", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          amount: { currency_code: "USD", value: price.toString() },
          description: `Beltline Workshop — ${discipline}`
        }
      ],
      application_context: {
        return_url: `${env.SITE_URL}/pages/workshops.html?paypal=return`,
        cancel_url: `${env.SITE_URL}/pages/workshops.html?paypal=cancel`
      }
    })
  });

  const order = await orderRes.json();

  const bookingId = crypto.randomUUID();
  await env.DB_network.prepare(
    `INSERT INTO bookings
     (id, userName, userEmail, userPhone, discipline, instructorId, instructorType, date, time, notes, price, paymentStatus, paypalOrderId, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, datetime('now'))`
  )
    .bind(
      bookingId,
      name,
      email,
      phone || "",
      discipline,
      instructorId,
      instructor,
      date,
      time,
      notes || "",
      price,
      order.id
    )
    .run();

  const approveLink = order.links.find(l => l.rel === "approve")?.href;
  return json({ approveUrl: approveLink });
}

async function captureOrder(request, env) {
  const body = await request.json();
  const { bookingId } = body;
  if (!bookingId) return json({ error: "Missing bookingId" }, 400);

  const booking = await env.DB_network.prepare(
    "SELECT * FROM bookings WHERE id = ?"
  ).bind(bookingId).first();
  if (!booking) return json({ error: "Not found" }, 404);

  const token = await paypalToken(env);
  const res = await fetch(
    `https://api-m.paypal.com/v2/checkout/orders/${booking.paypalOrderId}/capture`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    }
  );
  const data = await res.json();

  await env.DB_network.prepare(
    "UPDATE bookings SET paymentStatus = 'paid' WHERE id = ?"
  ).bind(bookingId).run();

  return json({ success: true, paypal: data });
}

async function userBookings(url, env) {
  const email = url.searchParams.get("email");
  if (!email) return json({ error: "Missing email" }, 400);

  const { results } = await env.DB_network.prepare(
    "SELECT * FROM bookings WHERE userEmail = ? ORDER BY createdAt DESC"
  ).bind(email).all();
  return json(results);
}

// ========== ADMIN WORKSHOPS / PAYOUTS ==========

async function listBookings(env) {
  const { results } = await env.DB_network.prepare(
    "SELECT * FROM bookings ORDER BY createdAt DESC"
  ).all();
  return json(results);
}

async function listPayouts(env) {
  const { results } = await env.DB_network.prepare(
    "SELECT * FROM payouts ORDER BY createdAt DESC"
  ).all();
  return json(results);
}

async function markPayoutPaid(request, env) {
  const body = await request.json();
  const { id } = body;
  if (!id) return json({ error: "Missing id" }, 400);

  await env.DB_network.prepare(
    "UPDATE payouts SET status = 'paid' WHERE id = ?"
  ).bind(id).run();

  return json({ success: true });
}

// ========== STAFF PORTAL (NETWORK) ==========

async function staffMe(request, env) {
  const user = await getUserFromToken(request, env);
  if (!user) return json({ error: "Unauthorized" }, 401);

  const vendor = await env.DB_network.prepare(
    "SELECT * FROM network_vendors WHERE ownerId = ?"
  ).bind(user.id).first();

  return json({ user, vendor });
}

async function staffUpdateProfile(request, env) {
  const user = await getUserFromToken(request, env);
  if (!user) return json({ error: "Unauthorized" }, 401);

  const body = await request.json();
  const { name, bio, tags, categories, photoUrl } = body;

  let vendor = await env.DB_network.prepare(
    "SELECT * FROM network_vendors WHERE ownerId = ?"
  ).bind(user.id).first();

  if (!vendor) {
    const id = crypto.randomUUID();
    await env.DB_network.prepare(
      `INSERT INTO network_vendors
       (id, ownerId, name, bio, tags, categories, photoUrl, active, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, 1, datetime('now'))`
    ).bind(id, user.id, name || "", bio || "", tags || "", categories || "", photoUrl || "").run();
  } else {
    await env.DB_network.prepare(
      `UPDATE network_vendors
       SET name = ?, bio = ?, tags = ?, categories = ?, photoUrl = ?
       WHERE ownerId = ?`
    ).bind(name || "", bio || "", tags || "", categories || "", photoUrl || "", user.id).run();
  }

  return json({ success: true });
}

async function staffProducts(request, env) {
  const user = await getUserFromToken(request, env);
  if (!user) return json({ error: "Unauthorized" }, 401);

  const vendor = await env.DB_network.prepare(
    "SELECT * FROM network_vendors WHERE ownerId = ?"
  ).bind(user.id).first();
  if (!vendor) return json([]);

  const { results } = await env.DB_network.prepare(
    "SELECT * FROM network_products WHERE vendorId = ? AND active = 1"
  ).bind(vendor.id).all();
  return json(results);
}

async function staffCreateProduct(request, env) {
  const user = await getUserFromToken(request, env);
  if (!user) return json({ error: "Unauthorized" }, 401);

  const vendor = await env.DB_network.prepare(
    "SELECT * FROM network_vendors WHERE ownerId = ?"
  ).bind(user.id).first();
  if (!vendor) return json({ error: "No vendor profile" }, 400);

  const body = await request.json();
  const { name, description, price, photoUrl } = body;

  const id = crypto.randomUUID();
  await env.DB_network.prepare(
    `INSERT INTO network_products
     (id, vendorId, name, description, price, photoUrl, featured, active, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, 0, 1, datetime('now'))`
  ).bind(id, vendor.id, name || "", description || "", price || 0, photoUrl || "").run();

  return json({ success: true, id });
}

async function staffUpdateProduct(request, env) {
  const user = await getUserFromToken(request, env);
  if (!user) return json({ error: "Unauthorized" }, 401);

  const body = await request.json();
  const { id, name, description, price, photoUrl } = body;

  await env.DB_network.prepare(
    `UPDATE network_products
     SET name = ?, description = ?, price = ?, photoUrl = ?
     WHERE id = ?`
  ).bind(name || "", description || "", price || 0, photoUrl || "", id).run();

  return json({ success: true });
}

async function staffDeleteProduct(request, env) {
  const user = await getUserFromToken(request, env);
  if (!user) return json({ error: "Unauthorized" }, 401);

  const body = await request.json();
  const { id } = body;

  await env.DB_network.prepare(
    "UPDATE network_products SET active = 0 WHERE id = ?"
  ).bind(id).run();

  return json({ success: true });
}

async function staffOrders(request, env) {
  const user = await getUserFromToken(request, env);
  if (!user) return json({ error: "Unauthorized" }, 401);

  const vendor = await env.DB_network.prepare(
    "SELECT * FROM network_vendors WHERE ownerId = ?"
  ).bind(user.id).first();
  if (!vendor) return json([]);

  const { results } = await env.DB_network.prepare(
    "SELECT * FROM network_orders WHERE vendorId = ? ORDER BY createdAt DESC"
  ).bind(vendor.id).all();
  return json(results);
}

async function staffPayouts(request, env) {
  const user = await getUserFromToken(request, env);
  if (!user) return json({ error: "Unauthorized" }, 401);

  const vendor = await env.DB_network.prepare(
    "SELECT * FROM network_vendors WHERE ownerId = ?"
  ).bind(user.id).first();
  if (!vendor) return json([]);

  const { results } = await env.DB_network.prepare(
    "SELECT * FROM payouts WHERE vendorId = ? ORDER BY createdAt DESC"
  ).bind(vendor.id).all();
  return json(results);
}

// ========== ADMIN NETWORK ==========

async function adminListProfiles(env) {
  const { results } = await env.DB_network.prepare(
    `SELECT v.id, v.name, v.bio, v.tags, v.categories, v.photoUrl,
            v.commissionPercent, v.blocked
     FROM network_vendors v`
  ).all();
  return json(results);
}

async function adminListProducts(env) {
  const { results } = await env.DB_network.prepare(
    `SELECT p.id, p.name, p.price, p.vendorId, v.name AS vendorName
     FROM network_products p
     JOIN network_vendors v ON v.id = p.vendorId
     WHERE p.active = 1`
  ).all();
  return json(results);
}

async function adminBlockProfile(request, env) {
  const body = await request.json();
  const { id, block } = body;
  if (!id) return json({ error: "Missing id" }, 400);

  await env.DB_network.prepare(
    "UPDATE network_vendors SET blocked = ? WHERE id = ?"
  ).bind(block ? 1 : 0, id).run();

  return json({ success: true });
}

async function adminSetCommission(request, env) {
  const body = await request.json();
  const { id, commissionPercent } = body;
  if (!id) return json({ error: "Missing id" }, 400);

  await env.DB_network.prepare(
    "UPDATE network_vendors SET commissionPercent = ? WHERE id = ?"
  ).bind(commissionPercent || 0.12, id).run();

  return json({ success: true });
}

async function adminSetFreeWindow(request, env) {
  const body = await request.json();
  const { id, freeWindowMinutes } = body;
  if (!id) return json({ error: "Missing id" }, 400);

  await env.DB_network.prepare(
    "UPDATE network_vendors SET freeWindowMinutes = ? WHERE id = ?"
  ).bind(freeWindowMinutes || 0, id).run();

  return json({ success: true });
}

async function adminAnalytics(env) {
  const totalOrders = await env.DB_network.prepare(
    "SELECT COUNT(*) AS orders, SUM(price) AS gross FROM network_orders WHERE status = 'paid'"
  ).first();

  const platformCut = (totalOrders?.gross || 0) * 0.12;

  return json({
    total: {
      orders: totalOrders?.orders || 0,
      gross: totalOrders?.gross || 0,
      platform: platformCut
    }
  });
}
