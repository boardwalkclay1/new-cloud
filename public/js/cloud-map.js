/* ============================================================
   PURE CODE MAP ENGINE (NO MAPLIBRE)
============================================================ */

const mapEl = document.getElementById("cloudMap");
const canvas = document.createElement("canvas");
const ctx = canvas.getContext("2d");

canvas.width = mapEl.clientWidth;
canvas.height = mapEl.clientHeight;
mapEl.appendChild(canvas);

/* ============================================================
   MAP STATE
============================================================ */

let zoom = 12;
let center = { lon: -84.3615, lat: 33.7677 }; // Beltline center

/* ============================================================
   FLOAT TILE MATH (CORRECT)
============================================================ */

function lonLatToTileFloat(lon, lat, zoom) {
    const x = (lon + 180) / 360 * Math.pow(2, zoom);
    const y =
        (1 -
            Math.log(
                Math.tan(lat * Math.PI / 180) +
                1 / Math.cos(lat * Math.PI / 180)
            ) /
            Math.PI) /
        2 *
        Math.pow(2, zoom);

    return { x, y }; // FLOAT tile coords
}

/* ============================================================
   DRAW MAP (FULLY FIXED)
============================================================ */

function drawMap() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const tileSize = 256;

    // FLOAT tile position of the center
    const floatTile = lonLatToTileFloat(center.lon, center.lat, zoom);

    // INTEGER tile index (OSM requires this)
    const baseX = Math.floor(floatTile.x);
    const baseY = Math.floor(floatTile.y);

    // FRACTIONAL offset inside the tile
    const offsetX = (floatTile.x - baseX) * tileSize;
    const offsetY = (floatTile.y - baseY) * tileSize;

    const tilesAcross = Math.ceil(canvas.width / tileSize) + 2;
    const tilesDown = Math.ceil(canvas.height / tileSize) + 2;

    for (let dx = -tilesAcross / 2; dx < tilesAcross / 2; dx++) {
        for (let dy = -tilesDown / 2; dy < tilesDown / 2; dy++) {

            const x = baseX + dx;
            const y = baseY + dy;

            // OSM tile boundaries
            if (x < 0 || y < 0) continue;

            const img = new Image();
            img.src = `https://tile.openstreetmap.org/${zoom}/${x}/${y}.png`;

            // Correct pixel placement
            const px = canvas.width / 2 + dx * tileSize - offsetX;
            const py = canvas.height / 2 + dy * tileSize - offsetY;

            img.onload = () => ctx.drawImage(img, px, py, tileSize, tileSize);
        }
    }
}

drawMap();

/* ============================================================
   ZOOM BUTTONS (WORKS WITH CUSTOM RENDERER)
============================================================ */

document.querySelectorAll(".tool-btn[data-zoom]").forEach(btn => {
    btn.addEventListener("click", () => {
        const mode = btn.dataset.zoom;

        if (mode === "full") {
            center = { lon: -84.3615, lat: 33.7677 };
            zoom = 12;
        }
        if (mode === "east") {
            center = { lon: -84.3655, lat: 33.7724 };
            zoom = 14;
        }
        if (mode === "west") {
            center = { lon: -84.4209, lat: 33.7729 };
            zoom = 14;
        }
        if (mode === "north") {
            center = { lon: -84.3709, lat: 33.8002 };
            zoom = 14;
        }
        if (mode === "south") {
            center = { lon: -84.3809, lat: 33.7309 };
            zoom = 14;
        }

        drawMap();
    });
});
