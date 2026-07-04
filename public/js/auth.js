// auth.js — FULL AUTHENTICATION ENGINE

const API = "https://api.beltlinecloud.com";

// DASHBOARD PATHS
const PATH_RIDER_DASH = "/public/fast-roll/pages/rider/rider-dashboard.html";
const PATH_VENDOR_DASH = "/public/network/staff/pages/vendor-dashboard.html";
const PATH_RESPONSE_DASH = "/public/pages/safety/response-unit/pages/response-dash.html";
const PATH_CLOUD_DASH = "/cloud/dashboard.html";

// ---------------------------------------------------------
// CLOUD USER SIGNUP
// ---------------------------------------------------------
const Auth = {

    async signupCloud(body) {
        const res = await fetch(`${API}/api/users/signup`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
        });

        const data = await res.json();
        if (!data.success) {
            alert(data.error || "Signup failed.");
            return;
        }

        // SEND VERIFICATION EMAIL
        await this.sendVerificationEmail(data.user.email, data.user.id);

        alert("Account created! Check your email to verify your account.");
    },

    async sendVerificationEmail(email, userId) {
        await fetch(`${API}/api/users/verify/send`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, userId })
        });
    },

    // ---------------------------------------------------------
    // CLOUD USER LOGIN
    // ---------------------------------------------------------
    async loginCloud(email, password) {
        const res = await fetch(`${API}/api/users/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });

        const data = await res.json();
        if (!data.success) {
            alert("Invalid login.");
            return;
        }

        localStorage.setItem("beltline_user", JSON.stringify(data.user));

        window.location.href = PATH_CLOUD_DASH;
    },

    // ---------------------------------------------------------
    // RIDER LOGIN
    // ---------------------------------------------------------
    async loginRider(email, password) {
        const res = await fetch(`${API}/api/rider/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });

        const data = await res.json();
        if (!data.success) {
            alert("Invalid rider login.");
            return;
        }

        const cloudUser = data.cloudUser;

        if (!cloudUser.roles.includes("rider")) {
            alert("You are not registered as a Rider.");
            return;
        }

        localStorage.setItem("beltline_user", JSON.stringify(cloudUser));

        window.location.href = PATH_RIDER_DASH;
    },

    // ---------------------------------------------------------
    // VENDOR LOGIN
    // ---------------------------------------------------------
    async loginVendor(email, password) {
        const res = await fetch(`${API}/api/vendor/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });

        const data = await res.json();
        if (!data.success) {
            alert("Invalid vendor login.");
            return;
        }

        const cloudUser = data.cloudUser;

        if (!cloudUser.roles.includes("vendor")) {
            alert("You are not registered as a Vendor.");
            return;
        }

        localStorage.setItem("beltline_user", JSON.stringify(cloudUser));

        window.location.href = PATH_VENDOR_DASH;
    },

    // ---------------------------------------------------------
    // RESPONSE UNIT SIGNUP
    // ---------------------------------------------------------
    async signupResponseUnit(body) {
        const res = await fetch(`${API}/api/response/signup`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
        });

        const data = await res.json();
        if (!data.success) {
            alert(data.error || "Signup failed.");
            return;
        }

        // SEND VERIFICATION EMAIL
        await this.sendVerificationEmail(data.user.email, data.user.id);

        alert("Response Unit account created! Check your email to verify.");
    },

    // ---------------------------------------------------------
    // RESPONSE UNIT LOGIN
    // ---------------------------------------------------------
    async loginResponseUnit(email, password) {
        const res = await fetch(`${API}/api/response/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });

        const data = await res.json();
        if (!data.success) {
            alert("Invalid Response Unit login.");
            return;
        }

        const cloudUser = data.cloudUser;

        if (!cloudUser.roles.includes("response_unit")) {
            alert("You are not registered as a Response Unit member.");
            return;
        }

        localStorage.setItem("beltline_user", JSON.stringify(cloudUser));

        window.location.href = PATH_RESPONSE_DASH;
    },

    // ---------------------------------------------------------
    // SEED BADGE (AFTER VERIFICATION)
    // ---------------------------------------------------------
    async giveSeedBadge(userId) {
        await fetch(`${API}/api/users/badge/seed`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId })
        });
    }
};
