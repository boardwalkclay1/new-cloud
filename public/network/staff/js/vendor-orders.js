// /network/staff/js/vendor-orders.js
// Handles loading and displaying vendor orders on the dashboard

import { staffGetOrders } from "/network/staff/js/staff.js";

const ordersList = document.getElementById("ordersList");

/* ---------------------------------------------------------
   RENDER ORDERS
--------------------------------------------------------- */
function renderOrders(orders) {
  if (!ordersList) return;

  ordersList.innerHTML = "";

  const safeOrders = Array.isArray(orders) ? orders : [];

  if (safeOrders.length === 0) {
    const empty = document.createElement("div");
    empty.className = "orders-empty";
    empty.textContent = "No orders yet.";
    ordersList.appendChild(empty);
    return;
  }

  safeOrders.forEach(o => {
    const item = document.createElement("div");
    item.className = "order-item";

    const id = o.id || o.orderId || "—";
    const status = o.status || o.paymentStatus || "pending";
    const buyer = o.buyerEmail || o.customerEmail || "Unknown customer";
    const qty = o.quantity || 1;
    const total = o.total || o.amount || 0;

    item.innerHTML = `
      <div class="order-main">
        <strong>#${id}</strong> • ${status}
      </div>
      <div class="order-sub">
        ${buyer}
      </div>
      <div class="order-meta">
        Qty: ${qty} • Total: $${total}
      </div>
    `;

    ordersList.appendChild(item);
  });
}

/* ---------------------------------------------------------
   PUBLIC LOAD FUNCTION
--------------------------------------------------------- */
export async function loadVendorOrders() {
  try {
    const orders = await staffGetOrders();
    renderOrders(orders);
  } catch (err) {
    if (ordersList) {
      ordersList.innerHTML = "<div class='orders-error'>Unable to load orders.</div>";
    }
    console.error("Failed to load vendor orders:", err);
  }
}
