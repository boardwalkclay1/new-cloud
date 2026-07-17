// /network/staff/js/staff.js
// FINAL STAFF WRAPPER — MATCHES work-network.js EXACTLY

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

    const emailParam = encodeURIComponent(cloudUser.email);

    // FIRST: resolve vendorId from email
    const store = await this.fetchJSON(`/api/vendor/storefront?email=${emailParam}`);

    if (!store || store.error) {
      console.warn("Vendor not found for this user.");
      return;
    }

    const vendorId = store.vendorId;

    // SECOND: load everything using vendorId
    const earnings  = await this.fetchJSON(`/api/vendor/earnings?email=${emailParam}`);
    const payout    = await this.fetchJSON(`/api/vendor/payout/status?email=${emailParam}`);
    const ads       = await this.fetchJSON(`/api/vendor/ads?email=${emailParam}`);
    const phonebook = await this.fetchJSON(`/api/vendor/phonebook?email=${emailParam}`);
    const orders    = await this.fetchJSON(`/api/vendor/orders?email=${emailParam}`);
    const messages  = await this.fetchJSON(`/api/vendor/messages?email=${emailParam}`);
    const stats     = await this.fetchJSON(`/api/vendor/stats/today?email=${emailParam}`);

    const storefront = {
      email: cloudUser.email,
      name: cloudUser.name,
      vendorId,

      description: store.description || "",
      tags: store.tags || "",
      logo: store.logo || "",
      cover: store.cover || "",
      products: store.products || [],
      services: store.services || [],
      workshops: store.workshops || [],
      apps: store.apps || [],

      ads: ads || [],
      phonebook: phonebook || null,
      published: store.published || false,

      earnings: earnings || {
        today: 0, week: 0, month: 0, total: 0
      },

      payout: payout || {
        connected: false,
        method: null,
        email: null,
        venmo: false
      },

      orders: orders || [],
      messages: messages || [],

      stats: stats || {
        revenue: 0,
        ordersCount: 0,
        activeProducts: 0,
        openOrders: 0,
        newMessages: 0
      }
    };

    this.saveStorefront(storefront);

    if (window.Vendor) {
      Vendor.init(storefront, cloudUser);
    }
  },

  message(email) {
    window.location.href = `/pages/messages/index.html?to=${encodeURIComponent(email)}`;
  },

  go(page) {
    window.location.href = `/network/staff/pages/${page}`;
  },

  previewPage() {
    const storefront = this.getStorefront();
    const id = storefront?.vendorId;
    if (!id) return;
    window.location.href = `/network/pages/vendor.html?id=${encodeURIComponent(id)}`;
  },

  logout() {
    localStorage.removeItem(this.cloudKey);
    localStorage.removeItem(this.storeKey);
    window.location.href = "/pages/login.html";
  },

  async fetchJSON(url) {
    try {
      const res = await fetch(url, { credentials: "include" });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data) return { error: true };
      return data;
    } catch (e) {
      console.error("fetchJSON error", e);
      return { error: true };
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
      const data = await res.json().catch(() => null);
      if (!res.ok || !data) return { error: true };
      return data;
    } catch (e) {
      console.error("postJSON error", e);
      return { error: true };
    }
  }
};

/* ============================================================
   EXPORTS — MATCH work-network.js EXACTLY
============================================================ */

export async function staffGetProducts() {
  const user = Staff.getCloudUser();
  if (!user) return [];
  return await Staff.fetchJSON(`/api/vendor/products?email=${encodeURIComponent(user.email)}`);
}

export async function staffUpdateProduct(id, data) {
  return await Staff.postJSON(`/api/vendor/products/update`, { id, ...data });
}

export async function staffToggleVisibility(id) {
  return await Staff.postJSON(`/api/vendor/products/toggle`, { id });
}

export async function staffGetOrders() {
  const user = Staff.getCloudUser();
  if (!user) return [];
  return await Staff.fetchJSON(`/api/vendor/orders?email=${encodeURIComponent(user.email)}`);
}

export async function staffGetMessages() {
  const user = Staff.getCloudUser();
  if (!user) return [];
  return await Staff.fetchJSON(`/api/vendor/messages?email=${encodeURIComponent(user.email)}`);
}

export async function staffGetTodayStats() {
  const user = Staff.getCloudUser();
  if (!user) return {
    revenue: 0, ordersCount: 0, activeProducts: 0, openOrders: 0, newMessages: 0
  };

  const stats = await Staff.fetchJSON(`/api/vendor/stats/today?email=${encodeURIComponent(user.email)}`);
  return stats.error ? {
    revenue: 0, ordersCount: 0, activeProducts: 0, openOrders: 0, newMessages: 0
  } : stats;
}

export default Staff;
