// STAFF SYSTEM — FULL VENDOR + PRODUCT + SERVICE + WORKSHOP + ORDERS + PAYOUTS
// Works with the full Worker logic you approved.

const Staff = {
  key: "network_staff_user",

  // -----------------------------
  // AUTH CACHE
  // -----------------------------
  getUser() {
    const raw = localStorage.getItem(this.key);
    return raw ? JSON.parse(raw) : null;
  },

  saveUser(user) {
    localStorage.setItem(this.key, JSON.stringify(user));
  },

  // -----------------------------
  // DASHBOARD INIT
  // -----------------------------
  async initDashboard() {
    const user = this.getUser();
    if (!user || !user.email) {
      window.location.href = "/network/staff/pages/login.html";
      return;
    }

    const profile = await this.fetchJSON(`/api/staff/me?email=${encodeURIComponent(user.email)}`);
    if (!profile || profile.error) {
      window.location.href = "/network/staff/pages/login.html";
      return;
    }

    user.name = profile.name;
    user.types = profile.types ? profile.types.split(",") : [];
    this.saveUser(user);

    const types = user.types;

    if (!types.includes("product")) document.getElementById("node-products")?.classList.add("hidden");
    if (!types.includes("service")) document.getElementById("node-services")?.classList.add("hidden");
    if (!types.includes("workshop")) document.getElementById("node-workshops")?.classList.add("hidden");
    if (!types.includes("product") && !types.includes("service"))
      document.getElementById("node-orders")?.classList.add("hidden");

    const title = document.querySelector(".network-title");
    if (title) title.textContent = `Staff Dashboard — ${user.name}`;
  },

  // -----------------------------
  // LOAD PROFILE
  // -----------------------------
  async loadProfile() {
    const user = this.getUser();
    if (!user || !user.email) return;

    const profile = await this.fetchJSON(`/api/staff/me?email=${encodeURIComponent(user.email)}`);
    if (!profile || profile.error) return;

    document.getElementById("vendor-name").value = profile.name || "";
    document.getElementById("vendor-bio").value = profile.bio || "";
    document.getElementById("vendor-tags").value = profile.tags || "";
    document.getElementById("vendor-paypal").value = profile.paypal || "";
    document.getElementById("vendor-active").checked = !!profile.active;
    document.getElementById("vendor-location").checked = !!profile.shareLocation;

    const types = (profile.types || "").split(",").map(t => t.trim());
    document.getElementById("type-product").checked = types.includes("product");
    document.getElementById("type-service").checked = types.includes("service");
    document.getElementById("type-workshop").checked = types.includes("workshop");
    document.getElementById("type-creator").checked = types.includes("creator");

    if (profile.photoUrl) {
      const img = document.getElementById("vendor-photo-preview");
      if (img) img.src = profile.photoUrl;
    }
  },

  // -----------------------------
  // SAVE PROFILE
  // -----------------------------
  async saveProfile() {
    const user = this.getUser();
    if (!user || !user.email) return;

    const types = [];
    if (document.getElementById("type-product").checked) types.push("product");
    if (document.getElementById("type-service").checked) types.push("service");
    if (document.getElementById("type-workshop").checked) types.push("workshop");
    if (document.getElementById("type-creator").checked) types.push("creator");

    const payload = {
      email: user.email,
      name: document.getElementById("vendor-name").value,
      bio: document.getElementById("vendor-bio").value,
      tags: document.getElementById("vendor-tags").value,
      paypal: document.getElementById("vendor-paypal").value,
      active: document.getElementById("vendor-active").checked ? 1 : 0,
      shareLocation: document.getElementById("vendor-location").checked ? 1 : 0,
      types: types.join(",")
    };

    const res = await this.postJSON("/api/staff/profile/update", payload);
    if (res && !res.error) alert("Profile updated");
    else alert("Error updating profile");
  },

  // -----------------------------
  // PRODUCTS
  // -----------------------------
  async loadProducts() {
    const user = this.getUser();
    if (!user || !user.email) return;

    const products = await this.fetchJSON(`/api/network/products?vendor=${encodeURIComponent(user.email)}`);
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
      vendorId: user.email,
      name: document.getElementById("product-name").value,
      description: document.getElementById("product-description").value,
      price: parseFloat(document.getElementById("product-price").value || "0")
    };

    const res = await this.postJSON("/api/network/product/create", payload);
    if (res && !res.error) location.reload();
    else alert("Error creating product");
  },

  async deleteProduct(id) {
    const res = await this.postJSON("/api/network/product/delete", { id });
    if (res && !res.error) location.reload();
    else alert("Error deleting product");
  },

  // -----------------------------
  // SERVICES
  // -----------------------------
  async loadServices() {
    const user = this.getUser();
    if (!user || !user.email) return;

    const services = await this.fetchJSON(`/api/network/services?vendor=${encodeURIComponent(user.email)}`);
    if (!services || services.error) return;

    const list = document.getElementById("service-list");
    list.innerHTML = services.map(s => `
      <div class="service">
        <h3>${s.name} — $${s.price}</h3>
        <p>${s.description || ""}</p>
        <button onclick="Staff.deleteService('${s.id}')">Delete</button>
      </div>
    `).join("");
  },

  async addService() {
    const user = this.getUser();
    if (!user || !user.email) return;

    const payload = {
      vendorId: user.email,
      name: document.getElementById("service-name").value,
      description: document.getElementById("service-description").value,
      price: parseFloat(document.getElementById("service-price").value || "0")
    };

    const res = await this.postJSON("/api/network/service/create", payload);
    if (res && !res.error) location.reload();
    else alert("Error creating service");
  },

  async deleteService(id) {
    const res = await this.postJSON("/api/network/service/delete", { id });
    if (res && !res.error) location.reload();
    else alert("Error deleting service");
  },

  // -----------------------------
  // WORKSHOPS
  // -----------------------------
  async loadWorkshops() {
    const user = this.getUser();
    if (!user || !user.email) return;

    const workshops = await this.fetchJSON(`/api/network/workshops?vendor=${encodeURIComponent(user.email)}`);
    if (!workshops || workshops.error) return;

    const list = document.getElementById("workshop-list");
    list.innerHTML = workshops.map(w => `
      <div class="workshop">
        <h3>${w.title} — $${w.price}</h3>
        <p>${w.description || ""}</p>
        <button onclick="Staff.deleteWorkshop('${w.id}')">Delete</button>
      </div>
    `).join("");
  },

  async addWorkshop() {
    const user = this.getUser();
    if (!user || !user.email) return;

    const payload = {
      vendorId: user.email,
      title: document.getElementById("workshop-title").value,
      description: document.getElementById("workshop-description").value,
      date: document.getElementById("workshop-date").value,
      price: parseFloat(document.getElementById("workshop-price").value || "0"),
      maxSeats: parseInt(document.getElementById("workshop-max").value || "0")
    };

    const res = await this.postJSON("/api/network/workshop/create", payload);
    if (res && !res.error) location.reload();
    else alert("Error creating workshop");
  },

  async deleteWorkshop(id) {
    const res = await this.postJSON("/api/network/workshop/delete", { id });
    if (res && !res.error) location.reload();
    else alert("Error deleting workshop");
  },

  // -----------------------------
  // ORDERS
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

  // -----------------------------
  // PAYOUTS
  // -----------------------------
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
  // PUBLIC PAGE PREVIEW
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
  // FETCH JSON
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
  // POST JSON
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
