import { json } from "../utils/json.js"
import { hashPassword, generateToken } from "../utils/auth.js"

// MAIN ROUTER
export async function handle(request, env) {
  const url = new URL(request.url)
  const path = url.pathname

  if (path === "/api/rider/signup" && request.method === "POST")
    return signup(request, env)

  if (path === "/api/rider/login" && request.method === "POST")
    return login(request, env)

  return json({ error: "Rider route not found" }, 404)
}

//
// ========== SIGNUP ==========
//

async function signup(request, env) {
  const body = await request.json()
  const { name, vehicle, paypal, password } = body

  if (!name || !vehicle || !paypal || !password)
    return json({ error: "Missing fields" }, 400)

  const exists = await env.DB_network.prepare(
    "SELECT id FROM fastroll_riders WHERE name = ?"
  ).bind(name).first()

  if (exists) return json({ error: "Name already exists" }, 400)

  const id = crypto.randomUUID()
  const passwordHash = hashPassword(password)

  await env.DB_network.prepare(
    `INSERT INTO fastroll_riders (id, name, vehicle, paypal, passwordHash, createdAt)
     VALUES (?, ?, ?, ?, ?, datetime('now'))`
  ).bind(id, name, vehicle, paypal, passwordHash).run()

  const token = generateToken(id)
  return json({ id, name, vehicle, paypal, token })
}

//
// ========== LOGIN ==========
//

async function login(request, env) {
  const body = await request.json()
  const { name, password } = body

  if (!name || !password)
    return json({ error: "Missing fields" }, 400)

  const rider = await env.DB_network.prepare(
    "SELECT * FROM fastroll_riders WHERE name = ?"
  ).bind(name).first()

  if (!rider) return json({ error: "Invalid login" }, 401)
  if (rider.passwordHash !== hashPassword(password))
    return json({ error: "Invalid login" }, 401)

  const token = generateToken(rider.id)
  return json({
    id: rider.id,
    name: rider.name,
    vehicle: rider.vehicle,
    paypal: rider.paypal,
    token
  })
}
