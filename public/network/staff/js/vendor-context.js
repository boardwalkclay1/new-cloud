// vendor-context.js
// Handles cloud user, storefront, vendorId, and basic UI context

const sidebarUser = document.getElementById("sidebarUser");
const vendorSubtitle = document.getElementById("vendorSubtitle");
const vendorLogoImg = document.getElementById("vendorLogoImg");

/* ---------------------------------------------------------
   RAW CONTEXT GETTERS
--------------------------------------------------------- */
export function getCloudUser() {
  return JSON.parse(localStorage.getItem("cloud_user") || "null");
}

export function getStorefront() {
  return JSON.parse(localStorage.getItem("vendor_storefront") || "null");
}

export function getVendorId() {
  const store = getStorefront();
  return store?.vendorId || null;
}

/* ---------------------------------------------------------
   UI CONTEXT
--------------------------------------------------------- */
export function applyCloudUserContext() {
  const cloudUser = getCloudUser();

  if (cloudUser && cloudUser.name) {
    sidebarUser.textContent = `Connected: ${cloudUser.name}`;
    vendorSubtitle.textContent = `Live performance for ${cloudUser.name}`;
  } else {
    sidebarUser.textContent = "Connected to Cloud";
    vendorSubtitle.textContent = "Live performance overview";
  }
}

/* ---------------------------------------------------------
   VENDOR LOGO DISPLAY
--------------------------------------------------------- */
export function applyVendorLogoContext() {
  const storefront = getStorefront();

  // storefront.logo should be a full URL from R2 or CDN
  if (storefront && storefront.logo) {
    vendorLogoImg.src = storefront.logo;
  } else {
    vendorLogoImg.src = "/assets/img/network-logo.jpg";
  }
}

/* ---------------------------------------------------------
   INIT
--------------------------------------------------------- */
export function initVendorContext() {
  applyCloudUserContext();
  applyVendorLogoContext();
}
