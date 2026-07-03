const API = "https://api.beltlinecloud.com/api";

const STORAGE_KEY = "beltline_user";

/* ============================================================
   CORE USER — CLOUD / FAST ROLL / VENDORS / EVENTS
   Single profile object used across the app
============================================================ */

function getStoredUser() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function setStoredUser(user) {
  if (!user) {
    localStorage.removeItem(STORAGE_KEY);
    return;
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
}

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

    // Expect data.user from API
    const baseUser = {
      id: data.user.id,
      name: data.user.name,
      email: data.user.email,
      roles: data.user.roles || "",
      bio: data.user.bio || "",
      photoUrl: data.user.photoUrl || "",
      // unified sub-profiles
      responderProfile: data.user.responderProfile || null,
      vendorProfile: null,
      fastrollClient: null,
      fastrollRider: null,
      eventHostProfile: null
    };

    setStoredUser(baseUser);
    return baseUser;
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

    const baseUser = {
      id: data.user.id,
      name: data.user.name,
      email: data.user.email,
      roles: data.user.roles || "",
      bio: data.user.bio || "",
      photoUrl: data.user.photoUrl || "",
      responderProfile: data.user.responderProfile || null,
      vendorProfile: data.user.vendorProfile || null,
      fastrollClient: data.user.fastrollClient || null,
      fastrollRider: data.user.fastrollRider || null,
      eventHostProfile: data.user.eventHostProfile || null
    };

    setStoredUser(baseUser);
    return baseUser;
  },

  //
  // LOGOUT
  //
  logout() {
    setStoredUser(null);
    window.location.href = "/cloud/login.html";
  },

  //
  // CURRENT CLOUD / APP USER
  //
  current() {
    return getStoredUser();
  },

  //
  // REQUIRE LOGIN
  //
  require() {
    const user = this.current();
    if (!user) {
      window.location.href = "/cloud/login.html";
      return false;
    }
    return true;
  },

  //
  // UPDATE CLOUD PROFILE (base + responder)
  //
  async updateProfile(data) {
    const user = this.current();
    if (!user) throw new Error("No user session");

    const res = await fetch(`${API}/network/profile/update`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: user.id, ...data })
    });

    const out = await res.json();
    if (!res.ok) throw new Error(out.error || "Profile update failed");

    // sync local
    const updated = { ...user };

    if (data.name !== undefined) updated.name = data.name;
    if (data.email !== undefined) updated.email = data.email;
    if (data.bio !== undefined) updated.bio = data.bio;
    if (data.photo !== undefined) updated.photoUrl = data.photo;
    if (data.roles !== undefined)
      updated.roles = Array.isArray(data.roles) ? data.roles.join(",") : data.roles;

    if (data.responderProfile !== undefined)
      updated.responderProfile = data.responderProfile;

    setStoredUser(updated);
    return out;
  },

  //
  // UPDATE RESPONDER PROFILE (Responder page flows from cloud profile)
  //
  async updateResponderProfile(profile) {
    const user = this.current();
    if (!user) throw new Error("No user session");

    const res = await fetch(`${API}/network/responder/update`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: user.id, ...profile })
    });

    const out = await res.json();
    if (!res.ok) throw new Error(out.error || "Responder update failed");

    const updated = { ...user, responderProfile: { ...(user.responderProfile || {}), ...profile } };
    setStoredUser(updated);
    return out;
  }
};

/* ============================================================
   VENDOR AUTH — PRODUCT / SERVICE PROVIDERS
   Uses same core user (id, name, email)
============================================================ */

export const VendorAuth = {
  //
  // SIGNUP (attach vendor details to existing cloud user)
  //
  async signup(vendorData) {
    const user = Auth.current();
    if (!user) throw new Error("Login required for vendor signup");

    const res = await fetch(`${API}/vendor?action=signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: user.id,
        ...vendorData // name, brand, products, services, etc.
      })
    });

    const data = await res.json();
    if (!data || !data.success) throw new Error(data.error || "Vendor signup failed");

    const updated = { ...user, vendorProfile: { id: data.id, ...vendorData } };
    setStoredUser(updated);
    return updated.vendorProfile;
  },

  //
  // UPDATE VENDOR PROFILE
  //
  async update(profile) {
    const user = Auth.current();
    if (!user || !user.vendorProfile) throw new Error("No vendor profile");

    const res = await fetch(`${API}/vendor?action=update`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: user.vendorProfile.id, ...profile })
    });

    const data = await res.json();
    if (!data || !data.success) throw new Error(data.error || "Vendor update failed");

    const updatedVendor = { ...user.vendorProfile, ...profile };
    const updatedUser = { ...user, vendorProfile: updatedVendor };
    setStoredUser(updatedUser);
    return updatedVendor;
  },

  current() {
    const user = Auth.current();
    return user ? user.vendorProfile || null : null;
  }
};

/* ============================================================
   FAST ROLL — CLIENT AUTH (uses same core user)
============================================================ */

export const FastClientAuth = {
  //
  // SIGNUP (attach client profile to cloud user)
  //
  async signup(clientData) {
    const user = Auth.current();
    if (!user) throw new Error("Login required for client signup");

    const res = await fetch(`${API}/client?action=signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.id, ...clientData })
    });

    const data = await res.json();
    if (!data || !data.success) throw new Error("Client signup failed");

    const profile = { id: data.id, ...clientData };
    const updated = { ...user, fastrollClient: profile };
    setStoredUser(updated);
    return profile;
  },

  //
  // UPDATE
  //
  async update(profile) {
    const user = Auth.current();
    if (!user || !user.fastrollClient) throw new Error("No client session");

    await fetch(`${API}/client?action=update`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: user.fastrollClient.id, ...profile })
    });

    const updatedClient = { ...user.fastrollClient, ...profile };
    const updatedUser = { ...user, fastrollClient: updatedClient };
    setStoredUser(updatedUser);
    return updatedClient;
  },

  current() {
    const user = Auth.current();
    return user ? user.fastrollClient || null : null;
  }
};

/* ============================================================
   FAST ROLL — RIDER AUTH (uses same core user)
============================================================ */

export const FastRiderAuth = {
  //
  // SIGNUP (attach rider profile to cloud user)
  //
  async signup(riderData) {
    const user = Auth.current();
    if (!user) throw new Error("Login required for rider signup");

    const res = await fetch(`${API}/rider?action=signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.id, ...riderData })
    });

    const data = await res.json();
    if (!data || !data.success) throw new Error("Rider signup failed");

    const profile = { id: data.id, status: "offline", ...riderData };
    const updated = { ...user, fastrollRider: profile };
    setStoredUser(updated);
    return profile;
  },

  //
  // UPDATE
  //
  async update(profile) {
    const user = Auth.current();
    if (!user || !user.fastrollRider) throw new Error("No rider session");

    await fetch(`${API}/rider?action=update`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: user.fastrollRider.id, ...profile })
    });

    const updatedRider = { ...user.fastrollRider, ...profile };
    const updatedUser = { ...user, fastrollRider: updatedRider };
    setStoredUser(updatedUser);
    return updatedRider;
  },

  //
  // SET STATUS (active/offline)
  //
  async setStatus(status) {
    const user = Auth.current();
    if (!user || !user.fastrollRider) throw new Error("No rider session");

    await fetch(`${API}/rider?action=status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: user.fastrollRider.id, status })
    });

    const updatedRider = { ...user.fastrollRider, status };
    const updatedUser = { ...user, fastrollRider: updatedRider };
    setStoredUser(updatedUser);
    return updatedRider;
  },

  current() {
    const user = Auth.current();
    return user ? user.fastrollRider || null : null;
  }
};

/* ============================================================
   EVENT HOST PROFILE (for people who throw events)
============================================================ */

export const EventHostAuth = {
  async signup(hostData) {
    const user = Auth.current();
    if (!user) throw new Error("Login required for event host signup");

    const res = await fetch(`${API}/events?action=host_signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.id, ...hostData })
    });

    const data = await res.json();
    if (!data || !data.success) throw new Error(data.error || "Event host signup failed");

    const profile = { id: data.id, ...hostData };
    const updated = { ...user, eventHostProfile: profile };
    setStoredUser(updated);
    return profile;
  },

  async update(profile) {
    const user = Auth.current();
    if (!user || !user.eventHostProfile) throw new Error("No event host profile");

    const res = await fetch(`${API}/events?action=host_update`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: user.eventHostProfile.id, ...profile })
    });

    const data = await res.json();
    if (!data || !data.success) throw new Error(data.error || "Event host update failed");

    const updatedHost = { ...user.eventHostProfile, ...profile };
    const updatedUser = { ...user, eventHostProfile: updatedHost };
    setStoredUser(updatedUser);
    return updatedHost;
  },

  current() {
    const user = Auth.current();
    return user ? user.eventHostProfile || null : null;
  }
};
