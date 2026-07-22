// /network/staff/js/vendor.js
// FINAL — multi-business aware, R2-ready, matches staff.js storefront

import {
  staffGetProducts,
  staffToggleVisibility,
  staffGetOrders,
  staffGetMessages,
  staffGetTodayStats
} from "/network/staff/js/staff.js";

import { initVendorMap } from "/network/staff/js/vendor-map.js";

/* ---------------------------------------------------------
   DOM
--------------------------------------------------------- */
const productsGrid = document.getElementById("productsGrid");
const ordersList = document.getElementById("ordersList");
const messagesList = document.getElementById("messagesList");

const statRevenue = document.getElementById("statRevenue");
const statRevenueSub = document.getElementById("statRevenueSub");
const statProducts = document.getElementById("statProducts");
const statOpenOrders = document.getElementById("statOpenOrders");
const statMessages = document.getElementById("statMessages");

const weatherStat = document.getElementById("weatherStat");
const locationStat = document.getElementById("locationStat");
const timeStat = document.getElementById("timeStat");
const sidebarUser = document.getElementById("sidebarUser");
const vendorSubtitle = document.getElementById("vendorSubtitle");

const vendorLogoUpload = document.getElementById("vendorLogoUpload");
const vendorLogoImg = document.getElementById("vendorLogoImg");
const coverUpload = document.getElementById("coverUpload");

/* ---------------------------------------------------------
   HELPERS
--------------------------------------------------------- */
function getCloudUser() {
  return JSON.parse(localStorage.getItem("cloud_user") || "null");
}

function getStorefront() {
  return JSON.parse(localStorage.getItem("vendor_storefront") || "null");
}

function getVendorId() {
  const store = getStorefront();
  return store?.vendorId || null;
}

/* ---------------------------------------------------------
   CLOUD USER DISPLAY
--------------------------------------------------------- */
export function connectCloudUser() {
  const cloudUser = getCloudUser();

  if (cloudUser && cloudUser.name) {
    sidebarUser.textContent = `Connected: ${cloudUser.name}`;
    vendorSubtitle.textContent = `Live performance for ${cloudUser.name}`;
  } else {
    sidebarUser.textContent = "Connected to Cloud";
    vendorSubtitle.textContent = "Live performance overview";
  }
}

/* ---------------------------------------------------------
   TIME
--------------------------------------------------------- */
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
setInterval(updateTime, 1000);
updateTime();

/* ---------------------------------------------------------
   WEATHER + LOCATION
--------------------------------------------------------- */
export async function detectBeltlineLocation() {
  const zones = [
    { name: "Eastside Trail", latMin: 33.745, latMax: 33.760, lngMin: -84.370, lngMax: -84.335 },
    { name: "Westside Trail", latMin: 33.750, latMax: 33.770, lngMin: -84.430, lngMax: -84.400 },
    { name: "Southside Trail", latMin: 33.730, latMax: 33.745, lngMin: -84.395, lngMax: -84.365 },
    { name: "Northside Trail", latMin: 33.780, latMax: 33.800, lngMin: -84.375, lngMax: -84.350 }
  ];

  navigator.geolocation.getCurrentPosition(async (pos) => {
    const lat = pos.coords.latitude;
    const lng = pos.coords.longitude;

    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current_weather=true&temperature_unit=fahrenheit`;

    try {
      const res = await fetch(url);
      const data = await res.json();
      const w = data.current_weather;
      const temp = w.temperature;
      const code = w.weathercode;

      let emoji = "⛅";
      if (code === 0) emoji = "☀️";
      if ([1, 2, 3].includes(code)) emoji = "🌤️";
      if ([45, 48].includes(code)) emoji = "🌫️";
      if ([51, 53, 55].includes(code)) emoji = "🌦️";
      if ([61, 63, 65].includes(code)) emoji = "🌧️";
      if ([71, 73, 75].includes(code)) emoji = "❄️";
      if ([95, 96, 99].includes(code)) emoji = "⛈️";

      weatherStat.textContent = `Weather: ${emoji} ${temp}°F`;
    } catch {
      weatherStat.textContent = "Weather: unavailable";
    }

    let zone = "Outside Beltline";
    for (const z of zones) {
      if (lat >= z.latMin && lat <= z.latMax && lng >= z.lngMin && lng <= z.lngMax) {
        zone = z.name;
        break;
      }
    }

    locationStat.textContent = `Location: ${zone}`;

    initVendorMap({
      lat,
      lng,
      zone,
      containerId: "vendorMapContainer"
    });
  }, () => {
    locationStat.textContent = "Location: unavailable";
    weatherStat.textContent = "Weather: unavailable";
    initVendorMap({ containerId: "vendorMapContainer" });
  });
}

/* ---------------------------------------------------------
   STATS
--------------------------------------------------------- */
export async function loadStats() {
  const stats = await staffGetTodayStats();

  statRevenue.textContent = `$${stats.revenue || 0}`;
  statRevenueSub.textContent = `${stats.ordersCount || 0} orders`;
  statProducts.textContent = stats.activeProducts || 0;
  statOpenOrders.textContent = stats.openOrders || 0;
  statMessages.textContent = stats.newMessages || 0;
}

/* ---------------------------------------------------------
   PRODUCTS
--------------------------------------------------------- */
export async function loadProducts() {
  const products = await staffGetProducts();
  const safeProducts = Array.isArray(products) ? products : [];

  productsGrid.innerHTML = "";

  safeProducts.forEach(p => {
    const card = document.createElement("div");
    card.className = "product-card";

    card.innerHTML = `
      <img src="${p.image || '/assets/img/placeholder.jpg'}" alt="${p.name || ''}">
      <div class="product-name">${p.name || "Unnamed product"}</div>
      <div class="product-meta">
        $${p.price || 0} • ${p.active ? "Active" : "Inactive"}
      </div>

      <label class="upload-btn">
        Upload Image
        <input type="file" class="product-image-input" data-product-id="${p.id}" accept="image/*">
      </label>
    `;

    const actions = document.createElement("div");
    actions.className = "product-actions";

    const editBtn = document.createElement("button");
    editBtn.textContent = "Edit";
    editBtn.onclick = () => window.location.href = "/network/staff/pages/products.html";

    const toggleBtn = document.createElement("button");
    toggleBtn.textContent = p.active ? "Deactivate" : "Activate";
    toggleBtn.onclick = async () => {
      await staffToggleVisibility(p.id);
      await loadProducts();
      await loadStats();
    };

    actions.appendChild(editBtn);
    actions.appendChild(toggleBtn);
    card.appendChild(actions);

    productsGrid.appendChild(card);
  });

  document.querySelectorAll(".product-image-input").forEach(input => {
    input.addEventListener("change", async () => {
      const file = input.files[0];
      const productId = input.dataset.productId;
      if (!file || !productId) return;

      const vendorId = getVendorId();
      if (!vendorId) return;

      const formData = new FormData();
      formData.append("file", file);
      formData.append("productId", productId);
      formData.append("vendorId", vendorId);

      await fetch(`/api/vendor/upload/product-image?vendorId=${encodeURIComponent(vendorId)}`, {
        method: "POST",
        body: formData,
        credentials: "include"
      });

      await loadProducts();
    });
  });
}

/* ---------------------------------------------------------
   ORDERS
--------------------------------------------------------- */
export async function loadOrders() {
  const orders = await staffGetOrders();
  const safeOrders = Array.isArray(orders) ? orders : [];

  ordersList.innerHTML = "";

  safeOrders.forEach(o => {
    const item = document.createElement("div");
    item.className = "order-item";
    item.innerHTML = `
      <strong>#${o.id}</strong> • ${o.status || o.paymentStatus || "pending"}<br>
      ${o.buyerEmail || ""}<br>
      ${o.itemType || ""} • Qty: ${o.quantity || 1}
    `;
    ordersList.appendChild(item);
  });
}

/* ---------------------------------------------------------
   MESSAGES
--------------------------------------------------------- */
export async function loadMessages() {
  const messages = await staffGetMessages();
  const safeMessages = Array.isArray(messages) ? messages : [];

  messagesList.innerHTML = "";

  safeMessages.forEach(m => {
    const item = document.createElement("div");
    item.className = "message-item";
    item.innerHTML = `
      <strong>${m.toEmail || "Customer"}</strong><br>
      ${m.text || ""}
    `;
    messagesList.appendChild(item);
  });
}

/* ---------------------------------------------------------
   UPLOAD HANDLERS
--------------------------------------------------------- */
vendorLogoUpload.addEventListener("change", async () => {
  const file = vendorLogoUpload.files[0];
  if (!file) return;

  const vendorId = getVendorId();
  if (!vendorId) return;

  const formData = new FormData();
  formData.append("file", file);
  formData.append("vendorId", vendorId);

  const res = await fetch(`/api/vendor/upload/logo?vendorId=${encodeURIComponent(vendorId)}`, {
    method: "POST",
    body: formData,
    credentials: "include"
  });

  const data = await res.json().catch(() => null);
  if (data && data.success && data.url) {
    vendorLogoImg.src = data.url;
  }
});

coverUpload.addEventListener("change", async () => {
  const file = coverUpload.files[0];
  if (!file) return;

  const vendorId = getVendorId();
  if (!vendorId) return;

  const formData = new FormData();
  formData.append("file", file);
  formData.append("vendorId", vendorId);

  await fetch(`/api/vendor/upload/cover?vendorId=${encodeURIComponent(vendorId)}`, {
    method: "POST",
    body: formData,
    credentials: "include"
  });
});

/* ---------------------------------------------------------
   INIT
--------------------------------------------------------- */
export async function initVendorDashboard() {
  connectCloudUser();
  await loadStats();
  await loadProducts();
  await loadOrders();
  await loadMessages();
  await detectBeltlineLocation();
}

initVendorDashboard();

/* ---------------------------------------------------------
   LOGOUT
--------------------------------------------------------- */
window.logout = function() {
  localStorage.removeItem("cloud_user");
  window.location.href = "/network/pages/login.html";
};
