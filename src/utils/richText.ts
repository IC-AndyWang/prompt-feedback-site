function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function applyInlineFormatting(input: string) {
  return escapeHtml(input)
    .replace(/`([^`]+)`/g, '<code class="rounded-md bg-slate-100 px-1.5 py-0.5 text-[0.92em] text-slate-700">$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>");
}

export function isRichTextHtml(value: string) {
  return /<(p|h1|h2|h3|ul|ol|li|blockquote|strong|em|code|a|div|br)\b/i.test(value);
}

export function markdownToRichTextHtml(markdown: string) {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const html: string[] = [];
  let paragraphLines: string[] = [];
  let listType: "ul" | "ol" | null = null;

  const flushParagraph = () => {
    if (paragraphLines.length === 0) {
      return;
    }

    html.push(`<p>${paragraphLines.join("<br />")}</p>`);
    paragraphLines = [];
  };

  const closeList = () => {
    if (!listType) {
      return;
    }

    html.push(`</${listType}>`);
    listType = null;
  };

  lines.forEach((line) => {
    const trimmed = line.trim();

    if (!trimmed) {
      flushParagraph();
      closeList();
      return;
    }

    const headingMatch = trimmed.match(/^(#{1,3})\s+(.*)$/);
    if (headingMatch) {
      flushParagraph();
      closeList();
      const level = Math.min(headingMatch[1].length + 1, 3);
      html.push(`<h${level}>${applyInlineFormatting(headingMatch[2])}</h${level}>`);
      return;
    }

    const blockquoteMatch = trimmed.match(/^>\s+(.*)$/);
    if (blockquoteMatch) {
      flushParagraph();
      closeList();
      html.push(`<blockquote>${applyInlineFormatting(blockquoteMatch[1])}</blockquote>`);
      return;
    }

    const orderedMatch = trimmed.match(/^\d+\.\s+(.*)$/);
    if (orderedMatch) {
      flushParagraph();
      if (listType !== "ol") {
        closeList();
        listType = "ol";
        html.push("<ol>");
      }
      html.push(`<li>${applyInlineFormatting(orderedMatch[1])}</li>`);
      return;
    }

    const unorderedMatch = trimmed.match(/^[-*]\s+(.*)$/);
    if (unorderedMatch) {
      flushParagraph();
      if (listType !== "ul") {
        closeList();
        listType = "ul";
        html.push("<ul>");
      }
      html.push(`<li>${applyInlineFormatting(unorderedMatch[1])}</li>`);
      return;
    }

    closeList();
    paragraphLines.push(applyInlineFormatting(trimmed));
  });

  flushParagraph();
  closeList();

  return html.join("");
}

export function richTextToPlainText(input: string) {
  if (!input) {
    return "";
  }

  return input
    .replace(/<\/(p|div|h1|h2|h3|blockquote|li)>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<li>/gi, "• ")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
