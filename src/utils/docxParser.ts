import mammoth from "mammoth";
import type { PromptDocument, PromptModule } from "../types";
import { getModuleMetadata } from "./moduleMetadata";

function normalizeText(text: string) {
  return text
    .replace(/\r/g, "")
    .replace(/\u00a0/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function cleanReadableContent(input: string) {
  return normalizeText(
    input
      .replace(/^<[^>\n]+>\s*/gm, "")
      .replace(/\s*<\/[^>\n]+>\s*$/gm, "")
      .replace(/^\s*[-*]\s+/gm, "- ")
      .trim(),
  );
}

function stableHash(input: string) {
  let hash = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

function makeStableId(prefix: string, seed: string) {
  return `${prefix}_${stableHash(seed)}`;
}

function parseModules(rawText: string, documentStableId: string): PromptModule[] {
  const modulePattern = /<([a-zA-Z0-9_:-]+)>\s*([\s\S]*?)\s*<\/\1>/g;
  const matches = Array.from(rawText.matchAll(modulePattern));

  const modules = matches.map((match, index) => {
    const tagName = match[1];
    const moduleRaw = match[0].trim();
    const inner = match[2].trim();
    const metadata = getModuleMetadata(tagName);

    return {
      id: makeStableId(
        `module_${tagName}`,
        `${documentStableId}:${tagName}:${index}:${moduleRaw}`,
      ),
      order: index,
      tagName,
      title: metadata.title,
      rawTitle: `<${tagName}>`,
      purpose: metadata.purpose,
      rawContent: moduleRaw,
      readableContent: cleanReadableContent(inner),
    };
  });

  if (modules.length > 0) {
    return modules;
  }

  return [
    {
      id: makeStableId("module_fallback", `${documentStableId}:full_document:${rawText}`),
      order: 0,
      tagName: "full_document",
      title: "完整 Prompt 内容",
      rawTitle: "<full_document>",
      purpose: "未检测到明确模块标签，因此系统将整份 Prompt 作为一个整体进行阅读和协作展示。",
      rawContent: rawText,
      readableContent: rawText,
    },
  ];
}

export async function extractTextFromDocx(file: File | ArrayBuffer) {
  const arrayBuffer =
    file instanceof File ? await file.arrayBuffer() : file;
  const result = await mammoth.extractRawText({ arrayBuffer });
  return normalizeText(result.value);
}

export async function parseDocxToPromptDocument(
  source: File | ArrayBuffer,
  sourceName: string,
  sourcePath?: string,
) {
  const rawText = await extractTextFromDocx(source);
  const documentStableId = makeStableId(
    "prompt_document",
    `${sourceName}:${sourcePath ?? ""}:${rawText}`,
  );
  const modules = parseModules(rawText, documentStableId);
  const now = new Date().toISOString();

  const document: PromptDocument = {
    id: documentStableId,
    title: "Prompt 结构说明",
    subtitle: "帮助业务用户更清晰地查看 Prompt 的结构、内容与优化建议",
    sourceName,
    sourcePath,
    rawText,
    modules,
    createdAt: now,
    updatedAt: now,
  };

  return document;
}
