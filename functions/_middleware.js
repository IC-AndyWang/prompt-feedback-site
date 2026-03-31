import { sha256Hex, getCookie } from "./api/_lib.js";

export async function onRequest(context) {
  const { request, env } = context;

  context.data.user = null;

  const sessionToken = getCookie(request, "session");

  if (sessionToken) {
    const sessionTokenHash = await sha256Hex(sessionToken);

    const row = await env.DB
      .prepare(`
        SELECT
          s.id AS session_id,
          s.user_id,
          s.session_token_hash,
          s.expires_at,
          u.email,
          u.name,
          u.role,
          u.is_active
        FROM sessions s
        JOIN users u ON u.id = s.user_id
        WHERE s.session_token_hash = ?
          AND s.expires_at > CURRENT_TIMESTAMP
        LIMIT 1
      `)
      .bind(sessionTokenHash)
      .first();

    if (row && row.is_active === 1) {
      context.data.user = {
        id: row.user_id,
        email: row.email,
        name: row.name,
        role: row.role
      };
    }
  }

  if (request.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type"
      }
    });
  }

  const response = await context.next();
  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type");
  response.headers.set("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  return response;
}
