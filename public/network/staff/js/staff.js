// /network/staff/js/staff.js
// FULL REWRITE — VENDOR STOREFRONT ENGINE CONNECTED TO CLOUD USER

const Staff = {
  cloudKey: "cloud_user",
  storeKey: "vendor_storefront",

  /* ---------------------------------------------------------
     CLOUD USER
  --------------------------------------------------------- */
  getCloudUser() {
    const raw = localStorage.getItem(this.cloudKey);
    return raw ? JSON.parse(raw) : null;
  },

  /* ---------------------------------------------------------
     STOREFRONT CACHE
  --------------------------------------------------------- */
  getStorefront() {
    const raw = localStorage.getItem(this.storeKey);
    return raw ? JSON.parse(raw) : null;
  },

  saveStorefront(data) {
    localStorage.setItem(this.storeKey, JSON.stringify(data));
  },

  /* ---------------------------------------------------------
     INIT DASHBOARD
  --------------------------------------------------------- */
  async initDashboard() {
    const cloudUser = this.getCloudUser();

    if (!cloudUser || !cloudUser.email) {
      window.location.href = "/pages/login.html";
      return;
    }

    const store = await this.fetchJSON(
      `/api/vendor/storefront?email=${encodeURIComponent(cloudUser.email)}`
    );

    if (!store || store.error) {
      const newStore = {
        email: cloudUser.email,
        name: cloudUser.name,
        description: "",
        tags: "",
        logo: "",
        cover: "",
        products: [],
        services: [],
        workshops: [],
        app: null,
        ads: [],
        phonebook: null
      };

      this.saveStorefront(newStore);
      this.renderDashboard(newStore);
      return;
    }

    this.saveStorefront(store);
    this.renderDashboard(store);
  },

  /* ---------------------------------------------------------
     RENDER DASHBOARD
  --------------------------------------------------------- */
  renderDashboard(store) {
    const title = document.getElementById("vendorTitle");
    const welcome = document.getElementById("vendorWelcome");

    if (title) title.innerText = `Vendor Dashboard — ${store.name}`;
    if (welcome) welcome.innerText = `Welcome back, ${store.name}`;
  },

  /* ---------------------------------------------------------
     UPDATE STOREFRONT
  --------------------------------------------------------- */
  async updateStorefront(payload) {
    const cloudUser = this.getCloudUser();
    if (!cloudUser) return false;

    payload.email = cloudUser.email;

    const res = await this.postJSON("/api/vendor/storefront/update", payload);
    if (res && !res.error) {
      this.saveStorefront(res);
      return true;
    }
    return false;
  },

  /* ---------------------------------------------------------
     PRODUCTS
  --------------------------------------------------------- */
  async loadProducts() {
    const cloudUser = this.getCloudUser();
    if (!cloudUser) return;

    const products = await this.fetchJSON(
      `/api/vendor/products?email=${encodeURIComponent(cloudUser.email)}`
    );

    const list = document.getElementById("product-list");
    const publicList = document.getElementById("public-products");

    if (!list || !publicList) return;

    if (!products || products.error || !products.length) {
      list.innerHTML = `<p>No products yet.</p>`;
      publicList.innerHTML = `<p>No products yet.</p>`;
      return;
    }

    list.innerHTML = products
      .map(
        p => `
      <div class="item-row">
        <strong>${p.name}</strong> — $${p.price}<br>
        ${p.description || ""}
        <div class="item-actions">
          <button onclick="Staff.deleteProduct('${p.id}')">Delete</button>
        </div>
      </div>
    `
      )
      .join("");

    publicList.innerHTML = products
      .map(
        p => `
      <div class="item-row">
        <strong>${p.name}</strong> — $${p.price}<br>
        ${p.description || ""}
      </div>
    `
      )
      .join("");

    this._products = products;
  },

  async addProduct() {
    const cloudUser = this.getCloudUser();
    if (!cloudUser) return;

    const payload = {
      email: cloudUser.email,
      name: document.getElementById("product-name").value,
      description: document.getElementById("product-desc").value,
      price: parseFloat(document.getElementById("product-price").value || "0")
    };

    const res = await this.postJSON("/api/vendor/product/create", payload);
    if (res && !res.error) {
      await this.loadProducts();
    } else {
      alert("Error creating product");
    }
  },

  async deleteProduct(id) {
    const res = await this.postJSON("/api/vendor/product/delete", { id });
    if (res && !res.error) {
      await this.loadProducts();
    } else {
      alert("Error deleting product");
    }
  },

  /* ---------------------------------------------------------
     SERVICES
  --------------------------------------------------------- */
  async loadServices() {
    const cloudUser = this.getCloudUser();
    if (!cloudUser) return;

    const services = await this.fetchJSON(
      `/api/vendor/services?email=${encodeURIComponent(cloudUser.email)}`
    );

    const list = document.getElementById("service-list");
    const publicList = document.getElementById("public-services");

    if (!list || !publicList) return;

    if (!services || services.error || !services.length) {
      list.innerHTML = `<p>No services yet.</p>`;
      publicList.innerHTML = `<p>No services yet.</p>`;
      return;
    }

    list.innerHTML = services
      .map(
        s => `
      <div class="item-row">
        <strong>${s.name}</strong> — $${s.price}<br>
        ${s.description || ""}
        <div class="item-actions">
          <button onclick="Staff.deleteService('${s.id}')">Delete</button>
        </div>
      </div>
    `
      )
      .join("");

    publicList.innerHTML = services
      .map(
        s => `
      <div class="item-row">
        <strong>${s.name}</strong> — $${s.price}<br>
        ${s.description || ""}
      </div>
    `
      )
      .join("");

    this._services = services;
  },

  async addService() {
    const cloudUser = this.getCloudUser();
    if (!cloudUser) return;

    const payload = {
      email: cloudUser.email,
      name: document.getElementById("service-name").value,
      description: document.getElementById("service-desc").value,
      price: parseFloat(document.getElementById("service-price").value || "0")
    };

    const res = await this.postJSON("/api/vendor/service/create", payload);
    if (res && !res.error) {
      await this.loadServices();
    } else {
      alert("Error creating service");
    }
  },

  async deleteService(id) {
    const res = await this.postJSON("/api/vendor/service/delete", { id });
    if (res && !res.error) {
      await this.loadServices();
    } else {
      alert("Error deleting service");
    }
  },

  /* ---------------------------------------------------------
     WORKSHOPS
  --------------------------------------------------------- */
  async loadWorkshops() {
    const cloudUser = this.getCloudUser();
    if (!cloudUser) return;

    const workshops = await this.fetchJSON(
      `/api/vendor/workshops?email=${encodeURIComponent(cloudUser.email)}`
    );

    const list = document.getElementById("workshop-list");
    const publicList = document.getElementById("public-workshops");

    if (!list || !publicList) return;

    if (!workshops || workshops.error || !workshops.length) {
      list.innerHTML = `<p>No workshops yet.</p>`;
      publicList.innerHTML = `<p>No workshops yet.</p>`;
      return;
    }

    list.innerHTML = workshops
      .map(
        w => `
      <div class="calendar-row">
        <strong>${w.title}</strong> — $${w.price}<br>
        ${w.date} • ${w.location}<br>
        ${w.description || ""}
        <div class="item-actions">
          <button onclick="Staff.deleteWorkshop('${w.id}')">Delete</button>
        </div>
      </div>
    `
      )
      .join("");

    publicList.innerHTML = workshops
      .map(
        w => `
      <div class="calendar-row">
        <strong>${w.title}</strong> — $${w.price}<br>
        ${w.date} • ${w.location}<br>
        ${w.description || ""}
      </div>
    `
      )
      .join("");

    this._workshops = workshops;
  },

  async addWorkshop() {
    const cloudUser = this.getCloudUser();
    if (!cloudUser) return;

    const payload = {
      email: cloudUser.email,
      title: document.getElementById("workshop-title").value,
      description: document.getElementById("workshop-desc").value,
      date: document.getElementById("workshop-date").value,
      time: document.getElementById("workshop-time").value,
      location: document.getElementById("workshop-location").value,
      price: parseFloat(document.getElementById("workshop-price").value || "0"),
      maxSeats: parseInt(document.getElementById("workshop-max").value || "0")
    };

    const res = await this.postJSON("/api/vendor/workshop/create", payload);
    if (res && !res.error) {
      await this.loadWorkshops();
    } else {
      alert("Error creating workshop");
    }
  },

  async deleteWorkshop(id) {
    const res = await this.postJSON("/api/vendor/workshop/delete", { id });
    if (res && !res.error) {
      await this.loadWorkshops();
    } else {
      alert("Error deleting workshop");
    }
  },

  /* ---------------------------------------------------------
     DIGITAL APP
  --------------------------------------------------------- */
  async loadApp() {
    const cloudUser = this.getCloudUser();
    if (!cloudUser) return;

    const app = await this.fetchJSON(
      `/api/vendor/app?email=${encodeURIComponent(cloudUser.email)}`
    );

    const publicBox = document.getElementById("public-app");
    if (!publicBox) return;

    if (!app || app.error || !app.name) {
      publicBox.innerHTML = `<p>No app linked yet.</p>`;
      return;
    }

    document.getElementById("app-name").value = app.name;
    document.getElementById("app-url").value = app.url;
    document.getElementById("app-desc").value = app.description;

    publicBox.innerHTML = `
      <div class="item-row">
        <strong>${app.name}</strong><br>
        <a href="${app.url}" target="_blank">${app.url}</a><br>
        ${app.description}
      </div>
    `;
  },

  async saveApp() {
    const cloudUser = this.getCloudUser();
    if (!cloudUser) return;

    const payload = {
      email: cloudUser.email,
      name: document.getElementById("app-name").value,
      url: document.getElementById("app-url").value,
      description: document.getElementById("app-desc").value
    };

    const res = await this.postJSON("/api/vendor/app/save", payload);
    if (res && !res.error) {
      await this.loadApp();
    } else {
      alert("Error saving app");
    }
  },

  /* ---------------------------------------------------------
     ADS
  --------------------------------------------------------- */
  async loadAds() {
    const cloudUser = this.getCloudUser();
    if (!cloudUser) return;

    const ads = await this.fetchJSON(
      `/api/vendor/ads?email=${encodeURIComponent(cloudUser.email)}`
    );

    const list = document.getElementById("ads-list");
    if (!list) return;

    if (!ads || ads.error || !ads.length) {
      list.innerHTML = `<p>No ads yet.</p>`;
      return;
    }

    list.innerHTML = ads
      .map(
        a => `
      <div class="item-row">
        <strong>${a.title}</strong><br>
        ${a.copy}<br>
        Placement: ${a.placement} • Status: ${a.status}
        <div class="item-actions">
          <button onclick="Staff.deleteAd('${a.id}')">Stop</button>
        </div>
      </div>
    `
      )
      .join("");

    this._ads = ads;
  },

  async saveAd() {
    const cloudUser = this.getCloudUser();
    if (!cloudUser) return;

    const payload = {
      email: cloudUser.email,
      title: document.getElementById("ad-title").value,
      copy: document.getElementById("ad-copy").value,
      placement: document.getElementById("ad-placement").value
    };

    const res = await this.postJSON("/api/vendor/ads/create", payload);
    if (res && !res.error) {
      await this.loadAds();
    } else {
      alert("Error creating ad");
    }
  },

  async deleteAd(id) {
    const res = await this.postJSON("/api/vendor/ads/delete", { id });
    if (res && !res.error) {
      await this.loadAds();
    } else {
      alert("Error stopping ad");
    }
  },

  /* ---------------------------------------------------------
     PHONE BOOK
  --------------------------------------------------------- */
  async loadPhoneBook() {
    const cloudUser = this.getCloudUser();
    if (!cloudUser) return;

    const entry = await this.fetchJSON(
      `/api/vendor/phonebook?email=${encodeURIComponent(cloudUser.email)}`
    );

    const box = document.getElementById("phonebook-box");
    if (!box) return;

    if (!entry || entry.error || !entry.name) {
      box.innerHTML = `<p>No phone book listing.</p>`;
      return;
    }

    box.innerHTML = `
      <div class="item-row">
        <strong>${entry.name}</strong><br>
        ${entry.description}<br>
        Phone: ${entry.phone}<br>
        <a href="${entry.link}" target="_blank">${entry.link}</a>
      </div>
    `;
  },

  async savePhoneBook() {
    const cloudUser = this.getCloudUser();
    if (!cloudUser) return;

    const payload = {
      email: cloudUser.email,
      name: document.getElementById("phonebook-name").value,
      description: document.getElementById("phonebook-desc").value,
      phone: document.getElementById("phonebook-phone").value,
      link: document.getElementById("phonebook-link").value
    };

    const res = await this.postJSON("/api/vendor/phonebook/save", payload);
    if (res && !res.error) {
      await this.loadPhoneBook();
    } else {
      alert("Error saving phone book");
    }
  },

  /* ---------------------------------------------------------
     ORDERS
  --------------------------------------------------------- */
  async loadOrders() {
    const cloudUser = this.getCloudUser();
    if (!cloudUser) return;

    const orders = await this.fetchJSON(
      `/api/vendor/orders?email=${encodeURIComponent(cloudUser.email)}`
    );

    const list = document.getElementById("order-list");
    if (!list) return;

    if (!orders || orders.error || !orders.length) {
      list.innerHTML = `<p>No orders yet.</p>`;
      return;
    }

    list.innerHTML = orders
      .map(
        o => `
      <div class="order">
        <strong>${o.itemName}</strong> — $${o.amount}<br>
        Buyer: ${o.buyerName} (${o.buyerEmail})<br>
        Status: ${o.paymentStatus}<br>
        Created: ${o.createdAt}
      </div>
    `
      )
      .join("");
  },

  /* ---------------------------------------------------------
     PAYOUTS
  --------------------------------------------------------- */
  async loadPayouts() {
    const cloudUser = this.getCloudUser();
    if (!cloudUser) return;

    const payouts = await this.fetchJSON(
      `/api/vendor/payouts?email=${encodeURIComponent(cloudUser.email)}`
    );

    const list = document.getElementById("payout-list");
    if (!list) return;

    if (!payouts || payouts.error || !payouts.length) {
      list.innerHTML = `<p>No payouts yet.</p>`;
      return;
    }

    list.innerHTML = payouts
      .map(
        p => `
      <div class="payout">
        <strong>$${p.amount}</strong><br>
        Status: ${p.status}<br>
        Created: ${p.createdAt}
      </div>
    `
      )
      .join("");
  },

  /* ---------------------------------------------------------
     NAVIGATION
  --------------------------------------------------------- */
  go(page) {
    window.location.href = `/network/staff/pages/${page}`;
  },

  previewPage() {
    const cloudUser = this.getCloudUser();
    if (!cloudUser) return;
    window.location.href = `/network/public/pages/vendor.html?id=${encodeURIComponent(cloudUser.email)}`;
  },

  /* ---------------------------------------------------------
     FETCH / POST HELPERS
  --------------------------------------------------------- */
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
      return await res.json
