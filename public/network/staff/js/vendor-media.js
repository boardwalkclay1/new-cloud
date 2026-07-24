// vendor-media.js
// Handles logo, cover, and future gallery uploads (FULLY UPDATED)

import { getVendorId, getVendorData } from "/network/staff/js/vendor-context.js";

const vendorLogoUpload = document.getElementById("vendorLogoUpload");
const vendorLogoImg = document.getElementById("vendorLogoImg");
const coverUpload = document.getElementById("coverUpload");
const vendorCoverImg = document.getElementById("vendorCoverImg");

/* ---------------------------------------------------------
   LOAD EXISTING MEDIA (LOGO + COVER)
--------------------------------------------------------- */
async function loadExistingMedia() {
  const vendor = getVendorData();
  if (!vendor) return;

  // LOGO
  if (vendor.logo && vendorLogoImg) {
    vendorLogoImg.src = vendor.logo;
  }

  // COVER
  if (vendor.cover && vendorCoverImg) {
    vendorCoverImg.src = vendor.cover;
  }
}

/* ---------------------------------------------------------
   LOGO UPLOAD
--------------------------------------------------------- */
function initLogoUpload() {
  if (!vendorLogoUpload) return;

  vendorLogoUpload.addEventListener("change", async () => {
    const file = vendorLogoUpload.files[0];
    if (!file) return;

    const vendorId = getVendorId();
    if (!vendorId) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("vendorId", vendorId);

    const res = await fetch(`/api/vendor/upload/logo`, {
      method: "POST",
      body: formData,
      credentials: "include"
    });

    const data = await res.json().catch(() => null);

    if (data && data.success && data.url) {
      vendorLogoImg.src = data.url;

      // Update vendor context so it stays saved
      const vendor = getVendorData();
      vendor.logo = data.url;
      localStorage.setItem("cloud_vendor", JSON.stringify(vendor));
    }
  });
}

/* ---------------------------------------------------------
   COVER UPLOAD
--------------------------------------------------------- */
function initCoverUpload() {
  if (!coverUpload) return;

  coverUpload.addEventListener("change", async () => {
    const file = coverUpload.files[0];
    if (!file) return;

    const vendorId = getVendorId();
    if (!vendorId) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("vendorId", vendorId);

    const res = await fetch(`/api/vendor/upload/cover`, {
      method: "POST",
      body: formData,
      credentials: "include"
    });

    const data = await res.json().catch(() => null);

    if (data && data.success && data.url) {
      if (vendorCoverImg) vendorCoverImg.src = data.url;

      // Update vendor context so it stays saved
      const vendor = getVendorData();
      vendor.cover = data.url;
      localStorage.setItem("cloud_vendor", JSON.stringify(vendor));
    }
  });
}

/* ---------------------------------------------------------
   INIT
--------------------------------------------------------- */
export function initVendorMedia() {
  loadExistingMedia();
  initLogoUpload();
  initCoverUpload();
}
