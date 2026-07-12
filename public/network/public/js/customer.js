// /network/js/customer.js
// PUBLIC CUSTOMER ENGINE — Cloud user + vendor interaction + orders + messages + directions

const Customer = {
  cloudKey: "cloud_user",

  getCloudUser() {
    const raw = localStorage.getItem(this.cloudKey);
    return raw ? JSON.parse(raw) : null;
  },

  saveCloudUser(user) {
    localStorage.setItem(this.cloudKey, JSON.stringify(user));
  },

  async fetchJSON(url) {
    try {
      const res = await fetch(url, { credentials: "include" });
      return await res.json();
    } catch (e) {
      console.error("customer fetchJSON error", e);
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
      console.error("customer postJSON error", e);
      return null;
    }
  },

  async loadProductsFeed(targetId = "products-feed") {
    const el = document.getElementById(targetId);
    if (!el) return;

    const data = await this.fetchJSON("/api/network/products");
    el.innerHTML = "";

    (data || []).forEach(p => {
      const card = document.createElement("div");
      card.className = "feed-card";
      card.onclick = () => this.openProduct(p);

      card.innerHTML = `
        <div class="feed-pill">${p.vendorName || "Vendor"}</div>
        <div class="feed-title">${p.name}</div>
        <div class="feed-meta">${p.description || ""}</div>
        <div class="feed-price">$${p.price}</div>
      `;

      el.appendChild(card);
    });
  },

  async loadServicesFeed(targetId = "services-feed") {
    const el = document.getElementById(targetId);
    if (!el) return;

    const data = await this.fetchJSON("/api/network/services");
    el.innerHTML = "";

    (data || []).forEach(s => {
      const card = document.createElement("div");
      card.className = "feed-card";
      card.onclick = () => this.openService(s);

      card.innerHTML = `
        <div class="feed-pill">${s.vendorName || "Vendor"}</div>
        <div class="feed-title">${s.name}</div>
        <div class="feed-meta">${s.description || ""}</div>
        <div class="feed-price">$${s.price}</div>
      `;

      el.appendChild(card);
    });
  },

  async loadWorkshopsFeed(targetId = "workshops-feed") {
    const el = document.getElementById(targetId);
    if (!el) return;

    const data = await this.fetchJSON("/api/network/workshops");
    el.innerHTML = "";

    (data || []).forEach(w => {
      const card = document.createElement("div");
      card.className = "feed-card";
      card.onclick = () => this.openWorkshop(w);

      card.innerHTML = `
        <div class="feed-pill">${w.vendorName || "Host"}</div>
        <div class="feed-title">${w.name}</div>
        <div class="feed-meta">${w.description || ""}</div>
        <div class="feed-price">$${w.price}</div>
      `;

      el.appendChild(card);
    });
  },

  async loadAppsFeed(targetId = "apps-feed") {
    const el = document.getElementById(targetId);
    if (!el) return;

    const data = await this.fetchJSON("/api/network/apps");
    el.innerHTML = "";

    (data || []).forEach(a => {
      const card = document.createElement("div");
      card.className = "feed-card";
      card.onclick = () => this.openApp(a);

      card.innerHTML = `
        <div class="feed-pill">${a.vendorName || "Creator"}</div>
        <div class="feed-title">${a.name}</div>
        <div class="feed-meta">${a.description || ""}</div>
        <div class="feed-price">${a.price ? "$" + a.price : "Free"}</div>
      `;

      el.appendChild(card);
    });
  },

  async loadVendorStrips(targets = {}) {
    const {
      productsTarget = "vendors-feed-products",
      servicesTarget = "vendors-feed-services",
      workshopsTarget = "vendors-feed-workshops",
      appsTarget = "vendors-feed-apps"
    } = targets;

    const vendors = await this.fetchJSON("/api/network/vendors");
    const list = vendors || [];

    this.renderVendorStrip(list.filter(v => v.hasProducts), productsTarget);
    this.renderVendorStrip(list.filter(v => v.hasServices), servicesTarget);
    this.renderVendorStrip(list.filter(v => v.hasWorkshops), workshopsTarget);
    this.renderVendorStrip(list.filter(v => v.hasApps), appsTarget);
  },

  renderVendorStrip(vendors, targetId) {
    const el = document.getElementById(targetId);
    if (!el) return;
    el.innerHTML = "";

    vendors.forEach(v => {
      const card = document.createElement("div");
      card.className = "vendor-card";
      card.onclick = () => this.openVendor(v);

      card.innerHTML = `
        <div class="vendor-name">${v.name || v.email}</div>
        <div class="vendor-tags">${v.tags || "Beltline vendor"}</div>
      `;

      el.appendChild(card);
    });
  },

  openVendor(vendor) {
    window.location.href = `/network/pages/vendor.html?id=${encodeURIComponent(vendor.id || vendor.email)}`;
  },

  openProduct(product) {
    window.location.href = `/network/pages/product.html?id=${encodeURIComponent(product.id)}`;
  },

  openService(service) {
    window.location.href = `/network/pages/service.html?id=${encodeURIComponent(service.id)}`;
  },

  openWorkshop(workshop) {
    window.location.href = `/network/pages/workshop.html?id=${encodeURIComponent(workshop.id)}`;
  },

  openApp(app) {
    window.location.href = `/network/pages/app.html?id=${encodeURIComponent(app.id)}`;
  },

  messageVendor(vendorEmail) {
    window.location.href = `/pages/messages/index.html?to=${encodeURIComponent(vendorEmail)}`;
  },

  async getDirectionsToVendor(vendor) {
    const destLat = vendor.lat;
    const destLng = vendor.lng;
    if (!destLat || !destLng) return;

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(pos => {
        const sLat = pos.coords.latitude;
        const sLng = pos.coords.longitude;
        const url = `https://www.google.com/maps/dir/${sLat},${sLng}/${destLat},${destLng}`;
        window.open(url, "_blank");
      }, () => {
        const url = `https://www.google.com/maps/search/?api=1&query=${destLat},${destLng}`;
        window.open(url, "_blank");
      });
    } else {
      const url = `https://www.google.com/maps/search/?api=1&query=${destLat},${destLng}`;
      window.open(url, "_blank");
    }
  },

  async purchaseItem(item) {
    const user = this.getCloudUser();
    if (!user) {
      window.location.href = "/pages/login.html";
      return;
    }

    const payload = {
      buyerEmail: user.email,
      itemId: item.id,
      type: item.type || "product",
      quantity: 1
    };

    const res = await this.postJSON("/api/network/checkout", payload);
    if (res && res.orderId) {
      window.location.href = `/network/pages/order.html?id=${encodeURIComponent(res.orderId)}`;
    }
  },

  startRealtimeFeeds(intervalMs = 15000) {
    this.loadProductsFeed();
    this.loadServicesFeed();
    this.loadWorkshopsFeed();
    this.loadAppsFeed();
    this.loadVendorStrips();

    setInterval(() => {
      this.loadProductsFeed();
      this.loadServicesFeed();
      this.loadWorkshopsFeed();
      this.loadAppsFeed();
      this.loadVendorStrips();
    }, intervalMs);
  },

  initHeroUser() {
    const heroUser = document.getElementById("heroUser");
    if (!heroUser) return;
    const cloudUser = this.getCloudUser();
    if (cloudUser && cloudUser.email) {
      heroUser.innerHTML = `
        Signed in as <span>${cloudUser.name || cloudUser.email}</span><br>
        Cloud user • ${cloudUser.email}
      `;
    } else {
      heroUser.innerHTML = `Browse publicly. Sign in to manage your storefront and rider routes.`;
    }
  },

  init() {
    this.initHeroUser();
    this.startRealtimeFeeds();
  }
};

Customer.init();

export default Customer;
