// vendor-init.js
// Handles time, weather, and full dashboard initialization

import { initVendorContext } from "./vendor-context.js";
import { loadVendorStats } from "./vendor-stats.js";
import { loadVendorProducts } from "./vendor-products.js";
import { loadVendorOrders } from "./vendor-orders.js";
import { loadVendorMessages } from "./vendor-messages.js";
import { initVendorMedia } from "./vendor-media.js";
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
   INIT DASHBOARD
--------------------------------------------------------- */
export async function initVendorDashboard() {
  initVendorContext();
  initVendorMedia();
  initTime();

  await loadVendorStats();
  await loadVendorProducts();
  await loadVendorOrders();
  await loadVendorMessages();

  await detectBeltlineLocation();
}

/* ---------------------------------------------------------
   LOGOUT
--------------------------------------------------------- */
export function initLogout() {
  window.logout = function() {
    localStorage.removeItem("cloud_user");
    window.location.href = "/network/pages/login.html";
  };
}
