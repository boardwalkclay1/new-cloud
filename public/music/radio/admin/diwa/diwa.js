/* ============================================================
   DIWA CINEMATIC INTRO — FINAL MOVIE VERSION
   ============================================================ */

/* YOUR IMAGE PATHS — ALREADY CONFIRMED */
const images = {
  chat: "/assets/img/cloud/cloud-chat.jpg",
  response: "/assets/img/cloud/cloud-response-logo.jpg",
  safety: "/assets/img/cloud/safety-cloud-logo.jpg",
  map: "/assets/img/cloud/cloud-map.jpg",
  radio: "/assets/img/cloud/radio.jpg"
};

/* TEXT FOR EACH CINEMATIC SCENE */
const texts = {
  chat: "Chat Cloud — the way the entire Beltline talks, connects, and shares.",
  response: "Response Cloud — the units that protect, respond, and stand ready.",
  safety: "Safety Cloud — alerts, check-ins, and guidance when it matters most.",
  map: "Map Cloud — every vendor, every route, every trail, every person in one view.",
  radio: "Your Radio Station — the center of the Cloud Station, the heartbeat of the Network."
};

/* ORDER OF SCENES */
const order = ["chat", "response", "safety", "map", "radio"];

document.addEventListener("DOMContentLoaded", () => {
  const slide = document.getElementById("cinematicSlide");
  const textBox = document.getElementById("cinematicText");
  const content = document.querySelectorAll(".fadeContent");

  const skipBtn = document.getElementById("skipBtn");
  const replayBtn = document.getElementById("replayBtn");

  let index = 0;

  /* TYPEWRITER EFFECT */
  function typeWriter(text, callback) {
    textBox.innerHTML = "";
    let i = 0;

    function type() {
      if (i < text.length) {
        textBox.innerHTML += text.charAt(i);
        i++;
        setTimeout(type, 40); // typing speed
      } else {
        callback();
      }
    }

    type();
  }

  /* SHOW EACH CINEMATIC SCENE */
  function showSlide() {
    if (index >= order.length) return finishIntro();

    const key = order[index];
    const bg = images[key];
    const line = texts[key];

    slide.style.backgroundImage = `url('${bg}')`;
    slide.style.opacity = 1;
    slide.classList.add("zoomIn");

    textBox.style.opacity = 1;

    typeWriter(line, () => {
      setTimeout(() => {
        textBox.style.opacity = 0;
        slide.style.opacity = 0;
        slide.classList.remove("zoomIn");
        index++;
        setTimeout(showSlide, 1200);
      }, 2600);
    });
  }

  /* END OF MOVIE — FADE OUT AND SHOW PAGE */
  function finishIntro() {
    const container = document.getElementById("cinematicContainer");
    container.style.opacity = 0;

    setTimeout(() => {
      container.style.display = "none";

      content.forEach(el => {
        el.style.opacity = 1;
      });
    }, 2000);
  }

  /* SKIP BUTTON */
  skipBtn.onclick = finishIntro;

  /* REPLAY BUTTON */
  replayBtn.onclick = () => {
    index = 0;
    const container = document.getElementById("cinematicContainer");
    container.style.display = "block";
    container.style.opacity = 1;

    content.forEach(el => el.style.opacity = 0);

    showSlide();
  };

  /* START MOVIE */
  showSlide();
});
