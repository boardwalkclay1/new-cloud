// vendor-products.js
// Handles product listing, image upload, visibility toggling

import {
  staffGetProducts,
  staffToggleVisibility
} from "/network/staff/js/staff.js";

import { getVendorId } from "./vendor-context.js";

const productsGrid = document.getElementById("productsGrid");

/* ---------------------------------------------------------
   RENDER PRODUCTS
--------------------------------------------------------- */
function renderProducts(products) {
  productsGrid.innerHTML = "";

  const safeProducts = Array.isArray(products) ? products : [];

  safeProducts.forEach(p => {
    const card = document.createElement("div");
    card.className = "product-card";

    card.innerHTML = `
      <img src="${p.image || '/assets/img/network-logo.jpg'}" alt="${p.name || ''}">
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
    editBtn.onclick = () => {
      window.location.href = "/network/staff/pages/products.html";
    };

    const toggleBtn = document.createElement("button");
    toggleBtn.textContent = p.active ? "Deactivate" : "Activate";
    toggleBtn.onclick = async () => {
      await staffToggleVisibility(p.id);
      await loadVendorProducts(); // reload after toggle
    };

    actions.appendChild(editBtn);
    actions.appendChild(toggleBtn);
    card.appendChild(actions);

    productsGrid.appendChild(card);
  });

  attachProductImageUploadHandlers();
}

/* ---------------------------------------------------------
   PRODUCT IMAGE UPLOAD HANDLERS
--------------------------------------------------------- */
function attachProductImageUploadHandlers() {
  document.querySelectorAll(".product-image-input").forEach(input => {
    input.addEventListener("change", async () => {
      const file = input.files[0];
      const productId = input.dataset.productId;
      if (!file || !productId) return;

      const vendorId = getVendorId();
      if (!vendorId) return;

      const formData = new FormData();
      formData.append("file", file);
      formData.append("productId", productId);
      formData.append("vendorId", vendorId);

      await fetch(`/api/vendor/upload/product-image`, {
        method: "POST",
        body: formData,
        credentials: "include"
      });

      await loadVendorProducts();
    });
  });
}

/* ---------------------------------------------------------
   PUBLIC LOAD FUNCTION
--------------------------------------------------------- */
export async function loadVendorProducts() {
  const products = await staffGetProducts();
  renderProducts(products);
}
