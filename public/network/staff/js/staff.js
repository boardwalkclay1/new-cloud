// /network/staff/js/staff.js
// FINAL STAFF WRAPPER — CLOUD USER + FULL VENDOR LOADERS + EXPORTS (SAFE)

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
     Loads EVERYTHING → hands off to Vendor.init()
  --------------------------------------------------------- */
  async initDashboard() {
    const cloudUser = this.getCloudUser();
    if (!cloudUser || !cloudUser.email) {
      window.location.href = "/pages/login.html";
      return;
    }

    const emailParam = encodeURIComponent(cloudUser.email);

    // ALL vendor API calls
    const store     = await this.fetchJSON(`/api/vendor/storefront?email=${emailParam}`);
    const earnings  = await this.fetchJSON(`/api/vendor/earnings?email=${emailParam}`);
    const payout    = await this.fetchJSON(`/api/vendor/payout/status?email=${emailParam}`);
    const ads       = await this.fetchJSON(`/api/vendor/ads?email=${emailParam}`);
    const phonebook = await this.fetchJSON(`/api/vendor/phonebook?email=${emailParam}`);
    const orders    = await this.fetchJSON(`/api/vendor/orders?email=${emailParam}`);
    const messages  = await this.fetchJSON(`/api/vendor/messages?email=${emailParam}`);
    const stats     = await this.fetchJSON(`/api/vendor/stats/today?email=${emailParam}`);

    const safeStore = store && !store.error ? store : {};

    const storefront = {
      email: cloudUser.email,
      name: cloudUser.name,

      vendorId: safeStore.vendorId || null,

      description: safeStore.description || "",
      tags: safeStore.tags || "",
      logo: safeStore.logo || "",
      cover: safeStore.cover || "",
      products: Array.isArray(safeStore.products) ? safeStore.products : [],
      services: Array.isArray(safeStore.services) ? safeStore.services : [],
      workshops: Array.isArray(safeStore.workshops) ? safeStore.workshops : [],
      apps: Array.isArray(safeStore.apps) ? safeStore.apps : [],

      ads: Array.isArray(ads) && !ads.error ? ads : [],
      phonebook: phonebook && !phonebook.error ? phonebook : null,
      published: safeStore.published || false,

      earnings: earnings && !earnings.error ? earnings : {
        today: 0,
        week: 0,
        month: 0,
        total: 0
      },

      payout: payout && !payout.error ? payout : {
        connected: false,
        method: null,
        email: null,
        venmo: false
      },

      orders: Array.isArray(orders) && !orders.error ? orders : [],
      messages: Array.isArray(messages) && !messages.error ? messages : [],

      stats: stats && !stats.error ? stats : {
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

  /* ---------------------------------------------------------
     CLOUD MESSAGING (STAFF → vendor inbox)
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
  },

  /* ---------------------------------------------------------
     FETCH HELPERS
  --------------------------------------------------------- */
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
   EXPORTS FOR VENDOR DASHBOARD
   ============================================================ */

export async function staffGetProducts() {
  const user = Staff.getCloudUser();
  if (!user) return [];
  const data = await Staff.fetchJSON(`/api/vendor/products?email=${encodeURIComponent(user.email)}`);
  return Array.isArray(data) && !data.error ? data : [];
}

export async function staffUpdateProduct(id, data) {
  return await Staff.postJSON(`/api/vendor/products/update?id=${id}`, data);
}

export async function staffToggleVisibility(id) {
  return await Staff.postJSON(`/api/vendor/products/toggle?id=${id}`, {});
}

export async function staffGetOrders() {
  const user = Staff.getCloudUser();
  if (!user) return [];
  const data = await Staff.fetchJSON(`/api/vendor/orders?email=${encodeURIComponent(user.email)}`);
  return Array.isArray(data) && !data.error ? data : [];
}

export async function staffGetMessages() {
  const user = Staff.getCloudUser();
  if (!user) return [];
  const data = await Staff.fetchJSON(`/api/vendor/messages?email=${encodeURIComponent(user.email)}`);
  return Array.isArray(data) && !data.error ? data : [];
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

  const stats = await Staff.fetchJSON(`/api/vendor/stats/today?email=${encodeURIComponent(user.email)}`);

  if (!stats || stats.error) {
    return {
      revenue: 0,
      ordersCount: 0,
      activeProducts: 0,
      openOrders: 0,
      newMessages: 0
    };
  }

  return stats;
}

/* ============================================================
   DEFAULT EXPORT
   ============================================================ */
export default Staff;
