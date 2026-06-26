import { json } from "../utils/json.js"

// MAIN ROUTER FOR ALL VENDOR + PRODUCT + SERVICE ROUTES
export async function handle(request, env) {
  const url = new URL(request.url)
  const path = url.pathname

  if (path === "/api/network/vendors" && request.method === "GET")
    return listVendors(env)

  if (path === "/api/network/services" && request.method === "GET")
    return listServices(env)

  if (path === "/api/network/products" && request.method === "GET")
    return listProducts(env)

  if (path === "/api/network/explore" && request.method === "GET")
    return listExplore(env)

  if (path === "/api/network/vendor" && request.method === "GET")
    return getVendorFull(url, env)

  if (path === "/api/network/workshops" && request.method === "GET")
    return listWorkshops(env)

  return json({ error: "Vendor route not found" }, 404)
}

//
// ========== VENDORS ==========
//

async function listVendors(env) {
  const { results } = await env.DB_network.prepare(
    `SELECT v.id, v.name, v.bio, v.photoUrl, v.tags, v.categories
     FROM network_vendors v
     WHERE v.active = 1`
  ).all()

  return json(results)
}

//
// ========== SERVICES ==========
//

async function listServices(env) {
  const { results } = await env.DB_network.prepare(
    `SELECT s.id, s.vendorId, s.name, s.description, s.price, s.photoUrl, s.featured
     FROM network_services s
     WHERE s.active = 1`
  ).all()

  return json(results)
}

//
// ========== PRODUCTS ==========
//

async function listProducts(env) {
  const { results } = await env.DB_network.prepare(
    `SELECT p.id, p.vendorId, p.name, p.description, p.price, p.photoUrl, p.featured
     FROM network_products p
     WHERE p.active = 1`
  ).all()

  return json(results)
}

//
// ========== EXPLORE FEED ==========
//

async function listExplore(env) {
  const { results } = await env.DB_network.prepare(
    `SELECT id, title, description
     FROM network_explore
     ORDER BY createdAt DESC
     LIMIT 50`
  ).all()

  return json(results)
}

//
// ========== FULL VENDOR PAGE ==========
//

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

//
// ========== WORKSHOPS FEED ==========
//

async function listWorkshops(env) {
  const { results } = await env.DB_network.prepare(
    `SELECT w.id, w.title, w.schedule, v.name AS hostName
     FROM network_workshops w
     JOIN network_vendors v ON v.id = w.vendorId
     WHERE w.active = 1`
  ).all()

  return json(results)
}
