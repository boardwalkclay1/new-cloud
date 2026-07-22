// /network/staff/js/vendor.js
// FINAL — clean orchestrator for all vendor dashboard modules

import { initVendorContext } from "./vendor-context.js";
import { initVendorMedia } from "./vendor-media.js";
import { loadVendorProducts } from "./vendor-products.js";
import { loadVendorStats } from "./vendor-stats.js";
import { loadVendorOrders } from "./vendor-orders.js";
import { loadVendorMessages } from "./vendor-messages.js";
import { detectBeltlineLocation } from "./vendor-map.js";

/* ---------------------------------------------------------
   TIME
--------------------------------------------------------- */
function initTime() {
  const timeStat = document.getElementById("timeStat");

  function updateTime() {
    const now = new Date();
    timeStat.textContent = now.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
      hour12: true,
      timeZone: "America/New_York"
    });
  }

  updateTime();
  setInterval(updateTime, 1000);
}

/* ---------------------------------------------------------
   DASHBOARD INIT
--------------------------------------------------------- */
export async function initVendorDashboard() {
  // Context (cloud user + storefront + vendorId + logo)
  initVendorContext();

  // Media uploads (logo + cover)
  initVendorMedia();

  // Time clock
  initTime();

  // Stats
  await loadVendorStats();

  // Products
  await loadVendorProducts();

  // Orders
  await loadVendorOrders();

  // Messages
  await loadVendorMessages();

  // Map + weather + beltline zone detection
  await detectBeltlineLocation();
}

/* ---------------------------------------------------------
   LOGOUT
--------------------------------------------------------- */
window.logout = function() {
  localStorage.removeItem("cloud_user");
  window.location.href = "/network/pages/login.html";
};

/* ---------------------------------------------------------
   AUTO-INIT
--------------------------------------------------------- */
initVendorDashboard();
