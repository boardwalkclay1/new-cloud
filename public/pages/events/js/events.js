// public/pages/events/js/events.js
// MAIN EVENTS CONTROLLER — orchestrates all modules

import { loadUpcomingEvents, renderUpcomingEventsStrip } from "./modules/events-upcoming.js";
import { loadEventDetails, renderEventDetails } from "./modules/events-details.js";
import { loadPurchases, renderPurchasesSection } from "./modules/events-purchases.js";
import { setupTicketing } from "./modules/events-ticketing.js";
import { setupHostEntry } from "./modules/events-host.js";
import { setupReferralAndSocial } from "./modules/events-referral.js";

const Auth = window.Auth;

document.addEventListener("DOMContentLoaded", async () => {
  const user = Auth?.currentUser || null;

  /* ---------------------------------------------------------
     UPCOMING EVENTS (everyone sees)
  --------------------------------------------------------- */
  const upcomingStrip = renderUpcomingEventsStrip();
  document.querySelector(".events-section").prepend(upcomingStrip);

  const upcomingEvents = await loadUpcomingEvents();
  upcomingStrip.populate(upcomingEvents);

  /* ---------------------------------------------------------
     USER PURCHASE HISTORY (Cloud users only)
  --------------------------------------------------------- */
  if (user) {
    const purchasesSection = renderPurchasesSection();
    document.querySelector(".events-section").appendChild(purchasesSection);

    const purchases = await loadPurchases(user.id);
    purchasesSection.populate(purchases);
  }

  /* ---------------------------------------------------------
     EVENT DETAILS (if eventId is in URL)
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
     HOST ENTRY (legal → dashboard)
  --------------------------------------------------------- */
  setupHostEntry(user);
});
