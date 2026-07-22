
    initVendorMap({
      lat,
      lng,
      zone,
      containerId: "vendorMapContainer"
    });
  }, () => {
    locationStat.textContent = "Location: unavailable";
    weatherStat.textContent = "Weather: unavailable";
    initVendorMap({ containerId: "vendorMapContainer" });
  });
}

/* ---------------------------------------------------------
   STATS
--------------------------------------------------------- */
export async function loadStats() {
  const stats = await staffGetTodayStats();

  statRevenue.textContent = `$${stats.revenue || 0}`;
  statRevenueSub.textContent = `${stats.ordersCount || 0} orders`;
  statProducts.textContent = stats.activeProducts || 0;
  statOpenOrders.textContent = stats.openOrders || 0;
  statMessages.textContent = stats.newMessages || 0;
}

/* ---------------------------------------------------------
   PRODUCTS
--------------------------------------------------------- */
export async function loadProducts() {
  const products = await staffGetProducts();
  const safeProducts = Array.isArray(products) ? products : [];

  productsGrid.innerHTML = "";

  safeProducts.forEach(p => {
    const card = document.createElement("div");
    card.className = "product-card";

    card.innerHTML = `
      <img src="${p.image || '/assets/img/placeholder.jpg'}" alt="${p.name || ''}">
      <div class="product-name">${p.name || "Unnamed product"}</div>
      <div class="product-meta">
        $${p.price || 0} • ${p.active ? "Active" : "Inactive"}
      </div>

      <label class="upload-btn">
        Upload Image
        <input type="file" class="product-image-input" data-product-id="${p.id}" accept="image/*">
      </label>
    `;

    const actions = document.createElement("div");
    actions.className = "product-actions";

    const editBtn = document.createElement("button");
    editBtn.textContent = "Edit";
    editBtn.onclick = () => window.location.href = "/network/staff/pages/products.html";

    const toggleBtn = document.createElement("button");
    toggleBtn.textContent = p.active ? "Deactivate" : "Activate";
    toggleBtn.onclick = async () => {
      await staffToggleVisibility(p.id);
      await loadProducts();
      await loadStats();
    };

    actions.appendChild(editBtn);
    actions.appendChild(toggleBtn);
    card.appendChild(actions);

    productsGrid.appendChild(card);
  });

  document.querySelectorAll(".product-image-input").forEach(input => {
    input.addEventListener("change", async () => {
      const file = input.files[0];
      const productId = input.dataset.productId;
      if (!file || !productId) return;

      const formData = new FormData();
      formData.append("file", file);
      formData.append("productId", productId);

      await fetch("/api/vendor/upload/product-image", {
        method: "POST",
        body: formData,
        credentials: "include"
      });

      await loadProducts();
    });
  });
}

/* ---------------------------------------------------------
   ORDERS
--------------------------------------------------------- */
export async function loadOrders() {
  const orders = await staffGetOrders();
  const safeOrders = Array.isArray(orders) ? orders : [];

  ordersList.innerHTML = "";

  safeOrders.forEach(o => {
    const item = document.createElement("div");
    item.className = "order-item";
    item.innerHTML = `
      <strong>#${o.id}</strong> • ${o.status || o.paymentStatus || "pending"}<br>
      ${o.buyerEmail || ""}<br>
      ${o.itemType || ""} • Qty: ${o.quantity || 1}
    `;
    ordersList.appendChild(item);
  });
}

/* ---------------------------------------------------------
   MESSAGES
--------------------------------------------------------- */
export async function loadMessages() {
  const messages = await staffGetMessages();
  const safeMessages = Array.isArray(messages) ? messages : [];

  messagesList.innerHTML = "";

  safeMessages.forEach(m => {
    const item = document.createElement("div");
    item.className = "message-item";
    item.innerHTML = `
      <strong>${m.toEmail || "Customer"}</strong><br>
      ${m.text || ""}
    `;
    messagesList.appendChild(item);
  });
}

/* ---------------------------------------------------------
   UPLOAD HELPERS
--------------------------------------------------------- */
function getVendorEmail() {
  const cloudUser = JSON.parse(localStorage.getItem("cloud_user") || "null");
  return cloudUser?.email || null;
}

/* ---------------------------------------------------------
   UPLOAD HANDLERS
--------------------------------------------------------- */
vendorLogoUpload.addEventListener("change", async () => {
  const file = vendorLogoUpload.files[0];
  if (!file) return;

  const email = getVendorEmail();
  if (!email) return;

  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch("/api/vendor/upload/logo", {
    method: "POST",
    body: formData,
    credentials: "include",
    headers: {
      "X-Vendor-Email": email
    }
  });

  const data = await res.json().catch(() => null);
  if (data && data.success && data.url) {
    vendorLogoImg.src = data.url;
  }
});

coverUpload.addEventListener("change", async () => {
  const file = coverUpload.files[0];
  if (!file) return;

  const email = getVendorEmail();
  if (!email) return;

  const formData = new FormData();
  formData.append("file", file);

  await fetch("/api/vendor/upload/cover", {
    method: "POST",
    body: formData,
    credentials: "include",
    headers: {
      "X-Vendor-Email": email
    }
  });
});

/* ---------------------------------------------------------
   INIT
--------------------------------------------------------- */
export async function initVendorDashboard() {
  connectCloudUser();
  await loadStats();
  await loadProducts();
  await loadOrders();
  await loadMessages();
  await detectBeltlineLocation();
}

initVendorDashboard();

/* ---------------------------------------------------------
   LOGOUT
--------------------------------------------------------- */
window.logout = function() {
  localStorage.removeItem("cloud_user");
  window.location.href = "/network/pages/login.html";
};
