/**
 * Tiny, dependency-free inline-markdown renderer for the vanilla web
 * component (which cannot pull in react-markdown).
 *
 * Scope is intentionally minimal: escape all HTML first (defense in
 * depth against injected article bodies), then apply a small set of
 * safe inline marks. Block-level structure is already handled upstream
 * by `splitParagraphs`, so this only formats the inside of one block.
 *
 * Supported: **bold**, *italic* / _italic_, `code`, [text](https url),
 * and a leading "# " heading stripped to bold. Anything else renders as
 * escaped plain text. Links are forced to https and rel-hardened.
 */
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function renderInlineMarkdown(raw: string): string {
  // Strip a single leading markdown heading marker; we render the embed
  // body uniformly and let the host page own real heading hierarchy.
  const stripped = raw.replace(/^#{1,6}\s+/, "");
  let html = escapeHtml(stripped);

  // Inline code first so its contents are not re-processed.
  html = html.replace(/`([^`]+)`/g, (_m, code: string) => {
    return `<code style="background:#f4f4f5;padding:1px 4px;border-radius:4px;font-size:0.9em">${code}</code>`;
  });

  // Links: [text](https://...) only. Non-https hrefs are dropped to text.
  html = html.replace(
    /\[([^\]]+)\]\((https:\/\/[^\s)]+)\)/g,
    (_m, text: string, href: string) =>
      `<a href="${href}" target="_blank" rel="noopener noreferrer nofollow">${text}</a>`,
  );

  // Bold then italic.
  html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/(^|[^*])\*([^*]+)\*/g, "$1<em>$2</em>");
  html = html.replace(/(^|[^_])_([^_]+)_/g, "$1<em>$2</em>");

  return html;
}
