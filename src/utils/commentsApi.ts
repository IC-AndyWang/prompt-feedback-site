import type { CommentItem, UserRole } from "../types";

interface ApiUser {
  id: string;
  name: string;
  email?: string;
  role?: UserRole | string;
}

interface ApiCommentRow {
  id: string;
  module_id: string;
  module_key?: string;
  user_id: string;
  parent_id?: string | null;
  content: string;
  status?: string;
  created_at: string;
  updated_at?: string | null;
  name?: string | null;
  email?: string | null;
}

function parseStoredExcerpt(content: string) {
  const match = content.match(/^【引用片段】([\s\S]*?)\n\n([\s\S]*)$/);
  if (!match) {
    return {
      excerpt: undefined,
      content,
    };
  }

  return {
    excerpt: match[1].trim(),
    content: match[2].trim(),
  };
}

function encodeContent(content: string, excerpt?: string) {
  if (!excerpt?.trim()) {
    return content;
  }

  return `【引用片段】${excerpt.trim()}\n\n${content}`;
}

function normalizeCommentStatus(status?: string) {
  return status === "resolved" ? "resolved" : "open";
}

function mapApiCommentRow(row: ApiCommentRow, localModuleId: string): CommentItem {
  const parsed = parseStoredExcerpt(row.content);

  return {
    id: row.id,
    source: "remote",
    targetType: parsed.excerpt ? "excerpt" : "module",
    targetId: localModuleId,
    moduleId: localModuleId,
    excerpt: parsed.excerpt,
    content: parsed.content,
    authorId: row.user_id,
    authorName: row.name || row.email || "未知用户",
    createdAt: row.created_at,
    status: normalizeCommentStatus(row.status),
    replies: [],
  };
}

async function requestJson<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const response = await fetch(input, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  const data = (await response.json().catch(() => ({}))) as T & { error?: string };
  if (!response.ok) {
    throw new Error(data.error || "Request failed");
  }

  return data;
}

export async function fetchAuthUser() {
  const data = await requestJson<{ user: ApiUser | null }>("/api/auth/me", {
    method: "GET",
    headers: {},
  });
  return data.user;
}

export async function fetchModuleComments(moduleKey: string, localModuleId: string) {
  const data = await requestJson<{ comments: ApiCommentRow[] }>(
    `/api/comments?moduleKey=${encodeURIComponent(moduleKey)}`,
    {
      method: "GET",
      headers: {},
    },
  );

  return (data.comments || []).map((row) => mapApiCommentRow(row, localModuleId));
}

export async function createModuleComment(input: {
  moduleKey: string;
  localModuleId: string;
  content: string;
  excerpt?: string;
}) {
  const data = await requestJson<{ ok: boolean; comment: ApiCommentRow | null }>(
    "/api/comments",
    {
      method: "POST",
      body: JSON.stringify({
        moduleKey: input.moduleKey,
        content: encodeContent(input.content, input.excerpt),
      }),
    },
  );

  if (!data.comment) {
    throw new Error("Comment not returned");
  }

  return mapApiCommentRow(data.comment, input.localModuleId);
}

export async function updateRemoteCommentStatus(commentId: string, status: "open" | "resolved") {
  await requestJson<{ ok: boolean }>(`/api/comments/${commentId}`, {
    method: "PUT",
    body: JSON.stringify({ status }),
  });
}
