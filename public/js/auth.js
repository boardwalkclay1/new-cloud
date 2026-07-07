// auth.js — BELTLINE CLOUD AUTH ENGINE (CLEAN VERSION)

const API = "https://api.beltlinecloud.com";

// ABSOLUTE CLOUD PATHS (NO /cloud/ ANYWHERE)
const PATH_CLOUD_DASH = "https://beltlinecloud.com/pages/dashboard.html";
const PATH_CLOUD_LOGIN = "https://beltlinecloud.com/pages/login.html";

const Auth = {

    saveUser(user) {
        try { localStorage.setItem("cloud_user", JSON.stringify(user)); }
        catch (err) { console.error("Error saving cloud_user:", err); }
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
        try { localStorage.removeItem("cloud_user"); }
        catch (err) { console.error("Error clearing cloud_user:", err); }
    },

    redirectToCloud() {
        const user = this.getUser();
        window.location.href = user ? PATH_CLOUD_DASH : PATH_CLOUD_LOGIN;
    },

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

            this.saveUser(data.user);
            this.redirectToCloud();

        } catch (err) {
            console.error("loginCloud error:", err);
            alert("Login failed. Please try again.");
        }
    },

    boot() {
        const user = this.getUser();
        const currentURL = window.location.href;

        // Logged in → block login page
        if (currentURL === PATH_CLOUD_LOGIN && user) {
            window.location.href = PATH_CLOUD_DASH;
            return;
        }

        // Not logged in → block dashboard
        if (currentURL === PATH_CLOUD_DASH && !user) {
            window.location.href = PATH_CLOUD_LOGIN;
            return;
        }
    }
};

window.Auth = Auth;

window.addEventListener("DOMContentLoaded", () => {
    Auth.boot();
});
