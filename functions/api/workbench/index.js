import { json } from "../_lib.js";
import { isAdminUser, mapChangeRow, mapCopyRow } from "./_helpers.js";

export async function onRequestGet(context) {
  const { env, data } = context;

  if (!data.user) {
    return json({ error: "Login required" }, { status: 401 });
  }

  try {
    const copiesStatement = isAdminUser(data.user)
      ? env.DB.prepare(`
          SELECT
            id,
            base_document_id,
            owner_id,
            owner_name,
            name,
            created_at,
            updated_at,
            module_overrides_json
          FROM prompt_copies
          ORDER BY updated_at DESC, created_at DESC
        `)
      : env.DB.prepare(`
          SELECT
            id,
            base_document_id,
            owner_id,
            owner_name,
            name,
            created_at,
            updated_at,
            module_overrides_json
          FROM prompt_copies
          WHERE owner_id = ?
          ORDER BY updated_at DESC, created_at DESC
        `).bind(data.user.id);

    const changesStatement = isAdminUser(data.user)
      ? env.DB.prepare(`
          SELECT
            ch.id,
            ch.copy_id,
            ch.module_id,
            ch.module_title,
            ch.author_id,
            ch.author_name,
            ch.timestamp,
            ch.before_text,
            ch.after_text,
            ch.summary
          FROM copy_changes ch
          JOIN prompt_copies c ON c.id = ch.copy_id
          ORDER BY ch.timestamp DESC
        `)
      : env.DB.prepare(`
          SELECT
            ch.id,
            ch.copy_id,
            ch.module_id,
            ch.module_title,
            ch.author_id,
            ch.author_name,
            ch.timestamp,
            ch.before_text,
            ch.after_text,
            ch.summary
          FROM copy_changes ch
          JOIN prompt_copies c ON c.id = ch.copy_id
          WHERE c.owner_id = ?
          ORDER BY ch.timestamp DESC
        `).bind(data.user.id);

    const [copiesResult, changesResult] = await Promise.all([
      copiesStatement.run(),
      changesStatement.run(),
    ]);

    return json({
      ok: true,
      copies: (copiesResult.results || []).map(mapCopyRow),
      changeRecords: (changesResult.results || []).map(mapChangeRow),
    });
  } catch (error) {
    return json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Workbench storage is not configured",
      },
      { status: 503 },
    );
  }
}

export async function onRequest(context) {
  if (context.request.method === "GET") {
    return onRequestGet(context);
  }

  return new Response("Method Not Allowed", { status: 405 });
}
