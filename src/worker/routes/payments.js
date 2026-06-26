import { json } from "../utils/json.js"
import { paypalToken } from "../utils/paypal.js"

export async function handle(request, env) {
  const url = new URL(request.url)
  const path = url.pathname

  if (path === "/api/paypal/capture" && request.method === "POST")
    return captureOrder(request, env)

  return json({ error: "Payments route not found" }, 404)
}

async function captureOrder(request, env) {
  const body = await request.json()
  const { bookingId } = body

  if (!bookingId) return json({ error: "Missing bookingId" }, 400)

  const booking = await env.DB_network.prepare(
    "SELECT * FROM bookings WHERE id = ?"
  ).bind(bookingId).first()

  if (!booking) return json({ error: "Not found" }, 404)

  const token = await paypalToken(env)

  const res = await fetch(
    `https://api-m.paypal.com/v2/checkout/orders/${booking.paypalOrderId}/capture`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    }
  )

  const data = await res.json()

  await env.DB_network.prepare(
    "UPDATE bookings SET paymentStatus = 'paid' WHERE id = ?"
  ).bind(bookingId).run()

  return json({ success: true, paypal: data })
}
