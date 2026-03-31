import { json } from "../_lib.js";

export async function onRequestGet(context) {
  const { env, params } = context;
  const versionId = params.id;

  const version = await env.DB
    .prepare(`
      SELECT id, version_name, description, created_at
      FROM prompt_versions
      WHERE id = ?
      LIMIT 1
    `)
    .bind(versionId)
    .first();

  if (!version) {
    return json({ success: false, error: "Version not found" }, { status: 404 });
  }

  const modulesResult = await env.DB
    .prepare(`
      SELECT id, version_id, module_key, title, content, sort_order, created_at
      FROM modules
      WHERE version_id = ?
      ORDER BY sort_order ASC, created_at ASC
    `)
    .bind(versionId)
    .run();

  return json({
    success: true,
    version,
    modules: modulesResult.results || []
  });
}

export async function onRequest(context) {
  if (context.request.method === "GET") {
    return onRequestGet(context);
  }

  return new Response("Method Not Allowed", { status: 405 });
}