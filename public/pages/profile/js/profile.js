// ===============================
// Beltline Cloud — Profile System
// ===============================
// Handles:
// - Profile loading
// - Badge vault loading
// - Media loading
// - Profile UI interactions
// - Worker API communication
// ===============================

const PROFILE_API = "https://api.beltlinecloud.com/profile";
const BADGE_API = "https://api.beltlinecloud.com/badges";
const MEDIA_API = "https://api.beltlinecloud.com/media";

// -------------------------------
// Helper: API wrapper
// -------------------------------
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

// -------------------------------
// Load Profile Data
// -------------------------------
export async function loadUserProfile(userId) {
    try {
        const data = await cloudAPI(`${PROFILE_API}/${userId}`);

        renderProfileHeader(data);
        renderProfileTags(data);
        renderProfileBadges(data.badges);
        renderProfileMedia(data.media);

    } catch (err) {
        console.error("Profile Load Error:", err);
    }
}

// -------------------------------
// Render Profile Header
// -------------------------------
function renderProfileHeader(data) {
    document.getElementById("profileName").textContent = data.name;
    document.getElementById("profileAvatar").src = data.avatar_url;
    document.getElementById("profileBanner").style.backgroundImage =
        `url('${data.banner_url}')`;
}

// -------------------------------
// Render Identity Tags
// -------------------------------
function renderProfileTags(data) {
    const tagContainer = document.getElementById("profileTags");
    tagContainer.innerHTML = "";

    data.tags.forEach(tag => {
        const div = document.createElement("div");
        div.className = "profile-tag";
        div.textContent = tag;
        tagContainer.appendChild(div);
    });
}

// -------------------------------
// Render Badges (Preview Only)
// -------------------------------
function renderProfileBadges(badges) {
    const container = document.getElementById("profileBadgePreview");
    container.innerHTML = "";

    badges.slice(0, 5).forEach(badge => {
        const img = document.createElement("img");
        img.src = `/pages/profile/badges/${badge.category}/${badge.file}`;
        img.className = "badge-preview";
        container.appendChild(img);
    });
}

// -------------------------------
// Render Media Gallery
// -------------------------------
function renderProfileMedia(media) {
    const container = document.getElementById("profileMedia");
    container.innerHTML = "";

    media.forEach(item => {
        const div = document.createElement("div");
        div.className = "media-item";

        if (item.type === "image") {
            div.innerHTML = `<img src="${item.url}" class="media-img">`;
        } else if (item.type === "video") {
            div.innerHTML = `
                <video class="media-video" controls>
                    <source src="${item.url}" type="video/mp4">
                </video>`;
        }

        container.appendChild(div);
    });
}

// -------------------------------
// Open Badge Vault
// -------------------------------
export function openBadgeVault(userId) {
    window.location.href = `/pages/profile/badges.html?user=${userId}`;
}

// -------------------------------
// Update Profile Settings
// -------------------------------
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
