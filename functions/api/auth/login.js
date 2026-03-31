import {
  badRequest,
  getSessionMaxAgeSeconds,
  json,
  makeSessionCookie,
  normalizeEmail,
  randomCode,
  randomId,
  sha256Hex,
  shouldUseSecureCookie
} from "../_lib.js";

export async function onRequestPost(context) {
  const { request, env } = context;

  let body;
  try {
    body = await request.json();
  } catch {
    return badRequest("Invalid JSON");
  }

  const email = normalizeEmail(body.email);
  if (!email || !email.includes("@")) {
    return badRequest("Valid email is required");
  }

  const user = await env.DB
    .prepare(`
      SELECT id, email, name, role, is_active
      FROM users
      WHERE email = ?
      LIMIT 1
    `)
    .bind(email)
    .first();

  if (!user || user.is_active !== 1) {
    return json({ error: "This email is not allowed to log in." }, { status: 403 });
  }

  await env.DB
    .prepare(`
      UPDATE users
      SET last_login_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `)
    .bind(user.id)
    .run();

  const sessionToken = `${randomId()}-${randomCode(8)}`;
  const sessionTokenHash = await sha256Hex(sessionToken);
  const maxAgeSeconds = getSessionMaxAgeSeconds(env);
  const expiresModifier = `+${Math.ceil(maxAgeSeconds / 86400)} days`;

  await env.DB
    .prepare(`
      INSERT INTO sessions (
        id, user_id, session_token_hash, expires_at, ip, user_agent
      ) VALUES (?, ?, ?, datetime('now', ?), ?, ?)
    `)
    .bind(
      randomId(),
      user.id,
      sessionTokenHash,
      expiresModifier,
      request.headers.get("CF-Connecting-IP"),
      request.headers.get("user-agent")
    )
    .run();

  return json(
    {
      ok: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    },
    {
      headers: {
        "Set-Cookie": makeSessionCookie(
          sessionToken,
          maxAgeSeconds,
          shouldUseSecureCookie(request)
        )
      }
    }
  );
}

export async function onRequest(context) {
  if (context.request.method === "POST") return onRequestPost(context);
  return new Response("Method Not Allowed", { status: 405 });
}
