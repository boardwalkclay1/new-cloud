// =========================================================
// BELTLINE CLOUD — GLOBAL REPUTATION ENGINE
// =========================================================
// This file controls:
// - Reputation point storage
// - Reputation point awarding
// - Reputation point deduction
// - Reputation history logging
// - Reputation syncing to profiles
// - Reputation syncing to Response Unit
// - Reputation syncing to Fast Roll + Vendors
// - Incident-based reputation updates
// - Admin dashboard reputation controls
// =========================================================

const REP_API      = "https://api.beltlinecloud.com/reputation";
const PROFILE_API  = "https://api.beltlinecloud.com/profile";
const INCIDENT_API = "https://api.beltlinecloud.com/incidents";
const RU_API       = "https://api.beltlinecloud.com/response-unit";

// =========================================================
// API WRAPPER
// =========================================================
async function cloudAPI(path, options = {}) {
  const res = await fetch(path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  });

  if (!res.ok) throw new Error(`Cloud API Error: ${res.status}`);
  return res.json();
}

// =========================================================
// GET USER REPUTATION SUMMARY
// =========================================================
export async function getReputation(userId) {
  return cloudAPI(`${REP_API}/user/${userId}`);
}

// =========================================================
// AWARD REPUTATION POINTS
// =========================================================
// Used by Response Unit engine, Fast Roll engine, Vendor engine,
// and Safety CLOUD incident system.
// =========================================================
export async function awardPoints(userId, points, reason, incidentId = null) {
  const payload = {
    userId,
    points,
    reason,
    incidentId,
    timestamp: Date.now()
  };

  // Update reputation table
  const repUpdate = await cloudAPI(`${REP_API}/award`, {
    method: "POST",
    body: JSON.stringify(payload)
  });

  // Sync to profile
  await syncProfileReputation(userId);

  return repUpdate;
}

// =========================================================
// DEDUCT REPUTATION POINTS (Admin Only)
// =========================================================
export async function deductPoints(userId, points, reason) {
  const payload = {
    userId,
    points,
    reason,
    timestamp: Date.now()
  };

  const repUpdate = await cloudAPI(`${REP_API}/deduct`, {
    method: "POST",
    body: JSON.stringify(payload)
  });

  await syncProfileReputation(userId);

  return repUpdate;
}

// =========================================================
// SYNC REPUTATION TO PROFILE
// =========================================================
async function syncProfileReputation(userId) {
  const rep = await getReputation(userId);

  return cloudAPI(`${PROFILE_API}/reputation/update`, {
    method: "POST",
    body: JSON.stringify({
      userId,
      totalPoints: rep.totalPoints,
      history: rep.history
    })
  });
}

// =========================================================
// INCIDENT-BASED REPUTATION AWARD
// =========================================================
// Called after incident closes.
// Awards 5 points to every responder involved.
// =========================================================
export async function awardIncidentPoints(incidentId) {
  // Get responders involved
  const responders = await cloudAPI(`${RU_API}/incident-responders`, {
    method: "POST",
    body: JSON.stringify({ incidentId })
  });

  const updates = [];

  for (const responder of responders) {
    const update = await awardPoints(
      responder.id,
      5,
      "Incident Response",
      incidentId
    );
    updates.push(update);
  }

  return updates;
}

// =========================================================
// GET FULL REPUTATION HISTORY (Admin)
// =========================================================
export async function getReputationHistory(filters = {}) {
  return cloudAPI(`${REP_API}/history`, {
    method: "POST",
    body: JSON.stringify(filters)
  });
}

// =========================================================
// ADMIN: RESET USER REPUTATION
// =========================================================
export async function resetReputation(userId) {
  await cloudAPI(`${REP_API}/reset`, {
    method: "POST",
    body: JSON.stringify({ userId })
  });

  await syncProfileReputation(userId);
}

// =========================================================
// ADMIN: SET REPUTATION TO SPECIFIC VALUE
// =========================================================
export async function setReputation(userId, points) {
  await cloudAPI(`${REP_API}/set`, {
    method: "POST",
    body: JSON.stringify({ userId, points })
  });

  await syncProfileReputation(userId);
}

// =========================================================
// UI HELPERS (For Admin Dash)
// =========================================================
export async function renderReputationPanel(containerId, userId) {
  const container = document.getElementById(containerId);
  const rep = await getReputation(userId);

  container.innerHTML = `
    <h3>Total Reputation: ${rep.totalPoints}</h3>
    <div class="rep-history">
      ${rep.history.map(h => `
        <div class="rep-entry">
          <p><strong>${h.points > 0 ? "+" : ""}${h.points} pts</strong> — ${h.reason}</p>
          <p>${new Date(h.timestamp).toLocaleString()}</p>
          ${h.incidentId ? `<p>Incident: ${h.incidentId}</p>` : ""}
        </div>
      `).join("")}
    </div>
  `;
}

// =========================================================
// UI HELPERS: AWARD / DEDUCT BUTTONS
// =========================================================
export function initReputationControls(containerId, userId) {
  const container = document.getElementById(containerId);

  container.innerHTML = `
    <div class="rep-controls">
      <input id="repPoints" type="number" placeholder="Points">
      <input id="repReason" type="text" placeholder="Reason">
      <button onclick="window._award()">Award</button>
      <button onclick="window._deduct()">Deduct</button>
      <button onclick="window._reset()">Reset</button>
    </div>
  `;

  window._award = async () => {
    const pts = Number(document.getElementById("repPoints").value);
    const reason = document.getElementById("repReason").value;
    await awardPoints(userId, pts, reason);
    location.reload();
  };

  window._deduct = async () => {
    const pts = Number(document.getElementById("repPoints").value);
    const reason = document.getElementById("repReason").value;
    await deductPoints(userId, pts, reason);
    location.reload();
  };

  window._reset = async () => {
    await resetReputation(userId);
    location.reload();
  };
}
