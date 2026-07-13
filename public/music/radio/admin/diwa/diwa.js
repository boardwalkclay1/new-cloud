/* ============================================================
   DIWA CINEMATIC INTRO SEQUENCE
   ============================================================ */

/*
  INSERT YOUR IMAGE LINKS HERE

  Example:
  const images = {
    chat: "/assets/img/cloud/chat-bg.jpg",
    response: "/assets/img/cloud/response-icon.jpg",
    safety: "/assets/img/cloud/safety-icon.jpg",
    map: "/assets/img/cloud/map-bg.jpg",
    radio: "/assets/img/cloud/radio-bg.jpg"
  };
*/

const images = {
  chat: "/assets/img/cloud/cloud-chat.jpg",      // Chat Cloud background
  response: "/assets/img/cloud/cloud-response-logo.jpg",  // Response Unit / Response Cloud icon background
  safety: "/assets/img/cloud/safety-cloud-logo.jpg",    // Safety Cloud icon background
  map: "",       // Map / Beltline Map background
  radio: "/assets/img/cloud/radio.jpg"      // Radio Station / Cloud Station background
};

const texts = {
  chat: "Chat Cloud — the way the entire Beltline talks, connects, and shares.",
  response: "Response Cloud — the units that protect, respond, and stand ready.",
  safety: "Safety Cloud — alerts, check-ins, and guidance when it matters most.",
  map: "Map Cloud — every vendor, every route, every trail, every person in one view.",
  radio: "Your Radio Station — the center of the Cloud Station, the heartbeat of the Network."
};

const order = ["chat", "response", "safety", "map", "radio"];

document.addEventListener("DOMContentLoaded", () => {
  const slide = document.getElementById("cinematicSlide");
  const textBox = document.getElementById("cinematicText");
  const content = document.querySelectorAll(".fadeContent");

  const skipBtn = document.getElementById("skipBtn");
  const replayBtn = document.getElementById("replayBtn");

  let index = 0;

  function showSlide() {
    if (index >= order.length) return finishIntro();

    const key = order[index];

    // If you haven't set an image yet, this prevents a broken background
    if (!images[key]) {
      console.warn(`No image set for ${key}. Set it in diwa.js images object.`);
    }

    slide.style.backgroundImage = images[key] ? `url('${images[key]}')` : "none";
    slide.style.opacity = 1;

    textBox.innerText = texts[key];
    textBox.style.opacity = 1;

    setTimeout(() => {
      textBox.style.opacity = 0;
      slide.style.opacity = 0;
      index++;
      setTimeout(showSlide, 1000);
    }, 3500);
  }

  function finishIntro() {
    document.getElementById("cinematicContainer").style.opacity = 0;

    setTimeout(() => {
      document.getElementById("cinematicContainer").style.display = "none";

      content.forEach(el => {
        el.style.opacity = 1;
      });
    }, 2000);
  }

  skipBtn.onclick = finishIntro;

  replayBtn.onclick = () => {
    index = 0;
    document.getElementById("cinematicContainer").style.display = "block";
    document.getElementById("cinematicContainer").style.opacity = 1;
    content.forEach(el => el.style.opacity = 0);
    showSlide();
  };

  showSlide();
});
