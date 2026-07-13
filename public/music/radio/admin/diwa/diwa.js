/* ============================================================
   DIWA CINEMATIC MOVIE INTRO — FINAL VERSION
   ============================================================ */

const images = {
  chat: "/assets/img/cloud/cloud-chat.jpg",
  response: "/assets/img/cloud/cloud-response-logo.jpg",
  safety: "/assets/img/cloud/safety-cloud-logo.jpg",
  map: "/assets/img/cloud/cloud-map.jpg",
  radio: "/assets/img/cloud/radio.jpg"
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

  function typeWriter(text, callback) {
    textBox.innerHTML = "";
    let i = 0;

    function type() {
      if (i < text.length) {
        textBox.innerHTML += text.charAt(i);
        i++;
        setTimeout(type, 40);
      } else {
        callback();
      }
    }

    type();
  }

  function showSlide() {
    if (index >= order.length) return finishIntro();

    const key = order[index];
    slide.style.backgroundImage = `url('${images[key]}')`;
    slide.style.opacity = 1;
    slide.classList.add("zoomIn");

    textBox.style.opacity = 1;

    typeWriter(texts[key], () => {
      setTimeout(() => {
        textBox.style.opacity = 0;
        slide.style.opacity = 0;
        slide.classList.remove("zoomIn");
        index++;
        setTimeout(showSlide, 1200);
      }, 2600);
    });
  }

  function finishIntro() {
    const container = document.getElementById("cinematicContainer");
    container.style.opacity = 0;

    setTimeout(() => {
      container.style.display = "none";
      content.forEach(el => el.style.opacity = 1);
    }, 2000);
  }

  skipBtn.onclick = finishIntro;

  replayBtn.onclick = () => {
    index = 0;
    const container = document.getElementById("cinematicContainer");
    container.style.display = "block";
    container.style.opacity = 1;
    content.forEach(el => el.style.opacity = 0);
    showSlide();
  };

  showSlide();
});
