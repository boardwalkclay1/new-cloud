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

// Weather (accurate Atlanta, Fahrenheit)
async function loadWeather() {
  try {
    const res = await fetch(
      "https://api.open-meteo.com/v1/forecast?latitude=33.7490&longitude=-84.3880&current_weather=true&temperature_unit=fahrenheit"
    );
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

    document.getElementById("weather").textContent =
      `${emoji} ${temp}°F • Atlanta`;
  } catch (err) {
    document.getElementById("weather").textContent = "Weather unavailable";
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
