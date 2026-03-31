import { CodeXml, Columns2, MessageSquarePlus, PencilLine } from "lucide-react";
import { RichTextModuleEditor } from "./RichTextModuleEditor";
import type { PromptModule, ViewMode } from "../types";
import {
  cn,
  flattenNodeText,
  highlightText,
  renderInteractiveNode,
  renderInteractiveText,
  standaloneCodeLinePattern,
  type ModuleLinkTarget,
} from "../utils/helpers";
import { isRichTextHtml } from "../utils/richText";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface ModuleCardProps {
  module: PromptModule;
  allModules: PromptModule[];
  viewMode: ViewMode;
  searchValue: string;
  commentCount: number;
  isEditable: boolean;
  isChanged: boolean;
  editedContent?: string;
  onEditedContentChange: (moduleId: string, value: string) => void;
  onEditedContentCommit: (moduleId: string) => void | Promise<void>;
  onOpenPanel: (panel: "comments" | "diff", moduleId: string) => void;
  onSwitchToCompare: (moduleId: string) => void;
  onJumpToModule: (moduleId: string) => void;
  onExcerptSelect: (moduleId: string) => void;
}

const cardTones = [
  "border-sky-200 bg-sky-50/60",
  "border-cyan-200 bg-cyan-50/60",
  "border-indigo-200 bg-indigo-50/60",
  "border-teal-200 bg-teal-50/60",
];

export function ModuleCard({
  module,
  allModules,
  viewMode,
  searchValue,
  commentCount,
  isEditable,
  isChanged,
  editedContent,
  onEditedContentChange,
  onEditedContentCommit,
  onOpenPanel,
  onSwitchToCompare,
  onJumpToModule,
  onExcerptSelect,
}: ModuleCardProps) {
  const currentContent = editedContent ?? module.readableContent;
  const tone = cardTones[module.order % cardTones.length];
  const showReadable = viewMode === "readable" || viewMode === "compare";
  const showRaw = viewMode === "raw" || viewMode === "compare";
  const moduleTargets: ModuleLinkTarget[] = allModules.flatMap((item) => [
    { label: item.tagName, targetId: item.id },
    { label: item.rawTitle, targetId: item.id },
    { label: item.title, targetId: item.id },
  ]);
  const interactiveOptions = {
    keyword: searchValue,
    moduleTargets,
    onJumpToModule,
  };
  const showRichTextContent = isRichTextHtml(currentContent);

  return (
    <section
      id={module.id}
      className={cn(
        "scroll-mt-40 rounded-[28px] border shadow-sm",
        tone,
      )}
    >
      <div className="rounded-[28px] bg-white/85 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-500 shadow-sm">
              <CodeXml className="h-3.5 w-3.5" />
              {highlightText(module.rawTitle, searchValue)}
            </div>
            <h3 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900">
              {highlightText(module.title, searchValue)}
            </h3>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              <span className="font-medium text-slate-800">作用：</span>
              {highlightText(module.purpose, searchValue)}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => onOpenPanel("comments", module.id)}
              className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900 transition hover:-translate-y-0.5 hover:border-amber-300 hover:bg-amber-100 hover:shadow-sm"
            >
              <MessageSquarePlus className="h-4 w-4" />
              评论 {commentCount}
            </button>
            <button
              type="button"
              onClick={() => onSwitchToCompare(module.id)}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-sm"
            >
              <Columns2 className="h-4 w-4" />
              对照查看原文
            </button>
            {isEditable ? (
              <button
                type="button"
                onClick={() => onOpenPanel("diff", module.id)}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm transition hover:-translate-y-0.5 hover:shadow-sm",
                  isChanged
                    ? "border-sky-300 bg-sky-100 text-sky-950"
                    : "border-sky-200 bg-sky-50 text-sky-900 hover:border-sky-300",
                )}
              >
                <PencilLine className="h-4 w-4" />
                {isChanged ? "查看本模块改动" : "查看改动"}
              </button>
            ) : null}
          </div>
        </div>

        {isEditable ? (
          <div
            className={cn(
              "mt-4 rounded-2xl border px-4 py-3 text-sm",
              isChanged
                ? "border-sky-200 bg-sky-50 text-sky-900"
                : "border-slate-200 bg-slate-50 text-slate-600",
            )}
          >
            {isChanged
              ? "你正在编辑个人副本中的这个模块，当前内容与主版本已有差异。"
              : "你正在个人副本中查看这个模块，修改后只会写入你的副本，不会覆盖主版本。"}
          </div>
        ) : null}

        <div
          className={cn(
            "mt-6 grid gap-4",
            viewMode === "compare" ? "lg:grid-cols-2" : "grid-cols-1",
          )}
        >
          {showReadable ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-5">
              <div className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                {isEditable ? "副本编辑区" : "可读版"}
              </div>
              {isEditable ? (
                <RichTextModuleEditor
                  value={currentContent}
                  modules={allModules}
                  onChange={(value) => onEditedContentChange(module.id, value)}
                  onCommit={() => onEditedContentCommit(module.id)}
                />
              ) : showRichTextContent ? (
                <div
                  className="prose prose-slate max-w-none text-sm leading-7"
                  onMouseUp={() => onExcerptSelect(module.id)}
                  onClick={(event) => {
                    const target = (event.target as HTMLElement).closest("[data-module-id]");
                    const targetId = target?.getAttribute("data-module-id");
                    if (!targetId) {
                      return;
                    }

                    event.preventDefault();
                    onJumpToModule(targetId);
                  }}
                  dangerouslySetInnerHTML={{ __html: currentContent }}
                />
              ) : (
                <div
                  className="prose prose-slate max-w-none text-sm leading-7"
                  onMouseUp={() => onExcerptSelect(module.id)}
                >
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      h1: ({ children }) => (
                        <h1 className="mt-6 text-2xl font-semibold text-slate-900">
                          {renderInteractiveNode(children, interactiveOptions)}
                        </h1>
                      ),
                      h2: ({ children }) => (
                        <h2 className="mt-6 text-xl font-semibold text-slate-900">
                          {renderInteractiveNode(children, interactiveOptions)}
                        </h2>
                      ),
                      h3: ({ children }) => (
                        <h3 className="mt-5 text-lg font-semibold text-slate-900">
                          {renderInteractiveNode(children, interactiveOptions)}
                        </h3>
                      ),
                      p: ({ children }) => {
                        const plainText = flattenNodeText(children).trim();
                        if (standaloneCodeLinePattern.test(plainText)) {
                          return (
                            <div className="my-4 rounded-2xl border border-slate-200 bg-slate-50 p-3 font-mono text-sm leading-6 text-slate-700">
                              {renderInteractiveText(plainText, {
                                keyword: searchValue,
                                moduleTargets: [],
                              })}
                            </div>
                          );
                        }

                        return (
                          <p className="my-4 text-sm leading-7 text-slate-700">
                            {renderInteractiveNode(children, interactiveOptions)}
                          </p>
                        );
                      },
                      li: ({ children }) => (
                        <li className="my-1 leading-7 text-slate-700">
                          {renderInteractiveNode(children, interactiveOptions)}
                        </li>
                      ),
                      blockquote: ({ children }) => (
                        <blockquote className="my-4 rounded-r-2xl border-l-4 border-sky-300 bg-sky-50 px-4 py-3 text-slate-700">
                          {renderInteractiveNode(children, interactiveOptions)}
                        </blockquote>
                      ),
                      strong: ({ children }) => (
                        <strong className="font-semibold text-slate-900">
                          {renderInteractiveNode(children, interactiveOptions)}
                        </strong>
                      ),
                      code: ({ children }) => (
                        <code className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[0.92em] text-slate-700">
                          {renderInteractiveNode(children, {
                            keyword: searchValue,
                            moduleTargets: [],
                          })}
                        </code>
                      ),
                    }}
                  >
                    {currentContent}
                  </ReactMarkdown>
                </div>
              )}
            </div>
          ) : null}

          {showRaw ? (
            <div className="rounded-3xl border border-slate-200 bg-slate-950 p-5 text-slate-100">
              <div className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                原始版
              </div>
              <pre
                className="overflow-x-auto whitespace-pre-wrap break-words font-mono text-xs leading-6 text-slate-200"
                onMouseUp={() => onExcerptSelect(module.id)}
              >
                {highlightText(module.rawContent, searchValue)}
              </pre>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
