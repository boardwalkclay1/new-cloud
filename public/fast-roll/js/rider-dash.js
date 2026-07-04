// /fast-roll/js/rider-dash.js
// CLEAN RIDER DASHBOARD LOADER

document.addEventListener("DOMContentLoaded", async () => {
    const rider = FastRiderAuth.current();

    if (!rider) {
        window.location.href = "/fast-roll/pages/rider/login.html";
        return;
    }

    loadProfileSummary(rider);
    loadStatus(rider);

    const jobs = await fastRiderLoadJobs();
    loadJobList(jobs);
    loadActiveDelivery(jobs);
});

/* ---------------------------------------------------------
   PROFILE SUMMARY
--------------------------------------------------------- */
function loadProfileSummary(rider) {
    document.getElementById("riderProfileSummary").innerHTML = `
        <strong>${rider.name}</strong><br>
        Vehicle: ${rider.vehicle}<br>
        Phone: ${rider.phone}<br>
        PayPal: ${rider.paypal || "Not set"}
    `;
}

/* ---------------------------------------------------------
   STATUS
--------------------------------------------------------- */
function loadStatus(rider) {
    document.getElementById("riderStatus").innerHTML = `
        Status: <strong>${rider.status || "offline"}</strong>
    `;
}

/* ---------------------------------------------------------
   JOB LIST
--------------------------------------------------------- */
function loadJobList(jobs) {
    const jobList = document.getElementById("jobList");

    if (!jobs.length) {
        jobList.innerHTML = `<p style="opacity:0.7;">No jobs available right now.</p>`;
        return;
    }

    jobList.innerHTML = jobs.map(job => `
        <div class="rider-card">
            <h3>${job.id}</h3>
            <p><strong>Pickup:</strong> ${job.pickup}</p>
            <p><strong>Dropoff:</strong> ${job.dropoff}</p>
            <p><strong>Payout:</strong> $${job.price || job.payout || 0}</p>
            <button class="primary-btn" onclick="fastRiderAcceptJob('${job.id}')">
                Accept Job
            </button>
        </div>
    `).join("");
}

/* ---------------------------------------------------------
   ACTIVE DELIVERY
--------------------------------------------------------- */
function loadActiveDelivery(jobs) {
    const active = jobs.find(j => j.status === "assigned");
    const el = document.getElementById("activeDelivery");

    if (!active) {
        el.innerHTML = "No active delivery.";
        return;
    }

    el.innerHTML = `
        <strong>Delivery Active</strong><br>
        Pickup: ${active.pickup}<br>
        Dropoff: ${active.dropoff}<br>
        <button class="primary-btn" onclick="fastRiderCompleteJob('${active.id}')">
            Mark Complete
        </button>
    `;
}

/* ---------------------------------------------------------
   LOGOUT
--------------------------------------------------------- */
function logoutRider() {
    FastRiderAuth.logout();
    window.location.href = "/fast-roll/pages/rider/login.html";
}
