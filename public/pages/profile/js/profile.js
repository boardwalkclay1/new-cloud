// =========================================================
// BELTLINE CLOUD — MASTER PROFILE ENGINE (UPGRADED)
// =========================================================
// Controls:
// - Profile loading (connected to cloud_user_id)
// - Badge vault loading
// - Badge categories + descriptions
// - Badge assignment
// - Media gallery
// - Identity tags
// - Safety CLOUD status badges
// - Membership / Vendor / Fast Roll / History badges
// - Rep points
// - Social links (Instagram / TikTok / Facebook)
// - Profile settings
// - Worker API communication
// =========================================================

const PROFILE_API = "https://api.beltlinecloud.com/profile";
const BADGE_API    = "https://api.beltlinecloud.com/badges";
const MEDIA_API    = "https://api.beltlinecloud.com/media";

// =========================================================
// API WRAPPER
// =========================================================
async function cloudAPI(path, options = {}) {
  const res = await fetch(path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  });

  if (!res.ok) throw new Error(`Cloud API Error: ${res.status}`);
  return res.json();
}

// =========================================================
// BADGE CATEGORIES (FOLDER PATHS)
// =========================================================
const BADGE_CATEGORIES = {
  membership: "/pages/profile/badges/membership/",
  vendor:     "/pages/profile/badges/vendor/",
  fastroll:   "/pages/profile/badges/fastroll/",
  history:    "/pages/profile/badges/history/",
  safety:     "/pages/profile/badges/safety-cloud/"
};

// =========================================================
// BADGE DESCRIPTIONS (PERSONALIZED TO THE CLOUD)
// =========================================================
const BADGE_DESCRIPTIONS = {
  // Membership
  "badge_local.jpg":    "A familiar face on the Beltline. Your journey in the Cloud begins here.",
  "badge_elemental.jpg":"You move with the natural rhythm of the Beltline — steady, fluid, and part of the flow.",
  "badge_regular.jpg":  "A consistent Beltline presence. Recognized by the Cloud and the community.",
  "badge_veteran.jpg":  "Years of dedication to the Beltline. A respected figure in the Cloud.",
  "badge_elder.jpg":    "A long-time Beltline presence. A keeper of culture, movement, and Cloud history.",

  // Vendor
  "vendor_cloud.jpg":   "Official Cloud Vendor. Part of the Beltline marketplace.",
  "vendor_plus.jpg":    "Trusted vendor with consistent presence and quality.",
  "vendor_elite.jpg":   "Elite vendor recognized for service, consistency, and community.",
  "vendor_legacy.jpg":  "Long-time Beltline vendor with deep roots and respect.",

  // Fast Roll
  "fastroll_basic.jpg": "Speed with control. A recognized mover on the Beltline.",
  "fastroll_elite.jpg": "Precision and pace. Elite speed with Beltline courtesy.",
  "fastroll_cloud.jpg": "Cloud-level mastery. Fast, smooth, and cinematic.",

  // Beltline History
  "beltline_local.jpg":  "One year of steady Beltline presence.",
  "beltline_regular.jpg":"Two years of consistent movement and community.",
  "beltline_veteran.jpg":"Five years of dedication to the Beltline.",
  "beltline_elder.jpg":  "A long-time Beltline presence.",
  "beltline_legend.jpg": "Ten years or more. A true legend of the Beltline.",

  // Safety CLOUD Status
  "sc_on.jpg":        "Safety CLOUD active and monitoring.",
  "sc_emergency.jpg": "Emergency event detected. Cloud response initiated.",
  "sc_nightrider.jpg":"Night Rider mode active. Visibility and caution enhanced.",
  "sc_highrisk.jpg":  "High-Risk Zone mode active. Maximum awareness engaged.",
  "sc_vendor.jpg":    "Vendor mode active. Stationary safety monitoring.",
  "sc_fall.jpg":      "Fall protection active. Monitoring for sudden impacts.",
  "sc_snatch.jpg":    "Phone Snatch mode active. Anti-theft monitoring engaged."
};

// =========================================================
// LOAD FULL PROFILE (CONNECTED TO CLOUD USER)
// =========================================================
export async function loadUserProfile(userId) {
  try {
    if (!userId) {
      const stored = localStorage.getItem("cloud_user_id");
      userId = stored || null;
    }
    if (!userId) {
      console.error("No cloud_user_id found.");
      return;
    }

    const data = await cloudAPI(`${PROFILE_API}/${userId}`);

    renderProfileHeader(data);
    renderProfileAvatar(data);
    renderProfileTags(data);
    renderRepPoints(data);
    renderSocialLinks(data.social || {});
    renderProfileBadgesPreview(data.badges || []);
    renderProfileMedia(data.media || []);
    renderSafetyCloudStatus(data.safety_status || "sc_on");

  } catch (err) {
    console.error("Profile Load Error:", err);
  }
}

// =========================================================
// RENDER PROFILE HEADER
// =========================================================
function renderProfileHeader(data) {
  const nameEl   = document.getElementById("profileName");
  const bannerEl = document.getElementById("profileBanner");

  if (nameEl)   nameEl.textContent = data.name || "Cloud User";
  if (bannerEl) bannerEl.style.backgroundImage = `url('${data.banner_url || "/assets/img/profile/default-banner.jpg"}')`;
}

// =========================================================
// RENDER AVATAR
// =========================================================
function renderProfileAvatar(data) {
  const avatar = document.getElementById("profileAvatar");
  if (!avatar) return;

  avatar.src = data.avatar_url || "/assets/img/profile/default-avatar.jpg";
  avatar.classList.add("cloud-glow");
}

// =========================================================
// RENDER IDENTITY TAGS
// =========================================================
function renderProfileTags(data) {
  const tagContainer = document.getElementById("profileTags");
  if (!tagContainer) return;

  tagContainer.innerHTML = "";

  (data.tags || []).forEach(tag => {
    const div = document.createElement("div");
    div.className = "profile-tag-pill";
    div.textContent = tag;
    tagContainer.appendChild(div);
  });
}

// =========================================================
// RENDER REP POINTS
// =========================================================
function renderRepPoints(data) {
  const repEl = document.getElementById("repValue");
  if (!repEl) return;

  repEl.textContent = data.rep_points != null ? data.rep_points : 0;
}

// =========================================================
// RENDER SOCIAL LINKS (INSTAGRAM / TIKTOK / FACEBOOK)
// =========================================================
function renderSocialLinks(social) {
  const instaEl  = document.getElementById("socialInstagram");
  const tiktokEl = document.getElementById("socialTikTok");
  const fbEl     = document.getElementById("socialFacebook");

  if (instaEl) {
    if (social.instagram) {
      instaEl.href = social.instagram;
      instaEl.style.display = "inline-block";
    } else {
      instaEl.style.display = "none";
    }
  }

  if (tiktokEl) {
    if (social.tiktok) {
      tiktokEl.href = social.tiktok;
      tiktokEl.style.display = "inline-block";
    } else {
      tiktokEl.style.display = "none";
    }
  }

  if (fbEl) {
    if (social.facebook) {
      fbEl.href = social.facebook;
      fbEl.style.display = "inline-block";
    } else {
      fbEl.style.display = "none";
    }
  }
}

// =========================================================
// RENDER BADGE PREVIEW (TOP OF PROFILE)
// =========================================================
function renderProfileBadgesPreview(badges) {
  const container = document.getElementById("profileBadgePreview");
  if (!container) return;

  container.innerHTML = "";

  badges.slice(0, 3).forEach(badge => {
    const badgePath = BADGE_CATEGORIES[badge.category] + badge.file;

    const slot = document.createElement("div");
    slot.className = "badge-slot";

    const img = document.createElement("img");
    img.src = badgePath;
    img.alt = formatBadgeName(badge.file);

    slot.appendChild(img);
    container.appendChild(slot);
  });
}

// =========================================================
// LOAD FULL BADGE VAULT
// =========================================================
export async function loadBadgeVault(userId) {
  try {
    if (!userId) {
      const stored = localStorage.getItem("cloud_user_id");
      userId = stored || null;
    }
    if (!userId) {
      console.error("No cloud_user_id for badge vault.");
      return;
    }

    const badgeData = await cloudAPI(`${BADGE_API}/${userId}`);
    renderBadgeVault(badgeData || []);
  } catch (err) {
    console.error("Badge Vault Load Error:", err);
  }
}

function renderBadgeVault(badges) {
  const container = document.getElementById("badgeVault");
  if (!container) return;

  container.innerHTML = "";

  badges.forEach(badge => {
    const badgePath = BADGE_CATEGORIES[badge.category] + badge.file;

    const div = document.createElement("div");
    div.className = "badge-card";

    div.innerHTML = `
      <img src="${badgePath}" class="badge-img" alt="${formatBadgeName(badge.file)}">
      <h3>${formatBadgeName(badge.file)}</h3>
      <p>${BADGE_DESCRIPTIONS[badge.file] || ""}</p>
      <span class="badge-date">Earned: ${badge.date || ""}</span>
    `;

    container.appendChild(div);
  });
}

// =========================================================
// FORMAT BADGE NAME
// =========================================================
function formatBadgeName(file) {
  return file.replace(".jpg", "").replace(/_/g, " ").toUpperCase();
}

// =========================================================
– ASSIGN BADGE (ADMIN ONLY)
// =========================================================
export async function assignBadge(userId, badgeFile, category) {
  try {
    await cloudAPI(`${BADGE_API}/assign`, {
      method: "POST",
      body: JSON.stringify({
        userId,
        badgeFile,
        category
      })
    });
  } catch (err) {
    console.error("Badge Assignment Error:", err);
  }
}

// =========================================================
// RENDER MEDIA GALLERY
// =========================================================
function renderProfileMedia(media) {
  const container = document.getElementById("profileMedia");
  if (!container) return;

  container.innerHTML = "";

  media.forEach(item => {
    const div = document.createElement("div");
    div.className = "media-item";

    if (item.type === "image") {
      div.innerHTML = `<img src="${item.url}" class="media-img" alt="Cloud Media">`;
    } else if (item.type === "video") {
      div.innerHTML = `
        <video class="media-video" controls>
          <source src="${item.url}" type="video/mp4">
        </video>`;
    }

    container.appendChild(div);
  });

  // Hook up posting button if present
  const uploadInput = document.getElementById("mediaUpload");
  const postBtn     = document.getElementById("mediaPostBtn");

  if (uploadInput && postBtn) {
    postBtn.onclick = () => handleMediaPost(uploadInput.files);
  }
}

// =========================================================
// MEDIA POST HANDLER (BASIC STUB)
// =========================================================
async function handleMediaPost(files) {
  if (!files || files.length === 0) return;

  const userId = localStorage.getItem("cloud_user_id");
  if (!userId) {
    console.error("No cloud_user_id for media post.");
    return;
  }

  // This assumes backend accepts a simple JSON URL or base64.
  // You can swap to FormData if needed.
  const file = files[0];
  const payload = {
    userId,
    filename: file.name,
    type: file.type.startsWith("video") ? "video" : "image"
  };

  try {
    await cloudAPI(`${MEDIA_API}/upload`, {
      method: "POST",
      body: JSON.stringify(payload)
    });

    // Reload profile media after upload
    const data = await cloudAPI(`${PROFILE_API}/${userId}`);
    renderProfileMedia(data.media || []);

  } catch (err) {
    console.error("Media Upload Error:", err);
  }
}

// =========================================================
// SAFETY CLOUD STATUS BADGE
// =========================================================
function renderSafetyCloudStatus(status) {
  const badge = document.getElementById("safetyCloudStatusBadge");
  if (!badge) return;

  badge.src = `/pages/profile/badges/safety-cloud/${status}.jpg`;
}

// =========================================================
// UPDATE PROFILE SETTINGS
// =========================================================
export async function updateProfileSettings(userId, settings) {
  try {
    await cloudAPI(`${PROFILE_API}/${userId}/update`, {
      method: "POST",
      body: JSON.stringify(settings)
    });
  } catch (err) {
    console.error("Profile Update Error:", err);
  }
}

// =========================================================
// OPEN BADGE VAULT PAGE
// =========================================================
export function openBadgeVault(userId) {
  if (!userId) userId = localStorage.getItem("cloud_user_id");
  if (!userId) return;

  window.location.href = `/pages/profile/badges.html?user=${userId}`;
}
