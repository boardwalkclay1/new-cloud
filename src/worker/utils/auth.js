export function hashPassword(password) {
  return btoa(password)
}

export function generateToken(userId) {
  return btoa(`${userId}:${Date.now()}`)
}

export async function getUserFromToken(request, env) {
  const auth = request.headers.get("Authorization") || ""
  if (!auth) return null

  const [userId] = atob(auth).split(":")
  if (!userId) return null

  return await env.DB_network.prepare(
    "SELECT * FROM network_users WHERE id = ?"
  ).bind(userId).first()
}
