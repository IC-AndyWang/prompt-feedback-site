import { CheckCircle2, MessageSquareText, SendHorizonal } from "lucide-react";
import { useMemo, useState } from "react";
import type {
  CommentItem,
  ExcerptSelection,
  PromptModule,
  User,
} from "../types";
import { cn, formatTime } from "../utils/helpers";

interface CommentsPanelProps {
  comments: CommentItem[];
  modules: PromptModule[];
  currentModule?: PromptModule;
  currentUser: User;
  onlyOpen: boolean;
  isLoading?: boolean;
  errorMessage?: string;
  composerDisabled?: boolean;
  composerHint?: string;
  selectedExcerpt?: ExcerptSelection;
  onClearExcerpt: () => void;
  onToggleOnlyOpen: () => void;
  onAddComment: (payload: {
    content: string;
    targetType: "document" | "module" | "excerpt";
    targetId: string;
    moduleId?: string;
    excerpt?: string;
  }) => void;
  onToggleStatus: (commentId: string) => void;
}

export function CommentsPanel({
  comments,
  modules,
  currentModule,
  currentUser,
  onlyOpen,
  isLoading,
  errorMessage,
  composerDisabled,
  composerHint,
  selectedExcerpt,
  onClearExcerpt,
  onToggleOnlyOpen,
  onAddComment,
  onToggleStatus,
}: CommentsPanelProps) {
  const [draft, setDraft] = useState("");
  const filteredComments = useMemo(
    () => (onlyOpen ? comments.filter((item) => item.status === "open") : comments),
    [comments, onlyOpen],
  );

  const targetType = selectedExcerpt
    ? "excerpt"
    : currentModule
      ? "module"
      : "document";
  const targetId = selectedExcerpt?.moduleId ?? currentModule?.id ?? "document_root";
  const moduleNameMap = new Map(modules.map((module) => [module.id, module.title]));

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-slate-200 px-5 py-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">评论与共创批注</h3>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              {currentModule
                ? `当前聚焦于：${currentModule.title}`
                : "当前展示全文级评论，可用于记录整体意见或版本建议。"}
            </p>
          </div>
          <button
            type="button"
            onClick={onToggleOnlyOpen}
            className={cn(
              "rounded-full px-3 py-2 text-xs font-medium transition",
              onlyOpen
                ? "bg-amber-100 text-amber-900"
                : "bg-slate-100 text-slate-600",
            )}
          >
            仅看未解决评论
          </button>
        </div>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
          <div className="mb-3 text-xs font-medium text-slate-500">
            以 {currentUser.name} 身份添加评论
          </div>
          {selectedExcerpt ? (
            <div className="mb-3 rounded-2xl border border-amber-200 bg-amber-50 p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs font-semibold text-amber-900">
                    当前将围绕所选片段评论
                  </div>
                  <div className="mt-1 line-clamp-4 text-xs leading-6 text-amber-900/80">
                    {selectedExcerpt.excerpt}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onClearExcerpt}
                  className="rounded-full bg-white px-2.5 py-1 text-xs text-amber-800"
                >
                  清除
                </button>
              </div>
            </div>
          ) : null}
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            disabled={composerDisabled}
            placeholder={
              selectedExcerpt
                ? "围绕这段具体内容写下你的建议或疑问"
                : currentModule
                ? "围绕当前模块写下建议、疑问或优化意见"
                : "围绕整份 Prompt 写下整体评论"
            }
            className="min-h-28 w-full rounded-2xl border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-700 outline-none transition focus:border-sky-400 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
          />
          {composerHint ? (
            <p className="mt-3 text-xs leading-6 text-slate-500">{composerHint}</p>
          ) : null}
          <button
            type="button"
            onClick={() => {
              if (!draft.trim() || composerDisabled) {
                return;
              }
              onAddComment({
                content: draft.trim(),
                targetType,
                targetId,
                moduleId: currentModule?.id,
                excerpt: selectedExcerpt?.excerpt,
              });
              setDraft("");
              onClearExcerpt();
            }}
            disabled={composerDisabled}
            className="mt-3 inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            <SendHorizonal className="h-4 w-4" />
            发布评论
          </button>
        </div>

        {isLoading ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-4 text-sm text-slate-500 shadow-sm">
            正在加载数据库中的评论...
          </div>
        ) : null}

        {errorMessage ? (
          <div className="rounded-3xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900 shadow-sm">
            {errorMessage}
          </div>
        ) : null}

        {filteredComments.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-6 text-sm leading-6 text-slate-500">
            暂无评论。这里可以记录业务疑问、措辞建议、风险提醒或版本讨论。
          </div>
        ) : null}

        {filteredComments.map((comment) => (
          <article
            key={comment.id}
            className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                    {comment.authorName}
                  </span>
                  <span className="text-xs text-slate-400">
                    {formatTime(comment.createdAt)}
                  </span>
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-1 text-xs font-medium",
                      comment.status === "open"
                        ? "bg-amber-100 text-amber-900"
                        : "bg-emerald-100 text-emerald-800",
                    )}
                  >
                    {comment.status === "open" ? "open" : "resolved"}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-7 text-slate-700">{comment.content}</p>
                {comment.excerpt ? (
                  <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs leading-6 text-slate-600">
                    引用片段：{comment.excerpt}
                  </div>
                ) : null}
                {comment.moduleId ? (
                  <p className="mt-2 text-xs text-slate-500">
                    所属模块：{moduleNameMap.get(comment.moduleId) ?? comment.moduleId}
                  </p>
                ) : (
                  <p className="mt-2 text-xs text-slate-500">所属范围：全文评论</p>
                )}
              </div>

              <button
                type="button"
                onClick={() => onToggleStatus(comment.id)}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
              >
                {comment.status === "open" ? (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    标记已解决
                  </>
                ) : (
                  <>
                    <MessageSquareText className="h-3.5 w-3.5" />
                    重新打开
                  </>
                )}
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
