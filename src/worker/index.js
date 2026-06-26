import * as network from "./routes/network.js"
import * as vendors from "./routes/vendors.js"
import * as staff from "./routes/staff.js"
import * as workshops from "./routes/workshops.js"
import * as payments from "./routes/payments.js"

export default {
  async fetch(request, env) {
    const url = new URL(request.url)
    const path = url.pathname

    // NETWORK AUTH
    if (path.startsWith("/api/network")) return network.handle(request, env)

    // VENDORS + PRODUCTS + SERVICES
    if (path.startsWith("/api/network/vendors")) return vendors.handle(request, env)

    // STAFF PORTAL
    if (path.startsWith("/api/staff")) return staff.handle(request, env)

    // WORKSHOPS
    if (path.startsWith("/api/workshops")) return workshops.handle(request, env)

    // PAYMENTS
    if (path.startsWith("/api/paypal")) return payments.handle(request, env)

    return new Response("Not found", { status: 404 })
  }
}
