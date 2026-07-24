export async function loadMyEvents(panel, user) {
  panel.innerHTML = `<h2>My Events</h2><div id="myEventsList"></div>`;

  const list = panel.querySelector("#myEventsList");

  const res = await fetch(`/api/events/host/history?userId=${user.id}`);
  const events = await res.json();

  list.innerHTML = events.map(ev => `
    <div class="event-card">
      <h3>${ev.title}</h3>
      <p>${ev.date} • ${ev.time}</p>
      <p>Revenue: $${ev.hostRevenue.toFixed(2)}</p>
      <p>Tickets: ${ev.totalTickets}</p>
      <button onclick="location.href='/events/event?eventId=${ev.eventId}'">View Event</button>
    </div>
  `).join("");
}
