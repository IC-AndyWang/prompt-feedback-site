import type { PromptModule } from "../types";

interface RawPanelProps {
  currentModule?: PromptModule;
}

export function RawPanel({ currentModule }: RawPanelProps) {
  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-slate-200 px-5 py-4">
        <h3 className="text-sm font-semibold text-slate-900">原始 Prompt 文本</h3>
        <p className="mt-1 text-xs leading-5 text-slate-500">
          保留 XML 标签、变量占位符和 Markdown 原样，便于和业务可读版对照。
        </p>
      </div>
      <div className="flex-1 overflow-y-auto px-5 py-4">
        <div className="rounded-3xl border border-slate-900 bg-slate-950 p-4 shadow-sm">
          <pre className="whitespace-pre-wrap break-words font-mono text-xs leading-6 text-slate-100">
            {currentModule?.rawContent ?? "选择左侧模块后可查看对应原始内容。"}
          </pre>
        </div>
      </div>
    </div>
  );
}
