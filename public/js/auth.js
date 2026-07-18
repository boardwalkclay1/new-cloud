// /js/auth.js — BELTLINE CLOUD AUTH ENGINE (WITH REAL EMAIL VERIFICATION)

const API = "https://api.beltlinecloud.com";

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
    // CLOUD USER SIGNUP (GENERATES REAL VERIFICATION LINK)
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

            // Backend already sends the verification email
            alert("Account created! Check your email to verify your account.");

        } catch (err) {
            console.error("signupCloud error:", err);
            alert("Signup failed. Please try again.");
        }
    },

    // ---------------------------------------------------------
    // CLOUD USER LOGIN (NO REDIRECT)
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
                alert(data.error || "Invalid login.");
                return;
            }

            if (!data.user.verified) {
                alert("Please verify your email before logging in.");
                return;
            }

            this.saveUser(data.user);
            return data.user;

        } catch (err) {
            console.error("loginCloud error:", err);
            alert("Login failed. Please try again.");
        }
    }
};

// EXPORT
window.Auth = Auth;
