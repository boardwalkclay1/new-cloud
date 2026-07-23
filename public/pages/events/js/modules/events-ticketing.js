// public/pages/events/js/modules/events-ticketing.js

const API = "https://api.beltlinecloud.com";

export function setupTicketing(event, user) {
  const tierList = document.getElementById("ticketTierList");
  const qty = document.getElementById("ticketQuantity");
  const priceDisplay = document.getElementById("ticketPriceDisplay");
  const buyBtn = document.getElementById("buyTicketBtn");
  const legal = document.getElementById("buyerLegalAgree");

  // Render tiers
  tierList.innerHTML = "";
  event.ticketTiers.forEach((tier, i) => {
    const btn = document.createElement("button");
    btn.className = "ticket-tier-btn";
    if (i === 0) btn.classList.add("active");

    btn.dataset.id = tier.id;
    btn.dataset.price = tier.price;

    btn.textContent = `${tier.name} • $${tier.price}`;

    btn.onclick = () => {
      document.querySelectorAll(".ticket-tier-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      updatePrice();
    };

    tierList.appendChild(btn);
  });

  qty.oninput = updatePrice;
  updatePrice();

  function updatePrice() {
    const active = document.querySelector(".ticket-tier-btn.active");
    if (!active) return;

    const price = Number(active.dataset.price);
    const count = Number(qty.value);
    const subtotal = price * count;
    const fee = subtotal * 0.10;
    const total = subtotal + fee;

    priceDisplay.textContent =
      `Subtotal: $${subtotal.toFixed(2)} • Platform Fee: $${fee.toFixed(2)} • Total: $${total.toFixed(2)}`;
  }

  buyBtn.onclick = async () => {
    if (!user) return alert("Login required.");
    if (!legal.checked) return alert("Please accept the legal notice.");

    const active = document.querySelector(".ticket-tier-btn.active");
    const tierId = active.dataset.id;
    const quantity = Number(qty.value);

    const res = await fetch(`${API}/api/events/paypal/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: user.id,
        eventId: event.id,
        tierId,
        quantity
      })
    });

    const data = await res.json();
    if (!data.approvalUrl) return alert("Payment error.");

    window.location.href = data.approvalUrl;
  };
}
