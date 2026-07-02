// =========================================================
// BELTLINE CLOUD — RESPONSE UNIT ENGINE (MASTER JS)
// =========================================================
// This file controls:
// - Responder signup + verification
// - Response Unit roster loading
// - Incident creation + assignment
// - First Response Chat creation
// - Reputation points per incident (5 per responder)
// - Incident history tracking
// - Integration with Worker APIs
// =========================================================

const RU_API      = "https://api.beltlinecloud.com/response-unit";
const INCIDENT_API = "https://api.beltlinecloud.com/incidents";
const CHAT_API     = "https://api.beltlinecloud.com/chat";
const PROFILE_API  = "https://api.beltlinecloud.com/profile";

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
// RESPONDER SIGNUP FLOW
// =========================================================
// Called from Response Unit signup form
// Required: name, idNumber, photoUrl, contact, preferredRole
// =========================================================
export async function signupResponder(payload) {
  // payload = { name, idNumber, photoUrl, contact, preferredRole }
  return cloudAPI(`${RU_API}/signup`, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

// =========================================================
// RESPONDER VERIFICATION (ADMIN)
// =========================================================
// You approve responders from Cloud Admin Dash
// =========================================================
export async function verifyResponder(responderId, approved) {
  return cloudAPI(`${RU_API}/verify`, {
    method: "POST",
    body: JSON.stringify({
      responderId,
      approved
    })
  });
}

// =========================================================
// LOAD RESPONSE UNIT ROSTER (ADMIN VIEW)
// =========================================================
export async function loadResponseUnitRoster() {
  return cloudAPI(`${RU_API}/roster`);
}

// =========================================================
// PROMOTE / DEMOTE RESPONDER (ADMIN)
// =========================================================
export async function setResponderRank(responderId, rank) {
  // rank: "responder1", "responder2", "responder3", "sentinel", "guardian", "commander", "chief"
  return cloudAPI(`${RU_API}/rank`, {
    method: "POST",
    body: JSON.stringify({
      responderId,
      rank
    })
  });
}

// =========================================================
// CREATE INCIDENT (FROM SAFETY CLOUD ALERT)
// =========================================================
// Called when any Safety CLOUD alert fires
// incidentPayload = {
//   userId,
//   mode,          // "fall", "snatch", "highrisk", "vendor", etc.
//   location,      // { lat, lng }
//   severity,      // "low", "medium", "high"
//   mediaUrl,      // optional
//   timestamp
// }
// =========================================================
export async function createIncident(incidentPayload) {
  const incident = await cloudAPI(`${INCIDENT_API}/create`, {
    method: "POST",
    body: JSON.stringify(incidentPayload)
  });

  // Auto-assign responders (Worker decides who)
  const assigned = await cloudAPI(`${RU_API}/assign`, {
    method: "POST",
    body: JSON.stringify({
      incidentId: incident.id
    })
  });

  // Create First Response Chat
  await createFirstResponseChat(incident, assigned);

  return { incident, assigned };
}

// =========================================================
// CREATE FIRST RESPONSE CHAT (PER INCIDENT)
// =========================================================
async function createFirstResponseChat(incident, assignedResponders) {
  const responderIds = assignedResponders.map(r => r.id);

  return cloudAPI(`${CHAT_API}/incident-channel`, {
    method: "POST",
    body: JSON.stringify({
      incidentId: incident.id,
      userId: incident.userId,
      responderIds
    })
  });
}

// =========================================================
// CLOSE INCIDENT + AWARD REPUTATION POINTS
// =========================================================
// When incident is resolved, called from admin or Guardian/Commander
// Everyone involved gets +5 reputation points
// =========================================================
export async function closeIncident(incidentId) {
  // Mark incident closed
  const incident = await cloudAPI(`${INCIDENT_API}/close`, {
    method: "POST",
    body: JSON.stringify({ incidentId })
  });

  // Get responders involved
  const responders = await cloudAPI(`${RU_API}/incident-responders`, {
    method: "POST",
    body: JSON.stringify({ incidentId })
  });

  // Award reputation points
  await awardReputationPoints(incidentId, responders);

  return { incident, responders };
}

// =========================================================
// AWARD REPUTATION POINTS (5 PER RESPONDER)
// =========================================================
async function awardReputationPoints(incidentId, responders) {
  const updates = responders.map(r => ({
    responderId: r.id,
    points: 5,
    incidentId
  }));

  return cloudAPI(`${RU_API}/reputation/award`, {
    method: "POST",
    body: JSON.stringify({ updates })
  });
}

// =========================================================
// GET INCIDENT HISTORY (ADMIN / RESPONDER VIEW)
// =========================================================
export async function getIncidentHistory(filters = {}) {
  // filters can include: responderId, userId, mode, severity, dateRange
  return cloudAPI(`${INCIDENT_API}/history`, {
    method: "POST",
    body: JSON.stringify(filters)
  });
}

// =========================================================
// GET RESPONDER PROFILE + REPUTATION SUMMARY
// =========================================================
export async function getResponderProfile(responderId) {
  const profile = await cloudAPI(`${RU_API}/responder/${responderId}`);
  const reputation = await cloudAPI(`${RU_API}/reputation/${responderId}`);

  return { profile, reputation };
}

// =========================================================
// WALKIE-TALKIE STYLE COMMUNICATION (RESPONSE CHANNEL)
// =========================================================
// Simple push-to-talk style: send short voice note to response channel
// =========================================================
export async function sendResponseVoiceNote(channelId, responderId, audioUrl) {
  return cloudAPI(`${CHAT_API}/response-voice`, {
    method: "POST",
    body: JSON.stringify({
      channelId,
      responderId,
      audioUrl
    })
  });
}

// =========================================================
// LINK RESPONSE UNIT TO PROFILE (BADGE + STATUS)
// =========================================================
// Called when responder is verified or rank changes
// =========================================================
export async function syncResponderProfileBadge(responderId, badgeFile) {
  return cloudAPI(`${PROFILE_API}/badge/assign`, {
    method: "POST",
    body: JSON.stringify({
      userId: responderId,
      badgeFile,
      category: "response-unit"
    })
  });
}

// =========================================================
// UI HELPERS (FOR RESPONSE UNIT PAGES)
// =========================================================
export async function initResponseUnitSignup(formId) {
  const form = document.getElementById(formId);
  form.onsubmit = async (e) => {
    e.preventDefault();

    const payload = {
      name: form.querySelector("#ruName").value,
      idNumber: form.querySelector("#ruIdNumber").value,
      photoUrl: form.querySelector("#ruPhotoUrl").value,
      contact: form.querySelector("#ruContact").value,
      preferredRole: form.querySelector("#ruRole").value
    };

    await signupResponder(payload);
    alert("Response Unit signup submitted. Pending verification.");
  };
}

export async function renderResponseUnitRoster(containerId) {
  const container = document.getElementById(containerId);
  const roster = await loadResponseUnitRoster();

  container.innerHTML = "";

  roster.forEach(r => {
    const div = document.createElement("div");
    div.className = "ru-card";
    div.innerHTML = `
      <img src="${r.photoUrl}" class="ru-photo">
      <h3>${r.name}</h3>
      <p>Rank: ${r.rank}</p>
      <p>Status: ${r.status}</p>
      <button onclick="window.promote('${r.id}')">Promote</button>
      <button onclick="window.demote('${r.id}')">Demote</button>
    `;
    container.appendChild(div);
  });

  // Expose promote/demote for admin
  window.promote = async (id) => {
    // You can wire a rank selector in UI; here we just example promote to next
    await setResponderRank(id, "guardian");
    location.reload();
  };

  window.demote = async (id) => {
    await setResponderRank(id, "responder1");
    location.reload();
  };
}
