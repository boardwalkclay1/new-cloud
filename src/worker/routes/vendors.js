import { json } from "../utils/json.js"

// ============================================================
// MAIN ROUTER FOR ALL NETWORK ROUTES
// ============================================================

export async function handle(request, env) {
  try {
    validateDB(env)

    const url = new URL(request.url)
    const path = url.pathname
    const method = request.method

    if (path === "/api/network/vendors" && method === "GET")
      return listVendors(env)

    if (path === "/api/network/services" && method === "GET")
      return listServices(env)

    if (path === "/api/network/products" && method === "GET")
      return listProducts(env)

    if (path === "/api/network/explore" && method === "GET")
      return listExplore(env)

    if (path === "/api/network/vendor" && method === "GET")
      return getVendorFull(url, env)

    if (path === "/api/network/workshops" && method === "GET")
      return listWorkshops(env)

    return json({ error: "Network route not found" }, 404)

  } catch (err) {
    return json({ error: err.message || "Internal error" }, 500)
  }
}

// ============================================================
// VALIDATE DB BINDING
// ============================================================

function validateDB(env) {
  if (!env.DB_network)
    throw new Error("DB_network binding missing")
}

// ============================================================
// VENDORS
// ============================================================

async function listVendors(env) {
  const { results } = await env.DB_network.prepare(
    `SELECT id, name, bio, photoUrl, tags, categories
     FROM network_vendors
     WHERE active = 1`
  ).all()

  return json(results || [])
}

// ============================================================
// SERVICES
// ============================================================

async function listServices(env) {
  const { results } = await env.DB_network.prepare(
    `SELECT id, vendorId, name, description, price, photoUrl, featured
     FROM network_services
     WHERE active = 1`
  ).all()

  return json(results || [])
}

// ============================================================
// PRODUCTS
// ============================================================

async function listProducts(env) {
  const { results } = await env.DB_network.prepare(
    `SELECT id, vendorId, name, description, price, photoUrl, featured
     FROM network_products
     WHERE active = 1`
  ).all()

  return json(results || [])
}

// ============================================================
// EXPLORE FEED
// ============================================================

async function listExplore(env) {
  const { results } = await env.DB_network.prepare(
    `SELECT id, title, description
     FROM network_explore
     ORDER BY createdAt DESC
     LIMIT 50`
  ).all()

  return json(results || [])
}

// ============================================================
// FULL VENDOR PAGE
// ============================================================

async function getVendorFull(url, env) {
  const id = url.searchParams.get("id")
  if (!id) return json({ error: "Missing id" }, 400)

  const vendor = await env.DB_network.prepare(
    "SELECT * FROM network_vendors WHERE id = ?"
  ).bind(id).first()

  if (!vendor) return json({ error: "Not found" }, 404)

  const products = await env.DB_network.prepare(
    "SELECT * FROM network_products WHERE vendorId = ? AND active = 1"
  ).bind(id).all()

  const services = await env.DB_network.prepare(
    "SELECT * FROM network_services WHERE vendorId = ? AND active = 1"
  ).bind(id).all()

  const workshops = await env.DB_network.prepare(
    "SELECT * FROM network_workshops WHERE vendorId = ? AND active = 1"
  ).bind(id).all()

  return json({
    vendor,
    products: products.results || [],
    services: services.results || [],
    workshops: workshops.results || []
  })
}

// ============================================================
// WORKSHOPS FEED
// ============================================================

async function listWorkshops(env) {
  const { results } = await env.DB_network.prepare(
    `SELECT w.id, w.title, w.schedule, v.name AS hostName
     FROM network_workshops w
     JOIN network_vendors v ON v.id = w.vendorId
     WHERE w.active = 1`
  ).all()

  return json(results || [])
}
