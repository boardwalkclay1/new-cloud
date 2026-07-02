// =========================================================
// BELTLINE CLOUD — VOICE NOTE ENGINE
// =========================================================

const CHAT_API = "https://api.beltlinecloud.com/chat";

export function initVoice(incidentId, userId) {
  const btn = document.getElementById("recordBtn");

  let mediaRecorder;
  let chunks = [];

  btn.onmousedown = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(stream);

    mediaRecorder.ondataavailable = e => chunks.push(e.data);

    mediaRecorder.onstop = async () => {
      const blob = new Blob(chunks, { type: "audio/webm" });
      chunks = [];

      const formData = new FormData();
      formData.append("audio", blob);
      formData.append("incidentId", incidentId);
      formData.append("userId", userId);

      await fetch(`${CHAT_API}/voice`, {
        method: "POST",
        body: formData
      });
    };

    mediaRecorder.start();
    btn.classList.add("recording");
  };

  btn.onmouseup = () => {
    mediaRecorder.stop();
    btn.classList.remove("recording");
  };
}
