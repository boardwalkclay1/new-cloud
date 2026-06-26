import { json } from "../utils/json.js"
import { getUserFromToken } from "../utils/auth.js"

export async function handle(request, env) {
  const url = new URL(request.url)
  const path = url.pathname

  if (path === "/api/staff/me" && request.method === "GET")
    return staffMe(request, env)

  if (path === "/api/staff/profile/update" && request.method === "POST")
    return staffUpdateProfile(request, env)

  if (path === "/api/staff/products" && request.method === "GET")
    return staffProducts(request, env)

  if (path === "/api/staff/product/create" && request.method === "POST")
    return staffCreateProduct(request, env)

  if (path === "/api/staff/product/update" && request.method === "POST")
    return staffUpdateProduct(request, env)

  if (path === "/api/staff/product/delete" && request.method === "POST")
    return staffDeleteProduct(request, env)

  if (path === "/api/staff/orders" && request.method === "GET")
    return staffOrders(request, env)

  if (path === "/api/staff/payouts" && request.method === "GET")
    return staffPayouts(request, env)

  return json({ error: "Staff route not found" }, 404)
}

async function staffMe(request, env) {
  const user = await getUserFromToken(request, env)
  if (!user) return json({ error: "Unauthorized" }, 401)

  const vendor = await env.DB_network.prepare(
    "SELECT * FROM network_vendors WHERE ownerId = ?"
  ).bind(user.id).first()

  return json({ user, vendor })
}

async function staffUpdateProfile(request, env) {
  const user = await getUserFromToken(request, env)
  if (!user) return json({ error: "Unauthorized" }, 401)

  const body = await request.json()
  const { name, bio, tags, categories, photoUrl } = body

  let vendor = await env.DB_network.prepare(
    "SELECT * FROM network_vendors WHERE ownerId = ?"
  ).bind(user.id).first()

  if (!vendor) {
    const id = crypto.randomUUID()
    await env.DB_network.prepare(
      `INSERT INTO network_vendors
       (id, ownerId, name, bio, tags, categories, photoUrl, active, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, 1, datetime('now'))`
    ).bind(id, user.id, name || "", bio || "", tags || "", categories || "", photoUrl || "").run()
  } else {
    await env.DB_network.prepare(
      `UPDATE network_vendors
       SET name = ?, bio = ?, tags = ?, categories = ?, photoUrl = ?
       WHERE ownerId = ?`
    ).bind(name || "", bio || "", tags || "", categories || "", photoUrl || "", user.id).run()
  }

  return json({ success: true })
}

async function staffProducts(request, env) {
  const user = await getUserFromToken(request, env)
  if (!user) return json({ error: "Unauthorized" }, 401)

  const vendor = await env.DB_network.prepare(
    "SELECT * FROM network_vendors WHERE ownerId = ?"
  ).bind(user.id).first()

  if (!vendor) return json([])

  const { results } = await env.DB_network.prepare(
    "SELECT * FROM network_products WHERE vendorId = ? AND active = 1"
  ).bind(vendor.id).all()

  return json(results)
}

async function staffCreateProduct(request, env) {
  const user = await getUserFromToken(request, env)
  if (!user) return json({ error: "Unauthorized" }, 401)

  const vendor = await env.DB_network.prepare(
    "SELECT * FROM network_vendors WHERE ownerId = ?"
  ).bind(user.id).first()

  if (!vendor) return json({ error: "No vendor profile" }, 400)

  const body = await request.json()
  const { name, description, price, photoUrl } = body

  const id = crypto.randomUUID()

  await env.DB_network.prepare(
    `INSERT INTO network_products
     (id, vendorId, name, description, price, photoUrl, featured, active, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, 0, 1, datetime('now'))`
  ).bind(id, vendor.id, name || "", description || "", price || 0, photoUrl || "").run()

  return json({ success: true, id })
}

async function staffUpdateProduct(request, env) {
  const body = await request.json()
  const { id, name, description, price, photoUrl } = body

  await env.DB_network.prepare(
    `UPDATE network_products
     SET name = ?, description = ?, price = ?, photoUrl = ?
     WHERE id = ?`
  ).bind(name || "", description || "", price || 0, photoUrl || "", id).run()

  return json({ success: true })
}

async function staffDeleteProduct(request, env) {
  const body = await request.json()
  const { id } = body

  await env.DB_network.prepare(
    "UPDATE network_products SET active = 0 WHERE id = ?"
  ).bind(id).run()

  return json({ success: true })
}

async function staffOrders(request, env) {
  const user = await getUserFromToken(request, env)
  if (!user) return json({ error: "Unauthorized" }, 401)

  const vendor = await env.DB_network.prepare(
    "SELECT * FROM network_vendors WHERE ownerId = ?"
  ).bind(user.id).first()

  if (!vendor) return json([])

  const { results } = await env.DB_network.prepare(
    "SELECT * FROM network_orders WHERE vendorId = ? ORDER BY createdAt DESC"
  ).bind(vendor.id).all()

  return json(results)
}

async function staffPayouts(request, env) {
  const user = await getUserFromToken(request, env)
  if (!user) return json({ error: "Unauthorized" }, 401)

  const vendor = await env.DB_network.prepare(
    "SELECT * FROM network_vendors WHERE ownerId = ?"
  ).bind(user.id).first()

  if (!vendor) return json([])

  const { results } = await env.DB_network.prepare(
    "SELECT * FROM payouts WHERE vendorId = ? ORDER BY createdAt DESC"
  ).bind(vendor.id).all()

  return json(results)
}
