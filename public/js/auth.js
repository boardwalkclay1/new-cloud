// /js/auth.js — BELTLINE CLOUD AUTH ENGINE (CLOUD + FAST ROLL + RESPONSE + VENDOR)

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

    /* ---------------------------------------------------------
       CLOUD USER STORAGE
    --------------------------------------------------------- */
    saveUser(user) {
        localStorage.setItem("cloud_user", JSON.stringify(user));
    },

    getUser() {
        const raw = localStorage.getItem("cloud_user");
        return raw ? JSON.parse(raw) : null;
    },

    clearUser() {
        localStorage.removeItem("cloud_user");
    },

    /* ---------------------------------------------------------
       SERVICE USER STORAGE (Fast Roll / Response / Vendor)
    --------------------------------------------------------- */
    saveServiceUser(service, data) {
        localStorage.setItem(`${service}_user`, JSON.stringify(data));
    },

    getServiceUser(service) {
        const raw = localStorage.getItem(`${service}_user`);
        return raw ? JSON.parse(raw) : null;
    },

    clearServiceUser(service) {
        localStorage.removeItem(`${service}_user`);
    },

    /* ---------------------------------------------------------
       CLOUD SIGNUP (EMAIL VERIFICATION)
    --------------------------------------------------------- */
    async signupCloud(body) {
        try {
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

    /* ---------------------------------------------------------
       CLOUD LOGIN (HASHED + VERIFIED)
    --------------------------------------------------------- */
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
    },

    /* ---------------------------------------------------------
       FAST ROLL — JOIN SERVICE
    --------------------------------------------------------- */
    async joinFastRoll(body) {
        try {
            const res = await fetch(`${API}/api/fastroll/join`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body)
            });

            const data = await res.json();

            if (!data.success) {
                alert("Failed to join Fast Roll.");
                return;
            }

            return data.riderId;

        } catch (err) {
            console.error("joinFastRoll error:", err);
            alert("Fast Roll signup failed.");
        }
    },

    /* ---------------------------------------------------------
       FAST ROLL — SET PIN
    --------------------------------------------------------- */
    async setFastRollPin(userId, pin) {
        const res = await fetch(`${API}/api/fastroll/pin`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId, pin })
        });

        const data = await res.json();
        return data.success;
    },

    /* ---------------------------------------------------------
       FAST ROLL — PIN LOGIN
    --------------------------------------------------------- */
    async loginFastRoll(userId, pin) {
        const res = await fetch(`${API}/api/fastroll/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId, pin })
        });

        const data = await res.json();

        if (!data.success) {
            alert(data.error || "Invalid PIN.");
            return null;
        }

        this.saveServiceUser("fastroll", data.rider);
        return data.rider;
    },

    /* ---------------------------------------------------------
       RESPONSE UNIT — JOIN SERVICE
    --------------------------------------------------------- */
    async joinResponse(body) {
        const res = await fetch(`${API}/api/response/join`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
        });

        const data = await res.json();
        return data.success ? data.memberId : null;
    },

    async setResponsePin(userId, pin) {
        const res = await fetch(`${API}/api/response/pin`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId, pin })
        });

        const data = await res.json();
        return data.success;
    },

    async loginResponse(userId, pin) {
        const res = await fetch(`${API}/api/response/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId, pin })
        });

        const data = await res.json();

        if (!data.success) {
            alert(data.error || "Invalid PIN.");
            return null;
        }

        this.saveServiceUser("response", data.member);
        return data.member;
    },

    /* ---------------------------------------------------------
       VENDOR NETWORK — JOIN SERVICE
    --------------------------------------------------------- */
    async joinVendor(body) {
        const res = await fetch(`${API}/api/vendor/join`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
        });

        const data = await res.json();
        return data.success ? data.vendorId : null;
    },

    async setVendorPin(ownerUserId, pin) {
        const res = await fetch(`${API}/api/vendor/pin`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ownerUserId, pin })
        });

        const data = await res.json();
        return data.success;
    },

    async loginVendor(ownerUserId, pin) {
        const res = await fetch(`${API}/api/vendor/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ownerUserId, pin })
        });

        const data = await res.json();

        if (!data.success) {
            alert(data.error || "Invalid PIN.");
            return null;
        }

        this.saveServiceUser("vendor", data.vendor);
        return data.vendor;
    }
};

// EXPORT
window.Auth = Auth;
