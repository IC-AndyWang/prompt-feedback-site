import {
  Bold,
  Heading3,
  Italic,
  Link2,
  List,
  ListOrdered,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { PromptModule } from "../types";
import { cn } from "../utils/helpers";
import { isRichTextHtml, markdownToRichTextHtml } from "../utils/richText";

interface RichTextModuleEditorProps {
  value: string;
  modules: PromptModule[];
  onChange: (value: string) => void;
  onCommit: () => void | Promise<void>;
}

export function RichTextModuleEditor({
  value,
  modules,
  onChange,
  onCommit,
}: RichTextModuleEditorProps) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const editorRef = useRef<HTMLDivElement | null>(null);
  const [selectedModuleId, setSelectedModuleId] = useState(modules[0]?.id ?? "");
  const normalizedHtml = useMemo(
    () => (isRichTextHtml(value) ? value : markdownToRichTextHtml(value)),
    [value],
  );

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) {
      return;
    }

    if (editor.innerHTML !== normalizedHtml) {
      editor.innerHTML = normalizedHtml;
    }
  }, [normalizedHtml]);

  function emitChange() {
    onChange(editorRef.current?.innerHTML ?? "");
  }

  function focusEditor() {
    editorRef.current?.focus();
  }

  function runCommand(command: string, commandValue?: string) {
    focusEditor();
    document.execCommand(command, false, commandValue);
    emitChange();
  }

  function insertModuleLink() {
    const target = modules.find((module) => module.id === selectedModuleId);
    if (!target) {
      return;
    }

    focusEditor();
    const html = `<a href="#${target.id}" data-module-id="${target.id}" class="mx-0.5 inline-flex rounded-full border border-sky-200 bg-sky-50 px-2 py-0.5 text-[0.92em] font-medium text-sky-900">${target.title}</a>&nbsp;`;
    document.execCommand("insertHTML", false, html);
    emitChange();
  }

  return (
    <div
      ref={wrapperRef}
      className="rounded-[28px] border border-sky-200 bg-[linear-gradient(180deg,_rgba(240,249,255,0.95),_rgba(255,255,255,1))] p-4"
      onBlur={(event) => {
        const nextTarget = event.relatedTarget as Node | null;
        if (nextTarget && wrapperRef.current?.contains(nextTarget)) {
          return;
        }
        void onCommit();
      }}
    >
      <div className="mb-3 flex flex-wrap items-center gap-2 rounded-2xl border border-sky-100 bg-white/90 p-2 shadow-sm">
        <button
          type="button"
          onClick={() => runCommand("bold")}
          className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-2 text-xs font-medium text-slate-700 transition hover:-translate-y-0.5 hover:bg-slate-200 hover:shadow-sm"
        >
          <Bold className="h-3.5 w-3.5" />
          加粗
        </button>
        <button
          type="button"
          onClick={() => runCommand("italic")}
          className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-2 text-xs font-medium text-slate-700 transition hover:-translate-y-0.5 hover:bg-slate-200 hover:shadow-sm"
        >
          <Italic className="h-3.5 w-3.5" />
          强调
        </button>
        <button
          type="button"
          onClick={() => runCommand("formatBlock", "h3")}
          className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-2 text-xs font-medium text-slate-700 transition hover:-translate-y-0.5 hover:bg-slate-200 hover:shadow-sm"
        >
          <Heading3 className="h-3.5 w-3.5" />
          小标题
        </button>
        <button
          type="button"
          onClick={() => runCommand("insertUnorderedList")}
          className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-2 text-xs font-medium text-slate-700 transition hover:-translate-y-0.5 hover:bg-slate-200 hover:shadow-sm"
        >
          <List className="h-3.5 w-3.5" />
          无序列表
        </button>
        <button
          type="button"
          onClick={() => runCommand("insertOrderedList")}
          className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-2 text-xs font-medium text-slate-700 transition hover:-translate-y-0.5 hover:bg-slate-200 hover:shadow-sm"
        >
          <ListOrdered className="h-3.5 w-3.5" />
          有序列表
        </button>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <select
            value={selectedModuleId}
            onChange={(event) => setSelectedModuleId(event.target.value)}
            className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none transition focus:border-sky-400"
          >
            {modules.map((module) => (
              <option key={module.id} value={module.id}>
                链接到：{module.title}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={insertModuleLink}
            className={cn(
              "inline-flex items-center gap-1 rounded-full bg-sky-100 px-3 py-2 text-xs font-medium text-sky-900 transition",
              "hover:-translate-y-0.5 hover:bg-sky-200 hover:shadow-sm",
            )}
          >
            <Link2 className="h-3.5 w-3.5" />
            插入模块链接
          </button>
        </div>
      </div>

      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={emitChange}
        className="prose prose-slate max-w-none rounded-[24px] border border-sky-100 bg-white p-5 text-sm leading-7 text-slate-800 outline-none transition focus:border-sky-300"
      />
    </div>
  );
}
