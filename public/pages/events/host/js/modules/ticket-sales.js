export function loadTicketScans(panel, user) {
  panel.innerHTML = `
    <h2>Ticket Scanning</h2>
    <p>Scan QR codes to validate tickets.</p>
    <button id="scanBtn">Start Scanner</button>
    <div id="scanResult"></div>
  `;

  const scanResult = panel.querySelector("#scanResult");

  panel.querySelector("#scanBtn").onclick = async () => {
    const qr = prompt("Enter QR code manually (camera scanner coming soon):");
    if (!qr) return;

    const res = await fetch(`/api/events/ticket/validate?qrCode=${qr}`);
    const data = await res.json();

    if (!data.valid) {
      scanResult.innerHTML = `<div class="error">Invalid or used ticket.</div>`;
      return;
    }

    scanResult.innerHTML = `
      <div class="ticket-valid">
        <h3>${data.eventTitle}</h3>
        <p>${data.eventDate} • ${data.eventTime}</p>
        <p>Ticket ID: ${data.ticketId}</p>
        <button id="useTicketBtn">Mark Used</button>
      </div>
    `;

    panel.querySelector("#useTicketBtn").onclick = async () => {
      const res2 = await fetch("/api/events/ticket/use", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticketId: data.ticketId })
      });

      const d2 = await res2.json();
      if (d2.success) scanResult.innerHTML = `<div class="success">Ticket marked used.</div>`;
    };
  };
}
