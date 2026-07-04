// public/js/network-api.js

const API = "https://api.beltlinecloud.com/api/network";

const Network = {

  /* ---------------------------------------------------------
     TOKEN
  --------------------------------------------------------- */
  token() {
    return localStorage.getItem("networkToken") || "";
  },

  /* ---------------------------------------------------------
     API WRAPPER — PUBLIC + PRIVATE ROUTES
  --------------------------------------------------------- */
  async api(path, options = {}) {
    try {
      const headers = { "Content-Type": "application/json" };

      // PUBLIC ROUTES (no auth)
      const isPublic =
        path.startsWith("/products") ||
        path.startsWith("/services") ||
        path.startsWith("/workshops") ||
        path.startsWith("/apps") ||
        path.startsWith("/vendors");

      if (!isPublic) {
        headers["Authorization"] = this.token();
      }

      const res = await fetch(API + path, {
        headers,
        ...options
      });

      const text = await res.text();
      try {
        return JSON.parse(text);
      } catch {
        console.error("Invalid JSON from API:", text);
        return { error: "Invalid JSON response" };
      }
    } catch (err) {
      console.error("API error:", err);
      return { error: "Network error" };
    }
  },

  /* ---------------------------------------------------------
     HOME PAGE — LOAD ALL FEEDS
  --------------------------------------------------------- */
  async loadHomeFeeds() {
    this.loadProductsFeed();
    this.loadServicesFeed();
    this.loadWorkshopsFeed();
    this.loadAppsFeed();
  },

  /* ---------------------------------------------------------
     PRODUCTS FEED
  --------------------------------------------------------- */
  async loadProductsFeed() {
    const feed = document.getElementById("products-feed");
    if (!feed) return;

    const products = await this.api("/products");
    const list = Array.isArray(products) ? products : [];

    feed.innerHTML = list.map(p => `
      <div class="feed-item" onclick="Network.goProduct('${p.id}')">
        <div class="feed-title">${p.name}</div>
        <div class="feed-meta">${p.vendorName || ''}</div>
      </div>
    `).join("");
  },

  /* ---------------------------------------------------------
     SERVICES FEED
  --------------------------------------------------------- */
  async loadServicesFeed() {
    const feed = document.getElementById("services-feed");
    if (!feed) return;

    const services = await this.api("/services");
    const list = Array.isArray(services) ? services : [];

    feed.innerHTML = list.map(s => `
      <div class="feed-item" onclick="Network.goService('${s.id}')">
        <div class="feed-title">${s.name}</div>
        <div class="feed-meta">${s.vendorName || ''}</div>
      </div>
    `).join("");
  },

  /* ---------------------------------------------------------
     WORKSHOPS FEED
  --------------------------------------------------------- */
  async loadWorkshopsFeed() {
    const feed = document.getElementById("workshops-feed");
    if (!feed) return;

    const workshops = await this.api("/workshops");
    const list = Array.isArray(workshops) ? workshops : [];

    feed.innerHTML = list.map(w => `
      <div class="feed-item" onclick="Network.goWorkshop('${w.id}')">
        <div class="feed-title">${w.title}</div>
        <div class="feed-meta">Host: ${w.hostName || ''}</div>
      </div>
    `).join("");
  },

  /* ---------------------------------------------------------
     APPS FEED
  --------------------------------------------------------- */
  async loadAppsFeed() {
    const feed = document.getElementById("apps-feed");
    if (!feed) return;

    const apps = await this.api("/apps");
    const list = Array.isArray(apps) ? apps : [];

    feed.innerHTML = list.map(a => `
      <div class="feed-item" onclick="Network.goApp('${a.id}', '${a.external || ""}')">
        <div class="feed-title">${a.name}</div>
        <div class="feed-meta">${a.vendorName || ''}</div>
      </div>
    `).join("");
  },

  /* ---------------------------------------------------------
     NAVIGATION HELPERS
  --------------------------------------------------------- */
  goProduct(id) {
    window.location.href = `/network/public/pages/product.html?id=${encodeURIComponent(id)}`;
  },

  goService(id) {
    window.location.href = `/network/public/pages/service.html?id=${encodeURIComponent(id)}`;
  },

  goWorkshop(id) {
    window.location.href = `/network/public/pages/workshop.html?id=${encodeURIComponent(id)}`;
  },

  goApp(id, external = "") {
    if (external) {
      window.open(external, "_blank");
      return;
    }
    window.location.href = `/network/public/pages/app.html?id=${encodeURIComponent(id)}`;
  },

  /* ---------------------------------------------------------
     CLOUD USER CONNECTION
  --------------------------------------------------------- */
  async requireCloudUser() {
    const raw = localStorage.getItem("beltline_user");
    if (!raw) {
      alert("Please log in to your Cloud account.");
      window.location.href = "/pages/profile/login.html";
      return null;
    }
    return JSON.parse(raw);
  },

  /* ---------------------------------------------------------
     PURCHASE PRODUCT
  --------------------------------------------------------- */
  async purchase(productId) {
    const user = await this.requireCloudUser();
    if (!user) return;

    const res = await this.api("/checkout/create", {
      method: "POST",
      body: JSON.stringify({
        vendorId: user.id,
        itemType: "product",
        itemId: productId,
        quantity: 1
      })
    });

    if (res.error) {
      alert("Payment failed.");
      return;
    }

    window.location.href = res.redirectUrl;
  },

  /* ---------------------------------------------------------
     BOOK WORKSHOP
  --------------------------------------------------------- */
  async bookWorkshop(workshopId) {
    const user = await this.requireCloudUser();
    if (!user) return;

    const res = await this.api("/checkout/create", {
      method: "POST",
      body: JSON.stringify({
        vendorId: user.id,
        itemType: "workshop",
        itemId: workshopId,
        quantity: 1
      })
    });

    if (res.error) {
      alert("Booking failed.");
      return;
    }

    window.location.href = res.redirectUrl;
  }
};

window.addEventListener("DOMContentLoaded", () => {
  Network.loadHomeFeeds();
});
