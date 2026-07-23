// /public/pages/messages/js/chatrooms/chatrooms-voice.js
// VOICE CHATROOM ENGINE — WebRTC + signaling + presence

const API = "https://api.beltlinecloud.com";
const Auth = window.Auth;

let localStream = null;
let peerConnections = {};
let roomIdGlobal = null;

/* ---------------------------------------------------------
   LOAD VOICE ROOMS
--------------------------------------------------------- */
export async function loadVoiceRooms(user) {
  try {
    const res = await fetch(`${API}/api/chatrooms/voice/list?userId=${user.id}`);
    const rooms = await res.json();

    return (rooms || []).map(r => ({
      id: r.id,
      name: r.name,
      preview: "Voice room",
      avatar: "/assets/img/cloud/voice.png",
      meta: { type: "voice", roomId: r.id }
    }));
  } catch (err) {
    console.error("loadVoiceRooms error:", err);
    return [];
  }
}

/* ---------------------------------------------------------
   OPEN VOICE ROOM
--------------------------------------------------------- */
export async function openVoiceRoom(user, roomId, viewEl) {
  roomIdGlobal = roomId;

  viewEl.innerHTML = `
    <div class="voice-room">
      <h2>Voice Chatroom</h2>
      <button id="voiceJoinBtn" class="thread-btn green">Join Voice</button>
      <button id="voiceLeaveBtn" class="thread-btn red">Leave Voice</button>

      <div id="voiceUsers" class="voice-users"></div>
    </div>
  `;

  el("voiceJoinBtn").onclick = () => joinVoiceRoom(user, roomId);
  el("voiceLeaveBtn").onclick = () => leaveVoiceRoom(user, roomId);

  /* PRESENCE REFRESH */
  setInterval(async () => {
    const res = await fetch(`${API}/api/chatrooms/voice/presence?roomId=${roomId}`);
    const users = await res.json();

    const list = el("voiceUsers");
    list.innerHTML = "";

    (users || []).forEach(u => {
      const div = document.createElement("div");
      div.className = "voice-user";
      div.textContent = u.name || u.userId;
      list.appendChild(div);
    });
  }, 2000);
}

/* ---------------------------------------------------------
   JOIN VOICE ROOM
--------------------------------------------------------- */
async function joinVoiceRoom(user, roomId) {
  await fetch(`${API}/api/chatrooms/voice/join`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId: user.id, roomId })
  });

  localStream = await navigator.mediaDevices.getUserMedia({ audio: true });

  /* SIGNAL JOIN */
  await fetch(`${API}/api/chatrooms/voice/signal/join`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ roomId, userId: user.id })
  });

  startSignalingLoop(user, roomId);
}

/* ---------------------------------------------------------
   LEAVE VOICE ROOM
--------------------------------------------------------- */
async function leaveVoiceRoom(user, roomId) {
  await fetch(`${API}/api/chatrooms/voice/leave`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId: user.id, roomId })
  });

  if (localStream) {
    localStream.getTracks().forEach(t => t.stop());
  }

  Object.values(peerConnections).forEach(pc => pc.close());
  peerConnections = {};
}

/* ---------------------------------------------------------
   SIGNALING LOOP (WebRTC)
--------------------------------------------------------- */
async function startSignalingLoop(user, roomId) {
  setInterval(async () => {
    const res = await fetch(
      `${API}/api/chatrooms/voice/signal/poll?roomId=${roomId}&userId=${user.id}`
    );
    const signals = await res.json();

    for (const sig of signals) {
      if (!peerConnections[sig.from]) {
        peerConnections[sig.from] = createPeerConnection(user, roomId, sig.from);
      }

      const pc = peerConnections[sig.from];

      if (sig.offer) {
        await pc.setRemoteDescription(new RTCSessionDescription(sig.offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        await fetch(`${API}/api/chatrooms/voice/signal/answer`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            roomId,
            fromUserId: user.id,
            toUserId: sig.from,
            answer
          })
        });
      }

      if (sig.answer) {
        await pc.setRemoteDescription(new RTCSessionDescription(sig.answer));
      }

      if (sig.ice) {
        try {
          await pc.addIceCandidate(sig.ice);
        } catch (err) {
          console.error("ICE error:", err);
        }
      }
    }
  }, 1500);
}

/* ---------------------------------------------------------
   CREATE PEER CONNECTION
--------------------------------------------------------- */
function createPeerConnection(user, roomId, remoteUserId) {
  const pc = new RTCPeerConnection({
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
  });

  /* LOCAL AUDIO */
  if (localStream) {
    localStream.getTracks().forEach(track => pc.addTrack(track, localStream));
  }

  /* REMOTE AUDIO */
  pc.ontrack = event => {
    const audio = document.createElement("audio");
    audio.srcObject = event.streams[0];
    audio.autoplay = true;
    document.body.appendChild(audio);
  };

  /* ICE CANDIDATES */
  pc.onicecandidate = async event => {
    if (event.candidate) {
      await fetch(`${API}/api/chatrooms/voice/signal/ice`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomId,
          fromUserId: user.id,
          toUserId: remoteUserId,
          ice: event.candidate
        })
      });
    }
  };

  return pc;
}

/* ---------------------------------------------------------
   DOM HELPER
--------------------------------------------------------- */
function el(id) {
  return document.getElementById(id);
}
