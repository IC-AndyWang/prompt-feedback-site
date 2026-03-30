import type { ReactNode } from "react";
import React from "react";

export interface ModuleLinkTarget {
  label: string;
  targetId: string;
}

interface InteractiveNodeOptions {
  keyword: string;
  moduleTargets: ModuleLinkTarget[];
  onJumpToModule?: (moduleId: string) => void;
}

export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function formatTime(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function makeId(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

function escapeRegExp(input: string) {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export const standaloneCodeLinePattern =
  /^(?:[A-Za-z_][\w-]*:\s*\{\{[^}]+\}\}|[A-Za-z_][\w-]*:\s*<[^>\n]+>|{{[^}]+\}}|<\/?[^>\n]+>)$/;

const codeLikeTokenPattern =
  /^(?:[A-Za-z_][\w-]*:\s*\{\{[^}]+\}\}|[A-Za-z_][\w-]*:\s*<[^>\n]+>|{{[^}]+\}}|<\/?[^>\n]+>)$/;
const codeLikeSplitter =
  /([A-Za-z_][\w-]*:\s*\{\{[^}]+\}\}|[A-Za-z_][\w-]*:\s*<[^>\n]+>|{{[^}]+\}}|<\/?[^>\n]+>)/g;

export function highlightText(text: string, keyword: string) {
  if (!keyword.trim()) {
    return text;
  }

  const regex = new RegExp(`(${escapeRegExp(keyword)})`, "ig");
  const parts = text.split(regex);

  return parts.map((part, index) => {
    if (part.toLowerCase() === keyword.toLowerCase()) {
      return (
        <mark
          key={`${part}-${index}`}
          className="rounded bg-amber-200 px-1 text-slate-900"
        >
          {part}
        </mark>
      );
    }

    return <React.Fragment key={`${part}-${index}`}>{part}</React.Fragment>;
  });
}

function renderReferenceAwareText(
  text: string,
  { keyword, moduleTargets, onJumpToModule }: InteractiveNodeOptions,
) {
  if (!text) {
    return text;
  }

  const dedupedTargets = Array.from(
    new Map(
      moduleTargets
        .filter((target) => target.label.trim())
        .sort((a, b) => b.label.length - a.label.length)
        .map((target) => [target.label, target]),
    ).values(),
  );

  if (dedupedTargets.length === 0) {
    return highlightText(text, keyword);
  }

  const referenceRegex = new RegExp(
    `(${dedupedTargets.map((target) => escapeRegExp(target.label)).join("|")})`,
    "g",
  );
  const matches = Array.from(text.matchAll(referenceRegex));

  if (matches.length === 0) {
    return highlightText(text, keyword);
  }

  const targetMap = new Map(dedupedTargets.map((target) => [target.label, target.targetId]));
  const nodes: ReactNode[] = [];
  let cursor = 0;

  matches.forEach((match, index) => {
    const matchedText = match[0];
    const startIndex = match.index ?? 0;

    if (startIndex > cursor) {
      nodes.push(
        <React.Fragment key={`text-${index}`}>
          {highlightText(text.slice(cursor, startIndex), keyword)}
        </React.Fragment>,
      );
    }

    const targetId = targetMap.get(matchedText);
    if (targetId) {
      nodes.push(
        <button
          key={`link-${matchedText}-${index}`}
          type="button"
          onClick={() => onJumpToModule?.(targetId)}
          className="mx-0.5 rounded-full border border-sky-200 bg-sky-50 px-2 py-0.5 text-[0.92em] font-medium text-sky-900 transition hover:border-sky-300 hover:bg-sky-100"
        >
          {highlightText(matchedText, keyword)}
        </button>,
      );
    } else {
      nodes.push(
        <React.Fragment key={`fallback-${matchedText}-${index}`}>
          {highlightText(matchedText, keyword)}
        </React.Fragment>,
      );
    }

    cursor = startIndex + matchedText.length;
  });

  if (cursor < text.length) {
    nodes.push(
      <React.Fragment key="tail">{highlightText(text.slice(cursor), keyword)}</React.Fragment>,
    );
  }

  return nodes;
}

export function renderInteractiveText(text: string, options: InteractiveNodeOptions) {
  const pieces = text.split(codeLikeSplitter).filter(Boolean);

  return pieces.map((piece, index) => {
    if (codeLikeTokenPattern.test(piece.trim())) {
      return (
        <code
          key={`code-${piece}-${index}`}
          className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[0.92em] text-slate-700"
        >
          {highlightText(piece, options.keyword)}
        </code>
      );
    }

    return (
      <React.Fragment key={`segment-${piece}-${index}`}>
        {renderReferenceAwareText(piece, options)}
      </React.Fragment>
    );
  });
}

export function flattenNodeText(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") {
    return String(node);
  }

  if (Array.isArray(node)) {
    return node.map((child) => flattenNodeText(child)).join("");
  }

  if (React.isValidElement<{ children?: ReactNode }>(node)) {
    return flattenNodeText(node.props.children);
  }

  return "";
}

export function renderInteractiveNode(
  node: ReactNode,
  options: InteractiveNodeOptions,
): ReactNode {
  if (typeof node === "string") {
    return renderInteractiveText(node, options);
  }

  if (Array.isArray(node)) {
    return node.map((child, index) => (
      <React.Fragment key={index}>{renderInteractiveNode(child, options)}</React.Fragment>
    ));
  }

  if (React.isValidElement<{ children?: ReactNode }>(node)) {
    return React.cloneElement(node, {
      ...node.props,
      children: renderInteractiveNode(node.props.children, options),
    });
  }

  return node;
}

export function countMatches(input: string, keyword: string) {
  if (!keyword.trim()) {
    return 0;
  }

  const regex = new RegExp(escapeRegExp(keyword), "ig");
  return input.match(regex)?.length ?? 0;
}
