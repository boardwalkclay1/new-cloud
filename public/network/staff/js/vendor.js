// VENDOR ENGINE — staff/vendor dashboard shared logic

import {
  staffGetProducts,
  staffToggleVisibility,
  staffGetOrders,
  staffGetMessages,
  staffGetTodayStats
} from "/network/staff/js/staff.js";

import { initVendorMap } from "/network/staff/js/vendor-map.js";

// DOM
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

// UPLOAD INPUTS
const vendorLogoUpload = document.getElementById("vendorLogoUpload");
const vendorLogoImg = document.getElementById("vendorLogoImg");
const productImageUpload = document.getElementById("productImageUpload");
const coverUpload = document.getElementById("coverUpload");

// CLOUD USER CONNECTION
export function connectCloudUser() {
  const beltlineUser = JSON.parse(localStorage.getItem("beltline_user") || "null");
  const vendorUser = JSON.parse(localStorage.getItem("vendor_user") || "null");
  const user = vendorUser || beltlineUser;

  if (user && user.name) {
    sidebarUser.textContent = `Connected: ${user.name}`;
    vendorSubtitle.textContent = `Live performance for ${user.name}`;
  } else {
    sidebarUser.textContent = "Connected to Cloud";
    vendorSubtitle.textContent = "Live performance overview";
  }
}

// TIME
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

// WEATHER + LOCATION
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
      if ([1,2,3].includes(code)) emoji = "🌤️";
      if ([45,48].includes(code)) emoji = "🌫️";
      if ([51,53,55].includes(code)) emoji = "🌦️";
      if ([61,63,65].includes(code)) emoji = "🌧️";
      if ([71,73,75].includes(code)) emoji = "❄️";
      if ([95,96,99].includes(code)) emoji = "⛈️";

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

// STATS
export async function loadStats() {
  const stats = await staffGetTodayStats();
  if (!stats) return;

  statRevenue.textContent = `$${stats.revenue || 0}`;
  statRevenueSub.textContent = `${stats.ordersCount || 0} orders`;
  statProducts.textContent = stats.activeProducts || 0;
  statOpenOrders.textContent = stats.openOrders || 0;
  statMessages.textContent = stats.newMessages || 0;
}

// PRODUCTS
export async function loadProducts() {
  const products = await staffGetProducts();
  const safeProducts = Array.isArray(products) ? products : [];

  productsGrid.innerHTML = "";

  safeProducts.forEach(p => {
    const card = document.createElement("div");
    card.className = "product-card";

    card.innerHTML = `
      <img src="${p.photoUrl || '/network/img/network-logo.jpg'}" alt="${p.name || ''}">
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

  // Attach per-product image upload handlers
  document.querySelectorAll(".product-image-input").forEach(input => {
    input.addEventListener("change", async () => {
      const file = input.files[0];
      const productId = input.dataset.productId;
      if (!file || !productId) return;

      const formData = new FormData();
      formData.append("file", file);
      formData.append("productId", productId);

      await fetch("/api/vendor/upload/product-image", {
        method: "POST",
        body: formData,
        credentials: "include"
      });

      await loadProducts();
    });
  });
}

// ORDERS
export async function loadOrders() {
  const orders = await staffGetOrders();
  const safeOrders = Array.isArray(orders) ? orders : [];

  ordersList.innerHTML = "";

  safeOrders.forEach(o => {
    const item = document.createElement("div");
    item.className = "order-item";
    item.innerHTML = `
      <strong>#${o.id}</strong> • ${o.status || "pending"}<br>
      ${o.buyerEmail || ""} • $${o.amount || 0}<br>
      ${o.itemType || ""} • Qty: ${o.quantity || 1}
    `;
    ordersList.appendChild(item);
  });
}

// MESSAGES
export async function loadMessages() {
  const messages = await staffGetMessages();
  const safeMessages = Array.isArray(messages) ? messages : [];

  messagesList.innerHTML = "";

  safeMessages.forEach(m => {
    const item = document.createElement("div");
    item.className = "message-item";
    item.innerHTML = `
      <strong>${m.fromEmail || "Unknown"}</strong><br>
      ${m.preview || m.body || ""}
    `;
    messagesList.appendChild(item);
  });
}

// UPLOAD HELPERS — include vendor email header
function getVendorEmail() {
  const beltlineUser = JSON.parse(localStorage.getItem("beltline_user") || "null");
  const vendorUser = JSON.parse(localStorage.getItem("vendor_user") || "null");
  const user = vendorUser || beltlineUser;
  return user?.email || null;
}

// UPLOAD HANDLERS
vendorLogoUpload.addEventListener("change", async () => {
  const file = vendorLogoUpload.files[0];
  if (!file) return;

  const email = getVendorEmail();
  if (!email) return;

  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch("/api/vendor/upload/logo", {
    method: "POST",
    body: formData,
    credentials: "include",
    headers: {
      "X-Vendor-Email": email
    }
  });

  const data = await res.json().catch(() => null);
  if (data && data.success && data.url) {
    vendorLogoImg.src = data.url;
  }
});

coverUpload.addEventListener("change", async () => {
  const file = coverUpload.files[0];
  if (!file) return;

  const email = getVendorEmail();
  if (!email) return;

  const formData = new FormData();
  formData.append("file", file);

  await fetch("/api/vendor/upload/cover", {
    method: "POST",
    body: formData,
    credentials: "include",
    headers: {
      "X-Vendor-Email": email
    }
  });
});

// INIT
export async function initVendorDashboard() {
  connectCloudUser();
  await loadStats();
  await loadProducts();
  await loadOrders();
  await loadMessages();
  await detectBeltlineLocation();
}

initVendorDashboard();

// LOGOUT
window.logout = function() {
  localStorage.removeItem("vendor_user");
  localStorage.removeItem("beltline_user");
  window.location.href = "/network/pages/login.html";
};
