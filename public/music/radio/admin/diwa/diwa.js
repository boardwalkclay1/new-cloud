/* ============================================================
   CINEMATIC INTRO SEQUENCE
   ============================================================ */

document.addEventListener("DOMContentLoaded", () => {
  const slides = document.querySelectorAll(".cinematicSlide");
  const textBox = document.getElementById("cinematicText");
  const content = document.querySelectorAll(".fadeContent");

  let index = 0;

  function showSlide() {
    if (index > 0) slides[index - 1].style.opacity = 0;
    if (index >= slides.length) return finishIntro();

    const slide = slides[index];
    slide.style.opacity = 1;

    textBox.innerText = slide.dataset.text;
    textBox.style.opacity = 1;

    setTimeout(() => {
      textBox.style.opacity = 0;
      index++;
      setTimeout(showSlide, 1000);
    }, 3000);
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

  showSlide();
});
