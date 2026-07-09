// /network/staff/js/vendor.js
// VENDOR ENGINE — 4 CARDS + HYBRID QUICK ACTIONS + STOREFRONT + EARNINGS + PAYOUT

const Vendor = {
  storefront: null,
  cloudUser: null,

  init(storefront, cloudUser) {
    this.storefront = storefront;
    this.cloudUser = cloudUser;

    this.renderVendorHeader();
    this.renderEarningsCard();
    this.renderProductsCard();
    this.renderWorkshopsCard();
    this.renderServicesAppsCard();
  },

  /* ---------------------------------------------------------
     HEADER
  --------------------------------------------------------- */
  renderVendorHeader() {
    const titleEl = document.getElementById("vendorTitle");
    const welcomeEl = document.getElementById("vendorWelcome");
    if (!titleEl || !welcomeEl) return;

    titleEl.textContent = this.storefront.name || "Vendor Dashboard";
    welcomeEl.textContent = `Signed in as ${this.cloudUser.email}`;
  },

  /* ---------------------------------------------------------
     CARD 1 — EARNINGS
  --------------------------------------------------------- */
  renderEarningsCard() {
    const e = this.storefront.earnings || {
      today: 0,
      week: 0,
      month: 0,
      total: 0
    };
    const p = this.storefront.payout || {
      connected: false,
      method: null,
      email: null,
      venmo: false
    };

    this.setText("earnToday", `$${e.today.toFixed ? e.today.toFixed(2) : e.today}`);
    this.setText("earnWeek", `$${e.week.toFixed ? e.week.toFixed(2) : e.week}`);
    this.setText("earnMonth", `$${e.month.toFixed ? e.month.toFixed(2) : e.month}`);
    this.setText("earnTotal", `$${e.total.toFixed ? e.total.toFixed(2) : e.total}`);

    const payoutEl = document.getElementById("payoutStatus");
    if (payoutEl) {
      if (!p.connected) {
        payoutEl.textContent = "Payout not connected — connect PayPal or Venmo in settings.";
      } else {
        payoutEl.textContent = `Payout connected via ${p.method || "PayPal"} (${p.email || "no email"})`;
      }
    }
  },

  /* ---------------------------------------------------------
     CARD 2 — PRODUCTS (MAIN COMMAND CENTER)
  --------------------------------------------------------- */
  renderProductsCard() {
    const container = document.getElementById("productsFeed");
    if (!container) return;

    const products = this.storefront.products || [];
    const services = this.storefront.services || [];
    const workshops = this.storefront.workshops || [];
    const apps = this.storefront.apps || [];

    let html = "";

    if (!products.length && !services.length && !workshops.length && !apps.length) {
      html = `<p style="opacity:0.75;">No items yet. Use the menu to add products, services, workshops, or apps.</p>`;
    } else {
      if (products.length) {
        html += `<h4>Products</h4><div class="scroll-row">`;
        products.forEach(p => html += this.renderItemRow("product", p));
        html += `</div>`;
      }

      if (services.length) {
        html += `<h4>Services</h4><div class="scroll-row">`;
        services.forEach(s => html += this.renderItemRow("service", s));
        html += `</div>`;
      }

      if (apps.length) {
        html += `<h4>Apps</h4><div class="scroll-row">`;
        apps.forEach(a => html += this.renderItemRow("app", a));
        html += `</div>`;
      }
    }

    container.innerHTML = html;

    this.autoScroll("productsFeed");
  },

  /* ---------------------------------------------------------
     CARD 3 — WORKSHOPS
  --------------------------------------------------------- */
  renderWorkshopsCard() {
    const container = document.getElementById("workshopsFeed");
    if (!container) return;

    const workshops = this.storefront.workshops || [];
    let html = "";

    if (!workshops.length) {
      html = `<p style="opacity:0.75;">No workshops yet. Add workshops from the menu.</p>`;
    } else {
      html += `<div class="scroll-row">`;
      workshops.forEach(w => html += this.renderItemRow("workshop", w));
      html += `</div>`;
    }

    container.innerHTML = html;
    this.autoScroll("workshopsFeed");
  },

  /* ---------------------------------------------------------
     CARD 4 — SERVICES + APPS
  --------------------------------------------------------- */
  renderServicesAppsCard() {
    const container = document.getElementById("servicesAppsFeed");
    if (!container) return;

    const services = this.storefront.services || [];
    const apps = this.storefront.apps || [];
    let html = "";

    if (!services.length && !apps.length) {
      html = `<p style="opacity:0.75;">No services or apps yet. Add them from the menu.</p>`;
    } else {
      if (services.length) {
        html += `<h4>Services</h4><div class="scroll-row">`;
        services.forEach(s => html += this.renderItemRow("service", s));
        html += `</div>`;
      }
      if (apps.length) {
        html += `<h4>Apps</h4><div class="scroll-row">`;
        apps.forEach(a => html += this.renderItemRow("app", a));
        html += `</div>`;
      }
    }

    container.innerHTML = html;
    this.autoScroll("servicesAppsFeed");
  },

  /* ---------------------------------------------------------
     HYBRID QUICK ACTION ROW (C)
  --------------------------------------------------------- */
  renderItemRow(type, item) {
    const thumb = item.thumbnail || "/network/public/img/network-logo.jpg";
    const name = item.name || item.title || "(Untitled)";
    const price = item.price ? `$${item.price}` : "";
    const desc = item.description || "";
    const activeLabel = item.active ? "Active" : "Hidden";

    return `
      <div class="item-row">
        <div class="item-row-main">
          <img src="${thumb}" class="item-thumb" alt="${name}">
          <div class="item-info">
            <div class="item-name">${name}</div>
            <div class="item-meta">${price}</div>
            <div class="item-desc">${desc}</div>
            <div class="item-status">${activeLabel}</div>
          </div>
        </div>
        <div class="item-actions">
          <button class="btn-small" onclick="Vendor.openItem('${type}', '${item.id}')">Open</button>
          <button class="btn-small" onclick="Vendor.editItem('${type}', '${item.id}')">Edit</button>
          <button class="btn-small" onclick="Vendor.toggleItem('${type}', '${item.id}')">
            ${item.active ? "Hide" : "Show"}
          </button>
          <button class="btn-small" onclick="Vendor.deleteItem('${type}', '${item.id}')">Delete</button>
        </div>
      </div>
    `;
  },

  /* ---------------------------------------------------------
     ITEM ACTIONS
  --------------------------------------------------------- */
  openItem(type, id) {
    Staff.go(`${type}.html?id=${encodeURIComponent(id)}`);
  },

  editItem(type, id) {
    Staff.go(`${type}-edit.html?id=${encodeURIComponent(id)}`);
  },

  async toggleItem(type, id) {
    const res = await Staff.postJSON("/api/vendor/item/toggle", {
      email: this.storefront.email,
      type,
      id
    });
    if (res && !res.error) {
      this.storefront = res.storefront;
      Staff.saveStorefront(this.storefront);
      this.refreshAll();
    }
  },

  async deleteItem(type, id) {
    if (!confirm("Delete this item?")) return;
    const res = await Staff.postJSON("/api/vendor/item/delete", {
      email: this.storefront.email,
      type,
      id
    });
    if (res && !res.error) {
      this.storefront = res.storefront;
      Staff.saveStorefront(this.storefront);
      this.refreshAll();
    }
  },

  /* ---------------------------------------------------------
     STOREFRONT PUBLISH / PREVIEW
  --------------------------------------------------------- */
  async publishStorefront() {
    const res = await Staff.postJSON("/api/vendor/storefront/publish", {
      email: this.storefront.email
    });
    if (res && !res.error) {
      this.storefront.published = true;
      Staff.saveStorefront(this.storefront);
      alert("Storefront published.");
    }
  },

  previewStorefront() {
    Staff.previewPage();
  },

  /* ---------------------------------------------------------
     REFRESH
  --------------------------------------------------------- */
  refreshAll() {
    this.renderEarningsCard();
    this.renderProductsCard();
    this.renderWorkshopsCard();
    this.renderServicesAppsCard();
  },

  /* ---------------------------------------------------------
     UTIL
  --------------------------------------------------------- */
  setText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  },

  autoScroll(id, speed = 0.4) {
    const el = document.getElementById(id);
    if (!el) return;
    let scrollPos = 0;
    setInterval(() => {
      if (el.scrollWidth <= el.clientWidth) return;
      scrollPos += speed;
      if (scrollPos >= el.scrollWidth) scrollPos = 0;
      el.scrollLeft = scrollPos;
    }, 40);
  }
};
