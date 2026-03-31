import { badRequest, json } from "../_lib.js";

export async function onRequestPut(context) {
  const { env, data, request, params } = context;

  if (!data.user) {
    return json({ error: "Login required" }, { status: 401 });
  }

  const id = params.id;

  let body;
  try {
    body = await request.json();
  } catch {
    return badRequest("Invalid JSON");
  }

  const content = String(body.content || "").trim();
  if (!content) return badRequest("content is required");

  const comment = await env.DB
    .prepare(`
      SELECT id, user_id, status
      FROM comments
      WHERE id = ?
      LIMIT 1
    `)
    .bind(id)
    .first();

  if (!comment || comment.status !== "active") {
    return json({ error: "Comment not found" }, { status: 404 });
  }

  if (comment.user_id !== data.user.id && data.user.role !== "admin") {
    return json({ error: "Forbidden" }, { status: 403 });
  }

  await env.DB
    .prepare(`
      UPDATE comments
      SET content = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `)
    .bind(content, id)
    .run();

  return json({ ok: true });
}

export async function onRequestDelete(context) {
  const { env, data, params } = context;

  if (!data.user) {
    return json({ error: "Login required" }, { status: 401 });
  }

  const id = params.id;

  const comment = await env.DB
    .prepare(`
      SELECT id, user_id, status
      FROM comments
      WHERE id = ?
      LIMIT 1
    `)
    .bind(id)
    .first();

  if (!comment || comment.status !== "active") {
    return json({ error: "Comment not found" }, { status: 404 });
  }

  if (comment.user_id !== data.user.id && data.user.role !== "admin") {
    return json({ error: "Forbidden" }, { status: 403 });
  }

  await env.DB
    .prepare(`
      UPDATE comments
      SET status = 'deleted', updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `)
    .bind(id)
    .run();

  return json({ ok: true });
}

export async function onRequest(context) {
  if (context.request.method === "PUT") return onRequestPut(context);
  if (context.request.method === "DELETE") return onRequestDelete(context);
  return new Response("Method Not Allowed", { status: 405 });
}