// js/auth-cloud-standalone.js

const API = "https://api.beltlinecloud.com";

const AuthStandalone = {
  async login(email, password) {
    try {
      const res = await fetch(`${API}/api/users/login-standalone`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (!data.success || !data.user) {
        throw new Error(data.error || "Invalid login.");
      }

      try {
        localStorage.setItem("cloud_user", JSON.stringify(data.user));
      } catch (err) {
        console.error("Error saving cloud_user:", err);
      }

      return data.user;
    } catch (err) {
      console.error("AuthStandalone.login error:", err);
      throw err;
    }
  }
};

window.AuthStandalone = AuthStandalone;
