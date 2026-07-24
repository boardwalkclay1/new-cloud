export function loadCreateEvent(panel, user) {
  panel.innerHTML = `
    <h2>Create Event</h2>

    <div class="form-group">
      <label>Title</label>
      <input id="evTitle">
    </div>

    <div class="form-group">
      <label>Tagline</label>
      <input id="evTagline">
    </div>

    <div class="form-group">
      <label>Description</label>
      <textarea id="evDesc"></textarea>
    </div>

    <div class="form-group">
      <label>Date</label>
      <input type="date" id="evDate">
    </div>

    <div class="form-group">
      <label>Time</label>
      <input type="time" id="evTime">
    </div>

    <div class="form-group">
      <label>Location</label>
      <input id="evLocation">
    </div>

    <div class="form-group">
      <label>Main Photo URL</label>
      <input id="evPhoto">
    </div>

    <h3>Ticket Tiers</h3>
    <div id="tierList"></div>
    <button id="addTierBtn">Add Tier</button>

    <label class="legal-check">
      <input type="checkbox" id="evLegal">
      I accept the Beltline Cloud event hosting legal agreement.
    </label>

    <button id="createEventBtn" class="primary-btn">Create Event</button>
  `;

  const tierList = panel.querySelector("#tierList");
  const addTierBtn = panel.querySelector("#addTierBtn");

  addTierBtn.onclick = () => {
    const div = document.createElement("div");
    div.className = "tier-item";
    div.innerHTML = `
      <input placeholder="Tier Name">
      <input placeholder="Price" type="number">
      <input placeholder="Max Quantity (optional)" type="number">
      <label><input type="checkbox"> Early Bird</label>
    `;
    tierList.appendChild(div);
  };

  panel.querySelector("#createEventBtn").onclick = async () => {
    const title = panel.querySelector("#evTitle").value.trim();
    const date = panel.querySelector("#evDate").value;
    const time = panel.querySelector("#evTime").value;
    const location = panel.querySelector("#evLocation").value.trim();
    const legal = panel.querySelector("#evLegal").checked;

    if (!title || !date || !time || !location || !legal)
      return alert("Missing required fields or legal not accepted.");

    const tiers = [...tierList.children].map(div => {
      const inputs = div.querySelectorAll("input");
      return {
        name: inputs[0].value.trim(),
        price: Number(inputs[1].value),
        maxQuantity: Number(inputs[2].value) || null,
        earlyBird: inputs[3].checked
      };
    });

    const res = await fetch("/api/events/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        hostUserId: user.id,
        title,
        tagline: panel.querySelector("#evTagline").value.trim(),
        description: panel.querySelector("#evDesc").value.trim(),
        date,
        time,
        location,
        mainPhotoUrl: panel.querySelector("#evPhoto").value.trim(),
        ticketTiers: tiers,
        legalAccepted: true
      })
    });

    const data = await res.json();
    if (!data.success) return alert("Error creating event.");

    alert("Event created!");
  };
}
