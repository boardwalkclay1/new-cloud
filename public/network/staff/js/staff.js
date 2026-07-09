// /network/staff/js/staff.js
// MINIMAL STAFF WRAPPER — CLOUD USER + STOREFRONT + EARNINGS + PAYPAL + NAVIGATION

const Staff = {
  cloudKey: "cloud_user",
  storeKey: "vendor_storefront",

  getCloudUser() {
    const raw = localStorage.getItem(this.cloudKey);
    return raw ? JSON.parse(raw) : null;
  },

  saveCloudUser(user) {
    localStorage.setItem(this.cloudKey, JSON.stringify(user));
  },

  getStorefront() {
    const raw = localStorage.getItem(this.storeKey);
    return raw ? JSON.parse(raw) : null;
  },

  saveStorefront(data) {
    localStorage.setItem(this.storeKey, JSON.stringify(data));
  },

  async initDashboard() {
    const cloudUser = this.getCloudUser();
    if (!cloudUser || !cloudUser.email) {
      window.location.href = "/pages/login.html";
      return;
    }

    // Load storefront
    const store = await this.fetchJSON(
      `/api/vendor/storefront?email=${encodeURIComponent(cloudUser.email)}`
    );

    // Load earnings
    const earnings = await this.fetchJSON(
      `/api/vendor/earnings?email=${encodeURIComponent(cloudUser.email)}`
    );

    // Load PayPal connection status
    const paypal = await this.fetchJSON(
      `/api/vendor/paypal/status?email=${encodeURIComponent(cloudUser.email)}`
    );

    const storefront = {
      email: cloudUser.email,
      name: cloudUser.name,
      description: store?.description || "",
      tags: store?.tags || "",
      logo: store?.logo || "",
      cover: store?.cover || "",
      products: store?.products || [],
      services: store?.services || [],
      workshops: store?.workshops || [],
      apps: store?.apps || [],
      ads: store?.ads || [],
      phonebook: store?.phonebook || null,
      published: store?.published || false,

      earnings: earnings?.error ? {
        today: 0,
        week: 0,
        month: 0,
        total: 0
      } : earnings,

      paypal: paypal?.error ? {
        connected: false,
        email: null,
        venmo: false
      } : paypal
    };

    this.saveStorefront(storefront);

    // Hand off to vendor.js
    if (window.Vendor) {
      Vendor.init(storefront, cloudUser);
    }
  },

  go(page) {
    window.location.href = `/network/staff/pages/${page}`;
  },

  previewPage() {
    const cloudUser = this.getCloudUser();
    if (!cloudUser) return;
    window.location.href = `/network/public/pages/vendor.html?id=${encodeURIComponent(cloudUser.email)}`;
  },

  logout() {
    localStorage.removeItem(this.cloudKey);
    localStorage.removeItem(this.storeKey);
    window.location.href = "/pages/login.html";
  },

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
