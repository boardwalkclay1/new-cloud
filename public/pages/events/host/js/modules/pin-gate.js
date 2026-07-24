export async function requireHostPin(userId) {
  const pin = prompt("Enter your 4-digit host PIN:");

  if (!pin || pin.length !== 4) {
    alert("Invalid PIN.");
    return location.href = "/";
  }

  const res = await fetch("/api/events/host/pin", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, pin })
  });

  const data = await res.json();

  if (!data.success) {
    alert("Incorrect PIN.");
    return location.href = "/";
  }
}
