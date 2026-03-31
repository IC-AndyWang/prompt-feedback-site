import { GitBranchPlus, LogOut, Search, UserCircle2 } from "lucide-react";
import type { ViewMode } from "../types";
import { cn } from "../utils/helpers";

interface HeaderProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  searchValue: string;
  onSearchChange: (value: string) => void;
  currentUserLabel: string;
  currentUserRoleLabel: string;
  onLogout: () => void;
  onCreateCopy: () => void;
  onReturnToBase: () => void;
  activeCopyName?: string;
  hasExistingCopy: boolean;
}

const modes: Array<{ key: ViewMode; label: string }> = [
  { key: "readable", label: "可读版" },
  { key: "raw", label: "原始版" },
  { key: "compare", label: "对照版" },
];

export function Header({
  viewMode,
  onViewModeChange,
  searchValue,
  onSearchChange,
  currentUserLabel,
  currentUserRoleLabel,
  onLogout,
  onCreateCopy,
  onReturnToBase,
  activeCopyName,
  hasExistingCopy,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="flex flex-col gap-4 px-6 py-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Prompt 结构说明书 + 共创工作台
            </p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-900">
              Prompt 结构说明
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              帮助业务用户更清晰地查看 Prompt 的结构、内容与优化建议，并围绕具体模块开展评论、修改与留痕共创。
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {activeCopyName ? (
              <>
                <div className="rounded-full border border-sky-200 bg-sky-50 px-4 py-2 text-sm text-sky-800">
                  当前正在查看副本：{activeCopyName}
                </div>
                <button
                  type="button"
                  onClick={onReturnToBase}
                  className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-sm"
                >
                  回到主版本
                </button>
              </>
            ) : (
              <div className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-600">
                当前正在查看主版本
              </div>
            )}

            <button
              type="button"
              onClick={onCreateCopy}
              className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-sm"
            >
              <GitBranchPlus className="h-4 w-4" />
              {activeCopyName || hasExistingCopy ? "进入我的副本" : "创建我的副本"}
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex rounded-full border border-slate-200 bg-slate-50 p-1">
            {modes.map((mode) => (
              <button
                key={mode.key}
                type="button"
                onClick={() => onViewModeChange(mode.key)}
                className={cn(
                  "rounded-full px-4 py-2 text-sm font-medium transition hover:-translate-y-0.5",
                  viewMode === mode.key
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-600 hover:bg-white hover:text-slate-900 hover:shadow-sm",
                )}
              >
                {mode.label}
              </button>
            ))}
          </div>

          <label className="relative min-w-[280px] flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={searchValue}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="搜索模块名称、标签名或原始内容关键词"
              className="w-full rounded-full border border-slate-200 bg-white py-2.5 pl-11 pr-4 text-sm text-slate-700 outline-none ring-0 transition placeholder:text-slate-400 focus:border-sky-400"
            />
          </label>

          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700">
            <UserCircle2 className="h-4 w-4 text-slate-400" />
            <span>{currentUserLabel}</span>
            <span className="text-slate-400">|</span>
            <span>{currentUserRoleLabel}</span>
          </div>

          <button
            type="button"
            onClick={onLogout}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50 hover:shadow-sm"
          >
            <LogOut className="h-4 w-4" />
            退出登录
          </button>
        </div>
      </div>
    </header>
  );
}
