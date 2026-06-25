// admin.js — Beltline Cloud Admin Panel
// Uses ADMIN_TOKEN header for all requests.

const Admin = {
  token: null,

  init(token) {
    this.token = token;
  },

  // -----------------------------
  // FETCH HELPERS
  // -----------------------------
  async get(url) {
    const res = await fetch(url, {
      headers: { "x-admin-token": this.token }
    });
    return res.json();
  },

  async post(url, body) {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "x-admin-token": this.token,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });
    return res.json();
  },

  // -----------------------------
  // ANALYTICS
  // -----------------------------
  async loadAnalytics() {
    const box = document.getElementById('tab-analytics');
    box.innerHTML = "Loading analytics...";

    const data = await this.get("/api/admin/network/analytics");

    box.innerHTML = `
      <div class="card">
        <h2>Network Overview</h2>
        <p>Total orders: ${data.total?.orders || 0}</p>
        <p>Gross volume: $${data.total?.gross || 0}</p>
        <p>Your cut (12%): $${data.total?.platform || 0}</p>
      </div>
    `;
  },

  // -----------------------------
  // PROFILES
  // -----------------------------
  async loadProfiles() {
    const box = document.getElementById('tab-profiles');
    box.innerHTML = "Loading profiles...";

    const profiles = await this.get("/api/admin/network/profiles");

    box.innerHTML = profiles.map(p => `
      <div class="card">
        <h3>${p.name}</h3>
        <p>${p.title || ''}</p>
        <p>Commission: ${(p.commissionPercent * 100 || 12).toFixed(1)}%</p>
        <button class="btn" onclick="Admin.toggleBlock('${p.id}', ${p.blocked ? 0 : 1})">
          ${p.blocked ? "Unblock" : "Block"}
        </button>
      </div>
    `).join('');
  },

  async toggleBlock(id, block) {
    await this.post("/api/admin/network/block", { id, block });
    this.loadProfiles();
  },

  // -----------------------------
  // PRODUCTS
  // -----------------------------
  async loadProducts() {
    const box = document.getElementById('tab-products');
    box.innerHTML = "Loading products...";

    const products = await this.get("/api/admin/network/products");

    box.innerHTML = products.map(p => `
      <div class="card">
        <h3>${p.name}</h3>
        <p>Vendor: ${p.vendorName}</p>
        <p>Price: $${p.price}</p>
      </div>
    `).join('');
  },

  // -----------------------------
  // ORDERS
  // -----------------------------
  async loadOrders() {
    const box = document.getElementById('tab-orders');
    box.innerHTML = "Loading orders...";

    const orders = await this.get("/api/admin/bookings");

    box.innerHTML = orders.map(o => `
      <div class="card">
        <h3>${o.discipline}</h3>
        <p>${o.userName} — ${o.userEmail}</p>
        <p>${o.date} @ ${o.time}</p>
        <p>Status: ${o.paymentStatus}</p>
      </div>
    `).join('');
  },

  // -----------------------------
  // PAYOUTS
  // -----------------------------
  async loadPayouts() {
    const box = document.getElementById('tab-payouts');
    box.innerHTML = "Loading payouts...";

    const payouts = await this.get("/api/admin/payouts");

    box.innerHTML = payouts.map(p => `
      <div class="card">
        <h3>$${p.amount}</h3>
        <p>${p.vendorName}</p>
        <p>Status: ${p.status}</p>
        <button class="btn" onclick="Admin.markPaid('${p.id}')">Mark Paid</button>
      </div>
    `).join('');
  },

  async markPaid(id) {
    await this.post("/api/admin/payouts/mark-paid", { id });
    this.loadPayouts();
  }
};
