import { badRequest, json, randomId } from "../../_lib.js";
import {
  isAdminUser,
  mapChangeRow,
  mapCopyRow,
  parseModuleOverrides,
  stringifyModuleOverrides,
} from "../_helpers.js";

export async function onRequestPut(context) {
  const { env, data, request, params } = context;

  if (!data.user) {
    return json({ error: "Login required" }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return badRequest("Invalid JSON");
  }

  const copyId = params.id;
  const moduleId = String(body.moduleId || "").trim();
  const moduleTitle = String(body.moduleTitle || "").trim();
  const baseText = typeof body.baseText === "string" ? body.baseText : "";
  const nextText = typeof body.nextText === "string" ? body.nextText : "";
  const authorName = String(body.authorName || data.user.name || data.user.email || "").trim();

  if (!moduleId || !moduleTitle) {
    return badRequest("moduleId and moduleTitle are required");
  }

  try {
    const copy = await env.DB
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
      .bind(copyId)
      .first();

    if (!copy) {
      return json({ error: "Prompt copy not found" }, { status: 404 });
    }

    if (copy.owner_id !== data.user.id && !isAdminUser(data.user)) {
      return json({ error: "Forbidden" }, { status: 403 });
    }

    const overrides = parseModuleOverrides(copy.module_overrides_json);
    const previousText = overrides[moduleId] ?? baseText;

    if (previousText === nextText) {
      return json({ ok: true, copy: mapCopyRow(copy), changeRecord: null });
    }

    const nextOverrides = { ...overrides };
    if (nextText === baseText) {
      delete nextOverrides[moduleId];
    } else {
      nextOverrides[moduleId] = nextText;
    }

    const summary =
      nextText === baseText
        ? `将“${moduleTitle}”恢复为主版本内容`
        : `更新了“${moduleTitle}”模块的内容表述`;

    const changeId = randomId();

    await env.DB
      .prepare(`
        UPDATE prompt_copies
        SET module_overrides_json = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `)
      .bind(stringifyModuleOverrides(nextOverrides), copyId)
      .run();

    await env.DB
      .prepare(`
        INSERT INTO copy_changes (
          id,
          copy_id,
          module_id,
          module_title,
          author_id,
          author_name,
          timestamp,
          before_text,
          after_text,
          summary
        ) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?, ?, ?)
      `)
      .bind(
        changeId,
        copyId,
        moduleId,
        moduleTitle,
        data.user.id,
        authorName || data.user.email,
        previousText,
        nextText,
        summary,
      )
      .run();

    const [updatedCopy, insertedChange] = await Promise.all([
      env.DB
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
        .bind(copyId)
        .first(),
      env.DB
        .prepare(`
          SELECT
            id,
            copy_id,
            module_id,
            module_title,
            author_id,
            author_name,
            timestamp,
            before_text,
            after_text,
            summary
          FROM copy_changes
          WHERE id = ?
          LIMIT 1
        `)
        .bind(changeId)
        .first(),
    ]);

    return json({
      ok: true,
      copy: updatedCopy ? mapCopyRow(updatedCopy) : null,
      changeRecord: insertedChange ? mapChangeRow(insertedChange) : null,
    });
  } catch (error) {
    return json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to save prompt change",
      },
      { status: 503 },
    );
  }
}

export async function onRequest(context) {
  if (context.request.method === "PUT") {
    return onRequestPut(context);
  }

  return new Response("Method Not Allowed", { status: 405 });
}
