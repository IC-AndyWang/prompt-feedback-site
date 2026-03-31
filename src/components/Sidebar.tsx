import { ChevronRight, MessageSquareText } from "lucide-react";
import type { PromptModule } from "../types";
import { cn, highlightText } from "../utils/helpers";

interface SidebarProps {
  modules: PromptModule[];
  activeModuleId?: string;
  onSelectModule: (moduleId: string) => void;
  commentCountByModule: Record<string, number>;
  changedModuleIds: string[];
  searchValue: string;
  isEditingCopy: boolean;
}

export function Sidebar({
  modules,
  activeModuleId,
  onSelectModule,
  commentCountByModule,
  changedModuleIds,
  searchValue,
  isEditingCopy,
}: SidebarProps) {
  return (
    <aside className="sticky top-[168px] h-[calc(100vh-184px)] overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-5 py-4">
        <h2 className="text-sm font-semibold text-slate-900">模块导航</h2>
        <p className="mt-1 text-xs leading-5 text-slate-500">
          {isEditingCopy
            ? "当前为副本编辑模式。点击左侧任一模块，可直接切换到对应内容区继续编辑。"
            : "点击模块可跳转阅读，并查看评论数量与结构位置。"}
        </p>
        {isEditingCopy ? (
          <div className="mt-3 rounded-2xl border border-sky-200 bg-sky-50 px-3 py-2 text-xs leading-5 text-sky-900">
            当前左侧导航已进入编辑态，带“编辑中”或“已改”标记的模块可直接定位到可编辑区域。
          </div>
        ) : null}
      </div>

      <div className="h-[calc(100%-81px)] overflow-y-auto px-3 py-3">
        {modules.map((module) => (
          <button
            key={module.id}
            type="button"
            onClick={() => onSelectModule(module.id)}
            className={cn(
              "mb-2 flex w-full items-start gap-3 rounded-2xl border px-3 py-3 text-left transition hover:-translate-y-0.5 hover:shadow-sm",
              activeModuleId === module.id
                ? "border-sky-200 bg-sky-50"
                : "border-transparent bg-slate-50 hover:border-slate-200 hover:bg-white",
            )}
          >
            <div
              className={cn(
                "mt-1 rounded-full p-1",
                activeModuleId === module.id
                  ? "bg-sky-100 text-sky-700"
                  : "bg-slate-200 text-slate-500",
              )}
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium leading-5 text-slate-900">
                {highlightText(module.title, searchValue)}
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-1.5">
                <div className="text-xs text-slate-500">
                  {highlightText(module.rawTitle, searchValue)}
                </div>
                {changedModuleIds.includes(module.id) ? (
                  <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[11px] font-medium text-sky-800">
                    已改
                  </span>
                ) : null}
                {isEditingCopy && activeModuleId === module.id ? (
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-900">
                    编辑中
                  </span>
                ) : null}
              </div>
            </div>
            <div className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-1 text-xs text-slate-500 shadow-sm">
              <MessageSquareText className="h-3 w-3" />
              {commentCountByModule[module.id] ?? 0}
            </div>
          </button>
        ))}
      </div>
    </aside>
  );
}
