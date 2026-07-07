// auth-cloud-isolated.js — STANDALONE CLOUD LOGIN MODULE

const API = "https://api.beltlinecloud.com";

const AuthCloudIsolated = {

    async login(email, password) {
        try {
            const res = await fetch(`${API}/api/users/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password })
            });

            const data = await res.json();

            if (!data.success || !data.user) {
                return null;
            }

            // Save user locally ONLY for this isolated module
            try {
                localStorage.setItem("cloud_user", JSON.stringify(data.user));
            } catch (err) {
                console.error("Local save error:", err);
            }

            return data.user;

        } catch (err) {
            console.error("Isolated login error:", err);
            return null;
        }
    }
};

window.AuthCloudIsolated = AuthCloudIsolated;
