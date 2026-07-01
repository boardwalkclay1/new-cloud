/* CLOUD EVENTS — MASTER JS FILE */

/* ------------------------------
   NAVIGATION
------------------------------ */
function goTo(path) {
  window.location.href = path;
}

/* ------------------------------
   UPCOMING EVENTS FEED (events.html)
------------------------------ */
if (document.getElementById("eventsFeed")) {
  fetch("/api/events/list")
    .then(res => res.json())
    .then(events => {
      const feed = document.getElementById("eventsFeed");
      feed.innerHTML = "";

      events.forEach(evt => {
        const card = document.createElement("div");
        card.className = "event-card";
        card.innerHTML = `
          <div class="event-title">${evt.title}</div>
          <div class="event-info">${evt.date}</div>
          <div class="event-info">${evt.location}</div>
          <div class="event-info">Price: $${evt.price}</div>
          <div class="events-btn-primary" onclick="goTo('/pages/events/pages/event.html?id=${evt.id}')">
            View Event
          </div>
        `;
        feed.appendChild(card);
      });
    });
}

/* ------------------------------
   CREATE EVENT (create.html)
------------------------------ */
if (document.getElementById("createEventForm")) {
  document.getElementById("createEventForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const formData = new FormData(e.target);
    const eventObj = Object.fromEntries(formData.entries());

    await fetch("/api/events/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(eventObj)
    });

    goTo("/pages/events/pages/events.html");
  });
}

/* ------------------------------
   EVENT DETAILS + TICKET PURCHASE (event.html)
------------------------------ */
if (document.getElementById("eventDetails")) {
  const params = new URLSearchParams(window.location.search);
  const eventId = params.get("id");

  fetch(`/api/events/get?id=${eventId}`)
    .then(res => res.json())
    .then(evt => {
      document.getElementById("eventTitle").innerText = evt.title;

      document.getElementById("eventDetails").innerHTML = `
        <div class="event-title">${evt.title}</div>
        <div class="event-info">${evt.date}</div>
        <div class="event-info">${evt.location}</div>
        <div class="event-info">${evt.description}</div>
      `;

      const ticketPriceDisplay = document.getElementById("ticketPriceDisplay");

      function updatePrice() {
        const qty = Number(document.getElementById("ticketQuantity").value);
        const total = qty * evt.price;
        ticketPriceDisplay.innerText = "Total: $" + total.toFixed(2);
      }

      updatePrice();
      document.getElementById("ticketQuantity").addEventListener("input", updatePrice);
    });
}

/* ------------------------------
   MY EVENTS (mine.html)
------------------------------ */
if (document.getElementById("myHostedEvents")) {
  document.getElementById("myHostedEvents").innerHTML = `
    <div class="event-card">
      <div class="event-title">Your Hosted Event</div>
      <div class="event-info">Coming Soon</div>
    </div>
  `;

  document.getElementById("myTickets").innerHTML = `
    <div class="event-card">
      <div class="event-title">Your Tickets</div>
      <div class="event-info">Coming Soon</div>
    </div>
  `;
}

/* ------------------------------
   QR SCANNER (scan.html)
------------------------------ */
if (document.getElementById("scannerContainer")) {
  document.getElementById("scanResult").innerText = "Scanner Ready";
}
