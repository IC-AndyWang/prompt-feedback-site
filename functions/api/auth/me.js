import { json, getCookie, sha256Hex } from "../_lib.js";

export async function onRequestGet(context) {
  const { request, env } = context;

  const sessionToken = getCookie(request, "session");
  const sessionTokenHash = sessionToken ? await sha256Hex(sessionToken) : null;

  let sessionRow = null;
  if (sessionTokenHash) {
    sessionRow = await env.DB
      .prepare(`
        SELECT
          s.id as session_id,
          s.user_id,
          s.session_token_hash,
          s.expires_at,
          s.created_at,
          s.last_seen_at,
          u.email,
          u.name,
          u.role,
          u.is_active
        FROM sessions s
        LEFT JOIN users u ON u.id = s.user_id
        WHERE s.session_token_hash = ?
        LIMIT 1
      `)
      .bind(sessionTokenHash)
      .first();
  }

  return json({
    user: context.data.user || null,
    debug: {
      hasCookie: !!sessionToken,
      sessionToken,
      sessionTokenHash,
      sessionRow
    }
  });
}

export async function onRequest(context) {
  if (context.request.method === "GET") return onRequestGet(context);
  return new Response("Method Not Allowed", { status: 405 });
}