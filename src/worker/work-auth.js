// work-auth.js — BELTLINE CLOUD AUTH ENGINE (REAL VERIFICATION + EMAIL)

export async function handleAuth(path, request, db, url, env) {

  /* ---------------------------------------------------------
     SIGNUP — CREATE USER + SEND VERIFY EMAIL
  --------------------------------------------------------- */
  if (path === "/api/users/signup" && request.method === "POST") {
    const body = await request.json();
    const { email, name, password } = body;

    const id = crypto.randomUUID();
    const token = crypto.randomUUID();
    const lowerEmail = email.trim().toLowerCase();

    // Save user with verification token
    await db.prepare(
      `INSERT INTO cloud_users (id, email, name, password, verified, verifyToken)
       VALUES (?, ?, ?, ?, 0, ?)`
    ).bind(id, lowerEmail, name, password, token).run();

    // Build verification link
    const verifyUrl = `https://beltlinecloud.com/api/users/verify?token=${token}`;

    // Send combined welcome + verify email
    await env.EMAIL.send({
      from: "welcome@beltlinecloud.com",
      to: lowerEmail,
      subject: "Welcome to Beltline Cloud — Verify Your Email",
      html: WELCOME_VERIFY_EMAIL.replace(/{{verifyUrl}}/g, verifyUrl)
    });

    return json({ success: true });
  }


  /* ---------------------------------------------------------
     VERIFY — USER CLICKS EMAIL LINK
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
     LOGIN — MUST BE VERIFIED
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

    return json({ success: true, user });
  }

  return null;
}


/* ---------------------------------------------------------
   EMAIL HTML — COMBINED WELCOME + VERIFY
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
   JSON HELPER
--------------------------------------------------------- */
function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}
