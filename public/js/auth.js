// /js/auth.js — BELTLINE CLOUD AUTH ENGINE (REAL VERIFICATION + HASHED LOGIN)

const API = "https://api.beltlinecloud.com";

/* ---------------------------------------------------------
   SHA-256 HASH (MATCHES WORKER)
--------------------------------------------------------- */
async function sha256Hex(str) {
    const data = new TextEncoder().encode(str);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

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
    // CLOUD USER SIGNUP (REAL VERIFICATION EMAIL)
    // ---------------------------------------------------------
    async signupCloud(body) {
        try {
            // Hash password BEFORE sending to Worker
            const passwordHash = await sha256Hex(body.password);

            const res = await fetch(`${API}/api/users/signup`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: body.email,
                    name: body.name,
                    passwordHash
                })
            });

            const data = await res.json();

            if (!data.success) {
                alert(data.error || "Signup failed.");
                return;
            }

            alert("Account created! Check your email to verify your account.");

        } catch (err) {
            console.error("signupCloud error:", err);
            alert("Signup failed. Please try again.");
        }
    },

    // ---------------------------------------------------------
    // CLOUD USER LOGIN (HASHED + VERIFIED)
    // ---------------------------------------------------------
    async loginCloud(email, password) {
        try {
            const passwordHash = await sha256Hex(password);

            const res = await fetch(`${API}/api/users/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password: passwordHash })
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
