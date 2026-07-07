const API = "https://api.beltlinecloud.com";

const AuthStandalone = {
  async login(email, password) {
    const res = await fetch(`${API}/api/users/login-standalone`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (!data.success || !data.user) {
      throw new Error(data.error || "Invalid login.");
    }

    localStorage.setItem("cloud_user", JSON.stringify(data.user));

    return data.user;
  }
};

window.AuthStandalone = AuthStandalone;
