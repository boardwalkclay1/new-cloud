// STAFF SYSTEM — WORKER + D1 VERSION
// Auth (email + password) handled in auth.js.
// auth.js should save { email, name } into localStorage["network_staff_user"] after login.

const Staff = {
  key: "network_staff_user",

  // -----------------------------
  // GET / SAVE USER (AUTH CACHE)
  // -----------------------------
  getUser() {
    const raw = localStorage.getItem(this.key);
    return raw ? JSON.parse(raw) : null;
  },

  saveUser(user) {
    localStorage.setItem(this.key, JSON.stringify(user));
  },

  // -----------------------------
  // DASHBOARD AUTO-ADAPT
  // -----------------------------
  async initDashboard() {
    const user = this.getUser();
    if (!user || !user.email) {
      window.location.href = "/network/staff/pages/login.html";
      return;
    }

    // Load profile from Worker/D1
    const profile = await this.fetchJSON(`/api/staff/me?email=${encodeURIComponent(user.email)}`);
    if (!profile || profile.error) {
      window.location.href = "/network/staff/pages/login.html";
      return;
    }

    // Save latest profile locally (name, types, etc.)
    user.name = profile.name;
    user.types = profile.types || [];
    this.saveUser(user);

    const types = user.types || [];

    if (!types.includes("product")) {
      document.getElementById("node-products")?.classList.add("hidden");
    }
    if (!types.includes("service")) {
      document.getElementById("node-services")?.classList.add("hidden");
    }
    if (!types.includes("workshop")) {
      document.getElementById("node-workshops")?.classList.add("hidden");
    }
    if (!types.includes("product") && !types.includes("service")) {
      document.getElementById("node-orders")?.classList.add("hidden");
    }

    const title = document.querySelector(".network-title");
    if (title) title.textContent = `Staff Dashboard — ${user.name}`;
  },

  // -----------------------------
  // PROFILE PAGE (D1)
  // -----------------------------
  async loadProfile() {
    const user = this.getUser();
    if (!user || !user.email) return;

    const profile = await this.fetchJSON(`/api/staff/me?email=${encodeURIComponent(user.email)}`);
    if (!profile || profile.error) return;

    document.getElementById("vendor-name").value = profile.name || "";
    document.getElementById("vendor-bio").value = profile.bio || "";
    document.getElementById("vendor-tags").value = (profile.tags || "").toString();
    document.getElementById("vendor-paypal").value = profile.paypal || "";
    document.getElementById("vendor-active").checked = !!profile.active;
    document.getElementById("vendor-location").checked = !!profile.shareLocation;

    const types = (profile.types || "").split(",").map(t => t.trim()).filter(Boolean);
    document.getElementById("type-product").checked = types.includes("product");
    document.getElementById("type-service").checked = types.includes("service");
    document.getElementById("type-workshop").checked = types.includes("workshop");
    document.getElementById("type-creator").checked = types.includes("creator");

    if (profile.photoUrl) {
      const img = document.getElementById("vendor-photo-preview");
      if (img) img.src = profile.photoUrl;
    }
  },

  async saveProfile() {
    const user = this.getUser();
    if (!user || !user.email) return;

    const types = [];
    if (document.getElementById("type-product").checked) types.push("product");
    if (document.getElementById("type-service").checked) types.push("service");
    if (document.getElementById("type-workshop").checked) types.push("workshop");
    if (document.getElementById("type-creator").checked) types.push("creator");

    const tags = document.getElementById("vendor-tags").value
      .split(",")
      .map(t => t.trim())
      .filter(Boolean)
      .join(", ");

    const payload = {
      email: user.email,
      name: document.getElementById("vendor-name").value,
      title: "", // optional, not used in UI yet
      bio: document.getElementById("vendor-bio").value,
      instagram: "",
      website: "",
      // extra fields you may add later:
      tags,
      types: types.join(","),
      paypal: document.getElementById("vendor-paypal").value,
      active: document.getElementById("vendor-active").checked ? 1 : 0,
      shareLocation: document.getElementById("vendor-location").checked ? 1 : 0
    };

    const res = await this.postJSON("/api/staff/profile/update", payload);
    if (res && !res.error) {
      alert("Profile updated");
    } else {
      alert("Error updating profile");
    }
  },

  // -----------------------------
  // PRODUCT SYSTEM (D1)
  // -----------------------------
  async loadProducts() {
    const user = this.getUser();
    if (!user || !user.email) return;

    const products = await this.fetchJSON(`/api/staff/products?email=${encodeURIComponent(user.email)}`);
    if (!products || products.error) return;

    const list = document.getElementById("product-list");
    list.innerHTML = products.map(p => `
      <div class="product">
        <h3>${p.name} — $${p.price}</h3>
        <p>${p.description || ""}</p>
        <button onclick="Staff.deleteProduct('${p.id}')">Delete</button>
      </div>
    `).join("");
  },

  async addProduct() {
    const user = this.getUser();
    if (!user || !user.email) return;

    const payload = {
      email: user.email,
      type: "product",
      name: document.getElementById("product-name").value,
      description: document.getElementById("product-description").value,
      price: parseFloat(document.getElementById("product-price").value || "0")
    };

    const res = await this.postJSON("/api/staff/product/create", payload);
    if (res && !res.error) {
      location.reload();
    } else {
      alert("Error creating product");
    }
  },

  async deleteProduct(productId) {
    const res = await this.postJSON("/api/staff/product/delete", { productId });
    if (res && !res.error) {
      location.reload();
    } else {
      alert("Error deleting product");
    }
  },

  // -----------------------------
  // ORDERS + PAYOUTS (D1)
  // -----------------------------
  async loadOrders() {
    const user = this.getUser();
    if (!user || !user.email) return;

    const orders = await this.fetchJSON(`/api/staff/orders?email=${encodeURIComponent(user.email)}`);
    if (!orders || orders.error) return;

    const list = document.getElementById("order-list");
    list.innerHTML = orders.map(o => `
      <div class="order">
        <h3>${o.productName || "Order"} — $${o.price}</h3>
        <p>Buyer: ${o.buyerName} (${o.buyerEmail})</p>
        <p>Status: ${o.paymentStatus}</p>
        <p>Created: ${o.createdAt}</p>
      </div>
    `).join("");
  },

  async loadPayouts() {
    const user = this.getUser();
    if (!user || !user.email) return;

    const payouts = await this.fetchJSON(`/api/staff/payouts?email=${encodeURIComponent(user.email)}`);
    if (!payouts || payouts.error) return;

    const list = document.getElementById("payout-list");
    list.innerHTML = payouts.map(p => `
      <div class="payout">
        <h3>$${p.amount}</h3>
        <p>Status: ${p.status}</p>
        <p>Created: ${p.createdAt}</p>
      </div>
    `).join("");
  },

  // -----------------------------
  // PREVIEW PUBLIC PAGE
  // -----------------------------
  previewPage() {
    window.location.href = `/network/public/pages/vendor.html?id=me`;
  },

  // -----------------------------
  // NAVIGATION
  // -----------------------------
  go(page) {
    window.location.href = `/network/staff/pages/${page}`;
  },

  // -----------------------------
  // HELPER: GET JSON
  // -----------------------------
  async fetchJSON(url) {
    try {
      const res = await fetch(url, { credentials: "include" });
      return await res.json();
    } catch (e) {
      console.error("fetchJSON error", e);
      return null;
    }
  },

  // -----------------------------
  // HELPER: POST JSON
  // -----------------------------
  async postJSON(url, body) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body)
      });
      return await res.json();
    } catch (e) {
      console.error("postJSON error", e);
      return null;
    }
  }
};
