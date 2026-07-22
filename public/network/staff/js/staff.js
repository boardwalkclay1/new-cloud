// /network/staff/js/staff.js
// FINAL — multi-business aware, safe, matches vendor.js usage

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

  saveCloudUser(user) {
    localStorage.setItem(this.cloudKey, JSON.stringify(user));
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

    const emailParam = encodeURIComponent(cloudUser.email);

    const store = await this.safeGET(`/api/vendor/storefront?email=${emailParam}`);

    const storefront = {
      email: cloudUser.email,
      name: cloudUser.name,

      vendorId: store.vendorId || null,

      description: store.description || "",
      tags: store.tags || "",
      logo: store.logo || "",
      cover: store.cover || "",
      products: store.products || [],
      services: store.services || [],
      workshops: store.workshops || [],
      apps: store.apps || [],

      ads: store.ads || [],
      phonebook: store.phonebook || null,
      published: store.published || false,

      earnings: store.earnings || {
        today: 0, week: 0, month: 0, total: 0
      },

      payout: store.payout || {
        connected: false,
        method: null,
        email: null,
        venmo: false
      },

      orders: store.orders || [],
      messages: store.messages || [],

      stats: store.stats || {
        revenue: 0,
        ordersCount: 0,
        activeProducts: 0,
        openOrders: 0,
        newMessages: 0
      }
    };

    this.saveStorefront(storefront);

    if (window.Vendor && typeof window.Vendor.init === "function") {
      window.Vendor.init(storefront, cloudUser);
    }
  },

  /* ---------------------------------------------------------
     SAFE GET
  --------------------------------------------------------- */
  async safeGET(url) {
    try {
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) return {};
      const data = await res.json().catch(() => ({}));
      return data || {};
    } catch (e) {
      console.error("safeGET error", e);
      return {};
    }
  },

  /* ---------------------------------------------------------
     SAFE POST
  --------------------------------------------------------- */
  async safePOST(url, body) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body)
      });

      if (!res.ok) return {};
      const data = await res.json().catch(() => ({}));
      return data || {};
    } catch (e) {
      console.error("safePOST error", e);
      return {};
    }
  },

  /* ---------------------------------------------------------
     CLOUD MESSAGING
  --------------------------------------------------------- */
  message(email) {
    window.location.href = `/pages/messages/index.html?to=${encodeURIComponent(email)}`;
  },

  /* ---------------------------------------------------------
     NAVIGATION
  --------------------------------------------------------- */
  go(page) {
    window.location.href = `/network/staff/pages/${page}`;
  },

  previewPage() {
    const storefront = this.getStorefront();
    const id = storefront?.vendorId || storefront?.email;
    if (!id) return;
    window.location.href = `/network/pages/vendor.html?id=${encodeURIComponent(id)}`;
  },

  logout() {
    localStorage.removeItem(this.cloudKey);
    localStorage.removeItem(this.storeKey);
    window.location.href = "/pages/login.html";
  }
};

/* ============================================================
   EXPORTS
============================================================ */

export async function staffGetProducts() {
  const user = Staff.getCloudUser();
  if (!user) return [];
  const data = await Staff.safeGET(`/api/vendor/products?email=${encodeURIComponent(user.email)}`);
  return Array.isArray(data) ? data : [];
}

export async function staffUpdateProduct(id, data) {
  return await Staff.safePOST(`/api/vendor/products/update`, { id, ...data });
}

export async function staffToggleVisibility(id) {
  return await Staff.safePOST(`/api/vendor/products/toggle`, { id });
}

export async function staffGetOrders() {
  const user = Staff.getCloudUser();
  if (!user) return [];
  const data = await Staff.safeGET(`/api/vendor/orders?email=${encodeURIComponent(user.email)}`);
  return Array.isArray(data) ? data : [];
}

export async function staffGetMessages() {
  const user = Staff.getCloudUser();
  if (!user) return [];
  const data = await Staff.safeGET(`/api/vendor/messages?email=${encodeURIComponent(user.email)}`);
  return Array.isArray(data) ? data : [];
}

export async function staffGetTodayStats() {
  const user = Staff.getCloudUser();
  if (!user) {
    return {
      revenue: 0,
      ordersCount: 0,
      activeProducts: 0,
      openOrders: 0,
      newMessages: 0
    };
  }

  const stats = await Staff.safeGET(`/api/vendor/stats/today?email=${encodeURIComponent(user.email)}`);

  return {
    revenue: stats.revenue || 0,
    ordersCount: stats.ordersCount || 0,
    activeProducts: stats.activeProducts || 0,
    openOrders: stats.openOrders || 0,
    newMessages: stats.newMessages || 0
  };
}

export default Staff;
