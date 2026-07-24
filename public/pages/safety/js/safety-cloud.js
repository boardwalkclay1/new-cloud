/* public/pages/safety/js/cloud.js */

/* ---------------------------------------------------------
   LOAD USER
--------------------------------------------------------- */
const user = JSON.parse(localStorage.getItem("cloud_user"));
if (!user) {
  alert("User not logged in.");
  window.location.href = "/pages/login.html";
}

/* ---------------------------------------------------------
   SIDE MENU TOGGLE
--------------------------------------------------------- */
const menuBtn = document.getElementById("menuBtn");
const sideMenu = document.getElementById("sideMenu");

menuBtn?.addEventListener("click", () => {
  sideMenu.classList.toggle("hidden");
});

/* ---------------------------------------------------------
   FULL DESCRIPTION DROPDOWN
--------------------------------------------------------- */
const fullDescTitle = document.querySelector(".full-desc-title");
const fullDescContent = document.getElementById("fullDescContent");

fullDescTitle?.addEventListener("click", () => {
  fullDescContent.classList.toggle("hidden");
});

/* ---------------------------------------------------------
   CATEGORY DROPDOWNS
--------------------------------------------------------- */
function toggleDrop(id) {
  const el = document.getElementById(id);
  if (el) el.classList.toggle("hidden");
}

/* ---------------------------------------------------------
   SAFETY CLOUD MODE
--------------------------------------------------------- */
const safetyModeSelect = document.getElementById("safetyModeSelect");

if (safetyModeSelect) {
  safetyModeSelect.addEventListener("change", async () => {
    const mode = safetyModeSelect.value;

    await fetch("https://api.beltlinecloud.com/api/safety/mode", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-User-Email": user.email,
        "X-User-Id": user.id
      },
      body: JSON.stringify({
        userId: user.id,
        mode
      })
    });

    localStorage.setItem("safety_mode", mode);
  });
}

/* ---------------------------------------------------------
   EMERGENCY ALERT BUTTON
--------------------------------------------------------- */
const emergencyButton = document.getElementById("globalAlertBtn");

emergencyButton?.addEventListener("click", async () => {
  emergencyButton.disabled = true;
  emergencyButton.textContent = "Sending Emergency Alert…";

  navigator.geolocation.getCurrentPosition(async pos => {
    const payload = {
      userId: user.id,
      email: user.email,
      lat: pos.coords.latitude,
      lon: pos.coords.longitude,
      timestamp: Date.now()
    };

    await fetch("https://api.beltlinecloud.com/api/response/emergency", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-User-Email": user.email,
        "X-User-Id": user.id
      },
      body: JSON.stringify(payload)
    });

    startEmergencyRecording();

  }, () => {
    alert("Location permission denied.");
    emergencyButton.disabled = false;
    emergencyButton.textContent = "⚠️ Emergency — Contact Response Unit";
  });
});

/* ---------------------------------------------------------
   EMERGENCY RECORDING (AUDIO + VIDEO)
--------------------------------------------------------- */
async function startEmergencyRecording() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: true
    });

    const recorder = new MediaRecorder(stream);
    const chunks = [];

    recorder.ondataavailable = e => chunks.push(e.data);

    recorder.onstop = async () => {
      const blob = new Blob(chunks, { type: "video/webm" });

      const formData = new FormData();
      formData.append("file", blob);
      formData.append("userId", user.id);

      await fetch("https://api.beltlinecloud.com/api/response/upload", {
        method: "POST",
        headers: {
          "X-User-Email": user.email,
          "X-User-Id": user.id
        },
        body: formData
      });
    };

    recorder.start();

    setTimeout(() => recorder.stop(), 60000);

  } catch (err) {
    console.error(err);
    alert("Emergency recording failed.");
  }
}

/* ---------------------------------------------------------
   SAFETY HELPER BUBBLE
--------------------------------------------------------- */
const helperLogo = document.getElementById("helperLogo");
const helperBubble = document.getElementById("helperBubble");

helperLogo?.addEventListener("click", () => {
  helperBubble.classList.toggle("hidden");
});

/* ---------------------------------------------------------
   RESPONSE UNIT ICON
--------------------------------------------------------- */
const responseIcon = document.querySelector(".top-right img[title='Response Unit']");

responseIcon?.addEventListener("click", () => {
  window.location.href = "/pages/response/signup.html";
});

/* ---------------------------------------------------------
   CLOUD TALK ICON
--------------------------------------------------------- */
const cloudTalkIcon = document.querySelector(".top-right img[title='Cloud Talk']");

cloudTalkIcon?.addEventListener("click", () => {
  window.location.href = "/pages/messages/index.html";
});
