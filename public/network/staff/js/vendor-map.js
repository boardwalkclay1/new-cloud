import maplibregl from "https://unpkg.com/maplibre-gl@3.6.1/dist/maplibre-gl.esm.js";

let map = null;
let userMarker = null;
let userVisible = false;

/* BELTLINE ZONES */
const beltlineZones = [
  {
    name: "Eastside Trail",
    color: "#ffcc00",
    coords: [
      [-84.370, 33.745],
      [-84.335, 33.745],
      [-84.335, 33.760],
      [-84.370, 33.760]
    ]
  },
  {
    name: "Westside Trail",
    color: "#00ccff",
    coords: [
      [-84.430, 33.750],
      [-84.400, 33.750],
      [-84.400, 33.770],
      [-84.430, 33.770]
    ]
  },
  {
    name: "Southside Trail",
    color: "#ff0066",
    coords: [
      [-84.395, 33.730],
      [-84.365, 33.730],
      [-84.365, 33.745],
      [-84.395, 33.745]
    ]
  },
  {
    name: "Northside Trail",
    color: "#66ff00",
    coords: [
      [-84.375, 33.780],
      [-84.350, 33.780],
      [-84.350, 33.800],
      [-84.375, 33.800]
    ]
  }
];

/* INIT MAP */
export function initVendorMap(options = {}) {
  const containerId = options.containerId || "vendorMapContainer";
  const lat = options.lat || 33.755;
  const lng = options.lng || -84.39;

  if (map) {
    map.remove();
    map = null;
  }

  map = new maplibregl.Map({
    container: containerId,
    style: "https://demotiles.maplibre.org/style.json",
    center: [lng, lat],
    zoom: 13,
    pitch: 45,
    bearing: -20,
    attributionControl: false
  });

  map.addControl(new maplibregl.NavigationControl(), "top-right");
  map.addControl(new maplibregl.ScaleControl({ maxWidth: 120 }), "bottom-left");

  /* USER LOCATION TOGGLE BUTTON */
  const toggleBtn = document.createElement("button");
  toggleBtn.innerText = "Toggle User Location";
  toggleBtn.style.cssText = `
    position:absolute;
    top:10px;
    left:10px;
    z-index:9999;
    padding:8px 12px;
    background:#000;
    color:#f7d354;
    border:2px solid #f7d354;
    border-radius:10px;
    cursor:pointer;
  `;
  toggleBtn.onclick = () => toggleUserLocation(lat, lng);
  document.getElementById(containerId).appendChild(toggleBtn);

  map.on("load", () => {
    /* BELTLINE ZONES */
    beltlineZones.forEach((z, i) => {
      const id = `zone-${i}`;

      map.addSource(id, {
        type: "geojson",
        data: {
          type: "Feature",
          geometry: {
            type: "Polygon",
            coordinates: [z.coords]
          }
        }
      });

      map.addLayer({
        id: `${id}-fill`,
        type: "fill",
        source: id,
        paint: {
          "fill-color": z.color,
          "fill-opacity": 0.25
        }
      });

      map.addLayer({
        id: `${id}-outline`,
        type: "line",
        source: id,
        paint: {
          "line-color": z.color,
          "line-width": 2
        }
      });
    });

    /* USER MARKER (HIDDEN BY DEFAULT) */
    userMarker = new maplibregl.Marker({
      color: "#f7d354"
    }).setLngLat([lng, lat]);

    /* SMOOTH CAMERA */
    map.flyTo({
      center: [lng, lat],
      zoom: 14,
      speed: 0.8,
      curve: 1.4
    });
  });
}

/* TOGGLE USER LOCATION */
function toggleUserLocation(lat, lng) {
  if (!map || !userMarker) return;

  if (!userVisible) {
    userMarker.addTo(map);
    map.flyTo({
      center: [lng, lat],
      zoom: 15,
      speed: 0.8,
      curve: 1.4
    });
    userVisible = true;
  } else {
    userMarker.remove();
    userVisible = false;
  }
}
