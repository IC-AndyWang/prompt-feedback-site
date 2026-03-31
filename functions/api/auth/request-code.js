import {
  badRequest,
  json,
  normalizeEmail,
  randomCode,
  randomId,
  sha256Hex,
  futureIso
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
  const inviteCode = body.inviteCode ? String(body.inviteCode).trim() : null;

  if (!email || !email.includes("@")) {
    return badRequest("Valid email is required");
  }

  const recent = await env.DB
    .prepare(`
      SELECT id
      FROM auth_codes
      WHERE email = ?
        AND created_at > datetime('now', '-60 seconds')
      LIMIT 1
    `)
    .bind(email)
    .first();

  if (recent) {
    return json({ error: "Please wait before requesting another code." }, { status: 429 });
  }

  let inviteCodeId = null;
  if (inviteCode) {
    const invite = await env.DB
      .prepare(`
        SELECT id, max_uses, used_count, expires_at, is_active
        FROM invite_codes
        WHERE code = ?
        LIMIT 1
      `)
      .bind(inviteCode)
      .first();

    if (!invite || invite.is_active !== 1) {
      return badRequest("Invalid invite code");
    }

    if (invite.expires_at && invite.expires_at <= new Date().toISOString()) {
      return badRequest("Invite code expired");
    }

    if (invite.used_count >= invite.max_uses) {
      return badRequest("Invite code has reached its usage limit");
    }

    inviteCodeId = invite.id;
  }

  const code = randomCode(6);
  const codeHash = await sha256Hex(code);

  await env.DB
    .prepare(`
      INSERT INTO auth_codes (
        id, email, code_hash, type, invite_code_id, expires_at, request_ip, request_ua
      ) VALUES (?, ?, ?, 'otp', ?, ?, ?, ?)
    `)
    .bind(
      randomId(),
      email,
      codeHash,
      inviteCodeId,
      futureIso(10),
      request.headers.get("CF-Connecting-IP"),
      request.headers.get("user-agent")
    )
    .run();

  return json({
    ok: true,
    message: "Verification code sent.",
    devCode: code
  });
}

export async function onRequest(context) {
  if (context.request.method === "POST") return onRequestPost(context);
  return new Response("Method Not Allowed", { status: 405 });
}