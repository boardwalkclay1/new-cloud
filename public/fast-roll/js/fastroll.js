// fastroll.js
// Unified Fast Roll front-end: client + rider + orders + tips
// Uses localStorage sessions and unified API wrapper

/* ============================================================
   UTILITIES
============================================================ */

function $(id) {
  return document.getElementById(id);
}

function qs(selector) {
  return document.querySelector(selector);
}

function getQueryParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

/* ============================================================
   SESSION (LOCALSTORAGE)
============================================================ */

function saveSession(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function getSession(key) {
  const raw = localStorage.getItem(key);
  return raw ? JSON.parse(raw) : null;
}

function clearSession(key) {
  localStorage.removeItem(key);
}

/* ============================================================
   API WRAPPER (CONNECTED TO WORKER)
============================================================ */

async function api(path, method = "GET", body = null) {
  const options = {
    method,
    headers: { "Content-Type": "application/json" }
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const res = await fetch(path, options);
  const text = await res.text();

  try {
    return JSON.parse(text);
  } catch {
    console.error("Invalid JSON from API:", text);
    return { error: "Invalid JSON response" };
  }
}

/* ============================================================
   CLIENT SYSTEM
   /api/client (Worker: clientHandler)
============================================================ */

async function fastClientSignup(name, phone, email, password) {
  const data = await api("/api/client?action=signup", "POST", {
    name,
    phone,
    email,
    password
  });

  if (data && data.success) {
    saveSession("client", {
      id: data.id,
      name,
      phone,
      email
    });
    return data.id;
  }

  alert("Signup failed");
  return null;
}

async function fastClientLogin(email, password) {
  const data = await api("/api/client?action=login", "POST", {
    email,
    password
  });

  if (data && data.success) {
    saveSession("client", {
      id: data.id,
      name: data.name,
      phone: data.phone,
      email: data.email
    });
    return data.id;
  }

  alert("Invalid login");
  return null;
}

async function fastClientUpdate(profile) {
  const client = getSession("client");
  if (!client) return;

  await api("/api/client?action=update", "POST", {
    id: client.id,
    ...profile
  });
}

/* ============================================================
   CLIENT SIGNUP PAGE
============================================================ */

function initClientSignupPage() {
  const form = $("clientSignupForm");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = $("name").value.trim();
    const email = $("email").value.trim();
    const phone = $("phone").value.trim();
    const password = $("password").value;
    const confirm = $("confirm").value;
    const terms = $("terms").checked;

    if (password !== confirm) {
      alert("Passwords do not match.");
      return;
    }

    if (!terms) {
      alert("You must agree to the terms.");
      return;
    }

    const id = await fastClientSignup(name, phone, email, password);
    if (!id) return;

    window.location.href = "/pages/client/order.html";
  });
}

/* ============================================================
   CLIENT LOGIN PAGE
============================================================ */

function initClientLoginPage() {
  const form = $("clientLoginForm");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = $("email").value.trim();
    const password = $("password").value;

    const id = await fastClientLogin(email, password);
    if (!id) return;

    window.location.href = "/pages/client/order.html";
  });
}

/* ============================================================
   ORDERS (CLIENT SIDE)
   /api/order (Worker: ordersHandler)
============================================================ */

async function createOrder(clientId, clientName, item, store, receiptFile) {
  const payload = {
    action: "create",
    clientId,
    pickup: store,
    dropoff: clientName + " (client)",
    price: 5,
    item,
    receiptPhoto: receiptFile ? receiptFile.name : null
  };

  const data = await api("/api/order?action=create", "POST", payload);

  if (data && data.success) {
    saveSession("order", {
      id: data.id,
      clientId,
      clientName,
      item,
      store
    });
    return data.id;
  }

  alert("Order creation failed");
  return null;
}

async function getOrderStatus(orderId) {
  const data = await api(`/api/order?id=${encodeURIComponent(orderId)}`, "GET");
  return data || null;
}

/* ============================================================
   CLIENT ORDER PAGE
============================================================ */

function initOrderPage() {
  const form = $("clientOrderForm");
  if (!form) return;

  const client = getSession("client");
  if (!client) {
    window.location.href = "/pages/client/signup.html";
    return;
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const clientName = $("clientName").value.trim();
    const item = $("itemName").value.trim();
    const store = $("storeName").value.trim();
    const receipt = $("receiptUpload").files[0] || null;

    if (!clientName || !item || !store) {
      alert("Fill out all fields.");
      return;
    }

    const orderId = await createOrder(client.id, clientName, item, store, receipt);

    if (orderId) {
      alert("Order created! Your order ID is: " + orderId);
      form.reset();
    }
  });
}

/* ============================================================
   CLIENT ORDER STATUS PAGE
============================================================ */

function initOrderStatusPage() {
  const form = $("orderStatusForm");
  const result = $("orderStatusResult");

  if (!form || !result) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const orderId = $("orderIdLookup").value.trim();
    if (!orderId) {
      result.innerHTML = "Enter an order ID.";
      return;
    }

    const order = await getOrderStatus(orderId);

    if (!order || order.error) {
      result.innerHTML = "Order not found.";
      return;
    }

    result.innerHTML = `
      <strong>Order ID:</strong> ${order.id}<br>
      <strong>Status:</strong> ${order.status}<br>
      <strong>Rider:</strong> ${order.riderId || "Not assigned yet"}<br><br>
      ${
        order.status === "completed"
          ? `<button class="primary-btn" onclick="location.href='/pages/client/success.html'">
               Delivery Complete — Continue
             </button>`
          : ""
      }
    `;
  });
}

/* ============================================================
   CLIENT TIP (SUCCESS PAGE)
   /api/client?action=tip-post
============================================================ */

async function sendPostTip(amount) {
  const order = getSession("order");
  if (!order) {
    alert("No order found.");
    return;
  }

  const tipValue = Number(amount || 0);
  if (!tipValue || tipValue <= 0) {
    alert("Enter a valid tip amount.");
    return;
  }

  const data = await api("/api/client?action=tip-post", "POST", {
    orderId: order.id,
    tipPost: tipValue
  });

  if (!data || data.error) {
    alert("Tip failed. Try again.");
    return;
  }

  alert("Thanks for tipping your rider!");
}

/* ============================================================
   RIDER SYSTEM
   /api/rider (Worker: riderHandler)
============================================================ */

async function fastRiderSignup(name, phone, vehicle, password) {
  const data = await api("/api/rider?action=signup", "POST", {
    name,
    phone,
    vehicle,
    password
  });

  if (data && data.success) {
    saveSession("rider", {
      id: data.id,
      name,
      phone,
      vehicle
    });
    return data.id;
  }

  alert("Rider signup failed");
  return null;
}

async function fastRiderLogin(name, password) {
  const data = await api("/api/rider?action=login", "POST", {
    name,
    password
  });

  if (data && data.success) {
    saveSession("rider", {
      id: data.id,
      name: data.name,
      phone: data.phone,
      vehicle: data.vehicle
    });
    return data.id;
  }

  alert("Invalid rider login");
  return null;
}

async function fastRiderUpdate(profile) {
  const rider = getSession("rider");
  if (!rider) return;

  await api("/api/rider?action=update", "POST", {
    id: rider.id,
    ...profile
  });
}

async function fastRiderSetStatus(status) {
  const rider = getSession("rider");
  if (!rider) return;

  await api("/api/rider?action=status", "POST", {
    id: rider.id,
    status
  });
}

/* ============================================================
   RIDER JOBS / ORDERS VIEW
============================================================ */

async function fastRiderLoadJobs() {
  const rider = getSession("rider");
  if (!rider) return [];

  const data = await api(`/api/order?riderId=${encodeURIComponent(rider.id)}`, "GET");
  return Array.isArray(data) ? data : [];
}

async function fastRiderAcceptJob(orderId) {
  const rider = getSession("rider");
  if (!rider) return;

  await api("/api/order?action=update", "POST", {
    id: orderId,
    riderId: rider.id,
    status: "assigned"
  });
}

async function fastRiderCompleteJob(orderId) {
  await api("/api/order?action=complete", "POST", {
    id: orderId
  });
}

/* ============================================================
   RIDER SIGNUP PAGE
============================================================ */

function initRiderSignupPage() {
  const form = $("riderSignupForm");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = $("riderName").value.trim();
    const phone = $("riderPhone").value.trim();
    const vehicle = $("riderVehicle").value.trim();
    const password = $("password") ? $("password").value : "";

    if (!name || !phone || !vehicle) {
      alert("Fill out all fields.");
      return;
    }

    const id = await fastRiderSignup(name, phone, vehicle, password);
    if (!id) return;

    alert("Rider account created!");
    window.location.href = "/pages/rider/dashboard.html";
  });
}

/* ============================================================
   RIDER LOGIN PAGE
============================================================ */

function initRiderLoginPage() {
  const form = $("riderLoginForm");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = $("name").value.trim();
    const password = $("password").value;

    const id = await fastRiderLogin(name, password);
    if (!id) return;

    window.location.href = "/pages/rider/dashboard.html";
  });
}

/* ============================================================
   RIDER DASHBOARD PAGE
============================================================ */

function initRiderDashboardPage() {
  const rider = getSession("rider");
  if (!rider) {
    window.location.href = "/pages/rider/signup.html";
    return;
  }

  const nameEl = $("riderDashboardName");
  if (nameEl) nameEl.textContent = rider.name;

  const statusBtn = $("riderStatusToggle");
  if (statusBtn) {
    statusBtn.addEventListener("click", async () => {
      const current = statusBtn.dataset.status || "offline";
      const newStatus = current === "active" ? "offline" : "active";

      await fastRiderSetStatus(newStatus);
      statusBtn.dataset.status = newStatus;
      statusBtn.textContent = newStatus === "active" ? "Go Offline" : "Go Active";
    });
  }
}

/* ============================================================
   RIDER JOBS PAGE
============================================================ */

async function initRiderJobsPage() {
  const rider = getSession("rider");
  if (!rider) {
    window.location.href = "/pages/rider/signup.html";
    return;
  }

  const list = $("riderJobsList");
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

  // Client pages
  if (path.includes("/pages/client/signup.html")) initClientSignupPage();
  if (path.includes("/pages/client/login.html")) initClientLoginPage();
  if (path.includes("/pages/client/order.html")) initOrderPage();
  if (path.includes("/pages/client/status.html")) initOrderStatusPage();

  // Rider pages
  if (path.includes("/pages/rider/signup.html")) initRiderSignupPage();
  if (path.includes("/pages/rider/login.html")) initRiderLoginPage();
  if (path.includes("/pages/rider/dashboard.html")) initRiderDashboardPage();
  if (path.includes("/pages/rider/jobs.html")) initRiderJobsPage();
});
