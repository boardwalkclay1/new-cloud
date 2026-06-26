document.addEventListener("DOMContentLoaded", () => {
  const playlist = document.body.dataset.playlist;

  const iframe = document.createElement("iframe");
  iframe.width = "100%";
  iframe.height = "450";
  iframe.allow = "autoplay";
  iframe.frameBorder = "0";

  // SoundCloud auto-repeat
  iframe.src = `https://w.soundcloud.com/player/?url=${encodeURIComponent(playlist)}&auto_play=true&loop=true&visual=true`;

  document.getElementById("player-container").appendChild(iframe);
});
