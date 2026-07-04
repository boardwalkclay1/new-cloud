// /network/staff/js/staff.js
// VENDOR DASHBOARD LOADER — CLEAN + MODULAR

import { Auth } from "/js/auth.js";

const Staff = {
  key: "network_vendor_user",

  // ---------------------------------------------------------
  // AUTH CACHE
  // ---------------------------------------------------------
  getUser() {
    const raw = localStorage.getItem(this.key);
    return raw ? JSON.parse(raw) : null;
  },

  saveUser(user) {
    localStorage.setItem(this.key, JSON.stringify(user));
  },

  // ---------------------------------------------------------
  // INIT DASHBOARD
  // ---------------------------------------------------------
  async initDashboard() {
    const cloud = Auth.current();
    if (!cloud || !cloud.roles.includes("vendor")) {
      window.location.href = "/network/staff/pages/login.html";
      return;
    }

    this.saveUser(cloud);

    const profile = await this.fetchJSON(
      `/api/vendor/me?userId=${encodeURIComponent(cloud.id)}`
    );

    if (!profile || profile.error) {
      window.location.href = "/network/staff/pages/login.html";
      return;
    }

    document.querySelector(".network-title").textContent =
      `Vendor Dashboard — ${profile.name}`;

    await this.loadProfile();
    await this.loadProducts();
    await this.loadServices();
    await this.loadWorkshops();
    await this.loadApp();
    await this.loadOrders();
    await this.loadPayouts();

    this.buildCheckoutItems();
    this.updatePreview();
  },

  // ---------------------------------------------------------
  // PROFILE
  // ---------------------------------------------------------
  async loadProfile() {
    const cloud = this.getUser();
    if (!cloud) return;

    const profile = await this.fetchJSON(
      `/api/vendor/me?userId=${encodeURIComponent(cloud.id)}`
    );
    if (!profile || profile.error) return;

    document.getElementById("vendor-name").value = profile.name || "";
    document.getElementById("vendor-bio").value = profile.bio || "";
    document.getElementById("vendor-tags").value = profile.tags || "";
    document.getElementById("vendor-paypal").value = profile.paypal || "";
    document.getElementById("vendor-active").checked = !!profile.active;

    if (profile.photoUrl) {
      const img = document.getElementById("vendor-photo-preview");
      if (img) img.src = profile.photoUrl;
    }
  },

  async saveProfile() {
    const cloud = this.getUser();
    if (!cloud) return;

    const payload = {
      userId: cloud.id,
      name: document.getElementById("vendor-name").value,
      bio: document.getElementById("vendor-bio").value,
      tags: document.getElementById("vendor-tags").value,
      paypal: document.getElementById("vendor-paypal").value,
      active: document.getElementById("vendor-active").checked ? 1 : 0
    };

    const res = await this.postJSON("/api/vendor/profile/update", payload);
    if (res && !res.error) alert("Profile updated");
    else alert("Error updating profile");
  },

  // ---------------------------------------------------------
  // PRODUCTS
  // ---------------------------------------------------------
  async loadProducts() {
    const cloud = this.getUser();
    if (!cloud) return;

    const products = await this.fetchJSON(
      `/api/network/products?vendorId=${encodeURIComponent(cloud.id)}`
    );
    if (!products || products.error) return;

    const list = document.getElementById("product-list");
    list.innerHTML = products.map(p => `
      <div class="product">
        <h3>${p.name} — $${p.price}</h3>
        <p>${p.description || ""}</p>
        <button onclick="Staff.deleteProduct('${p.id}')">Delete</button>
      </div>
    `).join("");

    this._products = products;
  },

  async addProduct() {
    const cloud = this.getUser();
    if (!cloud) return;

    const payload = {
      vendorId: cloud.id,
      name: document.getElementById("product-name").value,
      description: document.getElementById("product-description").value,
      price: parseFloat(document.getElementById("product-price").value || "0")
    };

    const res = await this.postJSON("/api/network/product/create", payload);
    if (res && !res.error) await this.loadProducts();
    else alert("Error creating product");
  },

  async deleteProduct(id) {
    const res = await this.postJSON("/api/network/product/delete", { id });
    if (res && !res.error) await this.loadProducts();
    else alert("Error deleting product");
  },

  // ---------------------------------------------------------
  // SERVICES
  // ---------------------------------------------------------
  async loadServices() {
    const cloud = this.getUser();
    if (!cloud) return;

    const services = await this.fetchJSON(
      `/api/network/services?vendorId=${encodeURIComponent(cloud.id)}`
    );
    if (!services || services.error) return;

    const list = document.getElementById("service-list");
    list.innerHTML = services.map(s => `
      <div class="service">
        <h3>${s.name} — $${s.price}</h3>
        <p>${s.description || ""}</p>
        <button onclick="Staff.deleteService('${s.id}')">Delete</button>
      </div>
    `).join("");

    this._services = services;
  },

  async addService() {
    const cloud = this.getUser();
    if (!cloud) return;

    const payload = {
      vendorId: cloud.id,
      name: document.getElementById("service-name").value,
      description: document.getElementById("service-description").value,
      price: parseFloat(document.getElementById("service-price").value || "0")
    };

    const res = await this.postJSON("/api/network/service/create", payload);
    if (res && !res.error) await this.loadServices();
    else alert("Error creating service");
  },

  async deleteService(id) {
    const res = await this.postJSON("/api/network/service/delete", { id });
    if (res && !res.error) await this.loadServices();
    else alert("Error deleting service");
  },

  // ---------------------------------------------------------
  // WORKSHOPS
  // ---------------------------------------------------------
  async loadWorkshops() {
    const cloud = this.getUser();
    if (!cloud) return;

    const workshops = await this.fetchJSON(
      `/api/network/workshops?vendorId=${encodeURIComponent(cloud.id)}`
    );
    if (!workshops || workshops.error) return;

    const list = document.getElementById("workshop-list");
    list.innerHTML = workshops.map(w => `
      <div class="workshop">
        <h3>${w.title} — $${w.price}</h3>
        <p>${w.description || ""}</p>
        <button onclick="Staff.deleteWorkshop('${w.id}')">Delete</button>
      </div>
    `).join("");

    this._workshops = workshops;
  },

  async addWorkshop() {
    const cloud = this.getUser();
    if (!cloud) return;

    const payload = {
      vendorId: cloud.id,
      title: document.getElementById("workshop-title").value,
      description: document.getElementById("workshop-description").value,
      date: document.getElementById("workshop-date").value,
      price: parseFloat(document.getElementById("workshop-price").value || "0"),
      maxSeats: parseInt(document.getElementById("workshop-max").value || "0")
    };

    const res = await this.postJSON("/api/network/workshop/create", payload);
    if (res && !res.error) await this.loadWorkshops();
    else alert("Error creating workshop");
  },

  async deleteWorkshop(id) {
    const res = await this.postJSON("/api/network/workshop/delete", { id });
    if (res && !res.error) await this.loadWorkshops();
    else alert("Error deleting workshop");
  },

  // ---------------------------------------------------------
  // APP
  // ---------------------------------------------------------
  async loadApp() {
    const cloud = this.getUser();
    if (!cloud) return;

    const app = await this.fetchJSON(
      `/api/network/app?vendorId=${encodeURIComponent(cloud.id)}`
    );

    const box = document.getElementById("public-app");

    if (!app || app.error || !app.name) {
      box.innerHTML = `<p>No app linked yet.</p>`;
      return;
    }

    document.getElementById("app-name").value = app.name;
    document.getElementById("app-url").value = app.url;
    document.getElementById("app-desc").value = app.description;

    box.innerHTML = `
      <div class="item-row">
        <strong>${app.name}</strong><br>
        <a href="${app.url}" target="_blank">${app.url}</a><br>
        ${app.description || ""}
      </div>
    `;
  },

  async saveApp() {
    const cloud = this.getUser();
    if (!cloud) return;

    const payload = {
      vendorId: cloud.id,
      name: document.getElementById("app-name").value,
      url: document.getElementById("app-url").value,
      description: document.getElementById("app-desc").value
    };

    const res = await this.postJSON("/api/network/app/save", payload);
    if (res && !res.error) await this.loadApp();
    else alert("Error saving app");
  },

  // ---------------------------------------------------------
  // ORDERS
  // ---------------------------------------------------------
  async loadOrders() {
    const cloud = this.getUser();
    if (!cloud) return;

    const orders = await this.fetchJSON(
      `/api/vendor/orders?vendorId=${encodeURIComponent(cloud.id)}`
    );
    if (!orders || orders.error) return;

    const list = document.getElementById("order-list");
    list.innerHTML = orders.map(o => `
      <div class="order">
        <h3>${o.itemName} — $${o.amount}</h3>
        <p>Buyer: ${o.buyerName} (${o.buyerEmail})</p>
        <p>Status: ${o.paymentStatus}</p>
        <p>${o.createdAt}</p>
      </div>
    `).join("");
  },

  // ---------------------------------------------------------
  // PAYOUTS
  // ---------------------------------------------------------
  async loadPayouts() {
    const cloud = this.getUser();
    if (!cloud) return;

    const payouts = await this.fetchJSON(
      `/api/payouts/list?vendorId=${encodeURIComponent(cloud.id)}`
    );
    if (!payouts || payouts.error) return;

    const list = document.getElementById("payout-list");
    list.innerHTML = payouts.map(p => `
      <div class="payout">
        <h3>$${p.amount}</h3>
        <p>Status: ${p.status}</p>
        <p>${p.createdAt}</p>
      </div>
    `).join("");
  },

  // ---------------------------------------------------------
  // CHECKOUT ITEMS
  // ---------------------------------------------------------
  buildCheckoutItems() {
    const select = document.getElementById("checkout-item");
    if (!select) return;

    const items = [];

    (this._products || []).forEach(p => {
      items.push({ type: "product", id: p.id, label: `Product: ${p.name} — $${p.price}` });
    });

    (this._services || []).forEach(s => {
      items.push({ type: "service", id: s.id, label: `Service: ${s.name} — $${s.price}` });
    });

    (this._workshops || []).forEach(w => {
      items.push({ type: "workshop", id: w.id, label: `Workshop: ${w.title} — $${w.price}` });
    });

    select.innerHTML = items.length
      ? items.map(i => `<option value="${i.type}:${i.id}">${i.label}</option>`).join("")
      : `<option value="">No items available</option>`;

    this._checkoutItems = items;
  },

  // ---------------------------------------------------------
  // CHECKOUT
  // ---------------------------------------------------------
  async checkout() {
    const cloud = this.getUser();
    if (!cloud) return;

    const select = document.getElementById("checkout-item");
    const qty = parseInt(document.getElementById("checkout-qty").value || "1");
    const statusEl = document.getElementById("checkout-status");

    if (!select.value) {
      statusEl.innerText = "Select an item first.";
      return;
    }

    const [type, id] = select.value.split(":");

    const payload = {
      vendorId: cloud.id,
      itemType: type,
      itemId: id,
      quantity: qty
    };

    const res = await this.postJSON("/api/network/checkout/create", payload);
    if (res && !res.error) {
      statusEl.innerText = "Checkout created.";
      if (res.redirectUrl) window.location.href = res.redirectUrl;
    } else {
      statusEl.innerText = "Error creating checkout.";
    }
  },

  // ---------------------------------------------------------
  // PREVIEW
  // ---------------------------------------------------------
  updatePreview() {
    const name = document.getElementById("vendor-name").value || "Vendor Name";
    const bio = document.getElementById("vendor-bio").value || "Your bio will appear here.";

    document.getElementById("public-name").innerText = name;
    document.getElementById("public-bio").innerText = bio;
  },

  // ---------------------------------------------------------
  // NAVIGATION
  // ---------------------------------------------------------
  go(page) {
    window.location.href = `/network/staff/pages/${page}`;
  },

  previewPage() {
    window.location.href = `/network/public/pages/vendor.html?id=me`;
  },

  // ---------------------------------------------------------
  // FETCH / POST
  // ---------------------------------------------------------
  async fetchJSON(url) {
    try {
      const res = await fetch(url, { credentials: "include" });
      return await res.json();
    } catch {
      return null;
    }
  },

  async postJSON(url, body) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body)
      });
      return await res.json();
    } catch {
      return null;
    }
  }
};

export { Staff };
