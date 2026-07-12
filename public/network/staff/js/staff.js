// /network/staff/js/staff.js
// FINAL STAFF WRAPPER — CLOUD USER + FULL VENDOR LOADERS + EXPORTS

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

    const email = encodeURIComponent(cloudUser.email);

    const store     = await this.fetchJSON(`/api/vendor/storefront?email=${email}`);
    const earnings  = await this.fetchJSON(`/api/vendor/earnings?email=${email}`);
    const payout    = await this.fetchJSON(`/api/vendor/payout/status?email=${email}`);
    const ads       = await this.fetchJSON(`/api/vendor/ads?email=${email}`);
    const phonebook = await this.fetchJSON(`/api/vendor/phonebook?email=${email}`);
    const orders    = await this.fetchJSON(`/api/vendor/orders?email=${email}`);
    const messages  = await this.fetchJSON(`/api/vendor/messages?email=${email}`);
    const stats     = await this.fetchJSON(`/api/vendor/stats/today?email=${email}`);

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
      ads: ads?.error ? [] : ads,
      phonebook: phonebook?.error ? null : phonebook,
      published: store?.published || false,

      earnings: earnings?.error ? {
        today: 0,
        week: 0,
        month: 0,
        total: 0
      } : earnings,

      payout: payout?.error ? {
        connected: false,
        method: null,
        email: null,
        venmo: false
      } : payout,

      orders: orders?.error ? [] : orders,
      messages: messages?.error ? [] : messages,
      stats: stats?.error ? {
        revenue: 0,
        ordersCount: 0,
        activeProducts: 0,
        openOrders: 0,
        newMessages: 0
      } : stats
    };

    this.saveStorefront(storefront);

    if (window.Vendor) {
      Vendor.init(storefront, cloudUser);
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
    const cloudUser = this.getCloudUser();
    if (!cloudUser) return;
    window.location.href = `/network/pages/vendor.html?id=${encodeURIComponent(cloudUser.email)}`;
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

/* ============================================================
   EXPORTS FOR VENDOR DASHBOARD
   ============================================================ */

export async function staffGetProducts() {
  const user = Staff.getCloudUser();
  if (!user) return [];
  return await Staff.fetchJSON(`/api/vendor/products?email=${encodeURIComponent(user.email)}`) || [];
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
  return await Staff.fetchJSON(`/api/vendor/orders?email=${encodeURIComponent(user.email)}`) || [];
}

export async function staffGetMessages() {
  const user = Staff.getCloudUser();
  if (!user) return [];
  return await Staff.fetchJSON(`/api/vendor/messages?email=${encodeURIComponent(user.email)}`) || [];
}

export async function staffGetTodayStats() {
  const user = Staff.getCloudUser();
  if (!user) return {
    revenue: 0,
    ordersCount: 0,
    activeProducts: 0,
    openOrders: 0,
    newMessages: 0
  };
  return await Staff.fetchJSON(`/api/vendor/stats/today?email=${encodeURIComponent(user.email)}`) || {
    revenue: 0,
    ordersCount: 0,
    activeProducts: 0,
    openOrders: 0,
    newMessages: 0
  };
}

/* ============================================================
   DEFAULT EXPORT
   ============================================================ */
export default Staff;
