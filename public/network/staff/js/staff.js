// /network/staff/js/staff.js
// UPGRADED STAFF SYSTEM — PROFILE + PRODUCTS + SERVICES + WORKSHOPS + APP + CHECKOUT

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
  // PROFILE PAGE INIT
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

    const types = (profile.types || "").split(",").map(t => t.trim());
    document.getElementById("type-product").checked = types.includes("product");
    document.getElementById("type-service").checked = types.includes("service");
    document.getElementById("type-workshop").checked = types.includes("workshop");
    document.getElementById("type-creator").checked = types.includes("creator");
    document.getElementById("type-app").checked = types.includes("app");

    if (profile.photoUrl) {
      const photoInput = document.getElementById("vendor-photo");
      if (photoInput) photoInput.value = profile.photoUrl;
    }

    // Load items for lists + public preview
    await this.loadProducts();
    await this.loadServices();
    await this.loadWorkshops();
    await this.loadApp();

    this.updatePreview();
    this.buildCheckoutItems();
  },

  async saveProfile() {
    const user = this.getUser();
    if (!user || !user.email) return;

    const types = [];
    if (document.getElementById("type-product").checked) types.push("product");
    if (document.getElementById("type-service").checked) types.push("service");
    if (document.getElementById("type-workshop").checked) types.push("workshop");
    if (document.getElementById("type-creator").checked) types.push("creator");
    if (document.getElementById("type-app").checked) types.push("app");

    const payload = {
      email: user.email,
      name: document.getElementById("vendor-name").value,
      bio: document.getElementById("vendor-bio").value,
      tags: document.getElementById("vendor-tags").value,
      paypal: document.getElementById("vendor-paypal").value,
      types: types.join(",")
    };

    const res = await this.postJSON("/api/staff/profile/update", payload);
    if (res && !res.error) {
      document.getElementById("publish-status")?.innerText = "Profile saved.";
      this.updatePreview();
    } else {
      alert("Error updating profile");
    }
  },

  async publishProfile() {
    await this.saveProfile();
    const user = this.getUser();
    if (!user || !user.email) return;

    const res = await this.postJSON("/api/staff/profile/publish", { email: user.email });
    if (res && !res.error) {
      document.getElementById("publish-status")?.innerText = "Profile published and live on The Network.";
    } else {
      alert("Error publishing profile");
    }
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
    const publicList = document.getElementById("public-products");
    if (!list || !publicList) return;

    list.innerHTML = products.map(p => `
      <div class="item-row">
        <span>
          <strong>${p.name}</strong> — <span class="price-tag">$${p.price}</span><br>
          ${p.description || ""}
        </span>
        <div class="item-actions">
          <button onclick="Staff.deleteProduct('${p.id}')">Delete</button>
        </div>
      </div>
    `).join("");

    publicList.innerHTML = products.length
      ? products.map(p => `
        <div class="item-row">
          <span>
            <strong>${p.name}</strong> — <span class="price-tag">$${p.price}</span><br>
            ${p.description || ""}
          </span>
        </div>
      `).join("")
      : `<p style="font-size:13px;opacity:0.7;">No products yet.</p>`;

    this._products = products;
  },

  async addProduct() {
    const user = this.getUser();
    if (!user || !user.email) return;

    const payload = {
      vendorId: user.email,
      name: document.getElementById("product-name").value,
      description: document.getElementById("product-desc").value,
      price: parseFloat(document.getElementById("product-price").value || "0")
    };

    const res = await this.postJSON("/api/network/product/create", payload);
    if (res && !res.error) {
      await this.loadProducts();
      this.buildCheckoutItems();
    } else {
      alert("Error creating product");
    }
  },

  async deleteProduct(id) {
    const res = await this.postJSON("/api/network/product/delete", { id });
    if (res && !res.error) {
      await this.loadProducts();
      this.buildCheckoutItems();
    } else {
      alert("Error deleting product");
    }
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
    const publicList = document.getElementById("public-services");
    if (!list || !publicList) return;

    list.innerHTML = services.map(s => `
      <div class="item-row">
        <span>
          <strong>${s.name}</strong> — <span class="price-tag">$${s.price}</span><br>
          ${s.description || ""}
        </span>
        <div class="item-actions">
          <button onclick="Staff.deleteService('${s.id}')">Delete</button>
        </div>
      </div>
    `).join("");

    publicList.innerHTML = services.length
      ? services.map(s => `
        <div class="item-row">
          <span>
            <strong>${s.name}</strong> — <span class="price-tag">$${s.price}</span><br>
            ${s.description || ""}
          </span>
        </div>
      `).join("")
      : `<p style="font-size:13px;opacity:0.7;">No services yet.</p>`;

    this._services = services;
  },

  async addService() {
    const user = this.getUser();
    if (!user || !user.email) return;

    const payload = {
      vendorId: user.email,
      name: document.getElementById("service-name").value,
      description: document.getElementById("service-desc").value,
      price: parseFloat(document.getElementById("service-price").value || "0")
    };

    const res = await this.postJSON("/api/network/service/create", payload);
    if (res && !res.error) {
      await this.loadServices();
      this.buildCheckoutItems();
    } else {
      alert("Error creating service");
    }
  },

  async deleteService(id) {
    const res = await this.postJSON("/api/network/service/delete", { id });
    if (res && !res.error) {
      await this.loadServices();
      this.buildCheckoutItems();
    } else {
      alert("Error deleting service");
    }
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
    const publicList = document.getElementById("public-workshops");
    if (!list || !publicList) return;

    list.innerHTML = workshops.map(w => `
      <div class="calendar-row">
        <strong>${w.title}</strong> — <span class="price-tag">$${w.price}</span><br>
        ${w.date} • ${w.location || ""}<br>
        ${w.description || ""}
        <div class="item-actions">
          <button onclick="Staff.deleteWorkshop('${w.id}')">Delete</button>
        </div>
      </div>
    `).join("");

    publicList.innerHTML = workshops.length
      ? workshops.map(w => `
        <div class="calendar-row">
          <strong>${w.title}</strong> — <span class="price-tag">$${w.price}</span><br>
          ${w.date} • ${w.location || ""}<br>
          ${w.description || ""}
        </div>
      `).join("")
      : `<p style="font-size:13px;opacity:0.7;">No workshops scheduled.</p>`;

    this._workshops = workshops;
  },

  async addWorkshop() {
    const user = this.getUser();
    if (!user || !user.email) return;

    const payload = {
      vendorId: user.email,
      title: document.getElementById("workshop-title").value,
      description: document.getElementById("workshop-desc").value,
      date: document.getElementById("workshop-date").value,
      time: document.getElementById("workshop-time").value,
      location: document.getElementById("workshop-location").value,
      price: parseFloat(document.getElementById("workshop-price").value || "0"),
      maxSeats: parseInt(document.getElementById("workshop-max")?.value || "0")
    };

    const res = await this.postJSON("/api/network/workshop/create", payload);
    if (res && !res.error) {
      await this.loadWorkshops();
      this.buildCheckoutItems();
    } else {
      alert("Error creating workshop");
    }
  },

  async deleteWorkshop(id) {
    const res = await this.postJSON("/api/network/workshop/delete", { id });
    if (res && !res.error) {
      await this.loadWorkshops();
      this.buildCheckoutItems();
    } else {
      alert("Error deleting workshop");
    }
  },

  // -----------------------------
  // APP / DIGITAL TOOL
  // -----------------------------
  async loadApp() {
    const user = this.getUser();
    if (!user || !user.email) return;

    const app = await this.fetchJSON(`/api/network/app?vendor=${encodeURIComponent(user.email)}`);
    const publicBox = document.getElementById("public-app");
    if (!publicBox) return;

    if (!app || app.error || !app.name) {
      publicBox.innerHTML = `<p style="font-size:13px;opacity:0.7;">No app linked yet.</p>`;
      return;
    }

    document.getElementById("app-name").value = app.name || "";
    document.getElementById("app-url").value = app.url || "";
    document.getElementById("app-desc").value = app.description || "";

    publicBox.innerHTML = `
      <div class="item-row">
        <span>
          <strong>${app.name}</strong><br>
          <a href="${app.url}" target="_blank" style="color:#00c3ff;">${app.url}</a><br>
          ${app.description || ""}
        </span>
      </div>
    `;
  },

  async saveApp() {
    const user = this.getUser();
    if (!user || !user.email) return;

    const payload = {
      vendorId: user.email,
      name: document.getElementById("app-name").value,
      url: document.getElementById("app-url").value,
      description: document.getElementById("app-desc").value
    };

    const res = await this.postJSON("/api/network/app/save", payload);
    if (res && !res.error) {
      await this.loadApp();
    } else {
      alert("Error saving app info");
    }
  },

  // -----------------------------
  // PREVIEW + CHECKOUT
  // -----------------------------
  updatePreview() {
    const name = document.getElementById("vendor-name").value || "Vendor Name";
    const bio = document.getElementById("vendor-bio").value || "Your bio will appear here for buyers.";

    const types = [];
    if (document.getElementById("type-product").checked) types.push("Products");
    if (document.getElementById("type-service").checked) types.push("Services");
    if (document.getElementById("type-workshop").checked) types.push("Workshops");
    if (document.getElementById("type-creator").checked) types.push("Creator");
    if (document.getElementById("type-app").checked) types.push("App");

    document.getElementById("public-name").innerText = name;
    document.getElementById("public-bio").innerText = bio;
    document.getElementById("public-types").innerText = types.join(" • ") || "Vendor";
  },

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
      : `<option value="">No items available yet</option>`;

    this._checkoutItems = items;
  },

  async checkout() {
    const user = this.getUser();
    if (!user || !user.email) return;

    const select = document.getElementById("checkout-item");
    const qty = parseInt(document.getElementById("checkout-qty").value || "1");
    const statusEl = document.getElementById("checkout-status");

    if (!select.value) {
      statusEl.innerText = "Select an item first.";
      return;
    }

    const [type, id] = select.value.split(":");

    const payload = {
      vendorId: user.email,
      itemType: type,
      itemId: id,
      quantity: qty
    };

    const res = await this.postJSON("/api/network/checkout/create", payload);
    if (res && !res.error) {
      statusEl.innerText = "Checkout created. Redirecting to payment…";
      if (res.redirectUrl) window.location.href = res.redirectUrl;
    } else {
      statusEl.innerText = "Error creating checkout.";
    }
  },

  // -----------------------------
  // ORDERS + PAYOUTS (for dashboard)
  // -----------------------------
  async loadOrders() {
    const user = this.getUser();
    if (!user || !user.email) return;

    const orders = await this.fetchJSON(`/api/staff/orders?email=${encodeURIComponent(user.email)}`);
    if (!orders || orders.error) return;

    const list = document.getElementById("order-list");
    if (!list) return;

    list.innerHTML = orders.map(o => `
      <div class="order">
        <h3>${o.itemName || "Order"} — $${o.amount}</h3>
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
    if (!list) return;

    list.innerHTML = payouts.map(p => `
      <div class="payout">
        <h3>$${p.amount}</h3>
        <p>Status: ${p.status}</p>
        <p>Created: ${p.createdAt}</p>
      </div>
    `).join("");
  },

  // -----------------------------
  // NAVIGATION
  // -----------------------------
  go(page) {
    window.location.href = `/network/staff/pages/${page}`;
  },

  previewPage() {
    window.location.href = `/network/public/pages/vendor.html?id=me`;
  },

  // -----------------------------
  // FETCH / POST
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
