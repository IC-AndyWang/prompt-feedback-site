import { diffLines, type Change } from "diff";
import { FileDiff } from "lucide-react";
import type { PromptModule } from "../types";
import { isRichTextHtml, richTextToPlainText } from "../utils/richText";

interface DiffPanelProps {
  currentModule?: PromptModule;
  originalText?: string;
  changedText?: string;
  copyName?: string;
}

export function DiffPanel({
  currentModule,
  originalText,
  changedText,
  copyName,
}: DiffPanelProps) {
  const hasDiff =
    currentModule &&
    typeof originalText === "string" &&
    typeof changedText === "string" &&
    originalText !== changedText;
  const originalDiffText = originalText
    ? isRichTextHtml(originalText)
      ? richTextToPlainText(originalText)
      : originalText
    : originalText;
  const changedDiffText = changedText
    ? isRichTextHtml(changedText)
      ? richTextToPlainText(changedText)
      : changedText
    : changedText;

  const diffs =
    hasDiff && originalDiffText && changedDiffText
      ? diffLines(originalDiffText, changedDiffText)
      : [];
  const addedBlocks = diffs.filter((part) => part.added).length;
  const removedBlocks = diffs.filter((part) => part.removed).length;

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-slate-200 px-6 py-4">
        <div className="flex items-center gap-2">
          <FileDiff className="h-4 w-4 text-slate-500" />
          <h3 className="text-sm font-semibold text-slate-900">改动对照</h3>
        </div>
        <p className="mt-1 text-xs leading-5 text-slate-500">
          {currentModule
            ? `当前模块：${currentModule.title}`
            : "选择一个模块后，这里会展示修改前后的差异。"}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4">
        {!hasDiff ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-6 text-sm leading-6 text-slate-500">
            当前模块尚无改动，或你还没有进入个人副本模式。
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-3xl border border-sky-200 bg-sky-50 p-4">
              <div className="text-sm font-semibold text-sky-950">
                主版本 vs {copyName ?? "当前副本"}
              </div>
              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                <span className="rounded-full bg-white px-3 py-1 text-emerald-800 shadow-sm">
                  新增片段 {addedBlocks}
                </span>
                <span className="rounded-full bg-white px-3 py-1 text-rose-800 shadow-sm">
                  删除片段 {removedBlocks}
                </span>
              </div>
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
              <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  主版本
                </div>
                {originalText && isRichTextHtml(originalText) ? (
                  <div
                    className="prose prose-slate max-w-none rounded-2xl bg-slate-50 p-3 text-sm leading-7 text-slate-700"
                    dangerouslySetInnerHTML={{ __html: originalText }}
                  />
                ) : (
                  <pre className="whitespace-pre-wrap break-words rounded-2xl bg-slate-50 p-3 font-mono text-xs leading-6 text-slate-700">
                    {originalText}
                  </pre>
                )}
              </div>
              <div className="rounded-3xl border border-sky-200 bg-white p-4 shadow-sm">
                <div className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  当前副本
                </div>
                {changedText && isRichTextHtml(changedText) ? (
                  <div
                    className="prose prose-slate max-w-none rounded-2xl bg-sky-50 p-3 text-sm leading-7 text-sky-950"
                    dangerouslySetInnerHTML={{ __html: changedText }}
                  />
                ) : (
                  <pre className="whitespace-pre-wrap break-words rounded-2xl bg-sky-50 p-3 font-mono text-xs leading-6 text-sky-950">
                    {changedText}
                  </pre>
                )}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-4 font-mono text-xs leading-6 text-slate-800 shadow-sm">
              <div className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                差异高亮
              </div>
              <div className="space-y-2">
                {(diffs as Change[]).map((part, index) => (
                  <pre
                    key={index}
                    className={[
                      "whitespace-pre-wrap break-words rounded-2xl px-3 py-2",
                      part.added
                        ? "bg-emerald-50 text-emerald-900"
                        : part.removed
                          ? "bg-rose-50 text-rose-900"
                          : "bg-slate-50 text-slate-600",
                    ].join(" ")}
                  >
                    {part.value}
                  </pre>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
