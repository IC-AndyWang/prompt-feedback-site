import { Clock3, FileDiff, History } from "lucide-react";
import type { ChangeRecord, PromptCopy, User } from "../types";
import { formatTime } from "../utils/helpers";

interface HistoryPanelProps {
  copies: PromptCopy[];
  changeRecords: ChangeRecord[];
  currentUser: User;
  isAdmin: boolean;
  activeCopyId?: string;
  onSelectCopy: (copyId: string) => void;
  onInspectModule: (moduleId: string) => void;
}

export function HistoryPanel({
  copies,
  changeRecords,
  currentUser,
  isAdmin,
  activeCopyId,
  onSelectCopy,
  onInspectModule,
}: HistoryPanelProps) {
  const visibleCopies = isAdmin
    ? copies
    : copies.filter((copy) => copy.ownerId === currentUser.id);

  const visibleChanges = isAdmin
    ? changeRecords
    : changeRecords.filter((change) => change.authorId === currentUser.id);

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-slate-200 px-5 py-4">
        <h3 className="text-sm font-semibold text-slate-900">历史记录与留痕</h3>
        <p className="mt-1 text-xs leading-5 text-slate-500">
          {isAdmin
            ? "管理视图可查看所有用户副本与修改记录。"
            : "当前展示你创建的副本和你发起的修改记录。"}
        </p>
      </div>

      <div className="flex-1 space-y-6 overflow-y-auto px-5 py-4">
        <section>
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-800">
            <History className="h-4 w-4 text-slate-500" />
            我的副本
          </div>
          <div className="space-y-3">
            {visibleCopies.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-5 text-sm text-slate-500">
                还没有副本。可以从顶部点击“创建我的副本”开始。
              </div>
            ) : null}
            {visibleCopies.map((copy) => (
              <div
                key={copy.id}
                className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-slate-900">{copy.name}</div>
                    <div className="mt-1 text-xs text-slate-500">
                      创建人：{copy.ownerName} | 最近修改：{formatTime(copy.updatedAt)}
                    </div>
                  </div>
                  <div className="rounded-full bg-sky-50 px-3 py-1 text-xs font-medium text-sky-800">
                    改动模块 {Object.keys(copy.moduleOverrides).length} 个
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onSelectCopy(copy.id)}
                  className={[
                    "mt-3 rounded-full px-3 py-2 text-xs font-medium transition hover:-translate-y-0.5 hover:shadow-sm",
                    activeCopyId === copy.id
                      ? "bg-slate-900 text-white"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200",
                  ].join(" ")}
                >
                  {activeCopyId === copy.id ? "当前查看中" : "打开副本"}
                </button>
              </div>
            ))}
          </div>
        </section>

        <section>
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-800">
            <Clock3 className="h-4 w-4 text-slate-500" />
            最近修改
          </div>
          <div className="space-y-3">
            {visibleChanges.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-5 text-sm text-slate-500">
                暂无修改记录。进入你的副本后编辑模块即可自动形成留痕。
              </div>
            ) : null}
            {visibleChanges
              .slice()
              .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
              .map((change) => (
                <div
                  key={change.id}
                  className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                      <FileDiff className="h-4 w-4 text-slate-500" />
                      {change.moduleTitle}
                    </div>
                    <button
                      type="button"
                      onClick={() => onInspectModule(change.moduleId)}
                      className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:-translate-y-0.5 hover:bg-slate-200 hover:shadow-sm"
                    >
                      查看 diff
                    </button>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-700">{change.summary}</p>
                  <p className="mt-2 text-xs text-slate-500">
                    {change.authorName} 于 {formatTime(change.timestamp)} 修改
                  </p>
                </div>
              ))}
          </div>
        </section>
      </div>
    </div>
  );
}
