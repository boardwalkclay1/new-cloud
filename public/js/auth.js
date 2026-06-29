const API = "https://beltlinecloud.com/api/network";

export const Auth = {
  //
  // SIGNUP
  //
  async signup(name, email, password) {
    const res = await fetch(`${API}/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Signup failed");

    return data;
  },

  //
  // LOGIN
  //
  async login(email, password) {
    const res = await fetch(`${API}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Login failed");

    // Save user session
    localStorage.setItem("cloud_user", JSON.stringify(data.user));
    return data.user;
  },

  //
  // LOGOUT
  //
  logout() {
    localStorage.removeItem("cloud_user");
    window.location.href = "/cloud/login.html";
  },

  //
  // GET CURRENT USER
  //
  current() {
    const raw = localStorage.getItem("cloud_user");
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },

  //
  // REQUIRE LOGIN (protect pages)
  //
  require() {
    const user = this.current();
    if (!user) {
      window.location.href = "/pages/login.html";
      return false;
    }
    return true;
  },

  //
  // UPDATE PROFILE (roles, bio, photo, interests)
  //
  async updateProfile(data) {
    const res = await fetch(`${API}/profile/update`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });

    const out = await res.json();
    if (!res.ok) throw new Error(out.error || "Profile update failed");

    // Merge updated fields into local user
    const user = this.current();
    if (user) {
      if (data.bio !== undefined) user.bio = data.bio;
      if (data.photo !== undefined) user.photoUrl = data.photo;
      if (data.roles !== undefined) user.roles = Array.isArray(data.roles) ? data.roles.join(",") : data.roles;
      localStorage.setItem("cloud_user", JSON.stringify(user));
    }

    return out;
  }
};
