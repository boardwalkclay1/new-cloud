// public/pages/events/js/modules/events-purchases.js

const API = "https://api.beltlinecloud.com";

export async function loadPurchases(userId) {
  const res = await fetch(`${API}/api/events/purchases?userId=${userId}`);
  return await res.json();
}

export function renderPurchasesSection() {
  const wrapper = document.createElement("div");
  wrapper.className = "events-purchases-section";

  wrapper.innerHTML = `
    <h3>Your Past Tickets</h3>
    <div class="events-purchases-list"></div>
  `;

  const list = wrapper.querySelector(".events-purchases-list");

  wrapper.populate = purchases => {
    list.innerHTML = "";

    if (!purchases.length) {
      list.innerHTML = `<div class="events-empty">No past tickets.</div>`;
      return;
    }

    purchases.forEach(p => {
      const card = document.createElement("div");
      card.className = "events-purchase-card";

      card.innerHTML = `
        <h4>${p.eventTitle}</h4>
        <div class="events-purchase-meta">
          ${p.date} • ${p.time} • $${p.totalPaid} • ${p.tierName} x${p.quantity}
        </div>
        <div class="events-purchase-status">Ticket ID: ${p.ticketId}</div>
      `;

      card.onclick = () => {
        window.location.href = `/events/event?eventId=${p.eventId}`;
      };

      list.appendChild(card);
    });
  };

  return wrapper;
}
