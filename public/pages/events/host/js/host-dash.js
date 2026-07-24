// public/pages/events/host/js/dashboard.js
import { loadOverview } from "./modules/overview.js";
import { loadCreateEvent } from "./modules/create-event.js";
import { loadMyEvents } from "./modules/my-events.js";
import { loadTicketScans } from "./modules/ticket-scans.js";
import { loadPayouts } from "./modules/payouts.js";
import { loadSettings } from "./modules/settings.js";
import { requireHostPin } from "./modules/pin-gate.js";

const API = "https://api.beltlinecloud.com";
const Auth = window.Auth;

document.addEventListener("DOMContentLoaded", async () => {
  const user = Auth?.currentUser;
  if (!user) return location.href = "/cloud/login.html";

  // PIN gate — required every time
  await requireHostPin(user.id);

  document.getElementById("hostName").textContent = user.username;

  const panel = document.getElementById("dashPanel");

  function loadView(view) {
    panel.innerHTML = "";

    if (view === "overview") loadOverview(panel, user);
    if (view === "create") loadCreateEvent(panel, user);
    if (view === "events") loadMyEvents(panel, user);
    if (view === "tickets") loadTicketScans(panel, user);
    if (view === "payouts") loadPayouts(panel, user);
    if (view === "settings") loadSettings(panel, user);
  }

  document.querySelectorAll(".menu-item").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".menu-item").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      loadView(btn.dataset.view);
    });
  });

  loadView("overview");
});
