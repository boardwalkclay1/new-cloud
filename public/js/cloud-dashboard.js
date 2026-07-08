// js/cloud-dashboard.js
// Beltline Cloud Identity + Dashboard Wiring Engine

const API = "https://api.beltlinecloud.com";

// -----------------------------------------------------
// 1. Get Cloud User (root identity)
// -----------------------------------------------------
export function getCloudUser() {
  const user = JSON.parse(localStorage.getItem("cloud_user"));
  return user || null;
}

// -----------------------------------------------------
// 2. Fetch Rider Profile (if exists)
// -----------------------------------------------------
export async function getRiderProfile(userId) {
  const res = await fetch(`${API}/api/riders/by-user?id=${userId}`);
  const data = await res.json();
  return data?.rider || null;
}

// -----------------------------------------------------
// 3. Fetch Vendor Profile (if exists)
// -----------------------------------------------------
export async function getVendorProfile(userId) {
  const res = await fetch(`${API}/api/vendors/by-user?id=${userId}`);
  const data = await res.json();
  return data?.vendor || null;
}

// -----------------------------------------------------
// 4. Build Cloud Dashboard (main hub)
// -----------------------------------------------------
export async function buildMainDashboard() {
  const user = getCloudUser();
  if (!user) return;

  const dash = document.getElementById("dashboard");
  dash.innerHTML = "";

  // Always show Cloud section
  dash.appendChild(buildCloudSection(user));

  // Detect rider/vendor profiles
  const rider = await getRiderProfile(user.id);
  const vendor = await getVendorProfile(user.id);

  if (rider) dash.appendChild(buildRiderPreview(rider));
  if (vendor) dash.appendChild(buildVendorPreview(vendor));
}

// -----------------------------------------------------
// 5. Cloud Section (everyone gets this)
// -----------------------------------------------------
function buildCloudSection(user) {
  const div = document.createElement("div");
  div.className = "dash-card";
  div.innerHTML = `
    <h2>Cloud Dashboard</h2>
    <p>Name: ${user.name || "Unnamed"}</p>
    <p>Email: ${user.email}</p>
    <button onclick="window.location.href='/pages/cloud-orders.html'">
      View Cloud Orders
    </button>
  `;
  return div;
}

// -----------------------------------------------------
// 6. Rider Preview Card
// -----------------------------------------------------
function buildRiderPreview(rider) {
  const div = document.createElement("div");
  div.className = "dash-card";
  div.innerHTML = `
    <h3>Fast Roll Rider</h3>
    <p>Deliveries: ${rider.deliveryCount}</p>
    <p>Status: ${rider.status}</p>
    <p>Vehicle: ${rider.vehicleType}</p>
    <button onclick="goToRiderDashboard()">Open Rider Dashboard</button>
  `;
  return div;
}

// -----------------------------------------------------
// 7. Vendor Preview Card
// -----------------------------------------------------
function buildVendorPreview(vendor) {
  const div = document.createElement("div");
  div.className = "dash-card";
  div.innerHTML = `
    <h3>Vendor Profile</h3>
    <p>${vendor.name}</p>
    <p>Active: ${vendor.active ? "Yes" : "No"}</p>
    <button onclick="goToVendorDashboard()">Open Vendor Dashboard</button>
  `;
  return div;
}

// -----------------------------------------------------
// 8. Navigation to full dashboards
// -----------------------------------------------------
export function goToRiderDashboard() {
  window.location.href = "/pages/rider-dashboard.html";
}

export function goToVendorDashboard() {
  window.location.href = "/pages/vendor-dashboard.html";
}

// -----------------------------------------------------
// 9. Helper: Get vendor ID for product creation
// -----------------------------------------------------
export async function getVendorIdForUser() {
  const user = getCloudUser();
  if (!user) return null;

  const vendor = await getVendorProfile(user.id);
  return vendor ? vendor.id : null;
}

// -----------------------------------------------------
// 10. Helper: Get rider ID for delivery pages
// -----------------------------------------------------
export async function getRiderIdForUser() {
  const user = getCloudUser();
  if (!user) return null;

  const rider = await getRiderProfile(user.id);
  return rider ? rider.id : null;
}

// -----------------------------------------------------
// 11. Auto-run dashboard if page has #dashboard
// -----------------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
  const dash = document.getElementById("dashboard");
  if (dash) buildMainDashboard();
});
