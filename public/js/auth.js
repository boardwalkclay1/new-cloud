// auth.js — BELTLINE CLOUD AUTH ENGINE (CLEAN VERSION)

const API = "https://api.beltlinecloud.com";

// CLOUD PATHS
const PATH_CLOUD_DASH = "/pages/dashboard.html";
const PATH_CLOUD_LOGIN = "/pages/login.html";

const Auth = {

    // ---------------------------------------------------------
    // SAVE + LOAD CLOUD USER
    // ---------------------------------------------------------
    saveUser(user) {
        try {
            localStorage.setItem("cloud_user", JSON.stringify(user));
        } catch (err) {
            console.error("Error saving cloud_user:", err);
        }
    },

    getUser() {
        try {
            const raw = localStorage.getItem("cloud_user");
            return raw ? JSON.parse(raw) : null;
        } catch (err) {
            console.error("Error loading cloud_user:", err);
            return null;
        }
    },

    clearUser() {
        try {
            localStorage.removeItem("cloud_user");
        } catch (err) {
            console.error("Error clearing cloud_user:", err);
        }
    },

    // ---------------------------------------------------------
    // SIMPLE CLOUD REDIRECTOR
    // ---------------------------------------------------------
    redirectToCloud() {
        const user = this.getUser();

        if (user) {
            window.location.href = PATH_CLOUD_DASH;
        } else {
            window.location.href = PATH_CLOUD_LOGIN;
        }
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
    // CLOUD USER LOGIN (ONLY CHECKS cloud_user)
    // ---------------------------------------------------------
    async loginCloud(email, password) {
        try {
            const res = await fetch(`${API}/api/users/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password })
            });

            const data = await res.json();

            if (!data.success || !data.user) {
                alert("Invalid login.");
                return;
            }

            // Save cloud_user
            this.saveUser(data.user);

            // Redirect into the Cloud
            this.redirectToCloud();

        } catch (err) {
            console.error("loginCloud error:", err);
            alert("Login failed. Please try again.");
        }
    },

    // ---------------------------------------------------------
    // BOOTSTRAP ON PAGE LOAD
    // ---------------------------------------------------------
    boot() {
        const user = this.getUser();
        const path = window.location.pathname;

        // If user is logged in and tries to access login page → send to Cloud
        if (path === PATH_CLOUD_LOGIN && user) {
            window.location.href = PATH_CLOUD_DASH;
            return;
        }

        // If user is NOT logged in and tries to access Cloud dashboard → send to login
        if (path === PATH_CLOUD_DASH && !user) {
            window.location.href = PATH_CLOUD_LOGIN;
            return;
        }
    }
};

// EXPORT
window.Auth = Auth;

// AUTO-BOOT
window.addEventListener("DOMContentLoaded", () => {
    Auth.boot();
});
