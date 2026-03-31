import { badRequest, json, randomId } from "../_lib.js";

function normalizeCommentStatus(status) {
  if (status === "resolved") return "resolved";
  if (status === "deleted") return "deleted";
  return "open";
}

async function ensureModuleRecord(env, input) {
  const moduleId = input.moduleId ? String(input.moduleId).trim() : "";
  const moduleKey = input.moduleKey ? String(input.moduleKey).trim() : "";
  const moduleTitle = input.moduleTitle ? String(input.moduleTitle).trim() : moduleKey;

  if (moduleId) {
    const byId = await env.DB
      .prepare(`SELECT id, module_key FROM modules WHERE id = ? LIMIT 1`)
      .bind(moduleId)
      .first();

    if (byId) {
      return byId;
    }
  }

  if (moduleKey) {
    const byKey = await env.DB
      .prepare(`SELECT id, module_key FROM modules WHERE module_key = ? LIMIT 1`)
      .bind(moduleKey)
      .first();

    if (byKey) {
      return byKey;
    }
  }

  if (!moduleKey) {
    return null;
  }

  const version = await env.DB
    .prepare(`
      SELECT id
      FROM prompt_versions
      ORDER BY is_published DESC, created_at DESC
      LIMIT 1
    `)
    .first();

  if (!version) {
    return null;
  }

  const nextModule = {
    id: randomId(),
    module_key: moduleKey,
  };

  try {
    await env.DB
      .prepare(`
        INSERT INTO modules (
          id, version_id, module_key, title, content, sort_order, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `)
      .bind(
        nextModule.id,
        version.id,
        moduleKey,
        moduleTitle || moduleKey,
        "",
        9999,
      )
      .run();

    return nextModule;
  } catch {
    const retried = await env.DB
      .prepare(`SELECT id, module_key FROM modules WHERE module_key = ? LIMIT 1`)
      .bind(moduleKey)
      .first();

    return retried || null;
  }
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const moduleId = url.searchParams.get("moduleId");
  const moduleKey = url.searchParams.get("moduleKey");

  if (!moduleId && !moduleKey) {
    return badRequest("moduleId or moduleKey is required");
  }

  const statement = moduleId
    ? env.DB.prepare(`
        SELECT
          c.id,
          c.module_id,
          m.module_key,
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
        JOIN modules m ON m.id = c.module_id
        WHERE c.module_id = ?
          AND c.status != 'deleted'
        ORDER BY c.created_at ASC
      `).bind(moduleId)
    : env.DB.prepare(`
        SELECT
          c.id,
          c.module_id,
          m.module_key,
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
        JOIN modules m ON m.id = c.module_id
        WHERE m.module_key = ?
          AND c.status != 'deleted'
        ORDER BY c.created_at ASC
      `).bind(moduleKey);

  const result = await statement.run();

  return json({
    comments: (result.results || []).map((row) => ({
      ...row,
      status: normalizeCommentStatus(row.status)
    }))
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

  const moduleId = body.moduleId ? String(body.moduleId).trim() : "";
  const moduleKey = body.moduleKey ? String(body.moduleKey).trim() : "";
  const moduleTitle = body.moduleTitle ? String(body.moduleTitle).trim() : "";
  const content = String(body.content || "").trim();
  const parentId = body.parentId ? String(body.parentId).trim() : null;

  if (!moduleId && !moduleKey) {
    return badRequest("moduleId or moduleKey is required");
  }
  if (!content) return badRequest("content is required");
  if (content.length > 5000) return badRequest("Comment is too long");

  const moduleRecord = await ensureModuleRecord(env, {
    moduleId,
    moduleKey,
    moduleTitle,
  });

  if (!moduleRecord) {
    return badRequest("Module not found and could not be registered");
  }

  const id = randomId();

  await env.DB
    .prepare(`
      INSERT INTO comments (
        id, module_id, user_id, parent_id, content, status, created_at
      ) VALUES (?, ?, ?, ?, ?, 'open', CURRENT_TIMESTAMP)
    `)
    .bind(id, moduleRecord.id, data.user.id, parentId, content)
    .run();

  const inserted = await env.DB
    .prepare(`
      SELECT
        c.id,
        c.module_id,
        m.module_key,
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
      JOIN modules m ON m.id = c.module_id
      WHERE c.id = ?
      LIMIT 1
    `)
    .bind(id)
    .first();

  return json({
    ok: true,
    comment: inserted
      ? {
          ...inserted,
          status: normalizeCommentStatus(inserted.status)
        }
      : null
  });
}

export async function onRequest(context) {
  if (context.request.method === "GET") return onRequestGet(context);
  if (context.request.method === "POST") return onRequestPost(context);
  return new Response("Method Not Allowed", { status: 405 });
}
