import {
  clearSessionCookie,
  getCookie,
  json,
  sha256Hex,
  shouldUseSecureCookie
} from "../_lib.js";

export async function onRequestPost(context) {
  const { request, env } = context;

  const sessionToken = getCookie(request, "session");
  if (sessionToken) {
    const sessionTokenHash = await sha256Hex(sessionToken);
    await env.DB
      .prepare(`DELETE FROM sessions WHERE session_token_hash = ?`)
      .bind(sessionTokenHash)
      .run();
  }

  return json(
    { ok: true },
    {
      headers: {
        "Set-Cookie": clearSessionCookie(shouldUseSecureCookie(request))
      }
    }
  );
}

export async function onRequest(context) {
  if (context.request.method === "POST") return onRequestPost(context);
  return new Response("Method Not Allowed", { status: 405 });
}
