import { json } from "../utils/json.js"
import { paypalToken } from "../utils/paypal.js"

export async function handle(request, env) {
  const url = new URL(request.url)
  const path = url.pathname

  if (path === "/api/availability" && request.method === "GET")
    return getAvailability(url, env)

  if (path === "/api/book" && request.method === "POST")
    return createBooking(request, env)

  if (path === "/api/user/bookings" && request.method === "GET")
    return userBookings(url, env)

  return json({ error: "Workshop route not found" }, 404)
}

async function getAvailability(url, env) {
  const staffId = url.searchParams.get("staffId")
  const discipline = url.searchParams.get("discipline")
  const date = url.searchParams.get("date")

  let query = "SELECT * FROM availability WHERE isBooked = 0"
  const params = []

  if (staffId) { query += " AND staffId = ?"; params.push(staffId) }
  if (discipline) { query += " AND discipline = ?"; params.push(discipline) }
  if (date) { query += " AND date = ?"; params.push(date) }

  const stmt = env.DB_network.prepare(query)
  const bound = params.length ? stmt.bind(...params) : stmt

  const { results } = await bound.all()
  return json(results)
}

async function createBooking(request, env) {
  const body = await request.json()
  const { name, email, discipline, instructor, date, time, notes, phone } = body

  if (!name || !email || !discipline || !instructor || !date || !time)
    return json({ error: "Missing fields" }, 400)

  const price = instructor === "clay" ? 200 : 80
  const instructorId = instructor === "clay" ? "staff_clay" : "staff_team"

  const slot = await env.DB_network.prepare(
    `SELECT * FROM availability
     WHERE staffId = ? AND discipline = ? AND date = ? AND time = ? AND isBooked = 0`
  ).bind(instructorId, discipline, date, time).first()

  if (slot) {
    await env.DB_network.prepare(
      "UPDATE availability SET isBooked = 1 WHERE id = ?"
    ).bind(slot.id).run()
  }

  const token = await paypalToken(env)

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
  })

  const order = await orderRes.json()

  const bookingId = crypto.randomUUID()

  await env.DB_network.prepare(
    `INSERT INTO bookings
     (id, userName, userEmail, userPhone, discipline, instructorId, instructorType, date, time, notes, price, paymentStatus, paypalOrderId, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, datetime('now'))`
  ).bind(
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
  ).run()

  const approveLink = order.links.find(l => l.rel === "approve")?.href
  return json({ approveUrl: approveLink })
}

async function userBookings(url, env) {
  const email = url.searchParams.get("email")
  if (!email) return json({ error: "Missing email" }, 400)

  const { results } = await env.DB_network.prepare(
    "SELECT * FROM bookings WHERE userEmail = ? ORDER BY createdAt DESC"
  ).bind(email).all()

  return json(results)
}
