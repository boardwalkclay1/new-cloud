export function loadSettings(panel, user) {
  panel.innerHTML = `
    <h2>Settings</h2>
    <p>Manage your event hosting preferences.</p>
    <button onclick="location.href='/events/host/setup-pin.html?userId=${user.id}'">
      Change PIN
    </button>
  `;
}
