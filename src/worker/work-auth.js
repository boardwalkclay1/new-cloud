// work-auth.js — BELTLINE CLOUD AUTH ENGINE (CLOUD + FAST ROLL + RESPONSE + VENDOR)

export async function handleAuth(path, request, db, url, env) {

  /* ---------------------------------------------------------
     CLOUD SIGNUP — CREATE USER + SEND VERIFY EMAIL
  --------------------------------------------------------- */
  if (path === "/api/users/signup" && request.method === "POST") {
    const body = await request.json();
    const { email, name, password } = body;

    const id = crypto.randomUUID();
    const token = crypto.randomUUID();
    const lowerEmail = email.trim().toLowerCase();

    await db.prepare(
      `INSERT INTO cloud_users (id, email, name, password, verified, verifyToken)
       VALUES (?, ?, ?, ?, 0, ?)`
    ).bind(id, lowerEmail, name, password, token).run();

    const verifyUrl = `https://beltlinecloud.com/api/users/verify?token=${token}`;

    await env.EMAIL.send({
      from: "welcome@beltlinecloud.com",
      to: lowerEmail,
      subject: "Welcome to Beltline Cloud — Verify Your Email",
      html: WELCOME_VERIFY_EMAIL.replace(/{{verifyUrl}}/g, verifyUrl)
    });

    return json({ success: true });
  }


  /* ---------------------------------------------------------
     CLOUD VERIFY — USER CLICKS EMAIL LINK
  --------------------------------------------------------- */
  if (path === "/api/users/verify" && request.method === "GET") {
    const token = url.searchParams.get("token");

    const user = await db.prepare(
      "SELECT id FROM cloud_users WHERE verifyToken = ?"
    ).bind(token).first();

    if (!user) {
      return new Response("Invalid or expired verification link.", { status: 400 });
    }

    await db.prepare(
      "UPDATE cloud_users SET verified = 1, verifyToken = NULL WHERE id = ?"
    ).bind(user.id).run();

    return new Response("Your email is verified. You can close this page.");
  }


  /* ---------------------------------------------------------
     CLOUD LOGIN — BASIC EMAIL/PASSWORD
  --------------------------------------------------------- */
  if (path === "/api/users/login" && request.method === "POST") {
    const body = await request.json();
    const { email, password } = body;

    const lowerEmail = email.trim().toLowerCase();

    const user = await db.prepare(
      "SELECT * FROM cloud_users WHERE email = ? AND password = ?"
    ).bind(lowerEmail, password).first();

    if (!user) {
      return json({ success: false, error: "Invalid login" });
    }

    if (!user.verified) {
      return json({ success: false, error: "Email not verified" });
    }

    return json({ success: true, user });
  }


  /* ---------------------------------------------------------
     FAST ROLL — JOIN SERVICE + SEND WELCOME EMAIL
     expects: { userId, name, phone, vehicleType, paypal }
  --------------------------------------------------------- */
  if (path === "/api/fastroll/join" && request.method === "POST") {
    const body = await request.json();
    const { userId, name, phone, vehicleType, paypal } = body;

    const riderId = crypto.randomUUID();
    const createdAt = new Date().toISOString();

    await db.prepare(
      `INSERT INTO fastroll_riders (id, userId, name, phone, vehicleType, lastVehicleChange,
                                   bio, photoUrl, paypal, active, status, deliveryCount, createdAt, pin)
       VALUES (?, ?, ?, ?, ?, ?, '', '', ?, 1, 'active', 0, ?, NULL)`
    ).bind(riderId, userId, name, phone, vehicleType, createdAt, paypal, createdAt).run();

    const user = await db.prepare(
      "SELECT email FROM cloud_users WHERE id = ?"
    ).bind(userId).first();

    if (user && user.email) {
      await env.EMAIL.send({
        from: "fastroll@beltlinecloud.com",
        to: user.email,
        subject: "Fast Roll — Rider Welcome",
        html: FASTROLL_WELCOME_EMAIL
      });
    }

    return json({ success: true, riderId });
  }


  /* ---------------------------------------------------------
     RESPONSE UNIT — JOIN SERVICE + SEND WELCOME EMAIL
     expects: { userId, groupId, rank }
  --------------------------------------------------------- */
  if (path === "/api/response/join" && request.method === "POST") {
    const body = await request.json();
    const { userId, groupId, rank } = body;

    const memberId = crypto.randomUUID();
    const joinedAt = new Date().toISOString();

    await db.prepare(
      `INSERT INTO cloud_response_members (id, userId, groupId, rank, joinedAt, pin)
       VALUES (?, ?, ?, ?, ?, NULL)`
    ).bind(memberId, userId, groupId, rank, joinedAt).run();

    const user = await db.prepare(
      "SELECT email FROM cloud_users WHERE id = ?"
    ).bind(userId).first();

    if (user && user.email) {
      await env.EMAIL.send({
        from: "response@beltlinecloud.com",
        to: user.email,
        subject: "Response Unit — Welcome",
        html: RESPONSE_WELCOME_EMAIL
      });
    }

    return json({ success: true, memberId });
  }


  /* ---------------------------------------------------------
     VENDOR NETWORK — JOIN SERVICE + SEND WELCOME EMAIL
     expects: { ownerUserId, email, name }
  --------------------------------------------------------- */
  if (path === "/api/vendor/join" && request.method === "POST") {
    const body = await request.json();
    const { ownerUserId, email, name } = body;

    const vendorId = crypto.randomUUID();
    const createdAt = new Date().toISOString();

    await db.prepare(
      `INSERT INTO network_vendors (id, ownerUserId, email, name, bio, logo, cover, photoUrl,
                                    categories, tags, lat, lng, hasProducts, hasServices,
                                    hasWorkshops, hasApps, published, active, createdAt, pin)
       VALUES (?, ?, ?, ?, '', '', '', '', '', '', NULL, NULL, 0, 0, 0, 0, 1, 1, ?, NULL)`
    ).bind(vendorId, ownerUserId, email, name, createdAt).run();

    await env.EMAIL.send({
      from: "vendors@beltlinecloud.com",
      to: email,
      subject: "Vendor Network — Welcome",
      html: VENDOR_WELCOME_EMAIL
    });

    return json({ success: true, vendorId });
  }


  /* ---------------------------------------------------------
     PIN SETUP — FAST ROLL
     expects: { userId, pin }
  --------------------------------------------------------- */
  if (path === "/api/fastroll/pin" && request.method === "POST") {
    const body = await request.json();
    const { userId, pin } = body;

    await db.prepare(
      "UPDATE fastroll_riders SET pin = ? WHERE userId = ?"
    ).bind(pin, userId).run();

    return json({ success: true });
  }


  /* ---------------------------------------------------------
     PIN SETUP — RESPONSE UNIT
     expects: { userId, pin }
  --------------------------------------------------------- */
  if (path === "/api/response/pin" && request.method === "POST") {
    const body = await request.json();
    const { userId, pin } = body;

    await db.prepare(
      "UPDATE cloud_response_members SET pin = ? WHERE userId = ?"
    ).bind(pin, userId).run();

    return json({ success: true });
  }


  /* ---------------------------------------------------------
     PIN SETUP — VENDOR NETWORK
     expects: { ownerUserId, pin }
  --------------------------------------------------------- */
  if (path === "/api/vendor/pin" && request.method === "POST") {
    const body = await request.json();
    const { ownerUserId, pin } = body;

    await db.prepare(
      "UPDATE network_vendors SET pin = ? WHERE ownerUserId = ?"
    ).bind(pin, ownerUserId).run();

    return json({ success: true });
  }


  /* ---------------------------------------------------------
     PIN LOGIN — FAST ROLL
     expects: { userId, pin }
  --------------------------------------------------------- */
  if (path === "/api/fastroll/login" && request.method === "POST") {
    const body = await request.json();
    const { userId, pin } = body;

    const rider = await db.prepare(
      "SELECT * FROM fastroll_riders WHERE userId = ? AND pin = ? AND active = 1"
    ).bind(userId, pin).first();

    if (!rider) {
      return json({ success: false, error: "Invalid PIN" });
    }

    return json({ success: true, rider });
  }


  /* ---------------------------------------------------------
     PIN LOGIN — RESPONSE UNIT
     expects: { userId, pin }
  --------------------------------------------------------- */
  if (path === "/api/response/login" && request.method === "POST") {
    const body = await request.json();
    const { userId, pin } = body;

    const member = await db.prepare(
      "SELECT * FROM cloud_response_members WHERE userId = ? AND pin = ?"
    ).bind(userId, pin).first();

    if (!member) {
      return json({ success: false, error: "Invalid PIN" });
    }

    return json({ success: true, member });
  }


  /* ---------------------------------------------------------
     PIN LOGIN — VENDOR NETWORK
     expects: { ownerUserId, pin }
  --------------------------------------------------------- */
  if (path === "/api/vendor/login" && request.method === "POST") {
    const body = await request.json();
    const { ownerUserId, pin } = body;

    const vendor = await db.prepare(
      "SELECT * FROM network_vendors WHERE ownerUserId = ? AND pin = ? AND active = 1"
    ).bind(ownerUserId, pin).first();

    if (!vendor) {
      return json({ success: false, error: "Invalid PIN" });
    }

    return json({ success: true, vendor });
  }

  return null;
}


/* ---------------------------------------------------------
   EMAIL HTML — CLOUD WELCOME + VERIFY
--------------------------------------------------------- */

const WELCOME_VERIFY_EMAIL = `
<!DOCTYPE html>
<html>
  <body style="margin:0; padding:0; background:#eef2f7; font-family:Arial, sans-serif;">
    <div style="max-width:650px; margin:auto; background:white; padding:40px; border-radius:14px; box-shadow:0 4px 20px rgba(0,0,0,0.08);">
      <div style="text-align:center; margin-bottom:25px;">
        <img src="https://beltlinecloud.com/assets/img/cloud/logo.png"
             alt="Beltline Cloud Logo"
             style="width:150px; border-radius:10px;">
      </div>
      <h1 style="text-align:center; color:#222; margin-bottom:10px; font-size:28px;">
        Welcome to Beltline Cloud
      </h1>
      <p style="text-align:center; color:#555; font-size:16px; margin-bottom:35px;">
        Your digital journey starts now.
      </p>
      <p style="font-size:16px; color:#444; line-height:1.7;">
        Before you get started, please verify your email to activate your account.
      </p>
      <div style="text-align:center; margin:40px 0;">
        <a href="{{verifyUrl}}"
           style="background:#4a90e2; color:white; padding:14px 28px; border-radius:8px; text-decoration:none; font-weight:bold; font-size:16px;">
          Verify Your Email
        </a>
      </div>
      <p style="font-size:14px; color:#777; text-align:center; margin-bottom:40px;">
        If the button doesn’t work, copy and paste this link:<br>
        <span style="color:#4a90e2;">{{verifyUrl}}</span>
      </p>
      <p style="font-size:16px; color:#444; line-height:1.7;">
        Thank you for joining <strong>Beltline Cloud</strong> — the official digital network of the Atlanta Beltline.
      </p>
      <p style="margin-top:40px; font-size:16px; color:#333; line-height:1.7;">
        — The Cloud Creator<br>
        <span style="color:#777;">Beltline Cloud</span>
      </p>
    </div>
  </body>
</html>
`;


/* ---------------------------------------------------------
   EMAIL HTML — FAST ROLL WELCOME
--------------------------------------------------------- */

const FASTROLL_WELCOME_EMAIL = `
<!DOCTYPE html>
<html>
  <body style="margin:0; padding:0; background:#111726; font-family:Arial, sans-serif; color:white;">
    <div style="max-width:650px; margin:auto; background:#000000; padding:40px; border-radius:14px;">
      <div style="text-align:center; margin-bottom:25px;">
        <img src="https://beltlinecloud.com/public/assets/img/fast-roll/Fast-logo.png"
             alt="Fast Roll Logo"
             style="width:150px; background:white; padding:10px; border-radius:12px;">
      </div>
      <h1 style="text-align:center; color:#f7d354; margin-bottom:10px; font-size:28px;">
        Welcome to The Fast Roll
      </h1>
      <p style="text-align:center; color:#ddd; font-size:16px; margin-bottom:35px;">
        Your rider profile is ready. Set your PIN inside the app to start rolling.
      </p>
    </div>
  </body>
</html>
`;


/* ---------------------------------------------------------
   EMAIL HTML — RESPONSE UNIT WELCOME
--------------------------------------------------------- */

const RESPONSE_WELCOME_EMAIL = `
<!DOCTYPE html>
<html>
  <body style="margin:0; padding:0; background:#220000; font-family:Arial, sans-serif; color:white;">
    <div style="max-width:650px; margin:auto; background:#000000; padding:40px; border-radius:14px;">
      <div style="text-align:center; margin-bottom:25px;">
        <img src="https://beltlinecloud.com/public/assets/img/response/response-logo.png"
             alt="Response Unit Logo"
             style="width:150px; background:white; padding:10px; border-radius:12px;">
      </div>
      <h1 style="text-align:center; color:#e24a4a; margin-bottom:10px; font-size:28px;">
        Welcome to the Response Unit
      </h1>
      <p style="text-align:center; color:#ddd; font-size:16px; margin-bottom:35px;">
        Your Response credentials are active. Set your PIN inside the app to access your dashboard.
      </p>
    </div>
  </body>
</html>
`;


/* ---------------------------------------------------------
   EMAIL HTML — VENDOR NETWORK WELCOME
--------------------------------------------------------- */

const VENDOR_WELCOME_EMAIL = `
<!DOCTYPE html>
<html>
  <body style="margin:0; padding:0; background:#0b1a2a; font-family:Arial, sans-serif; color:white;">
    <div style="max-width:650px; margin:auto; background:#000000; padding:40px; border-radius:14px;">
      <div style="text-align:center; margin-bottom:25px;">
        <img src="https://beltlinecloud.com/public/assets/img/network/network-logo.png"
             alt="Vendor Network Logo"
             style="width:150px; background:white; padding:10px; border-radius:12px;">
      </div>
      <h1 style="text-align:center; color:#4a90e2; margin-bottom:10px; font-size:28px;">
        Welcome to the Vendor Network
      </h1>
      <p style="text-align:center; color:#ddd; font-size:16px; margin-bottom:35px;">
        Your storefront is ready. Set your PIN inside the app to access your vendor dashboard.
      </p>
    </div>
  </body>
</html>
`;


/* ---------------------------------------------------------
   JSON HELPER
--------------------------------------------------------- */
function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}
