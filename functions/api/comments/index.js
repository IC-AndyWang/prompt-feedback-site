import { badRequest, json, randomId } from "../_lib.js";

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const moduleId = url.searchParams.get("moduleId");

  if (!moduleId) {
    return badRequest("moduleId is required");
  }

  const result = await env.DB
    .prepare(`
      SELECT
        c.id,
        c.module_id,
        c.user_id,
        c.parent_id,
        c.content,
        c.status,
        c.created_at,
        c.updated_at,
        u.email,
        u.name
      FROM comments c
      JOIN users u ON u.id = c.user_id
      WHERE c.module_id = ?
        AND c.status = 'active'
      ORDER BY c.created_at ASC
    `)
    .bind(moduleId)
    .run();

  return json({
    comments: result.results || []
  });
}

export async function onRequestPost(context) {
  const { request, env, data } = context;

  if (!data.user) {
    return json({ error: "Login required" }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return badRequest("Invalid JSON");
  }

  const moduleId = String(body.moduleId || "").trim();
  const content = String(body.content || "").trim();
  const parentId = body.parentId ? String(body.parentId).trim() : null;

  if (!moduleId) return badRequest("moduleId is required");
  if (!content) return badRequest("content is required");
  if (content.length > 5000) return badRequest("Comment is too long");

  const moduleExists = await env.DB
    .prepare(`SELECT id FROM modules WHERE id = ? LIMIT 1`)
    .bind(moduleId)
    .first();

  if (!moduleExists) {
    return badRequest("Module not found");
  }

  const id = randomId();

  await env.DB
    .prepare(`
      INSERT INTO comments (
        id, module_id, user_id, parent_id, content, status, created_at
      ) VALUES (?, ?, ?, ?, ?, 'active', CURRENT_TIMESTAMP)
    `)
    .bind(id, moduleId, data.user.id, parentId, content)
    .run();

  const inserted = await env.DB
    .prepare(`
      SELECT
        c.id,
        c.module_id,
        c.user_id,
        c.parent_id,
        c.content,
        c.status,
        c.created_at,
        c.updated_at,
        u.email,
        u.name
      FROM comments c
      JOIN users u ON u.id = c.user_id
      WHERE c.id = ?
      LIMIT 1
    `)
    .bind(id)
    .first();

  return json({
    ok: true,
    comment: inserted
  });
}

export async function onRequest(context) {
  if (context.request.method === "GET") return onRequestGet(context);
  if (context.request.method === "POST") return onRequestPost(context);
  return new Response("Method Not Allowed", { status: 405 });
}