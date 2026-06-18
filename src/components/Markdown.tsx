// Minimal markdown renderer (no external deps) for headings, bold, lists, code, paragraphs.
import { type JSX } from "react";

function renderInline(text: string): (string | JSX.Element)[] {
  const parts: (string | JSX.Element)[] = [];
  const regex = /(\*\*[^*]+\*\*|`[^`]+`)/g;
  let lastIndex = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = regex.exec(text)) !== null) {
    if (m.index > lastIndex) parts.push(text.slice(lastIndex, m.index));
    const tok = m[0];
    if (tok.startsWith("**")) parts.push(<strong key={i++}>{tok.slice(2, -2)}</strong>);
    else parts.push(<code key={i++}>{tok.slice(1, -1)}</code>);
    lastIndex = m.index + tok.length;
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  return parts;
}

export function Markdown({ text }: { text: string }) {
  const lines = text.split("\n");
  const blocks: JSX.Element[] = [];
  let listBuf: string[] = [];
  let listType: "ul" | "ol" | null = null;
  let key = 0;

  const flushList = () => {
    if (listBuf.length === 0) return;
    const items = listBuf.map((l, i) => <li key={i}>{renderInline(l)}</li>);
    blocks.push(listType === "ol" ? <ol key={key++}>{items}</ol> : <ul key={key++}>{items}</ul>);
    listBuf = [];
    listType = null;
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    if (!line.trim()) {
      flushList();
      continue;
    }
    const h = line.match(/^(#{1,3})\s+(.*)$/);
    if (h) {
      flushList();
      const level = h[1].length;
      const content = renderInline(h[2]);
      if (level === 1) blocks.push(<h1 key={key++}>{content}</h1>);
      else if (level === 2) blocks.push(<h2 key={key++}>{content}</h2>);
      else blocks.push(<h3 key={key++}>{content}</h3>);
      continue;
    }
    const ul = line.match(/^[-*]\s+(.*)$/);
    const ol = line.match(/^\d+\.\s+(.*)$/);
    if (ul) {
      if (listType !== "ul") flushList();
      listType = "ul";
      listBuf.push(ul[1]);
      continue;
    }
    if (ol) {
      if (listType !== "ol") flushList();
      listType = "ol";
      listBuf.push(ol[1]);
      continue;
    }
    flushList();
    blocks.push(<p key={key++}>{renderInline(line)}</p>);
  }
  flushList();
  return <div className="prose-workmate text-sm text-foreground">{blocks}</div>;
}
