import { json } from "../_lib.js";

export async function onRequestGet(context) {
  const { env } = context;

  const result = await env.DB
    .prepare(`
      SELECT id, version_name, description, created_at, is_published
      FROM prompt_versions
      WHERE is_published = 1
      ORDER BY created_at DESC
    `)
    .run();

  return json({
    success: true,
    versions: result.results || []
  });
}

export async function onRequest(context) {
  if (context.request.method === "GET") {
    return onRequestGet(context);
  }

  return new Response("Method Not Allowed", { status: 405 });
}