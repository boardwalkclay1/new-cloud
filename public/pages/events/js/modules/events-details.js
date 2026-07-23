// public/pages/events/js/modules/events-details.js

const API = "https://api.beltlinecloud.com";

export async function loadEventDetails(eventId) {
  const res = await fetch(`${API}/api/events/details?eventId=${eventId}`);
  return await res.json();
}

export function renderEventDetails(event) {
  const title = document.getElementById("eventTitle");
  const tagline = document.getElementById("eventTagline");
  const details = document.getElementById("eventDetails");

  title.textContent = event.title;
  tagline.textContent = event.tagline || "";

  details.innerHTML = `
    <img src="${event.mainPhotoUrl}" class="event-main-photo">
    <div class="event-meta">
      <div>${event.date} • ${event.time}</div>
      <div>${event.location}</div>
    </div>
    <p class="event-description">${event.description}</p>
  `;
}
