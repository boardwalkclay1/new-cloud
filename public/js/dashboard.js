import { Auth } from "/js/auth.js";

const user = Auth.current();
document.getElementById("userName").textContent = user.name || user.email;

// ROLES
const roles = (user.roles || "").split(",");

// Vendor links + toggle
if (roles.includes("vendor")) {
  document.getElementById("vendorLinks").style.display = "block";
  document.getElementById("vendorToggleSection").style.display = "block";
  document.getElementById("vendorToggle").checked = true;
}

// Rider links + toggle
if (roles.includes("rider")) {
  document.getElementById("riderLinks").style.display = "block";
  document.getElementById("riderToggleSection").style.display = "block";
  document.getElementById("riderToggle").checked = true;
}

// Toggle vendor mode
document.getElementById("vendorToggle")?.addEventListener("change", async (e) => {
  const active = e.target.checked;
  const newRoles = new Set((user.roles || "").split(","));
  active ? newRoles.add("vendor") : newRoles.delete("vendor");
  await Auth.updateProfile({ roles: Array.from(newRoles) });
  location.reload();
});

// Toggle rider mode
document.getElementById("riderToggle")?.addEventListener("change", async (e) => {
  const active = e.target.checked;
  const newRoles = new Set((user.roles || "").split(","));
  active ? newRoles.add("rider") : newRoles.delete("rider");
  await Auth.updateProfile({ roles: Array.from(newRoles) });
  location.reload();
});

// Weather
async function loadWeather() {
  try {
    const res = await fetch("https://api.weatherapi.com/v1/current.json?key=YOUR_KEY&q=Atlanta");
    const data = await res.json();
    document.getElementById("weather").textContent =
      `${data.current.temp_f}°F • ${data.current.condition.text}`;
  } catch {
    document.getElementById("weather").textContent = "Unavailable";
  }
}
loadWeather();

// Menu open/close
document.getElementById("menuTrigger").onclick = () => {
  document.getElementById("cloudMenu").style.display = "block";
};

document.getElementById("menuClose").onclick = () => {
  document.getElementById("cloudMenu").style.display = "none";
};

// Logout
window.logout = function () {
  Auth.logout();
};
