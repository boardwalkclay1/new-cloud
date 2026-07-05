// auth.js — FULL AUTHENTICATION ENGINE (UPGRADED FLOW + BOOTSTRAP)

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
        try {
            localStorage.setItem("beltline_user", JSON.stringify(user));
        } catch (err) {
            console.error("Error saving user:", err);
        }
    },

    getUser() {
        try {
            const raw = localStorage.getItem("beltline_user");
            return raw ? JSON.parse(raw) : null;
        } catch (err) {
            console.error("Error loading user:", err);
            return null;
        }
    },

    clearUser() {
        try {
            localStorage.removeItem("beltline_user");
        } catch (err) {
            console.error("Error clearing user:", err);
        }
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
        try {
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
        } catch (err) {
            console.error("signupCloud error:", err);
            alert("Signup failed. Please try again.");
        }
    },

    async sendVerificationEmail(email, userId) {
        try {
            await fetch(`${API}/api/users/verify/send`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, userId })
            });
        } catch (err) {
            console.error("sendVerificationEmail error:", err);
        }
    },

    // ---------------------------------------------------------
    // CLOUD USER LOGIN
    // ---------------------------------------------------------
    async loginCloud(email, password) {
        try {
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
        } catch (err) {
            console.error("loginCloud error:", err);
            alert("Login failed. Please try again.");
        }
    },

    // ---------------------------------------------------------
    // RIDER LOGIN
    // ---------------------------------------------------------
    async loginRider(email, password) {
        try {
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
        } catch (err) {
            console.error("loginRider error:", err);
            alert("Rider login failed. Please try again.");
        }
    },

    // ---------------------------------------------------------
    // VENDOR LOGIN
    // ---------------------------------------------------------
    async loginVendor(email, password) {
        try {
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
        } catch (err) {
            console.error("loginVendor error:", err);
            alert("Vendor login failed. Please try again.");
        }
    },

    // ---------------------------------------------------------
    // RESPONSE UNIT SIGNUP
    // ---------------------------------------------------------
    async signupResponseUnit(body) {
        try {
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
        } catch (err) {
            console.error("signupResponseUnit error:", err);
            alert("Response Unit signup failed. Please try again.");
        }
    },

    // ---------------------------------------------------------
    // RESPONSE UNIT LOGIN
    // ---------------------------------------------------------
    async loginResponseUnit(email, password) {
        try {
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
        } catch (err) {
            console.error("loginResponseUnit error:", err);
            alert("Response Unit login failed. Please try again.");
        }
    },

    // ---------------------------------------------------------
    // VENDOR PAYOUTS
    // ---------------------------------------------------------
    async listVendorPayouts(vendorId) {
        try {
            const res = await fetch(`${API}/api/payouts/list?vendorId=${vendorId}`);
            return await res.json();
        } catch (err) {
            console.error("listVendorPayouts error:", err);
            return null;
        }
    },

    // ---------------------------------------------------------
    // BOOTSTRAP ON DASHBOARD PAGES
    // ---------------------------------------------------------
    boot() {
        const user = this.getUser();

        // If we're on the cloud dashboard and have a user, route them
        if (window.location.pathname === PATH_CLOUD_DASH && user) {
            this.redirectByRole(user);
        }

        // If we're on a role dashboard but no user, send back to login
        const riderDash = PATH_RIDER_DASH;
        const vendorDash = PATH_VENDOR_DASH;
        const responseDash = PATH_RESPONSE_DASH;

        const path = window.location.pathname;

        if (!user && (path === riderDash || path === vendorDash || path === responseDash)) {
            // No user stored, force them to Cloud login
            window.location.href = "/pages/login.html";
        }
    }
};

// EXPORT
window.Auth = Auth;

// AUTO-BOOT ON LOAD
window.addEventListener("DOMContentLoaded", () => {
    Auth.boot();
});
