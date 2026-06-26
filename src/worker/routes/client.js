import { json } from "../utils/json.js"
import { hashPassword, generateToken } from "../utils/auth.js"

// MAIN ROUTER
export async function handle(request, env) {
  const url = new URL(request.url)
  const path = url.pathname

  if (path === "/api/client/signup" && request.method === "POST")
    return signup(request, env)

  if (path === "/api/client/login" && request.method === "POST")
    return login(request, env)

  if (path === "/api/client/tip-post" && request.method === "POST")
    return tipPost(request, env)

  return json({ error: "Client route not found" }, 404)
}

//
// ========== SIGNUP ==========
//

async function signup(request, env) {
  const body = await request.json()
  const { name, email, phone, password } = body

  if (!name || !email || !phone || !password)
    return json({ error: "Missing fields" }, 400)

  const exists = await env.DB_network.prepare(
    "SELECT id FROM fastroll_clients WHERE email = ?"
  ).bind(email).first()

  if (exists) return json({ error: "Email already exists" }, 400)

  const id = crypto.randomUUID()
  const passwordHash = hashPassword(password)

  await env.DB_network.prepare(
    `INSERT INTO fastroll_clients (id, name, email, phone, passwordHash, createdAt)
     VALUES (?, ?, ?, ?, ?, datetime('now'))`
  ).bind(id, name, email, phone, passwordHash).run()

  const token = generateToken(id)
  return json({ id, name, email, phone, token })
}

//
// ========== LOGIN ==========
//

async function login(request, env) {
  const body = await request.json()
  const { email, password } = body

  if (!email || !password)
    return json({ error: "Missing fields" }, 400)

  const user = await env.DB_network.prepare(
    "SELECT * FROM fastroll_clients WHERE email = ?"
  ).bind(email).first()

  if (!user) return json({ error: "Invalid login" }, 401)
  if (user.passwordHash !== hashPassword(password))
    return json({ error: "Invalid login" }, 401)

  const token = generateToken(user.id)
  return json({
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    token
  })
}

//
// ========== TIP AFTER DELIVERY ==========
//

async function tipPost(request, env) {
  const body = await request.json()
  const { orderId, tipPost } = body

  if (!orderId || !tipPost)
    return json({ error: "Missing fields" }, 400)

  await env.DB_network.prepare(
    `UPDATE fastroll_orders SET tip = ? WHERE id = ?`
  ).bind(tipPost, orderId).run()

  return json({ success: true })
}
