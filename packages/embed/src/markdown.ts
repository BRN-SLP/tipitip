/**
 * Split a markdown document into tippable paragraphs.
 *
 * MIRROR of `splitParagraphs` in apps/web/src/lib/articles.ts. The two
 * must agree byte-for-byte on the boundary heuristic, because the
 * on-chain `paragraphKey` for each tip is derived from `(articleId,
 * index, text)`. A mismatch here would put tips on different keys than
 * the canonical TipiTip app and the counts would never line up.
 *
 * Heuristic: paragraphs are separated by one or more blank lines.
 * Fenced code blocks (``` … ```) are preserved as a single paragraph
 * regardless of internal blank lines.
 */
export function splitParagraphs(markdown: string): string[] {
  const lines = markdown.split(/\r?\n/);
  const out: string[] = [];
  let buf: string[] = [];
  let inFence = false;

  const flush = () => {
    const text = buf.join("\n").trim();
    if (text) out.push(text);
    buf = [];
  };

  for (const line of lines) {
    if (line.trimStart().startsWith("```")) {
      inFence = !inFence;
      buf.push(line);
      continue;
    }
    if (inFence) {
      buf.push(line);
      continue;
    }
    if (line.trim() === "") {
      flush();
      continue;
    }
    buf.push(line);
  }
  flush();
  return out;
}
