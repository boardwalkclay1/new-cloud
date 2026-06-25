// worker.js — Beltline Cloud Worker Version (DB_network binding)

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

    // ADMIN
    if (path === "/api/admin/bookings" && request.method === "GET")
      return admin(request, env, () => listBookings(env));
    if (path === "/api/admin/payouts" && request.method === "GET")
      return admin(request, env, () => listPayouts(env));
    if (path === "/api/admin/payouts/mark-paid" && request.method === "POST")
      return admin(request, env, () => markPayoutPaid(request, env));
    if (path === "/api/admin/availability/set" && request.method === "POST")
      return admin(request, env, () => setAvailability(request, env));

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
    if (path === "/api/staff/me" && request.method === "GET") return staffMe(url, env);
    if (path === "/api/staff/profile/update" && request.method === "POST") return staffUpdateProfile(request, env);
    if (path === "/api/staff/products" && request.method === "GET") return staffProducts(url, env);
    if (path === "/api/staff/product/create" && request.method === "POST") return staffCreateProduct(request, env);
    if (path === "/api/staff/product/update" && request.method === "POST") return staffUpdateProduct(request, env);
    if (path === "/api/staff/product/delete" && request.method === "POST") return staffDeleteProduct(request, env);
    if (path === "/api/staff/orders" && request.method === "GET") return staffOrders(url, env);
    if (path === "/api/staff/payouts" && request.method === "GET") return staffPayouts(url, env);

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

/* ========= EXISTING WORKSHOP LOGIC ========= */

// STAFF (legacy workshops)
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
