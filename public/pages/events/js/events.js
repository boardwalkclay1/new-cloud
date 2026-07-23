// /pages/events/js/events.js
// MAIN EVENTS CONTROLLER
// Loads modules and orchestrates the entire Cloud Events system

import { loadUpcomingEvents, renderUpcomingEventsStrip } from "./modules/events-upcoming.js";
import { loadEventDetails, renderEventDetails } from "./modules/events-details.js";
import { loadPurchases, renderPurchasesSection } from "./modules/events-purchases.js";
import { setupTicketing } from "./modules/events-ticketing.js";
import { setupHostEntry } from "./modules/events-host.js";
import { setupReferralAndSocial } from "./modules/events-referral.js";

const API = "https://api.beltlinecloud.com";
const Auth = window.Auth;

document.addEventListener("DOMContentLoaded", async () => {
  const user = Auth?.currentUser || null;

  /* ---------------------------------------------------------
     1. UPCOMING EVENTS (everyone sees this)
  --------------------------------------------------------- */
  const upcomingStrip = renderUpcomingEventsStrip();
  document.querySelector(".events-section").prepend(upcomingStrip);

  const upcomingEvents = await loadUpcomingEvents();
  upcomingStrip.populate(upcomingEvents);


  /* ---------------------------------------------------------
     2. USER PURCHASE HISTORY (only Cloud users)
  --------------------------------------------------------- */
  if (user) {
    const purchasesSection = renderPurchasesSection();
    document.querySelector(".events-section").appendChild(purchasesSection);

    const purchases = await loadPurchases(user.id);
    purchasesSection.populate(purchases);
  }


  /* ---------------------------------------------------------
     3. EVENT DETAILS (if eventId is in URL)
  --------------------------------------------------------- */
  const url = new URL(window.location.href);
  const eventId = url.searchParams.get("eventId");

  if (eventId) {
    const event = await loadEventDetails(eventId);

    if (event) {
      renderEventDetails(event);
      setupReferralAndSocial(event);
      setupTicketing(event, user);
    }
  }


  /* ---------------------------------------------------------
     4. HOST ENTRY (legal agreement → dashboard)
  --------------------------------------------------------- */
  setupHostEntry(user);
});
