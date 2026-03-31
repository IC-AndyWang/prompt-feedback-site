import { badRequest, json } from "../_lib.js";

function normalizeWritableStatus(status) {
  if (status === "resolved") return "resolved";
  if (status === "open" || status === "active") return "open";
  return null;
}

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

  const nextContent =
    typeof body.content === "string" ? String(body.content).trim() : undefined;
  const nextStatus =
    typeof body.status === "string" ? normalizeWritableStatus(body.status.trim()) : undefined;

  if (!nextContent && !nextStatus) {
    return badRequest("content or status is required");
  }

  const comment = await env.DB
    .prepare(`
      SELECT id, user_id, status, content
      FROM comments
      WHERE id = ?
      LIMIT 1
    `)
    .bind(id)
    .first();

  if (!comment || comment.status === "deleted") {
    return json({ error: "Comment not found" }, { status: 404 });
  }

  if (comment.user_id !== data.user.id && data.user.role !== "admin") {
    return json({ error: "Forbidden" }, { status: 403 });
  }

  await env.DB
    .prepare(`
      UPDATE comments
      SET content = ?, status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `)
    .bind(
      nextContent || comment.content,
      nextStatus || normalizeWritableStatus(comment.status) || "open",
      id
    )
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

  if (!comment || comment.status === "deleted") {
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
