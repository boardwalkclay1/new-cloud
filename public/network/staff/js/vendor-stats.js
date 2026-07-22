// vendor-stats.js
// Handles loading and displaying vendor stats

import { staffGetTodayStats } from "/network/staff/js/staff.js";

const statRevenue = document.getElementById("statRevenue");
const statRevenueSub = document.getElementById("statRevenueSub");
const statProducts = document.getElementById("statProducts");
const statOpenOrders = document.getElementById("statOpenOrders");
const statMessages = document.getElementById("statMessages");

/* ---------------------------------------------------------
   LOAD + APPLY STATS
--------------------------------------------------------- */
export async function loadVendorStats() {
  const stats = await staffGetTodayStats();

  const revenue = stats?.revenue || 0;
  const ordersCount = stats?.ordersCount || 0;
  const activeProducts = stats?.activeProducts || 0;
  const openOrders = stats?.openOrders || 0;
  const newMessages = stats?.newMessages || 0;

  statRevenue.textContent = `$${revenue}`;
  statRevenueSub.textContent = `${ordersCount} orders`;
  statProducts.textContent = activeProducts;
  statOpenOrders.textContent = openOrders;
  statMessages.textContent = newMessages;
}
