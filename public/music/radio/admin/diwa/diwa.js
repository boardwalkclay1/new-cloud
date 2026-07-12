/* ============================================================
   DIWA CINEMATIC JS ENGINE
   ============================================================ */

/* Fade-in stagger effect */
document.addEventListener("DOMContentLoaded", () => {
  const fades = document.querySelectorAll(".fade");
  let delay = 0;

  fades.forEach(el => {
    el.style.animationDelay = `${delay}s`;
    delay += 0.4;
  });
});

/* Optional: Add future interactions here */
console.log("Diwa cinematic intro loaded.");
