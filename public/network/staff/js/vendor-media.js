// vendor-media.js
// Handles logo, cover, and future gallery uploads

import { getVendorId } from "./vendor-context.js";

const vendorLogoUpload = document.getElementById("vendorLogoUpload");
const vendorLogoImg = document.getElementById("vendorLogoImg");
const coverUpload = document.getElementById("coverUpload");

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

    await fetch(`/api/vendor/upload/cover`, {
      method: "POST",
      body: formData,
      credentials: "include"
    });
  });
}

/* ---------------------------------------------------------
   INIT
--------------------------------------------------------- */
export function initVendorMedia() {
  initLogoUpload();
  initCoverUpload();
}
