import { Auth } from "/js/auth.js";

/* ---------------------------------------------------------
   CLOUD USER
--------------------------------------------------------- */
const user = Auth.current();

if (!user) {
  window.location.href = "/pages/login.html";
  throw new Error("User not logged in");
}

document.getElementById("cloudName").textContent = user.name || "Cloud User";
document.getElementById("cloudEmail").textContent = user.email;

/* ---------------------------------------------------------
   BADGES
--------------------------------------------------------- */
async function loadBadges() {
  try {
    const res = await Auth.listBadges(user.id);

    const container = document.getElementById("badgeList");
    container.innerHTML = "";

    if (!res.success || !res.badges || res.badges.length === 0) {
      container.innerHTML = "<p>No badges yet.</p>";
      return;
    }

    res.badges.forEach(b => {
      const item = document.createElement("div");
      item.className = "badge-item";
      item.innerHTML = `
        <span class="badge-icon">${b.icon || "🏅"}</span>
        <span class="badge-name">${b.name}</span>
      `;
      container.appendChild(item);
    });

  } catch (err) {
    console.error(err);
    document.getElementById("badgeList").innerHTML = "<p>Error loading badges.</p>";
  }
}
loadBadges();

/* ---------------------------------------------------------
   VERIFICATION STATUS
--------------------------------------------------------- */
function loadVerificationStatus() {
  const el = document.getElementById("verifyStatus");

  if (user.verified) {
    el.textContent = "Verified ✔";
    el.style.color = "#4caf50";
  } else {
    el.textContent = "Not Verified";
    el.style.color = "#ff5252";
  }
}
loadVerificationStatus();

/* ---------------------------------------------------------
   WEATHER (Atlanta)
--------------------------------------------------------- */
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

/* ---------------------------------------------------------
   TIME
--------------------------------------------------------- */
function updateTime() {
  const now = new Date();
  document.getElementById("timeDisplay").textContent =
    now.toLocaleTimeString("en-US", {
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
   MENU
--------------------------------------------------------- */
const cloudMenu = document.getElementById("cloudMenu");
const menuTrigger = document.getElementById("menuTrigger");
const menuClose = document.getElementById("menuClose");

menuTrigger.onclick = () => cloudMenu.classList.add("open");
menuClose.onclick = () => cloudMenu.classList.remove("open");

/* ---------------------------------------------------------
   LOGOUT
--------------------------------------------------------- */
window.logout = function () {
  Auth.logout();
  window.location.href = "/pages/login.html";
};
