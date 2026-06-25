// public/js/network.js

const Network = {
  // -----------------------------
  // AUTH TOKEN
  // -----------------------------
  token() {
    return localStorage.getItem("networkToken") || "";
  },

  // -----------------------------
  // GENERIC API WRAPPER
  // -----------------------------
  async api(path, options = {}) {
    try {
      const res = await fetch(path, {
        headers: {
          "Content-Type": "application/json",
          "Authorization": this.token()
        },
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

  // -----------------------------
  // HOMEPAGE FEEDS
  // -----------------------------
  async loadHomeFeeds() {
    this.loadHomeVendors();
    this.loadHomeProducts();
    this.loadHomeServices();
  },

  // HOME VENDORS FEED
  async loadHomeVendors() {
    const feed = document.getElementById("vendors-feed");
    if (!feed) return;

    const vendors = await this.api("/api/network/vendors");
    const list = Array.isArray(vendors) ? vendors : [];

    feed.innerHTML = list.slice(0, 6).map(v => `
      <div class="feed-card" onclick="Network.goVendor('${v.id}')">
        <img src="${v.photoUrl || '/network/public/img/default-vendor.jpg'}" class="feed-photo">
        <div class="feed-title">${v.name}</div>
        <div class="feed-sub">${v.tags || ''}</div>
      </div>
    `).join("");
  },

  // HOME PRODUCTS FEED (with starter items)
  async loadHomeProducts() {
    const feed = document.getElementById("products-feed");
    if (!feed) return;

    const products = await this.api("/api/network/products");
    const list = Array.isArray(products) ? products : [];

    const starter = [
      {
        id: "laundry-bubbles",
        name: "Laundry Bubbles",
        price: 25,
        description: "Door-to-door laundry, shoes, and sewing — powered by Beltline Cloud.",
        photoUrl: "/assets/img/laundry-bubbles.jpg",
        external: "https://laundry-bubbles.pages.dev/"
      },
      {
        id: "go-time-software",
        name: "Go Time Software",
        price: 0,
        description: "Cinematic dashboards, course systems, and Beltline‑grade software.",
        photoUrl: "/assets/img/go-time-logo.jpg",
        external: "https://go-time.pages.dev/"
      }
    ];

    const combined = [...starter, ...list];

    feed.innerHTML = combined.slice(0, 8).map(p => `
      <div class="feed-card" onclick="Network.goProduct('${p.id}', '${p.external || ""}')">
        <img src="${p.photoUrl || '/network/public/img/default-product.jpg'}" class="feed-photo">
        <div class="feed-title">${p.name}</div>
        <div class="feed-sub">
          ${p.description || ''}<br>
          ${p.price ? `$${p.price}` : ''}
        </div>
      </div>
    `).join("");
  },

  // HOME SERVICES FEED (with Fast Roll starter)
  async loadHomeServices() {
    const feed = document.getElementById("services-feed");
    if (!feed) return;

    const services = await this.api("/api/network/services");
    let list = Array.isArray(services) ? services : [];

    const starter = [
      {
        id: "fast-roll-delivery",
        name: "Fast Roll Delivery",
        price: 9,
        description: "One‑tap Beltline delivery for any product on The Network.",
        photoUrl: "/assets/img/Fast-logo.png",
        external: "https://fast-roll.pages.dev/"
      }
    ];

    list = [...starter, ...list];

    feed.innerHTML = list.slice(0, 8).map(s => `
      <div class="feed-card" onclick="Network.goService('${s.id}', '${s.external || ""}')">
        <img src="${s.photoUrl || '/network/public/img/default-service.jpg'}" class="feed-photo">
        <div class="feed-title">${s.name}</div>
        <div class="feed-sub">
          ${s.description || ''}<br>
          ${s.price ? `$${s.price}` : ''}
        </div>
      </div>
    `).join("");
  },

  // -----------------------------
  // EXPLORE PAGE
  // -----------------------------
  async loadExplore() {
    const grid = document.getElementById("explore-grid");
    if (!grid) return;

    const data = await this.api("/api/network/explore");
    if (!Array.isArray(data)) return;

    grid.innerHTML = data.map(item => `
      <div class="card">
        <h2>${item.title}</h2>
        <p>${item.description}</p>
      </div>
    `).join("");
  },

  // -----------------------------
  // VENDORS LIST PAGE
  // -----------------------------
  async loadVendors() {
    const grid = document.getElementById("vendors-grid");
    if (!grid) return;

    const vendors = await this.api("/api/network/vendors");
    if (!Array.isArray(vendors)) return;

    // Keep existing signup card (first child), append vendors after
    const signupCard = grid.querySelector(".signup-card");
    grid.innerHTML = "";
    if (signupCard) grid.appendChild(signupCard);

    const html = vendors.map(v => {
      return `
        <div class="card" onclick="Network.goVendor('${v.id}')">
          <h2>${v.name}</h2>
          <p>${v.categories || ''}</p>
          <p>${v.bio || ''}</p>
        </div>
      `;
    }).join("");

    grid.insertAdjacentHTML("beforeend", html);
  },

  goVendor(id) {
    window.location.href = `vendor.html?id=${encodeURIComponent(id)}`;
  },

  // -----------------------------
  // SINGLE VENDOR PAGE
  // -----------------------------
  async loadVendor() {
    const container = document.getElementById("vendor-container");
    if (!container) return;

    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");
    if (!id) {
      container.innerHTML = "<p>No vendor selected.</p>";
      return;
    }

    const data = await this.api(`/api/network/vendor?id=${encodeURIComponent(id)}`);
    if (!data || data.error) {
      container.innerHTML = "<p>Vendor not found.</p>";
      return;
    }

    const vendor = data.vendor || {};
    const products = data.products || [];
    const workshops = data.workshops || [];
    const services = data.services || [];

    container.innerHTML = `
      <div class="vendor-header">
        <div class="vendor-photo" style="background-image:url('${vendor.photoUrl || ""}');"></div>
        <div class="vendor-info">
          <h2>${vendor.name}</h2>
          <p>${vendor.bio || ""}</p>
        </div>
      </div>

      <div class="section-title">Products</div>
      <div class="items-grid">
        ${products.map(p => `
          <div class="item-card">
            <h3>${p.name}</h3>
            <p>$${p.price}</p>
            <p>${p.description || ""}</p>
            <button onclick="Network.purchase('${vendor.id}','${p.id}')">Order with Fast Roll</button>
          </div>
        `).join("")}
      </div>

      <div class="section-title">Workshops</div>
      <div class="items-grid">
        ${workshops.map(w => `
          <div class="item-card">
            <h3>${w.title}</h3>
            <p>${w.schedule}</p>
            <button onclick="Network.bookWorkshop('${vendor.id}','${w.id}')">Book</button>
          </div>
        `).join("")}
      </div>

      <div class="section-title">Services</div>
      <div class="items-grid">
        ${services.map(s => `
          <div class="item-card">
            <h3>${s.name}</h3>
            <p>$${s.price}</p>
            <p>${s.description || ""}</p>
            <button onclick="Network.goService('${s.id}')">View</button>
          </div>
        `).join("")}
      </div>
    `;
  },

  // -----------------------------
  // WORKSHOPS LIST PAGE
  // -----------------------------
  async loadWorkshops() {
    const grid = document.getElementById("workshops-grid");
    if (!grid) return;

    const workshops = await this.api("/api/network/workshops");
    if (!Array.isArray(workshops)) return;

    grid.innerHTML = workshops.map(w => `
      <div class="card">
        <h2>${w.title}</h2>
        <p>Host: ${w.hostName}</p>
        <p>${w.schedule}</p>
      </div>
    `).join("");
  },

  // -----------------------------
  // PROFILE PAGE (NETWORK USER)
  // -----------------------------
  async loadProfile() {
    const nameEl = document.getElementById("profile-name");
    if (!nameEl) return;

    const profile = await this.api("/api/network/me");
    if (!profile || profile.error) return;

    nameEl.value = profile.name || "";
    document.getElementById("profile-photo").value = profile.photoUrl || "";
    document.getElementById("profile-bio").value = profile.bio || "";
  },

  async saveProfile() {
    const body = {
      name: document.getElementById("profile-name").value,
      photoUrl: document.getElementById("profile-photo").value,
      bio: document.getElementById("profile-bio").value
    };

    await this.api("/api/network/profile/update", {
      method: "POST",
      body: JSON.stringify(body)
    });

    alert("Profile saved");
  },

  // -----------------------------
  // AUTH (LOGIN / SIGNUP)
  // -----------------------------
  async login() {
    const email = document.getElementById("login-email").value;
    const password = document.getElementById("login-password").value;

    const res = await this.api("/api/network/login", {
      method: "POST",
      body: JSON.stringify({ email, password })
    });

    if (res.success) {
      localStorage.setItem("networkToken", res.token);
      window.location.href = "profile.html";
    } else {
      alert("Login failed");
    }
  },

  async signup() {
    const email = document.getElementById("signup-email").value;
    const password = document.getElementById("signup-password").value;
    const name = document.getElementById("signup-name").value;

    const res = await this.api("/api/network/signup", {
      method: "POST",
      body: JSON.stringify({ email, password, name })
    });

    if (res.success) {
      localStorage.setItem("networkToken", res.token);
      window.location.href = "profile.html";
    } else {
      alert("Sign up failed");
    }
  },

  // -----------------------------
  // PURCHASE + FAST ROLL
  // -----------------------------
  async purchase(vendorId, productId) {
    // Call your Worker to create an order, then send to Fast Roll
    const res = await this.api("/api/network/pay", {
      method: "POST",
      body: JSON.stringify({ vendorId, productId })
    });

    if (res.error) {
      alert("Could not start order.");
      return;
    }

    // Fast Roll: one‑tap delivery
    const fastUrl = `https://fast-roll.pages.dev/?orderId=${encodeURIComponent(res.orderId)}`;
    window.open(fastUrl, "_blank");
  },

  async bookWorkshop(vendorId, workshopId) {
    alert(`Workshop booking for vendor ${vendorId}, workshop ${workshopId}.`);
  },

  // -----------------------------
  // NAV HELPERS
  // -----------------------------
  goService(id, external = "") {
    if (external) {
      window.open(external, "_blank");
      return;
    }
    window.location.href = `service.html?id=${encodeURIComponent(id)}`;
  },

  goProduct(id, external = "") {
    if (external) {
      window.open(external, "_blank");
      return;
    }
    window.location.href = `product.html?id=${encodeURIComponent(id)}`;
  }
};

// Auto-init for homepage feeds
window.addEventListener("DOMContentLoaded", () => {
  Network.loadHomeFeeds();
});
