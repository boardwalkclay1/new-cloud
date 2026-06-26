import { json } from "../utils/json.js"
import { hashPassword, generateToken, getUserFromToken } from "../utils/auth.js"
import { paypalToken } from "../utils/paypal.js"

// MAIN ROUTER FOR ALL /api/network ROUTES
export async function handle(request, env) {
  const url = new URL(request.url)
  const path = url.pathname

  //
  // AUTH
  //
  if (path === "/api/network/signup" && request.method === "POST")
    return signup(request, env)

  if (path === "/api/network/login" && request.method === "POST")
    return login(request, env)

  if (path === "/api/network/me" && request.method === "GET")
    return me(request, env)

  if (path === "/api/network/profile/update" && request.method === "POST")
    return updateProfile(request, env)

  //
  // PUBLIC (OLD)
  //
  if (path === "/api/network/list" && request.method === "GET")
    return listProfiles(env)

  if (path === "/api/network/profile" && request.method === "GET")
    return getProfile(url, env)

  //
  // PAYMENTS
  //
  if (path === "/api/network/pay" && request.method === "POST")
    return pay(request, env)

  if (path === "/api/network/pay/capture" && request.method === "POST")
    return capture(request, env)

  return json({ error: "Network route not found" }, 404)
}

//
// ========== AUTH ==========
//

async function signup(request, env) {
  const body = await request.json()
  const { email, password, name } = body

  if (!email || !password || !name)
    return json({ error: "Missing fields" }, 400)

  const existing = await env.DB_network.prepare(
    "SELECT id FROM network_users WHERE email = ?"
  ).bind(email).first()

  if (existing) return json({ error: "Email already exists" }, 400)

  const id = crypto.randomUUID()
  const passwordHash = hashPassword(password)

  await env.DB_network.prepare(
    `INSERT INTO network_users (id, email, passwordHash, name, photoUrl, bio, createdAt)
     VALUES (?, ?, ?, ?, '', '', datetime('now'))`
  ).bind(id, email, passwordHash, name).run()

  const token = generateToken(id)
  return json({ success: true, token })
}

async function login(request, env) {
  const body = await request.json()
  const { email, password } = body

  if (!email || !password)
    return json({ error: "Missing fields" }, 400)

  const user = await env.DB_network.prepare(
    "SELECT * FROM network_users WHERE email = ?"
  ).bind(email).first()

  if (!user) return json({ error: "Invalid login" }, 401)
  if (user.passwordHash !== hashPassword(password))
    return json({ error: "Invalid login" }, 401)

  const token = generateToken(user.id)
  return json({ success: true, token })
}

async function me(request, env) {
  const user = await getUserFromToken(request, env)
  if (!user) return json({ error: "Unauthorized" }, 401)

  return json({
    id: user.id,
    email: user.email,
    name: user.name,
    photoUrl: user.photoUrl,
    bio: user.bio
  })
}

async function updateProfile(request, env) {
  const user = await getUserFromToken(request, env)
  if (!user) return json({ error: "Unauthorized" }, 401)

  const body = await request.json()
  const { name, photoUrl, bio } = body

  await env.DB_network.prepare(
    "UPDATE network_users SET name = ?, photoUrl = ?, bio = ? WHERE id = ?"
  ).bind(name || "", photoUrl || "", bio || "", user.id).run()

  return json({ success: true })
}

//
// ========== PUBLIC PROFILES (OLD) ==========
//

async function listProfiles(env) {
  const { results } = await env.DB_network.prepare(
    "SELECT id, name, bio, photoUrl FROM network_users"
  ).all()

  return json(results)
}

async function getProfile(url, env) {
  const id = url.searchParams.get("id")
  if (!id) return json({ error: "Missing id" }, 400)

  const profile = await env.DB_network.prepare(
    "SELECT id, name, bio, photoUrl FROM network_users WHERE id = ?"
  ).bind(id).first()

  if (!profile) return json({ error: "Not found" }, 404)

  return json(profile)
}

//
// ========== PAYMENTS ==========
//

async function pay(request, env) {
  const body = await request.json()
  const { vendorId, productId } = body

  if (!vendorId || !productId)
    return json({ error: "Missing fields" }, 400)

  const product = await env.DB_network.prepare(
    "SELECT * FROM network_products WHERE id = ? AND active = 1"
  ).bind(productId).first()

  if (!product) return json({ error: "Product not found" }, 404)

  const price = product.price || 0
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
          description: `Network Product — ${product.name}`
        }
      ],
      application_context: {
        return_url: `${env.SITE_URL}/network/public/pages/product.html?paypal=return`,
        cancel_url: `${env.SITE_URL}/network/public/pages/product.html?paypal=cancel`
      }
    })
  })

  const order = await orderRes.json()
  const orderId = order.id

  const id = crypto.randomUUID()
  await env.DB_network.prepare(
    `INSERT INTO network_orders
     (id, vendorId, productId, price, paypalOrderId, status, createdAt)
     VALUES (?, ?, ?, ?, ?, 'pending', datetime('now'))`
  ).bind(id, vendorId, productId, price, orderId).run()

  const approveLink = order.links.find(l => l.rel === "approve")?.href
  return json({ orderId: id, approveUrl: approveLink })
}

async function capture(request, env) {
  const body = await request.json()
  const { orderId } = body

  if (!orderId) return json({ error: "Missing orderId" }, 400)

  const orderRow = await env.DB_network.prepare(
    "SELECT * FROM network_orders WHERE id = ?"
  ).bind(orderId).first()

  if (!orderRow) return json({ error: "Order not found" }, 404)

  const token = await paypalToken(env)

  const res = await fetch(
    `https://api-m.paypal.com/v2/checkout/orders/${orderRow.paypalOrderId}/capture`,
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
    "UPDATE network_orders SET status = 'paid' WHERE id = ?"
  ).bind(orderId).run()

  return json({ success: true, paypal: data })
}
