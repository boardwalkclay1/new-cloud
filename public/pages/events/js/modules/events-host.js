// public/pages/events/js/modules/events-host.js

const API = "https://api.beltlinecloud.com";

export function setupHostEntry(user) {
  const legal = document.getElementById("hostLegalAgree");
  const btn = document.getElementById("openHostDashboardBtn");

  btn.onclick = async () => {
    if (!user) return alert("Login required.");
    if (!legal.checked) return alert("You must accept the legal terms.");

    const res = await fetch(`${API}/api/events/host/link`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.id })
    });

    const data = await res.json();
    if (!data.hostUrl) return alert("Unable to open dashboard.");

    window.location.href = data.hostUrl;
  };
}
