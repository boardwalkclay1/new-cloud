// FAST ROLL — Client System
// Fully synced with Worker (clientHandler, ordersHandler)
// Uses real API calls instead of localStorage
// Clean, modular, production-ready

/* ============================================================
   SESSION HELPERS
============================================================ */

function saveSession(key, value) {
    sessionStorage.setItem(key, JSON.stringify(value));
}

function getSession(key) {
    const raw = sessionStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
}

/* ============================================================
   CLIENT SIGNUP / PROFILE
============================================================ */

async function fastClientSignup(name, phone, email) {
    const res = await fetch("/api/client?action=signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, email })
    });

    const data = await res.json();
    if (data && data.success) {
        saveSession("client", { id: data.id, name, phone, email });
        return data.id;
    }

    alert("Signup failed");
    return null;
}

async function fastClientUpdate(profile) {
    const client = getSession("client");
    if (!client) return;

    await fetch("/api/client?action=update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: client.id, ...profile })
    });
}

/* ============================================================
   CREATE ORDER (REAL WORKER)
============================================================ */

async function createOrder(clientId, clientName, item, store, receiptFile) {
    const payload = {
        action: "create",
        clientId,
        pickup: store,
        dropoff: clientName + " (client)",
        price: 5, // base payout, can be dynamic later
        item,
        receiptPhoto: receiptFile ? receiptFile.name : null
    };

    const res = await fetch("/api/order?action=create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (data && data.success) {
        saveSession("order", { id: data.id, clientId, clientName, item, store });
        return data.id;
    }

    alert("Order creation failed");
    return null;
}

/* ============================================================
   GET ORDER STATUS (REAL WORKER)
============================================================ */

async function getOrderStatus(orderId) {
    const res = await fetch(`/api/order?id=${orderId}`);
    const data = await res.json();
    return data || null;
}

/* ============================================================
   ORDER PAGE
============================================================ */

function initOrderPage() {
    const form = document.getElementById("clientOrderForm");
    if (!form) return;

    const client = getSession("client");
    if (!client) return location.href = "/pages/client/signup.html";

    form.addEventListener("submit", async e => {
        e.preventDefault();

        const clientName = document.getElementById("clientName").value.trim();
        const item = document.getElementById("itemName").value.trim();
        const store = document.getElementById("storeName").value.trim();
        const receipt = document.getElementById("receiptUpload").files[0] || null;

        if (!clientName || !item || !store) {
            alert("Fill out all fields.");
            return;
        }

        const orderId = await createOrder(client.id, clientName, item, store, receipt);

        if (orderId) {
            alert("Order created! Your order ID is: " + orderId);
            form.reset();
        }
    });
}

/* ============================================================
   ORDER STATUS PAGE
============================================================ */

function initOrderStatusPage() {
    const form = document.getElementById("orderStatusForm");
    const result = document.getElementById("orderStatusResult");

    if (!form || !result) return;

    form.addEventListener("submit", async e => {
        e.preventDefault();

        const orderId = document.getElementById("orderIdLookup").value.trim();
        if (!orderId) {
            result.innerHTML = "Enter an order ID.";
            return;
        }

        const order = await getOrderStatus(orderId);

        if (!order || order.error) {
            result.innerHTML = "Order not found.";
            return;
        }

        result.innerHTML = `
            <strong>Order ID:</strong> ${order.id}<br>
            <strong>Status:</strong> ${order.status}<br>
            <strong>Rider:</strong> ${order.riderId || "Not assigned yet"}<br><br>

            ${
                order.status === "completed"
                    ? `<button class="primary-btn" onclick="location.href='/pages/client/success.html'">
                           Delivery Complete — Continue
                       </button>`
                    : ""
            }
        `;
    });
}

/* ============================================================
   ROUTER
============================================================ */

document.addEventListener("DOMContentLoaded", () => {
    const path = window.location.pathname;

    if (path.includes("order.html")) initOrderPage();
    if (path.includes("status.html")) initOrderStatusPage();
});
