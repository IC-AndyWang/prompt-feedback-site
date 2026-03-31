import { FileText, FileType2, Sparkles } from "lucide-react";
import type { PromptDocument, PromptModule } from "../types";

interface OverviewPanelProps {
  document?: PromptDocument;
  currentModule?: PromptModule;
}

export function OverviewPanel({ document, currentModule }: OverviewPanelProps) {
  return (
    <div className="flex flex-col">
      <div className="border-b border-slate-200 px-5 py-4">
        <h3 className="text-sm font-semibold text-slate-900">模块说明</h3>
        <p className="mt-1 text-xs leading-5 text-slate-500">
          这里会用业务语言概括当前模块的作用、来源与阅读重点。
        </p>
      </div>

      <div className="space-y-4 px-5 py-4">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <FileText className="h-4 w-4 text-slate-500" />
            当前文档
          </div>
          <p className="mt-3 text-sm leading-7 text-slate-700">{document?.title}</p>
          <p className="mt-2 text-xs leading-6 text-slate-500">
            来源文件：{document?.sourceName ?? "-"}
          </p>
          {document?.sourcePath ? (
            <p className="mt-1 text-xs leading-6 text-slate-500">
              默认来源路径：{document.sourcePath}
            </p>
          ) : null}
        </div>

        {currentModule ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <Sparkles className="h-4 w-4 text-slate-500" />
              当前模块重点
            </div>
            <p className="mt-3 text-lg font-semibold text-slate-900">{currentModule.title}</p>
            <div className="mt-2 inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">
              <FileType2 className="mr-1.5 h-3.5 w-3.5" />
              {currentModule.rawTitle}
            </div>
            <p className="mt-3 text-sm leading-7 text-slate-700">{currentModule.purpose}</p>
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-6 text-sm leading-6 text-slate-500">
            选择左侧任一模块后，这里会展示更聚焦的说明信息。
          </div>
        )}
      </div>
    </div>
  );
}
