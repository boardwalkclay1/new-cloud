// /fast-roll/js/rider-dash.js
// UPDATED RIDER DASHBOARD — CLEAN, CLOUD-CONNECTED, FUTURE-PROOF

document.addEventListener("DOMContentLoaded", async () => {
    const rider = FastRiderAuth.current();

    // Redirect if not logged in
    if (!rider) {
        window.location.href = "/fast-roll/pages/rider/login.html";
        return;
    }

    // Load rider info
    loadProfileSummary(rider);
    loadStatus(rider);

    // Load jobs
    let jobs = [];
    try {
        jobs = await fastRiderLoadJobs();
    } catch (err) {
        console.error("Failed to load jobs:", err);
    }

    loadJobList(jobs);
    loadActiveDelivery(jobs);

    // Cloud sync (future use)
    syncWithCloud(rider);
});

/* ---------------------------------------------------------
   PROFILE SUMMARY
--------------------------------------------------------- */
function loadProfileSummary(rider) {
    const el = document.getElementById("riderProfileSummary");

    el.innerHTML = `
        <strong>${rider.name}</strong><br>
        Vehicle: ${rider.vehicle || "Not set"}<br>
        Phone: ${rider.phone || "Not set"}<br>
        PayPal: ${rider.paypal || "Not set"}<br>
        Zone: ${rider.zone || "Unassigned"}
    `;
}

/* ---------------------------------------------------------
   STATUS
--------------------------------------------------------- */
function loadStatus(rider) {
    const el = document.getElementById("riderStatus");

    el.innerHTML = `
        Status: <strong>${rider.status || "offline"}</strong>
    `;
}

/* ---------------------------------------------------------
   JOB LIST
--------------------------------------------------------- */
function loadJobList(jobs) {
    const jobList = document.getElementById("jobList");

    if (!jobs || !jobs.length) {
        jobList.innerHTML = `<p style="opacity:0.7;">No jobs available right now.</p>`;
        return;
    }

    jobList.innerHTML = jobs.map(job => `
        <div class="rider-card">
            <h3>${job.id}</h3>
            <p><strong>Pickup:</strong> ${job.pickup}</p>
            <p><strong>Dropoff:</strong> ${job.dropoff}</p>
            <p><strong>Payout:</strong> $${job.price || job.payout || 0}</p>

            <button class="primary-btn" onclick="acceptJob('${job.id}')">
                Accept Job
            </button>
        </div>
    `).join("");
}

/* ---------------------------------------------------------
   ACTIVE DELIVERY
--------------------------------------------------------- */
function loadActiveDelivery(jobs) {
    const el = document.getElementById("activeDelivery");

    if (!jobs || !jobs.length) {
        el.innerHTML = "No active delivery.";
        return;
    }

    const active = jobs.find(j => j.status === "assigned");

    if (!active) {
        el.innerHTML = "No active delivery.";
        return;
    }

    el.innerHTML = `
        <strong>Delivery Active</strong><br>
        Pickup: ${active.pickup}<br>
        Dropoff: ${active.dropoff}<br>

        <button class="primary-btn" onclick="completeJob('${active.id}')">
            Mark Complete
        </button>
    `;
}

/* ---------------------------------------------------------
   ACCEPT JOB (WRAPPER)
--------------------------------------------------------- */
async function acceptJob(jobId) {
    try {
        await fastRiderAcceptJob(jobId);
        location.reload();
    } catch (err) {
        alert("Unable to accept job.");
        console.error(err);
    }
}

/* ---------------------------------------------------------
   COMPLETE JOB (WRAPPER)
--------------------------------------------------------- */
async function completeJob(jobId) {
    try {
        await fastRiderCompleteJob(jobId);
        location.reload();
    } catch (err) {
        alert("Unable to complete job.");
        console.error(err);
    }
}

/* ---------------------------------------------------------
   CLOUD SYNC (FUTURE USE)
--------------------------------------------------------- */
async function syncWithCloud(rider) {
    // This will later sync:
    // - Rider rep
    // - Rider territory
    // - Rider cloud badges
    // - Rider cloud notifications
    // - Rider cloud profile
    try {
        console.log("Cloud sync ready for future expansion.");
    } catch (err) {
        console.error("Cloud sync failed:", err);
    }
}

/* ---------------------------------------------------------
   LOGOUT
--------------------------------------------------------- */
function logoutRider() {
    FastRiderAuth.logout();
    window.location.href = "/fast-roll/pages/rider/login.html";
}
