// /public/js/safety-cloud.js

const API_BASE = "https://api.beltlinecloud.com/safety";

/* ---------- CORE API HELPER ---------- */

async function api(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) return res.json();
  return res.text();
}

/* ---------- LOST & FOUND ---------- */

export async function loadLostFoundBoard() {
  const items = await api("/lost-found");
  const container = document.getElementById("lostFoundList");
  if (!container) return;

  container.innerHTML = "";
  items.forEach(item => {
    const div = document.createElement("div");
    div.className = "lf-item";
    div.innerHTML = `
      <strong>${item.status?.toUpperCase() || ""}</strong> • ${item.category || ""}<br>
      ${item.description || ""}<br>
      <small>${item.lost_place || ""} • ${item.lost_time || ""}</small>
    `;
    container.appendChild(div);
  });
}

export async function submitLostFound(formEl) {
  const formData = new FormData(formEl);
  // status: "lost" or "found"
  // photo: file input
  await fetch(`${API_BASE}/lost-found`, {
    method: "POST",
    body: formData
  });
}

/* ---------- STOLEN ---------- */

export async function loadStolenBoard() {
  const items = await api("/stolen");
  const container = document.getElementById("stolenList");
  if (!container) return;

  container.innerHTML = "";
  items.forEach(item => {
    const div = document.createElement("div");
    div.className = "stolen-item";
    div.innerHTML = `
      <strong>${item.title || ""}</strong><br>
      ${item.description || ""}<br>
      <small>${item.stolen_place || ""} • ${item.stolen_time || ""}</small>
    `;
    container.appendChild(div);
  });
}

export async function submitStolen(formEl) {
  const formData = new FormData(formEl);
  await fetch(`${API_BASE}/stolen`, {
    method: "POST",
    body: formData
  });
}

/* ---------- ALERTS (USER + WEATHER) ---------- */

export async function loadAlerts() {
  const alerts = await api("/alerts?active=true");
  const container = document.getElementById("alertList");
  if (!container) return;

  container.innerHTML = "";
  alerts.forEach(a => {
    const div = document.createElement("div");
    div.className = "alert-item";
    div.innerHTML = `
      <strong>${a.type?.toUpperCase() || ""}</strong> • ${a.title || ""}<br>
      ${a.message || ""}<br>
      <small>${a.area_label || ""} • ${a.created_at || ""}</small>
    `;
    container.appendChild(div);
  });
}

export async function submitUserAlert(formEl) {
  const formData = new FormData(formEl);

  navigator.geolocation.getCurrentPosition(async pos => {
    formData.append("lat", pos.coords.latitude);
    formData.append("lon", pos.coords.longitude);

    await fetch(`${API_BASE}/alerts`, {
      method: "POST",
      body: formData
    });
  });
}

/* ---------- WEATHER SAFETY ---------- */

export async function loadWeatherSafety() {
  const alerts = await api("/weather-alerts");
  const container = document.getElementById("weatherAlertList");
  if (!container) return;

  container.innerHTML = "";
  alerts.forEach(a => {
    const div = document.createElement("div");
    div.className = "weather-alert-item";
    div.innerHTML = `
      <strong>${a.level?.toUpperCase() || ""}</strong> • ${a.title || ""}<br>
      ${a.message || ""}<br>
      <small>${a.area_label || ""}</small>
    `;
    container.appendChild(div);
  });
}

/* ---------- LIVE FEED (VIDEO EMBEDS) ---------- */

export async function loadLiveFeed() {
  const feed = await api("/live-feed");
  const container = document.getElementById("liveFeed");
  if (!container) return;

  container.innerHTML = "";
  feed.forEach(e => {
    const div = document.createElement("div");
    div.className = "live-item";
    div.innerHTML = `
      <h3>${e.title || ""}</h3>
      <iframe
        src="${e.embed_url}"
        title="${e.title || ""}"
        frameborder="0"
        allowfullscreen
      ></iframe>
      <small>${e.location || ""}</small>
    `;
    container.appendChild(div);
  });
}

/* ---------- SAFETY MOTION TOGGLE ---------- */

let safetyMotionEnabled = false;

export function initSafetyMotionToggle() {
  const toggle = document.getElementById("safetyMotionToggle");
  if (!toggle) return;

  toggle.addEventListener("change", () => {
    safetyMotionEnabled = toggle.checked;
    if (safetyMotionEnabled) {
      startSafetyMotionMonitoring();
    } else {
      stopSafetyMotionMonitoring();
    }
  });
}

function startSafetyMotionMonitoring() {
  // Hook into your motion detection system / external app.
  console.log("Safety motion monitoring: ON");
}

function stopSafetyMotionMonitoring() {
  console.log("Safety motion monitoring: OFF");
}

/* Call this when suspicious motion is detected */
export async function handleSuspiciousMotionEvent(details = {}) {
  navigator.geolocation.getCurrentPosition(async pos => {
    const payload = {
      type: "emergency",
      title: "Suspicious motion detected",
      message: details.message || "Unusual movement pattern detected (possible emergency).",
      lat: pos.coords.latitude,
      lon: pos.coords.longitude
    };

    // 1. Send alert to Safety Cloud
    await api("/motion-alert", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    // 2. Optional: send to police via Worker (Worker handles integration)
    await api("/motion-alert/police", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    // 3. Start auto recording and post to alerts (placeholder)
    await startAutoRecordingAndPostAlert();
  });
}

/* Auto recording placeholder */
async function startAutoRecordingAndPostAlert() {
  console.log("Auto recording started (placeholder).");

  const recordingPayload = {
    type: "emergency-recording",
    title: "Auto recording started",
    message: "Auto recording attached to motion alert."
  };

  await api("/alerts/recording", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(recordingPayload)
  });
}

/* ---------- PAGE BOOTSTRAP ---------- */

document.addEventListener("DOMContentLoaded", () => {
  const page = document.body.dataset.page;

  if (page === "lost-found") {
    loadLostFoundBoard();
  }

  if (page === "stolen") {
    loadStolenBoard();
  }

  if (page === "alerts") {
    loadAlerts();
    loadWeatherSafety();
  }

  if (page === "live-feed") {
    loadLiveFeed();
  }

  initSafetyMotionToggle();
});
