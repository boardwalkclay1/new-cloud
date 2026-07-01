const API = "https://beltlinecloud.com/api";

/* ============================================================
   AUTH — CLOUD USERS (NETWORK)
============================================================ */

export const Auth = {
  //
  // SIGNUP (Network)
  //
  async signup(name, email, password) {
    const res = await fetch(`${API}/network/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Signup failed");

    return data;
  },

  //
  // LOGIN (Network)
  //
  async login(email, password) {
    const res = await fetch(`${API}/network/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Login failed");

    // Save cloud user session
    localStorage.setItem("cloud_user", JSON.stringify(data.user));

    // ALSO sync staff/vendor session
    localStorage.setItem("network_staff_user", JSON.stringify({
      email: data.user.email,
      name: data.user.name,
      types: (data.user.roles || "").split(",")
    }));

    return data.user;
  },

  //
  // LOGOUT
  //
  logout() {
    localStorage.removeItem("cloud_user");
    localStorage.removeItem("network_staff_user");
    localStorage.removeItem("fastroll_client");
    localStorage.removeItem("fastroll_rider");

    window.location.href = "/cloud/login.html";
  },

  //
  // CURRENT CLOUD USER
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
  // REQUIRE LOGIN
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
  // UPDATE CLOUD PROFILE
  //
  async updateProfile(data) {
    const res = await fetch(`${API}/network/profile/update`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });

    const out = await res.json();
    if (!res.ok) throw new Error(out.error || "Profile update failed");

    const user = this.current();
    if (user) {
      if (data.bio !== undefined) user.bio = data.bio;
      if (data.photo !== undefined) user.photoUrl = data.photo;
      if (data.roles !== undefined)
        user.roles = Array.isArray(data.roles) ? data.roles.join(",") : data.roles;

      localStorage.setItem("cloud_user", JSON.stringify(user));
    }

    return out;
  }
};

/* ============================================================
   FAST ROLL — CLIENT AUTH
============================================================ */

export const FastClientAuth = {
  //
  // SIGNUP
  //
  async signup(name, phone, email) {
    const res = await fetch(`${API}/client?action=signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, phone, email })
    });

    const data = await res.json();
    if (!data || !data.success) throw new Error("Client signup failed");

    const profile = { id: data.id, name, phone, email };
    localStorage.setItem("fastroll_client", JSON.stringify(profile));
    return profile;
  },

  //
  // UPDATE
  //
  async update(profile) {
    const client = this.current();
    if (!client) throw new Error("No client session");

    await fetch(`${API}/client?action=update`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: client.id, ...profile })
    });

    const updated = { ...client, ...profile };
    localStorage.setItem("fastroll_client", JSON.stringify(updated));
    return updated;
  },

  //
  // CURRENT CLIENT
  //
  current() {
    const raw = localStorage.getItem("fastroll_client");
    return raw ? JSON.parse(raw) : null;
  }
};

/* ============================================================
   FAST ROLL — RIDER AUTH
============================================================ */

export const FastRiderAuth = {
  //
  // SIGNUP
  //
  async signup(name, phone, vehicle) {
    const res = await fetch(`${API}/rider?action=signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, phone, vehicle })
    });

    const data = await res.json();
    if (!data || !data.success) throw new Error("Rider signup failed");

    const profile = { id: data.id, name, phone, vehicle };
    localStorage.setItem("fastroll_rider", JSON.stringify(profile));
    return profile;
  },

  //
  // UPDATE
  //
  async update(profile) {
    const rider = this.current();
    if (!rider) throw new Error("No rider session");

    await fetch(`${API}/rider?action=update`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: rider.id, ...profile })
    });

    const updated = { ...rider, ...profile };
    localStorage.setItem("fastroll_rider", JSON.stringify(updated));
    return updated;
  },

  //
  // SET STATUS (active/offline)
  //
  async setStatus(status) {
    const rider = this.current();
    if (!rider) throw new Error("No rider session");

    await fetch(`${API}/rider?action=status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: rider.id, status })
    });

    rider.status = status;
    localStorage.setItem("fastroll_rider", JSON.stringify(rider));
    return rider;
  },

  //
  // CURRENT RIDER
  //
  current() {
    const raw = localStorage.getItem("fastroll_rider");
    return raw ? JSON.parse(raw) : null;
  }
};
