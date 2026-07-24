// src/worker/events/work-events.js
// CLOUD EVENTS SYSTEM
// Tables: events, event_tier, event_ticket, event_purchase, event_host

export async function handleEvents(path, request, db, url, env) {

  /* EVENTS CORE */
  if (path === "/api/events/create" && request.method === "POST")
    return createEvent(request, db, env);

  if (path === "/api/events/details" && request.method === "GET")
    return eventDetails(db, url);

  if (path === "/api/events/upcoming" && request.method === "GET")
    return upcomingEvents(db);

  /* USER PURCHASES */
  if (path === "/api/events/purchases" && request.method === "GET")
    return userPurchases(db, url);

  /* PAYPAL FLOW */
  if (path === "/api/events/paypal/create" && request.method === "POST")
    return paypalCreate(request, db, env);

  if (path === "/api/events/paypal/complete" && request.method === "POST")
    return paypalComplete(request, db, env);

  /* TICKETS + QR */
  if (path === "/api/events/ticket/validate" && request.method === "GET")
    return validateTicket(db, url);

  if (path === "/api/events/ticket/use" && request.method === "POST")
    return useTicket(request, db);

  /* HOST LOGIC */
  if (path === "/api/events/host/link" && request.method === "POST")
    return hostDashboardLink(request, db);

  if (path === "/api/events/host/pin" && request.method === "POST")
    return hostPinSetup(request, db);

  if (path === "/api/events/host/history" && request.method === "GET")
    return hostHistory(db, url);

  return json({ error: "Events route not found" }, 404);
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

/* ---------------------------------------------------------
   EVENTS CORE
--------------------------------------------------------- */

async function createEvent(request, db, env) {
  const body = await request.json();
  const {
    hostUserId,
    title,
    tagline,
    description,
    date,
    time,
    location,
    mainPhotoUrl,
    ticketTiers,
    legalAccepted
  } = body;

  if (!hostUserId || !title || !date || !time || !location || !legalAccepted)
    return json({ error: "Missing required fields or legal not accepted" }, 400);

  const eventId = crypto.randomUUID();

  await db.prepare(
    `INSERT INTO events (
       id, hostUserId, title, tagline, description,
       date, time, location, mainPhotoUrl,
       status, createdAt
     )
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', datetime('now'))`
  ).bind(
    eventId,
    hostUserId,
    title,
    tagline || null,
    description || null,
    date,
    time,
    location,
    mainPhotoUrl || null
  ).run();

  if (Array.isArray(ticketTiers)) {
    for (const tier of ticketTiers) {
      const tierId = crypto.randomUUID();
      await db.prepare(
        `INSERT INTO event_tier (
           id, eventId, name, price, maxQuantity, earlyBird,
           createdAt
         )
         VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`
      ).bind(
        tierId,
        eventId,
        tier.name,
        tier.price,
        tier.maxQuantity || null,
        tier.earlyBird ? 1 : 0
      ).run();
    }
  }

  await db.prepare(
    `INSERT INTO event_host (
       id, userId, eventId, legalAccepted, createdAt
     )
     VALUES (?, ?, ?, 1, datetime('now'))`
  ).bind(crypto.randomUUID(), hostUserId, eventId).run();

  return json({ success: true, eventId });
}

async function eventDetails(db, url) {
  const eventId = url.searchParams.get("eventId");
  if (!eventId) return json({ error: "Missing eventId" }, 400);

  const event = await db.prepare(
    "SELECT * FROM events WHERE id = ?"
  ).bind(eventId).first();

  if (!event) return json({ error: "Event not found" }, 404);

  const tiers = await db.prepare(
    "SELECT * FROM event_tier WHERE eventId = ? ORDER BY price ASC"
  ).bind(eventId).all();

  return json({
    ...event,
    ticketTiers: tiers.results || []
  });
}

async function upcomingEvents(db) {
  const rows = await db.prepare(
    `SELECT id, title, date, time, mainPhotoUrl,
            (SELECT MIN(price) FROM event_tier WHERE eventId = events.id) AS startingPrice
     FROM events
     WHERE status = 'active'
       AND date >= date('now')
     ORDER BY date ASC, time ASC
     LIMIT 50`
  ).all();

  return json(rows.results || []);
}

/* ---------------------------------------------------------
   USER PURCHASES
--------------------------------------------------------- */

async function userPurchases(db, url) {
  const userId = url.searchParams.get("userId");
  if (!userId) return json({ error: "Missing userId" }, 400);

  const rows = await db.prepare(
    `SELECT
       ep.id AS purchaseId,
       ep.userId,
       ep.eventId,
       ep.tierId,
       ep.quantity,
       ep.totalPaid,
       ep.createdAt,
       e.title AS eventTitle,
       e.date,
       e.time,
       et.name AS tierName,
       et.price,
       et.earlyBird,
       et.id AS tierIdRef,
       et.eventId AS tierEventId,
       et.maxQuantity,
       t.id AS ticketId
     FROM event_purchase ep
     JOIN events e ON ep.eventId = e.id
     JOIN event_tier et ON ep.tierId = et.id
     LEFT JOIN event_ticket t ON t.purchaseId = ep.id
     WHERE ep.userId = ?
     ORDER BY ep.createdAt DESC`
  ).bind(userId).all();

  return json(rows.results || []);
}

/* ---------------------------------------------------------
   PAYPAL FLOW (CREATE + COMPLETE)
--------------------------------------------------------- */

async function paypalCreate(request, db, env) {
  const body = await request.json();
  const { userId, eventId, tierId, quantity } = body;

  if (!userId || !eventId || !tierId || !quantity)
    return json({ error: "Missing fields" }, 400);

  const tier = await db.prepare(
    "SELECT * FROM event_tier WHERE id = ? AND eventId = ?"
  ).bind(tierId, eventId).first();

  if (!tier) return json({ error: "Tier not found" }, 404);

  const event = await db.prepare(
    "SELECT * FROM events WHERE id = ?"
  ).bind(eventId).first();

  if (!event) return json({ error: "Event not found" }, 404);

  const subtotal = tier.price * quantity;
  const platformFee = subtotal * 0.10;
  const total = subtotal + platformFee;

  const purchaseId = crypto.randomUUID();

  await db.prepare(
    `INSERT INTO event_purchase (
       id, userId, eventId, tierId,
       quantity, subtotal, platformFee, totalPaid,
       status, createdAt
     )
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', datetime('now'))`
  ).bind(
    purchaseId,
    userId,
    eventId,
    tierId,
    quantity,
    subtotal,
    platformFee,
    total
  ).run();

  // Placeholder: integrate real PayPal API here
  const approvalUrl = `${env.PAYPAL_REDIRECT_BASE}/approve?purchaseId=${purchaseId}`;

  return json({ success: true, approvalUrl, purchaseId });
}

async function paypalComplete(request, db, env) {
  const body = await request.json();
  const { purchaseId, paypalOrderId, success } = body;

  if (!purchaseId || !paypalOrderId)
    return json({ error: "Missing purchaseId or paypalOrderId" }, 400);

  const purchase = await db.prepare(
    "SELECT * FROM event_purchase WHERE id = ?"
  ).bind(purchaseId).first();

  if (!purchase) return json({ error: "Purchase not found" }, 404);

  if (!success) {
    await db.prepare(
      `UPDATE event_purchase
       SET status = 'failed'
       WHERE id = ?`
    ).bind(purchaseId).run();

    return json({ success: false, error: "Payment failed" });
  }

  await db.prepare(
    `UPDATE event_purchase
     SET status = 'paid', paypalOrderId = ?
     WHERE id = ?`
  ).bind(paypalOrderId, purchaseId).run();

  for (let i = 0; i < purchase.quantity; i++) {
    const ticketId = crypto.randomUUID();
    const qrCode = crypto.randomUUID();

    await db.prepare(
      `INSERT INTO event_ticket (
         id, purchaseId, eventId, tierId,
         userId, qrCode, used, createdAt
       )
       VALUES (?, ?, ?, ?, ?, ?, 0, datetime('now'))`
    ).bind(
      ticketId,
      purchaseId,
      purchase.eventId,
      purchase.tierId,
      purchase.userId,
      qrCode
    ).run();
  }

  return json({ success: true, purchaseId });
}

/* ---------------------------------------------------------
   TICKETS + QR
--------------------------------------------------------- */

async function validateTicket(db, url) {
  const ticketId = url.searchParams.get("ticketId");
  const qrCode = url.searchParams.get("qrCode");

  if (!ticketId && !qrCode)
    return json({ error: "Missing ticketId or qrCode" }, 400);

  let ticket;

  if (ticketId) {
    ticket = await db.prepare(
      "SELECT * FROM event_ticket WHERE id = ?"
    ).bind(ticketId).first();
  } else {
    ticket = await db.prepare(
      "SELECT * FROM event_ticket WHERE qrCode = ?"
    ).bind(qrCode).first();
  }

  if (!ticket) return json({ valid: false, error: "Ticket not found" }, 404);
  if (ticket.used) return json({ valid: false, error: "Ticket already used" }, 403);

  const event = await db.prepare(
    "SELECT * FROM events WHERE id = ?"
  ).bind(ticket.eventId).first();

  return json({
    valid: true,
    ticketId: ticket.id,
    eventId: ticket.eventId,
    tierId: ticket.tierId,
    userId: ticket.userId,
    eventTitle: event?.title || null,
    eventDate: event?.date || null,
    eventTime: event?.time || null
  });
}

async function useTicket(request, db) {
  const body = await request.json();
  const { ticketId } = body;

  if (!ticketId) return json({ error: "Missing ticketId" }, 400);

  const ticket = await db.prepare(
    "SELECT * FROM event_ticket WHERE id = ?"
  ).bind(ticketId).first();

  if (!ticket) return json({ error: "Ticket not found" }, 404);
  if (ticket.used) return json({ error: "Ticket already used" }, 403);

  await db.prepare(
    `UPDATE event_ticket
     SET used = 1, usedAt = datetime('now')
     WHERE id = ?`
  ).bind(ticketId).run();

  return json({ success: true, ticketId });
}

/* ---------------------------------------------------------
   HOST LOGIC
--------------------------------------------------------- */

async function hostDashboardLink(request, db) {
  const body = await request.json();
  const { userId } = body;

  if (!userId) return json({ error: "Missing userId" }, 400);

  const host = await db.prepare(
    "SELECT * FROM event_host_pin WHERE userId = ?"
  ).bind(userId).first();

  const hostUrl = host
    ? `/events/host/dashboard.html?userId=${userId}`
    : `/events/host/setup-pin.html?userId=${userId}`;

  return json({ success: true, hostUrl });
}

async function hostPinSetup(request, db) {
  const body = await request.json();
  const { userId, pin } = body;

  if (!userId || !pin) return json({ error: "Missing userId or pin" }, 400);
  if (String(pin).length !== 4) return json({ error: "PIN must be 4 digits" }, 400);

  const existing = await db.prepare(
    "SELECT * FROM event_host_pin WHERE userId = ?"
  ).bind(userId).first();

  if (existing) {
    await db.prepare(
      `UPDATE event_host_pin
       SET pin = ?, updatedAt = datetime('now')
       WHERE userId = ?`
    ).bind(pin, userId).run();
  } else {
    await db.prepare(
      `INSERT INTO event_host_pin (
         id, userId, pin, createdAt
       )
       VALUES (?, ?, ?, datetime('now'))`
    ).bind(crypto.randomUUID(), userId, pin).run();
  }

  return json({ success: true });
}

async function hostHistory(db, url) {
  const userId = url.searchParams.get("userId");
  if (!userId) return json({ error: "Missing userId" }, 400);

  const rows = await db.prepare(
    `SELECT
       e.id AS eventId,
       e.title,
       e.date,
       e.time,
       e.location,
       e.createdAt,
       SUM(ep.totalPaid) AS grossRevenue,
       SUM(ep.platformFee) AS platformFees,
       SUM(ep.subtotal) AS hostRevenue,
       COUNT(DISTINCT ep.id) AS totalPurchases,
       COUNT(DISTINCT t.id) AS totalTickets
     FROM events e
     LEFT JOIN event_purchase ep ON ep.eventId = e.id AND ep.status = 'paid'
     LEFT JOIN event_ticket t ON t.eventId = e.id
     WHERE e.hostUserId = ?
     GROUP BY e.id
     ORDER BY e.date DESC, e.time DESC`
  ).bind(userId).all();

  return json(rows.results || []);
}
