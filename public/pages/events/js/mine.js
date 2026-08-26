/* AUTH */
const Auth = window.Auth;
const user = Auth.getUser();

if (!user) {
  window.location.href = "/pages/login.html";
  throw new Error("Not logged in");
}

const API = "https://api.beltlinecloud.com";

/* ELEMENTS */
const hostedEl = document.getElementById("myHostedEvents");
const ticketsEl = document.getElementById("myTickets");

/* LOAD HOSTED EVENTS */
async function loadHosted() {
  hostedEl.innerHTML = "<div class='loading'>Loading your events...</div>";

  const res = await fetch(`${API}/events/hosted/${user.id}`).catch(() => null);
  const data = res ? await res.json() : { events: [] };

  hostedEl.innerHTML = "";

  if (!data.events.length) {
    hostedEl.innerHTML = "<div class='empty'>You haven’t hosted any events yet.</div>";
    return;
  }

  data.events.forEach(ev => {
    const card = document.createElement("div");
    card.className = "event-card";

    card.innerHTML = `
      <img src="${ev.banner || '/assets/img/cloud/events-cloud.jpg'}" class="event-banner">

      <div class="event-info">
        <h4 class="event-title">${ev.title}</h4>
        <p class="event-meta">${ev.date} • ${ev.location}</p>

        <div class="event-stats">
          <span>Tickets Sold: <strong>${ev.ticketsSold}</strong></span>
          <span>Revenue: <strong>$${ev.revenue}</strong></span>
          <span>Check‑ins: <strong>${ev.checkins}</strong></span>
        </div>

        <div class="event-actions">
          <button onclick="viewEvent('${ev.id}')">View</button>
          <button onclick="manageEvent('${ev.id}')">Manage</button>
          <button onclick="viewCheckins('${ev.id}')">Check‑ins</button>
          <button onclick="editEvent('${ev.id}')">Edit</button>
        </div>
      </div>
    `;

    hostedEl.appendChild(card);
  });
}

/* LOAD PURCHASED TICKETS */
async function loadTickets() {
  ticketsEl.innerHTML = "<div class='loading'>Loading your tickets...</div>";

  const res = await fetch(`${API}/events/tickets/${user.id}`).catch(() => null);
  const data = res ? await res.json() : { tickets: [] };

  ticketsEl.innerHTML = "";

  if (!data.tickets.length) {
    ticketsEl.innerHTML = "<div class='empty'>You haven’t purchased any tickets yet.</div>";
    return;
  }

  data.tickets.forEach(t => {
    const card = document.createElement("div");
    card.className = "ticket-card";

    card.innerHTML = `
      <div class="ticket-info">
        <h4 class="ticket-title">${t.eventTitle}</h4>
        <p class="ticket-meta">${t.eventDate} • ${t.eventLocation}</p>
        <p class="ticket-id">Ticket ID: ${t.ticketId}</p>
      </div>

      <div class="ticket-actions">
        <button onclick="viewTicket('${t.ticketId}')">View Ticket</button>
        <button onclick="openQR('${t.ticketId}')">QR Code</button>
      </div>
    `;

    ticketsEl.appendChild(card);
  });
}

/* ACTIONS */
window.viewEvent = id => window.location.href = `/pages/events/pages/event.html?id=${id}`;
window.manageEvent = id => window.location.href = `/pages/events/pages/manage.html?id=${id}`;
window.viewCheckins = id => window.location.href = `/pages/events/pages/checkins.html?id=${id}`;
window.editEvent = id => window.location.href = `/pages/events/pages/edit.html?id=${id}`;
window.viewTicket = id => window.location.href = `/pages/events/pages/ticket.html?id=${id}`;
window.openQR = id => window.location.href = `/pages/events/pages/ticket-qr.html?id=${id}`;

/* INIT */
loadHosted();
loadTickets();
