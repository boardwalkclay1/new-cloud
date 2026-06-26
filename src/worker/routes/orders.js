import { json } from "../utils/json.js"

// MAIN ROUTER
export async function handle(request, env) {
  const url = new URL(request.url)
  const path = url.pathname

  if (path === "/api/client/tip-post" && request.method === "POST")
    return tipPost(request, env)

  return json({ error: "Order route not found" }, 404)
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
