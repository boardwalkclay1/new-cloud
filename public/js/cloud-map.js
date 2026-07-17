// MapLibre is global because we load it with a <script> tag in HTML

/* ============================================================
   INIT MAP
============================================================ */

const map = new maplibregl.Map({
    container: "cloudMap",
    style: "https://demotiles.maplibre.org/style.json", // TEMP WORKING STYLE
    center: [-84.3615, 33.7677], // Beltline center
    zoom: 12
});

/* ============================================================
   ZOOM BUTTONS
============================================================ */

document.querySelectorAll(".tool-btn[data-zoom]").forEach(btn => {
    btn.addEventListener("click", () => {
        const mode = btn.dataset.zoom;

        if (mode === "full") {
            map.flyTo({ center: [-84.3615, 33.7677], zoom: 12 });
        }
        if (mode === "east") {
            map.flyTo({ center: [-84.3655, 33.7724], zoom: 14 });
        }
        if (mode === "west") {
            map.flyTo({ center: [-84.4209, 33.7729], zoom: 14 });
        }
        if (mode === "north") {
            map.flyTo({ center: [-84.3709, 33.8002], zoom: 14 });
        }
        if (mode === "south") {
            map.flyTo({ center: [-84.3809, 33.7309], zoom: 14 });
        }
    });
});
