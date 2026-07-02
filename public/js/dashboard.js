import { Auth } from "/js/auth.js";

/* USER */
const user = Auth.current();

if (!user) {
  window.location.href = "/pages/login.html";
  throw new Error("User not logged in");
}

document.getElementById("userName").textContent =
  user.name || user.email || "User";

/* ROLES */
const roles = (user.roles || "").split(",");

/* Vendor */
if (roles.includes("vendor")) {
  document.getElementById("vendorLinks").style.display = "block";
  document.getElementById("vendorToggleSection").style.display = "block";
  document.getElementById("vendorToggle").checked = true;
}

/* Rider */
if (roles.includes("rider")) {
  document.getElementById("riderLinks").style.display = "block";
  document.getElementById("riderToggleSection").style.display = "block";
  document.getElementById("riderToggle").checked = true;
}

/* Toggle vendor */
document.getElementById("vendorToggle")?.addEventListener("change", async (e) => {
  const active = e.target.checked;
  const newRoles = new Set((user.roles || "").split(","));
  active ? newRoles.add("vendor") : newRoles.delete("vendor");
  await Auth.updateProfile({ roles: Array.from(newRoles) });
  location.reload();
});

/* Toggle rider */
document.getElementById("riderToggle")?.addEventListener("change", async (e) => {
  const active = e.target.checked;
  const newRoles = new Set((user.roles || "").split(","));
  active ? newRoles.add("rider") : newRoles.delete("rider");
  await Auth.updateProfile({ roles: Array.from(newRoles) });
  location.reload();
});

/* WEATHER */
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
  } catch {
    document.getElementById("weather").textContent = "Weather unavailable";
  }
}
loadWeather();

/* BELTLINE LOCATION */
const beltlineZones = [
  { name:"Eastside Trail (Ponce City Market)", lat:33.7725, lon:-84.3652 },
  { name:"Westside Trail (Lee + White)", lat:33.7358, lon:-84.4173 },
  { name:"Northside Trail", lat:33.8082, lon:-84.4021 },
  { name:"Southside Trail", lat:33.7089, lon:-84.3890 }
];

function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2-lat1)*Math.PI/180;
  const dLon = (lon2-lon1)*Math.PI/180;
  const a =
    Math.sin(dLat/2)**2 +
    Math.cos(lat1*Math.PI/180) *
    Math.cos(lat2*Math.PI/180) *
    Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

function detectBeltlineLocation() {
  if (!navigator.geolocation) {
    document.getElementById("beltlineLocation").textContent =
      "Location unavailable.";
    return;
  }

  navigator.geolocation.getCurrentPosition(pos => {
    const { latitude, longitude } = pos.coords;

    let closest = null;
    let closestDist = Infinity;

    beltlineZones.forEach(zone => {
      const dist = getDistance(latitude, longitude, zone.lat, zone.lon);
      if (dist < closestDist) {
        closestDist = dist;
        closest = zone;
      }
    });

    if (closestDist < 0.5) {
      document.getElementById("beltlineLocation").textContent =
        `You are currently on: ${closest.name}`;
    } else {
      document.getElementById("beltlineLocation").textContent =
        "You are not currently on the Beltline Trail.";
    }
  });
}
detectBeltlineLocation();

/* TIME */
function updateTime() {
  const now = new Date();
  document.getElementById("timeDisplay").textContent =
    now.toLocaleTimeString("en-US", {
      hour:"numeric", minute:"numeric", second:"numeric",
      hour12:true, timeZone:"America/New_York"
    });
}
setInterval(updateTime, 1000);
updateTime();

/* MENU */
document.getElementById("menuTrigger").onclick = () => {
  document.getElementById("cloudMenu").style.display = "block";
};
document.getElementById("menuClose").onclick = () => {
  document.getElementById("cloudMenu").style.display = "none";
};

/* SAFETY DROPDOWN */
document.getElementById("safetyDropdownTrigger").onclick = () => {
  const menu = document.getElementById("safetyDropdown");
  menu.style.display = menu.style.display === "block" ? "none" : "block";
};

/* NOTIFICATIONS */
async function loadNotifications() {
  try {
    const res = await fetch(`/api/notifications?user=${user.id}`);
    const data = await res.json();

    if (!data.length) {
      document.getElementById("notificationsBar").textContent =
        "No new notifications.";
      return;
    }

    document.getElementById("notificationsBar").textContent =
      data.map(n => n.message).join(" • ");
  } catch {
    document.getElementById("notificationsBar").textContent =
      "Notifications unavailable.";
  }
}
loadNotifications();

/* LOGOUT */
window.logout = function () {
  Auth.logout();
};
