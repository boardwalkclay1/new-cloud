// =========================================================
// BELTLINE CLOUD — RESPONSE UNIT ENGINE (MASTER JS)
// =========================================================

const RESPONSE_API  = "/api/response";        // groups, members, ranks, activity
const SAFETY_API    = "/api/safety";          // alerts (cloud_safety_alerts)
const CHAT_API      = "/api/chat";            // incident channels
const PROFILE_API   = "/api/profile";         // badges, status

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
// RESPONSE MEMBER SIGNUP (FROM CLOUD USER)
// =========================================================
// payload = { userId, groupId, preferredRole }
// =========================================================
export async function signupResponseMember(payload) {
  return cloudAPI(`${RESPONSE_API}/members/signup`, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

// =========================================================
// VERIFY RESPONSE MEMBER (ADMIN)
// =========================================================
export async function verifyResponseMember(memberId, approved) {
  return cloudAPI(`${RESPONSE_API}/members/verify`, {
    method: "POST",
    body: JSON.stringify({
      memberId,
      approved
    })
  });
}

// =========================================================
// LOAD RESPONSE UNIT ROSTER (BY GROUP)
// =========================================================
export async function loadResponseUnitRoster(groupId) {
  return cloudAPI(`${RESPONSE_API}/groups/${groupId}/members`);
}

// =========================================================
// SET RESPONSE MEMBER RANK (ADMIN)
// =========================================================
export async function setResponseMemberRank(memberId, rank) {
  return cloudAPI(`${RESPONSE_API}/members/rank`, {
    method: "POST",
    body: JSON.stringify({
      memberId,
      rank
    })
  });
}

// =========================================================
// CREATE INCIDENT FROM SAFETY ALERT
// =========================================================
// alertPayload = {
//   userId,
//   mode,       // "fall", "snatch", "highrisk", "vendor", etc.
//   location,   // { lat, lng } or string
//   severity,   // "low", "medium", "high"
//   mediaUrl,   // optional
//   timestamp
// }
// =========================================================
export async function createIncidentFromAlert(alertPayload) {
  const alert = await cloudAPI(`${SAFETY_API}/alerts/create`, {
    method: "POST",
    body: JSON.stringify(alertPayload)
  });

  const assigned = await cloudAPI(`${RESPONSE_API}/assign`, {
    method: "POST",
    body: JSON.stringify({
      alertId: alert.id
    })
  });

  await createIncidentChannel(alert, assigned);

  return { alert, assigned };
}

// =========================================================
// CREATE INCIDENT CHANNEL (CHAT)
// =========================================================
async function createIncidentChannel(alert, assignedMembers) {
  const memberIds = assignedMembers.map(m => m.id);

  return cloudAPI(`${CHAT_API}/incident-channel`, {
    method: "POST",
    body: JSON.stringify({
      alertId: alert.id,
      userId: alert.userId,
      memberIds
    })
  });
}

// =========================================================
// CLOSE INCIDENT + AWARD REPUTATION POINTS
// =========================================================
export async function closeIncident(alertId) {
  const alert = await cloudAPI(`${SAFETY_API}/alerts/close`, {
    method: "POST",
    body: JSON.stringify({ alertId })
  });

  const members = await cloudAPI(`${RESPONSE_API}/incident/members`, {
    method: "POST",
    body: JSON.stringify({ alertId })
  });

  await awardReputationPoints(alertId, members);

  return { alert, members };
}

// =========================================================
// AWARD REPUTATION POINTS (5 PER MEMBER)
// =========================================================
async function awardReputationPoints(alertId, members) {
  const updates = members.map(m => ({
    memberId: m.id,
    points: 5,
    alertId
  }));

  return cloudAPI(`${RESPONSE_API}/reputation/award`, {
    method: "POST",
    body: JSON.stringify({ updates })
  });
}

// =========================================================
// INCIDENT / ALERT HISTORY
// =========================================================
export async function getAlertHistory(filters = {}) {
  return cloudAPI(`${SAFETY_API}/alerts/history`, {
    method: "POST",
    body: JSON.stringify(filters)
  });
}

// =========================================================
// RESPONSE MEMBER PROFILE + REPUTATION
// =========================================================
export async function getResponseMemberProfile(memberId) {
  const profile = await cloudAPI(`${RESPONSE_API}/members/${memberId}`);
  const reputation = await cloudAPI(`${RESPONSE_API}/reputation/${memberId}`);

  return { profile, reputation };
}

// =========================================================
// RESPONSE CHANNEL VOICE NOTE
// =========================================================
export async function sendResponseVoiceNote(channelId, memberId, audioUrl) {
  return cloudAPI(`${CHAT_API}/response-voice`, {
    method: "POST",
    body: JSON.stringify({
      channelId,
      memberId,
      audioUrl
    })
  });
}

// =========================================================
// SYNC RESPONSE BADGE TO CLOUD USER PROFILE
// =========================================================
export async function syncResponseBadge(userId, badgeFile) {
  return cloudAPI(`${PROFILE_API}/badge/assign`, {
    method: "POST",
    body: JSON.stringify({
      userId,
      badgeFile,
      category: "response-unit"
    })
  });
}

// =========================================================
// UI HELPERS
// =========================================================
export async function initResponseMemberSignup(formId, groupId) {
  const form = document.getElementById(formId);
  form.onsubmit = async (e) => {
    e.preventDefault();

    const payload = {
      userId: form.querySelector("#ruUserId").value,
      groupId,
      preferredRole: form.querySelector("#ruRole").value
    };

    await signupResponseMember(payload);
    alert("Response membership submitted. Pending verification.");
  };
}

export async function renderResponseUnitRoster(containerId, groupId) {
  const container = document.getElementById(containerId);
  const roster = await loadResponseUnitRoster(groupId);

  container.innerHTML = "";

  roster.forEach(m => {
    const div = document.createElement("div");
    div.className = "ru-card";
    div.innerHTML = `
      <h3>${m.name}</h3>
      <p>Rank: ${m.rank}</p>
      <p>Status: ${m.status}</p>
      <button onclick="window.promoteMember('${m.id}')">Promote</button>
      <button onclick="window.demoteMember('${m.id}')">Demote</button>
    `;
    container.appendChild(div);
  });

  window.promoteMember = async (id) => {
    await setResponseMemberRank(id, "guardian");
    location.reload();
  };

  window.demoteMember = async (id) => {
    await setResponseMemberRank(id, "responder1");
    location.reload();
  };
}
