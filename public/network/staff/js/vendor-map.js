/* ============================================================
   VENDOR MAP ENGINE — MAPLIBRE + GEOJSON + USER LOCATION
   ============================================================ */

let map = null;
let userMarker = null;
let userVisible = false;

/* ============================================================
   BELTLINE ZONES — GEOJSON POLYGONS
   ============================================================ */
const beltlineZones = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: { name: "Eastside Trail", color: "#ffcc00" },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [-84.370, 33.745],
          [-84.335, 33.745],
          [-84.335, 33.760],
          [-84.370, 33.760],
          [-84.370, 33.745]
        ]]
      }
    },
    {
      type: "Feature",
      properties: { name: "Westside Trail", color: "#00ccff" },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [-84.430, 33.750],
          [-84.400, 33.750],
          [-84.400, 33.770],
          [-84.430, 33.770],
          [-84.430, 33.750]
        ]]
      }
    },
    {
      type: "Feature",
      properties: { name: "Southside Trail", color: "#ff0066" },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [-84.395, 33.730],
          [-84.365, 33.730],
          [-84.365, 33.745],
          [-84.395, 33.745],
          [-84.395, 33.730]
        ]]
      }
    },
    {
      type: "Feature",
      properties: { name: "Northside Trail", color: "#66ff00" },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [-84.375, 33.780],
          [-84.350, 33.780],
          [-84.350, 33.800],
          [-84.375, 33.800],
          [-84.375, 33.780]
        ]]
      }
    }
  ]
};

/* ============================================================
   MAIN INIT FUNCTION
   ============================================================ */
export function initVendorMap(options = {}) {
  const containerId = options.containerId || "vendorMapContainer";
  const lat = options.lat || 33.755;
  const lng = options.lng || -84.39;

  /* Destroy old map */
  if (map) {
    map.remove();
    map = null;
  }

  /* MapLibre global script must already be loaded in HTML */
  if (!window.maplibregl) {
    console.error("MapLibre GL not loaded. Add script tag in HTML.");
    return;
  }

  /* Create map */
  map = new maplibregl.Map({
    container: containerId,
    style: "https://demotiles.maplibre.org/style.json",
    center: [lng, lat],
    zoom: 13,
    pitch: 45,
    bearing: -20,
    attributionControl: false
  });

  /* Controls */
  map.addControl(new maplibregl.NavigationControl(), "top-right");
  map.addControl(new maplibregl.ScaleControl({ maxWidth: 120 }), "bottom-left");

  /* Toggle Button */
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

  /* Load map layers */
  map.on("load", () => {
    /* Beltline Zones */
    map.addSource("beltline-zones", {
      type: "geojson",
      data: beltlineZones
    });

    map.addLayer({
      id: "beltline-fill",
      type: "fill",
      source: "beltline-zones",
      paint: {
        "fill-color": ["get", "color"],
        "fill-opacity": 0.25
      }
    });

    map.addLayer({
      id: "beltline-outline",
      type: "line",
      source: "beltline-zones",
      paint: {
        "line-color": ["get", "color"],
        "line-width": 2
      }
    });

    /* User Marker (hidden initially) */
    userMarker = new maplibregl.Marker({
      color: "#f7d354"
    }).setLngLat([lng, lat]);

    /* Smooth camera */
    map.flyTo({
      center: [lng, lat],
      zoom: 14,
      speed: 0.8,
      curve: 1.4
    });
  });
}

/* ============================================================
   USER LOCATION TOGGLE
   ============================================================ */
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
