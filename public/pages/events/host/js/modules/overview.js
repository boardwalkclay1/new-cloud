export async function loadOverview(panel, user) {
  panel.innerHTML = `
    <h2>Overview</h2>
    <div id="overviewStats" class="overview-stats"></div>
    <div id="overviewEvents" class="overview-events"></div>
  `;

  const statsEl = panel.querySelector("#overviewStats");
  const eventsEl = panel.querySelector("#overviewEvents");

  const res = await fetch(`/api/events/host/history?userId=${user.id}`);
  const history = await res.json();

  let totalRevenue = 0;
  let totalTickets = 0;

  history.forEach(ev => {
    totalRevenue += ev.hostRevenue || 0;
    totalTickets += ev.totalTickets || 0;
  });

  statsEl.innerHTML = `
    <div class="stat-card">Total Revenue: $${totalRevenue.toFixed(2)}</div>
    <div class="stat-card">Total Tickets Sold: ${totalTickets}</div>
    <div class="stat-card">Events Hosted: ${history.length}</div>
  `;

  eventsEl.innerHTML = history.map(ev => `
    <div class="event-card">
      <h3>${ev.title}</h3>
      <p>${ev.date} • ${ev.time}</p>
      <p>Revenue: $${ev.hostRevenue.toFixed(2)}</p>
      <p>Tickets: ${ev.totalTickets}</p>
    </div>
  `).join("");
}
