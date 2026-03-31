import {
  badRequest,
  json,
  makeSessionCookie,
  normalizeEmail,
  randomCode,
  randomId,
  sha256Hex
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
  const code = String(body.code || "").trim();

  if (!email || !code) {
    return badRequest("Email and code are required");
  }

  const codeHash = await sha256Hex(code);

  const authCode = await env.DB
    .prepare(`
      SELECT id, invite_code_id
      FROM auth_codes
      WHERE email = ?
        AND code_hash = ?
        AND type = 'otp'
        AND used_at IS NULL
        AND expires_at > CURRENT_TIMESTAMP
      ORDER BY created_at DESC
      LIMIT 1
    `)
    .bind(email, codeHash)
    .first();

  if (!authCode) {
    return badRequest("Invalid or expired code");
  }

  let user = await env.DB
    .prepare(`
      SELECT id, email, role
      FROM users
      WHERE email = ?
      LIMIT 1
    `)
    .bind(email)
    .first();

  if (!user) {
    let role = "reviewer";

    if (authCode.invite_code_id) {
      const invite = await env.DB
        .prepare(`
          SELECT role
          FROM invite_codes
          WHERE id = ?
          LIMIT 1
        `)
        .bind(authCode.invite_code_id)
        .first();

      if (invite?.role) role = invite.role;
    }

    const newUserId = randomId();

    await env.DB
      .prepare(`
        INSERT INTO users (id, email, role, created_at, last_login_at)
        VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `)
      .bind(newUserId, email, role)
      .run();

    user = { id: newUserId, email, role };
  } else {
    await env.DB
      .prepare(`
        UPDATE users
        SET last_login_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `)
      .bind(user.id)
      .run();
  }

  await env.DB
    .prepare(`
      UPDATE auth_codes
      SET used_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `)
    .bind(authCode.id)
    .run();

  if (authCode.invite_code_id) {
    await env.DB
      .prepare(`
        UPDATE invite_codes
        SET used_count = used_count + 1
        WHERE id = ?
      `)
      .bind(authCode.invite_code_id)
      .run();
  }

  const sessionToken = `${randomId()}-${randomCode(8)}`;
  const sessionTokenHash = await sha256Hex(sessionToken);

  await env.DB
    .prepare(`
      INSERT INTO sessions (
        id, user_id, session_token_hash, expires_at, ip, user_agent
      ) VALUES (?, ?, ?, datetime('now', '+30 days'), ?, ?)
    `)
    .bind(
      randomId(),
      user.id,
      sessionTokenHash,
      request.headers.get("CF-Connecting-IP"),
      request.headers.get("user-agent")
    )
    .run();

  return json(
    {
      ok: true,
      user
    },
    {
      headers: {
        "Set-Cookie": makeSessionCookie(sessionToken)
      }
    }
  );
}

export async function onRequest(context) {
  if (context.request.method === "POST") return onRequestPost(context);
  return new Response("Method Not Allowed", { status: 405 });
}