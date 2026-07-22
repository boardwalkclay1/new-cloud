/* ============================================================
   PURE CODE MAP ENGINE (NO MAPLIBRE)
============================================================ */

const mapEl = document.getElementById("cloudMap");
const ctx = document.createElement("canvas").getContext("2d");
const canvas = ctx.canvas;

canvas.width = mapEl.clientWidth;
canvas.height = mapEl.clientHeight;
mapEl.appendChild(canvas);

/* ============================================================
   MAP STATE
============================================================ */

let zoom = 12;
let center = { lon: -84.3615, lat: 33.7677 }; // Beltline center

/* ============================================================
   TILE DRAWING
============================================================ */

function lonLatToTile(lon, lat, zoom) {
  const x = Math.floor((lon + 180) / 360 * Math.pow(2, zoom));
  const y = Math.floor(
    (1 - Math.log(Math.tan(lat * Math.PI/180) + 1 / Math.cos(lat * Math.PI/180)) / Math.PI) / 2 * Math.pow(2, zoom)
  );
  return { x, y };
}

function drawMap() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const tile = lonLatToTile(center.lon, center.lat, zoom);

  const tileSize = 256;
  const tilesAcross = Math.ceil(canvas.width / tileSize) + 2;
  const tilesDown = Math.ceil(canvas.height / tileSize) + 2;

  for (let dx = -tilesAcross/2; dx < tilesAcross/2; dx++) {
    for (let dy = -tilesDown/2; dy < tilesDown/2; dy++) {
      const x = tile.x + dx;
      const y = tile.y + dy;

      const img = new Image();
      img.src = `https://tile.openstreetmap.org/${zoom}/${x}/${y}.png`;

      const px = canvas.width/2 + dx * tileSize;
      const py = canvas.height/2 + dy * tileSize;

      img.onload = () => ctx.drawImage(img, px, py, tileSize, tileSize);
    }
  }
}

drawMap();
