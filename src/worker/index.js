import * as network from "./routes/network.js"
import * as vendors from "./routes/vendors.js"
import * as staff from "./routes/staff.js"
import * as workshops from "./routes/workshops.js"
import * as payments from "./routes/payments.js"
import * as client from "./routes/client.js"
import * as rider from "./routes/rider.js"
import * as orders from "./routes/orders.js"

export default {
  async fetch(request, env) {
    const url = new URL(request.url)
    const path = url.pathname

    // NETWORK (auth + profiles + pay)
    if (path.startsWith("/api/network"))
      return network.handle(request, env)

    // VENDORS + PRODUCTS + SERVICES + EXPLORE
    if (path.startsWith("/api/network/vendors") ||
        path.startsWith("/api/network/services") ||
        path.startsWith("/api/network/products") ||
        path.startsWith("/api/network/explore") ||
        path.startsWith("/api/network/vendor") ||
        path.startsWith("/api/network/workshops"))
      return vendors.handle(request, env)

    // STAFF PORTAL
    if (path.startsWith("/api/staff"))
      return staff.handle(request, env)

    // WORKSHOPS (legacy)
    if (path.startsWith("/api/workshops") ||
        path.startsWith("/api/availability") ||
        path.startsWith("/api/book") ||
        path.startsWith("/api/user/bookings"))
      return workshops.handle(request, env)

    // PAYMENTS
    if (path.startsWith("/api/paypal"))
      return payments.handle(request, env)

    // FAST ROLL — CLIENT
    if (path.startsWith("/api/client"))
      return client.handle(request, env)

    // FAST ROLL — RIDER
    if (path.startsWith("/api/rider"))
      return rider.handle(request, env)

    // FAST ROLL — ORDERS (tips, delivery)
    if (path.startsWith("/api/order") ||
        path.startsWith("/api/client/tip-post"))
      return orders.handle(request, env)

    return new Response("Not found", { status: 404 })
  }
}
