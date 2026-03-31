export function parseModuleOverrides(raw) {
  if (!raw) {
    return {};
  }

  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export function mapCopyRow(row) {
  return {
    id: row.id,
    baseDocumentId: row.base_document_id,
    ownerId: row.owner_id,
    ownerName: row.owner_name,
    name: row.name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    moduleOverrides: parseModuleOverrides(row.module_overrides_json),
    changeRecordIds: [],
  };
}

export function mapChangeRow(row) {
  return {
    id: row.id,
    copyId: row.copy_id,
    moduleId: row.module_id,
    moduleTitle: row.module_title,
    authorId: row.author_id,
    authorName: row.author_name,
    timestamp: row.timestamp,
    beforeText: row.before_text,
    afterText: row.after_text,
    summary: row.summary,
  };
}

export function stringifyModuleOverrides(overrides) {
  return JSON.stringify(overrides || {});
}

export function isAdminUser(user) {
  return user?.role === "admin";
}
