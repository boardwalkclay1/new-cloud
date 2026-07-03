// work-safety.js
import { json } from "./work-utils.js";

export async function handleSafetyRoutes(path, request, db, url) {
  // SAFETY ALERT CREATE
  if (path.startsWith("/api/safety/create") && request.method === "POST") {
    const body = await request.json();
    const id = crypto.randomUUID();

    await db.prepare(
      `INSERT INTO cloud_safety_alerts (id, userId, category, message, location, severity, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`
    ).bind(
      id,
      body.userId,
      body.category,
      body.message,
      body.location || "",
      Number(body.severity || 1)
    ).run();

    return json({ success: true, id });
  }

  // SAFETY ALERT LIST
  if (path.startsWith("/api/safety/list")) {
    const { results } = await db.prepare(
      "SELECT * FROM cloud_safety_alerts ORDER BY createdAt DESC LIMIT 50"
    ).all();

    return json(results);
  }

  // LOST & FOUND CREATE
  if (path.startsWith("/api/lostfound/create") && request.method === "POST") {
    const body = await request.json();
    const id = crypto.randomUUID();

    await db.prepare(
      `INSERT INTO cloud_lost_found (id, userId, itemName, description, location, status, createdAt)
       VALUES (?, ?, ?, ?, ?, 'lost', datetime('now'))`
    ).bind(
      id,
      body.userId,
      body.itemName,
      body.description || "",
      body.location || ""
    ).run();

    return json({ success: true, id });
  }

  // LOST & FOUND UPDATE
  if (path.startsWith("/api/lostfound/update") && request.method === "POST") {
    const body = await request.json();

    await db.prepare(
      `UPDATE cloud_lost_found
       SET status = ?
       WHERE id = ?`
    ).bind(body.status, body.id).run();

    return json({ success: true });
  }

  // LOST & FOUND LIST
  if (path.startsWith("/api/lostfound/list")) {
    const { results } = await db.prepare(
      "SELECT * FROM cloud_lost_found ORDER BY createdAt DESC"
    ).all();

    return json(results);
  }

  return null;
}
