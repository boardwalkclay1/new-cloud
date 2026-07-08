// community.js — Cumulus Cloud Community Hub

// Load user from localStorage
const rawUser = localStorage.getItem("cloud_user");
const user = rawUser ? JSON.parse(rawUser) : null;

// Redirect if not logged in
if (!user) {
  window.location.href = "/pages/login.html";
}

// Fill header info
document.getElementById("userName").textContent = user.name || user.email;
document.getElementById("userRep").textContent = `Rep: ${user.rep ?? 0}`;

// MENU OPEN / CLOSE
const menu = document.getElementById("cloudMenu");
const openMenuBtn = document.getElementById("openMenu");
const closeMenuBtn = document.getElementById("closeMenu");

openMenuBtn.addEventListener("click", () => {
  menu.classList.add("open");
});

closeMenuBtn.addEventListener("click", () => {
  menu.classList.remove("open");
});

// OPTIONAL: Sync user profile from backend (future expansion)
async function syncUserProfile() {
  try {
    const res = await fetch(`/api/users/profile?id=${user.id}`);
    if (!res.ok) return;

    const updated = await res.json();

    // Update localStorage
    localStorage.setItem("cloud_user", JSON.stringify(updated));

    // Update UI
    document.getElementById("userName").textContent = updated.name || updated.email;
    document.getElementById("userRep").textContent = `Rep: ${updated.rep ?? 0}`;
  } catch (err) {
    console.error("Profile sync failed:", err);
  }
}

// OPTIONAL: Auto-sync every 60 seconds
// setInterval(syncUserProfile, 60000);

// COMMUNITY MODULE HOOKS (future pages use these)
window.Community = {
  volunteer() {
    window.location.href = "/pages/volunteer.html";
  },
  barter() {
    window.location.href = "/pages/barter.html";
  },
  needs() {
    window.location.href = "/pages/needs.html";
  },
  deeds() {
    window.location.href = "/pages/deeds.html";
  },
  messages() {
    window.location.href = "/pages/messages.html";
  }
};
