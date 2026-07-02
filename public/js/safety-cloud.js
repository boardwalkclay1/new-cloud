// /public/js/safety-cloud.js

const API_BASE = "https://api.beltlinecloud.com/safety";

/* ---------- CORE API HELPER ---------- */

async function api(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, { ...options });
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

/* ---------- LIVE FEED ---------- */

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

/* ---------- SAFE‑CLOD MOTION ENGINE ---------- */

let SAFE_CLOD_ENABLED = false;
let THRESHOLDS = {};
let fallStage = null;
let stillnessTimer = null;
let countdownTimer = null;

function setSafeClodMode(mode) {
  switch (mode) {
    case "kidnapping":
      THRESHOLDS = {
        jerk: 20,
        flipAngle: 140,
        dragSpeed: 0.7,
        sprintSpeed: 4.0,
        kidnappingAccel: 30
      };
      break;
    case "night":
      THRESHOLDS = {
        jerk: 18,
        flipAngle: 130,
        fallAccel: 22,
        dragSpeed: 1.0
      };
      break;
    case "solo":
      THRESHOLDS = {
        jerk: 16,
        flipAngle: 150,
        dragSpeed: 0.9
      };
      break;
    case "vendor":
      THRESHOLDS = {
        jerk: 12,
        dragSpeed: 1.1
      };
      break;
    case "highrisk":
      THRESHOLDS = {
        jerk: 10,
        flipAngle: 120,
        dragSpeed: 0.8
      };
      break;
    case "snatch":
      THRESHOLDS = {
        jerk: 22,
        flipAngle: 160,
        sprintSpeed: 4.5
      };
      break;
    case "fall":
      THRESHOLDS = {
        fallAccel: 24,
        impactAccel: 30,
        flipAngle: 100,
        stillnessTime: 3.5,
        jerk: 15
      };
      break;
    default:
      THRESHOLDS = {};
  }
}

function getAlertTargets() {
  const sel = document.getElementById("safeClodAlertTarget");
  const val = sel ? sel.value : "cloud";
  return {
    notifyContacts: val === "contacts" || val === "all",
    notifyPolice: val === "police" || val === "all"
  };
}

function startSafeClodMonitoring() {
  if (SAFE_CLOD_ENABLED) return;
  SAFE_CLOD_ENABLED = true;

  window.addEventListener("devicemotion", handleSafeClodMotion);
  window.addEventListener("deviceorientation", handleSafeClodOrientation);
}

function stopSafeClodMonitoring() {
  SAFE_CLOD_ENABLED = false;
  window.removeEventListener("devicemotion", handleSafeClodMotion);
  window.removeEventListener("deviceorientation", handleSafeClodOrientation);
  clearInterval(countdownTimer);
  clearInterval(stillnessTimer);
}

function handleSafeClodMotion(event) {
  if (!SAFE_CLOD_ENABLED) return;

  const acc = event.accelerationIncludingGravity || {};
  const x = acc.x || 0;
  const y = acc.y || 0;
  const z = acc.z || 0;
  const total = Math.abs(x) + Math.abs(y) + Math.abs(z);

  // Kidnapping / snatch / jerk
  if (THRESHOLDS.kidnappingAccel && total > THRESHOLDS.kidnappingAccel) {
    triggerSafeClodScenario("kidnapping");
  } else if (THRESHOLDS.jerk && total > THRESHOLDS.jerk) {
    triggerSafeClodScenario("jerk");
  }

  // Fall detection
  if (THRESHOLDS.fallAccel && total > THRESHOLDS.fallAccel) {
    fallStage = "falling";
  }
  if (fallStage === "falling" && THRESHOLDS.impactAccel && total > THRESHOLDS.impactAccel) {
    fallStage = "impact";
    startSafeClodStillnessTimer();
  }
}

function handleSafeClodOrientation(event) {
  if (!SAFE_CLOD_ENABLED) return;

  const beta = event.beta || 0;
  if (THRESHOLDS.flipAngle && Math.abs(beta) > THRESHOLDS.flipAngle) {
    triggerSafeClodScenario("flip");
  }
}

function startSafeClodStillnessTimer() {
  clearInterval(stillnessTimer);
  let stillTime = 0;
  stillnessTimer = setInterval(() => {
    stillTime += 0.5;
    if (stillTime >= (THRESHOLDS.stillnessTime || 3.5)) {
      clearInterval(stillnessTimer);
      triggerSafeClodScenario("fall");
    }
  }, 500);
}

function triggerSafeClodScenario(type) {
  let message = "Unusual movement detected.";
  let autoRecord = false;

  switch (type) {
    case "kidnapping":
      message = "Possible kidnapping detected.";
      autoRecord = true;
      break;
    case "jerk":
      message = "Violent motion detected.";
      break;
    case "flip":
      message = "Violent device flip detected.";
      break;
    case "fall":
      message = "Sudden fall detected.";
      autoRecord = true;
      break;
  }

  const targets = getAlertTargets();
  beginSafeClodCountdown({
    type: "emergency",
    title: "Safe‑Clod Alert",
    message,
    autoRecord,
    notifyContacts: targets.notifyContacts,
    notifyPolice: targets.notifyPolice
  });
}

function beginSafeClodCountdown(payload) {
  const countdownEl = document.getElementById("safeClodCountdown");
  const valueEl = document.getElementById("safeClodCountdownValue");
  const cancelBtn = document.getElementById("safeClodCancelBtn");

  if (!countdownEl || !valueEl || !cancelBtn) {
    finalizeSafeClodAlert(payload);
    return;
  }

  let remaining = 7;
  countdownEl.classList.remove("hidden");
  valueEl.textContent = remaining.toString();

  clearInterval(countdownTimer);
  countdownTimer = setInterval(() => {
    remaining--;
    valueEl.textContent = remaining.toString();
    if (remaining <= 0) {
      clearInterval(countdownTimer);
      countdownEl.classList.add("hidden");
      finalizeSafeClodAlert(payload);
    }
  }, 1000);

  cancelBtn.onclick = () => {
    clearInterval(countdownTimer);
    countdownEl.classList.add("hidden");
  };
}

async function finalizeSafeClodAlert(payload) {
  navigator.geolocation.getCurrentPosition(async pos => {
    const fullPayload = {
      ...payload,
      lat: pos.coords.latitude,
      lon: pos.coords.longitude
    };

    // Cloud users
    await api("/motion-alert", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(fullPayload)
    });

    // Emergency contacts
    if (fullPayload.notifyContacts) {
      await api("/motion-alert/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fullPayload)
      });
    }

    // Authorities
    if (fullPayload.notifyPolice) {
      await api("/motion-alert/police", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fullPayload)
      });
    }

    // Auto recording
    if (fullPayload.autoRecord) {
      await startSafeClodRecording();
    }
  });
}

async function startSafeClodRecording() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    const recorder = new MediaRecorder(stream);
    const chunks = [];

    recorder.ondataavailable = e => chunks.push(e.data);
    recorder.onstop = async () => {
      const blob = new Blob(chunks, { type: "video/webm" });
      const formData = new FormData();
      formData.append("recording", blob);

      await fetch(`${API_BASE}/alerts/recording`, {
        method: "POST",
        body: formData
      });
    };

    recorder.start();
    setTimeout(() => recorder.stop(), 8000);
  } catch (err) {
    console.error("Safe‑Clod recording error:", err);
  }
}

/* ---------- PAGE BOOTSTRAP ---------- */

document.addEventListener("DOMContentLoaded", () => {
  const page = document.body.dataset.page;

  if (page === "lost-found") loadLostFoundBoard();
  if (page === "stolen") loadStolenBoard();
  if (page === "alerts") {
    loadAlerts();
    loadWeatherSafety();
  }
  if (page === "live-feed") loadLiveFeed();

  if (page === "safe-clod") {
    const modeSel = document.getElementById("safeClodMode");
    const toggle = document.getElementById("safeClodToggle");

    if (modeSel) {
      setSafeClodMode(modeSel.value);
      modeSel.addEventListener("change", e => setSafeClodMode(e.target.value));
    }

    if (toggle) {
      toggle.addEventListener("change", () => {
        if (toggle.checked) startSafeClodMonitoring();
        else stopSafeClodMonitoring();
      });
    }
  }
});
