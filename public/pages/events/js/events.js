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
  const events = [
    {
      id: 44,
      title: "Sunset Beltline Ride",
      date: "July 12, 2026 • 7:00 PM",
      location: "Eastside Trail",
      price: "$20",
    },
    {
      id: 45,
      title: "Vendor Pop-Up Market",
      date: "July 15, 2026 • 3:00 PM",
      location: "Old Fourth Ward",
      price: "Free",
    },
    {
      id: 46,
      title: "Night Flow Jam",
      date: "July 18, 2026 • 9:00 PM",
      location: "Ponce City Market",
      price: "$15",
    }
  ];

  const feed = document.getElementById("eventsFeed");

  events.forEach(evt => {
    const card = document.createElement("div");
    card.className = "event-card";
    card.innerHTML = `
      <div class="event-title">${evt.title}</div>
      <div class="event-info">${evt.date}</div>
      <div class="event-info">${evt.location}</div>
      <div class="event-info">Price: ${evt.price}</div>
      <div class="events-btn-primary" onclick="goTo('/pages/events/pages/event.html?id=${evt.id}')">
        View Event
      </div>
    `;
    feed.appendChild(card);
  });
}

/* ------------------------------
   CREATE EVENT (create.html)
------------------------------ */
if (document.getElementById("createEventForm")) {
  document.getElementById("createEventForm").addEventListener("submit", (e) => {
    e.preventDefault();

    const formData = new FormData(e.target);
    const eventObj = Object.fromEntries(formData.entries());

    localStorage.setItem("newEvent", JSON.stringify(eventObj));

    alert("Event Published!");
    goTo("/pages/events/pages/events.html");
  });
}

/* ------------------------------
   EVENT DETAILS + TICKET PURCHASE (event.html)
------------------------------ */
if (document.getElementById("eventDetails")) {
  const params = new URLSearchParams(window.location.search);
  const eventId = params.get("id");

  const eventDetails = document.getElementById("eventDetails");
  const ticketPriceDisplay = document.getElementById("ticketPriceDisplay");

  const sampleEvent = {
    id: eventId,
    title: "Sample Event",
    date: "July 20, 2026 • 6:00 PM",
    location: "Beltline Westside",
    description: "This is a sample event description.",
    price: 20
  };

  document.getElementById("eventTitle").innerText = sampleEvent.title;

  eventDetails.innerHTML = `
    <div class="event-title">${sampleEvent.title}</div>
    <div class="event-info">${sampleEvent.date}</div>
    <div class="event-info">${sampleEvent.location}</div>
    <div class="event-info">${sampleEvent.description}</div>
  `;

  function updatePrice() {
    const qty = Number(document.getElementById("ticketQuantity").value);
    const total = qty * sampleEvent.price;
    ticketPriceDisplay.innerText = "Total: $" + total.toFixed(2);
  }

  updatePrice();

  document.getElementById("ticketQuantity").addEventListener("input", updatePrice);

  document.getElementById("buyTicketBtn").addEventListener("click", () => {
    alert("Ticket Purchased! QR Code Sent.");
  });
}

/* ------------------------------
   MY EVENTS (mine.html)
------------------------------ */
if (document.getElementById("myHostedEvents")) {
  document.getElementById("myHostedEvents").innerHTML = `
    <div class="event-card">
      <div class="event-title">Your Hosted Event</div>
      <div class="event-info">July 12, 2026</div>
      <div class="event-info">Eastside Trail</div>
    </div>
  `;

  document.getElementById("myTickets").innerHTML = `
    <div class="event-card">
      <div class="event-title">Ticket: Sunset Beltline Ride</div>
      <div class="event-info">QR Code Sent</div>
    </div>
  `;
}

/* ------------------------------
   QR SCANNER (scan.html)
------------------------------ */
if (document.getElementById("scannerContainer")) {
  document.getElementById("scanResult").innerText = "Scanner Ready";
}
