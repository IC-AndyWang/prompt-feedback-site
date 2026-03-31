import { badRequest, json, randomId } from "../../_lib.js";
import { mapCopyRow, stringifyModuleOverrides } from "../_helpers.js";

export async function onRequestPost(context) {
  const { env, data, request } = context;

  if (!data.user) {
    return json({ error: "Login required" }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return badRequest("Invalid JSON");
  }

  const baseDocumentId = String(body.baseDocumentId || "").trim();
  const name = String(body.name || "").trim();
  const ownerName = String(body.ownerName || data.user.name || data.user.email || "").trim();

  if (!baseDocumentId) {
    return badRequest("baseDocumentId is required");
  }

  try {
    const existing = await env.DB
      .prepare(`
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
        WHERE owner_id = ? AND base_document_id = ?
        LIMIT 1
      `)
      .bind(data.user.id, baseDocumentId)
      .first();

    if (existing) {
      return json({ ok: true, copy: mapCopyRow(existing) });
    }

    const id = randomId();
    await env.DB
      .prepare(`
        INSERT INTO prompt_copies (
          id,
          base_document_id,
          owner_id,
          owner_name,
          name,
          module_overrides_json,
          created_at,
          updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `)
      .bind(
        id,
        baseDocumentId,
        data.user.id,
        ownerName || data.user.email,
        name || `${ownerName || data.user.email} 的 Prompt 副本`,
        stringifyModuleOverrides({}),
      )
      .run();

    const inserted = await env.DB
      .prepare(`
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
        WHERE id = ?
        LIMIT 1
      `)
      .bind(id)
      .first();

    return json({
      ok: true,
      copy: inserted ? mapCopyRow(inserted) : null,
    });
  } catch (error) {
    return json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to create prompt copy",
      },
      { status: 503 },
    );
  }
}

export async function onRequest(context) {
  if (context.request.method === "POST") {
    return onRequestPost(context);
  }

  return new Response("Method Not Allowed", { status: 405 });
}
