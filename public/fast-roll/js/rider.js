// FAST ROLL — Rider System
// Fully synced with Worker (riderHandler, ordersHandler)
// Real API calls, ready for launch

/* ============================================================
   SESSION HELPERS
============================================================ */

function saveSession(key, value) {
  sessionStorage.setItem(key, JSON.stringify(value));
}

function getSession(key) {
  const raw = sessionStorage.getItem(key);
  return raw ? JSON.parse(raw) : null;
}

/* ============================================================
   RIDER SIGNUP / PROFILE
============================================================ */

async function fastRiderSignup(name, phone, vehicle) {
  const res = await fetch("/api/rider?action=signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, phone, vehicle })
  });

  const data = await res.json();
  if (data && data.success) {
    saveSession("rider", { id: data.id, name, phone, vehicle });
    return data.id;
  }

  alert("Rider signup failed");
  return null;
}

async function fastRiderUpdate(profile) {
  const rider = getSession("rider");
  if (!rider) return;

  await fetch("/api/rider?action=update", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id: rider.id, ...profile })
  });
}

async function fastRiderSetStatus(status) {
  const rider = getSession("rider");
  if (!rider) return;

  await fetch("/api/rider?action=status", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id: rider.id, status })
  });
}

/* ============================================================
   JOBS / ORDERS (RIDER VIEW)
============================================================ */

async function fastRiderLoadJobs() {
  const rider = getSession("rider");
  if (!rider) return [];

  const res = await fetch(`/api/order?riderId=${encodeURIComponent(rider.id)}`);
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

async function fastRiderAcceptJob(orderId) {
  const rider = getSession("rider");
  if (!rider) return;

  await fetch("/api/order?action=update", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id: orderId,
      riderId: rider.id,
      status: "assigned"
    })
  });
}

async function fastRiderCompleteJob(orderId) {
  await fetch("/api/order?action=complete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id: orderId })
  });
}

/* ============================================================
   SIGNUP PAGE
============================================================ */

function initRiderSignupPage() {
  const form = document.getElementById("riderSignupForm");
  if (!form) return;

  form.addEventListener("submit", async e => {
    e.preventDefault();

    const name = document.getElementById("riderName").value.trim();
    const phone = document.getElementById("riderPhone").value.trim();
    const vehicle = document.getElementById("riderVehicle").value.trim();

    if (!name || !phone || !vehicle) {
      alert("Fill out all fields.");
      return;
    }

    const id = await fastRiderSignup(name, phone, vehicle);
    if (id) {
      alert("Rider account created!");
      window.location.href = "/pages/rider/dashboard.html";
    }
  });
}

/* ============================================================
   DASHBOARD PAGE
============================================================ */

function initRiderDashboardPage() {
  const rider = getSession("rider");
  if (!rider) {
    window.location.href = "/pages/rider/signup.html";
    return;
  }

  const nameEl = document.getElementById("riderDashboardName");
  if (nameEl) nameEl.textContent = rider.name;

  const statusBtn = document.getElementById("riderStatusToggle");
  if (statusBtn) {
    statusBtn.addEventListener("click", async () => {
      const newStatus = statusBtn.dataset.status === "active" ? "offline" : "active";
      await fastRiderSetStatus(newStatus);
      statusBtn.dataset.status = newStatus;
      statusBtn.textContent = newStatus === "active" ? "Go Offline" : "Go Active";
    });
  }
}

/* ============================================================
   JOBS PAGE
============================================================ */

async function initRiderJobsPage() {
  const rider = getSession("rider");
  if (!rider) {
    window.location.href = "/pages/rider/signup.html";
    return;
  }

  const list = document.getElementById("riderJobsList");
  if (!list) return;

  const jobs = await fastRiderLoadJobs();

  list.innerHTML = jobs.map(job => `
    <div class="job-card">
      <h3>Job: ${job.id}</h3>
      <p><strong>Pickup:</strong> ${job.pickup}</p>
      <p><strong>Dropoff:</strong> ${job.dropoff}</p>
      <p><strong>Status:</strong> ${job.status}</p>
      <p><strong>Payout:</strong> $${job.price || job.payout || 0}</p>
      <button class="primary-btn" onclick="fastRiderAcceptJob('${job.id}')">
        Accept Job
      </button>
      <button class="secondary-btn" onclick="fastRiderCompleteJob('${job.id}')">
        Mark Complete
      </button>
    </div>
  `).join("");
}

/* ============================================================
   ROUTER
============================================================ */

document.addEventListener("DOMContentLoaded", () => {
  const path = window.location.pathname;

  if (path.includes("signup.html")) initRiderSignupPage();
  if (path.includes("dashboard.html")) initRiderDashboardPage();
  if (path.includes("jobs.html")) initRiderJobsPage();
});
