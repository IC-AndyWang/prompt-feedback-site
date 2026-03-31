import type { ChangeRecord, PromptCopy } from "../types";

interface WorkbenchStateResponse {
  ok: boolean;
  copies: PromptCopy[];
  changeRecords: ChangeRecord[];
}

interface CreateCopyResponse {
  ok: boolean;
  copy: PromptCopy | null;
}

interface SaveModuleChangeResponse {
  ok: boolean;
  copy: PromptCopy | null;
  changeRecord: ChangeRecord | null;
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

export async function fetchWorkbenchState() {
  return requestJson<WorkbenchStateResponse>("/api/workbench", {
    method: "GET",
    headers: {},
  });
}

export async function createPromptCopy(input: {
  baseDocumentId: string;
  ownerName: string;
  name: string;
}) {
  const data = await requestJson<CreateCopyResponse>("/api/workbench/copies", {
    method: "POST",
    body: JSON.stringify(input),
  });

  if (!data.copy) {
    throw new Error("Prompt copy was not returned");
  }

  return data.copy;
}

export async function savePromptModuleChange(input: {
  copyId: string;
  moduleId: string;
  moduleTitle: string;
  baseText: string;
  nextText: string;
  authorName: string;
}): Promise<{ copy: PromptCopy; changeRecord: ChangeRecord | null }> {
  const data = await requestJson<SaveModuleChangeResponse>(
    `/api/workbench/copies/${input.copyId}`,
    {
      method: "PUT",
      body: JSON.stringify({
        moduleId: input.moduleId,
        moduleTitle: input.moduleTitle,
        baseText: input.baseText,
        nextText: input.nextText,
        authorName: input.authorName,
      }),
    },
  );

  if (!data.copy) {
    throw new Error("Updated prompt copy was not returned");
  }

  return {
    copy: data.copy,
    changeRecord: data.changeRecord,
  };
}
