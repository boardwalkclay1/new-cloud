const audio = document.getElementById("beltline-radio");
const playPause = document.getElementById("playPause");
const muteBtn = document.getElementById("muteBtn");
const volumeSlider = document.getElementById("volumeSlider");
const currentTimeEl = document.getElementById("currentTime");

audio.volume = 0.8;

/* PLAY / PAUSE */
playPause.addEventListener("click", () => {
  if (audio.paused) {
    audio.play();
    playPause.textContent = "Pause";
  } else {
    audio.pause();
    playPause.textContent = "Play";
  }
});

/* MUTE */
muteBtn.addEventListener("click", () => {
  audio.muted = !audio.muted;
  muteBtn.textContent = audio.muted ? "Unmute" : "Mute";
});

/* VOLUME */
volumeSlider.addEventListener("input", () => {
  audio.volume = volumeSlider.value;
});

/* TIME DISPLAY (LIVE SIMULATION) */
setInterval(() => {
  const now = new Date();
  currentTimeEl.textContent = now.toLocaleTimeString();
}, 1000);

/* VISUALIZER HOOK */
const visualizer = document.getElementById("visualizer");
visualizer.textContent = "Visualizer Ready (Hooked)";
