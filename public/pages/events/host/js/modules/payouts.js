export async function loadPayouts(panel, user) {
  panel.innerHTML = `<h2>Payouts</h2><div id="payoutList"></div>`;

  const list = panel.querySelector("#payoutList");

  const res = await fetch(`/api/events/host/history?userId=${user.id}`);
  const events = await res.json();

  list.innerHTML = events.map(ev => `
    <div class="payout-card">
      <h3>${ev.title}</h3>
      <p>Gross Revenue: $${ev.grossRevenue.toFixed(2)}</p>
      <p>Platform Fees: $${ev.platformFees.toFixed(2)}</p>
      <p>Host Revenue: $${ev.hostRevenue.toFixed(2)}</p>
      <p>Payout Status: pending</p>
    </div>
  `).join("");
}
