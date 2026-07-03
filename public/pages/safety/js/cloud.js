/* public/pages/safety/js/cloud.js */

/* LOAD USER */
const user = JSON.parse(localStorage.getItem("cloud_user"));
if (!user) {
  alert("User not logged in.");
  window.location.href = "/pages/login.html";
}

/* SAFETY CLOUD MODE */
const safetyModeSelect = document.getElementById("safetyModeSelect");

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

/* EMERGENCY ALERT */
const emergencyButton = document.getElementById("emergencyButton");

emergencyButton.addEventListener("click", async () => {
  emergencyButton.disabled = true;
  emergencyButton.textContent = "Alert Sent…";

  /* GET LOCATION */
  navigator.geolocation.getCurrentPosition(async pos => {
    const payload = {
      userId: user.id,
      email: user.email,
      lat: pos.coords.latitude,
      lon: pos.coords.longitude,
      timestamp: Date.now()
    };

    /* SEND ALERT TO CLOUD RESPONSE */
    await fetch("https://api.beltlinecloud.com/api/response/emergency", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-User-Email": user.email,
        "X-User-Id": user.id
      },
      body: JSON.stringify(payload)
    });

    /* START AUDIO + VIDEO RECORDING */
    startEmergencyRecording();

  }, () => {
    alert("Location permission denied.");
  });
});

/* RECORDING FUNCTION */
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

    /* Auto-stop after 60 seconds */
    setTimeout(() => recorder.stop(), 60000);

  } catch (err) {
    console.error(err);
    alert("Recording failed.");
  }
}
