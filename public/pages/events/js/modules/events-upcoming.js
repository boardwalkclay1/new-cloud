// public/pages/events/js/modules/events-upcoming.js

const API = "https://api.beltlinecloud.com";

export async function loadUpcomingEvents() {
  try {
    const res = await fetch(`${API}/api/events/upcoming`);
    return await res.json();
  } catch {
    return [];
  }
}

export function renderUpcomingEventsStrip() {
  const wrapper = document.createElement("div");
  wrapper.className = "events-upcoming-strip";

  const header = document.createElement("h3");
  header.textContent = "Upcoming Events";

  const scroller = document.createElement("div");
  scroller.className = "events-upcoming-scroller";

  wrapper.appendChild(header);
  wrapper.appendChild(scroller);

  wrapper.populate = events => {
    scroller.innerHTML = "";

    events.forEach(ev => {
      const card = document.createElement("div");
      card.className = "events-upcoming-card";

      card.innerHTML = `
        <img src="${ev.photoUrl}" class="events-upcoming-photo">
        <div class="events-upcoming-info">
          <h4>${ev.title}</h4>
          <div class="events-upcoming-meta">
            ${ev.date} • ${ev.time} • $${ev.startingPrice}
          </div>
        </div>
      `;

      card.onclick = () => {
        window.location.href = `/events/event?eventId=${ev.id}`;
      };

      scroller.appendChild(card);
    });

    // Auto-scroll
    let pos = 0;
    setInterval(() => {
      pos += 1;
      scroller.scrollLeft = pos;
      if (pos > scroller.scrollWidth) pos = 0;
    }, 80);
  };

  return wrapper;
}
