// auth.js — FULL AUTHENTICATION ENGINE (UPGRADED FLOW)

const API = "https://api.beltlinecloud.com";

// DASHBOARD PATHS
const PATH_RIDER_DASH = "/public/fast-roll/pages/rider/rider-dashboard.html";
const PATH_VENDOR_DASH = "/public/network/staff/pages/vendor-dashboard.html";
const PATH_RESPONSE_DASH = "/public/pages/safety/response-unit/pages/response-dash.html";
const PATH_CLOUD_DASH = "/cloud/dashboard.html";

const Auth = {

    // ---------------------------------------------------------
    // SAVE + LOAD CLOUD USER
    // ---------------------------------------------------------
    saveUser(user) {
        localStorage.setItem("beltline_user", JSON.stringify(user));
    },

    getUser() {
        const raw = localStorage.getItem("beltline_user");
        return raw ? JSON.parse(raw) : null;
    },

    // ---------------------------------------------------------
    // UNIVERSAL ROLE REDIRECTOR
    // ---------------------------------------------------------
    redirectByRole(user) {
        if (!user || !user.roles) {
            window.location.href = PATH_CLOUD_DASH;
            return;
        }

        const roles = user.roles;

        // Priority: Response → Vendor → Rider → Cloud
        if (roles.includes("response_unit")) {
            window.location.href = PATH_RESPONSE_DASH;
            return;
        }

        if (roles.includes("vendor")) {
            window.location.href = PATH_VENDOR_DASH;
            return;
        }

        if (roles.includes("rider")) {
            window.location.href = PATH_RIDER_DASH;
            return;
        }

        window.location.href = PATH_CLOUD_DASH;
    },

    // ---------------------------------------------------------
    // CLOUD USER SIGNUP
    // ---------------------------------------------------------
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

        this.saveUser(data.user);

        // Auto redirect based on roles
        this.redirectByRole(data.user);
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

        this.saveUser(cloudUser);

        this.redirectByRole(cloudUser);
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

        this.saveUser(cloudUser);

        this.redirectByRole(cloudUser);
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

        this.saveUser(cloudUser);

        this.redirectByRole(cloudUser);
    },

    // ---------------------------------------------------------
    // VENDOR PAYOUTS
    // ---------------------------------------------------------
    async listVendorPayouts(vendorId) {
        const res = await fetch(`${API}/api/payouts/list?vendorId=${vendorId}`);
        return await res.json();
    }
};

// EXPORT
window.Auth = Auth;
