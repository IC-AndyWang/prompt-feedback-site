export function json(data, init = {}) {
  return new Response(JSON.stringify(data), {
    status: init.status || 200,
    headers: {
      "content-type": "application/json; charset=utf-8",
      ...(init.headers || {})
    }
  });
}

export function badRequest(message = "Bad request") {
  return json({ error: message }, { status: 400 });
}

export async function sha256Hex(input) {
  const data = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(hash)].map(b => b.toString(16).padStart(2, "0")).join("");
}

export function randomId() {
  return crypto.randomUUID();
}

export function randomCode(length = 6) {
  let out = "";
  for (let i = 0; i < length; i++) out += Math.floor(Math.random() * 10);
  return out;
}

export function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

export function getCookie(request, name) {
  const cookie = request.headers.get("cookie") || "";
  const parts = cookie.split(";").map(s => s.trim());
  for (const part of parts) {
    const [k, ...rest] = part.split("=");
    if (k === name) return decodeURIComponent(rest.join("="));
  }
  return null;
}

export function getSessionMaxAgeSeconds(env) {
  const rawDays = Number(env?.SESSION_MAX_AGE_DAYS || 30);
  const safeDays = Number.isFinite(rawDays) && rawDays > 0 ? rawDays : 30;
  return Math.floor(safeDays * 24 * 60 * 60);
}

export function shouldUseSecureCookie(request) {
  try {
    const url = new URL(request.url);
    return url.protocol === "https:";
  } catch {
    return true;
  }
}

export function makeSessionCookie(token, maxAgeSeconds = 60 * 60 * 24 * 30, secure = true) {
  return [
    `session=${encodeURIComponent(token)}`,
    "Path=/",
    "HttpOnly",
    ...(secure ? ["Secure"] : []),
    "SameSite=Lax",
    `Max-Age=${maxAgeSeconds}`
  ].join("; ");
}

export function clearSessionCookie(secure = true) {
  return [
    "session=",
    "Path=/",
    "HttpOnly",
    ...(secure ? ["Secure"] : []),
    "SameSite=Lax",
    "Max-Age=0"
  ].join("; ");
}

export function futureIso(minutesFromNow) {
  return new Date(Date.now() + minutesFromNow * 60 * 1000).toISOString();
}
