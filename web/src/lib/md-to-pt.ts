// Convert simple markdown to Sanity Portable Text blocks.
// Supports: ## h2, ### h3, > blockquote, **bold**, _italic_, paragraphs.

let keyCounter = 0;
function k() { return `k${(++keyCounter).toString(36)}`; }

type PTMark = string;
type PTSpan = { _type: "span"; _key: string; text: string; marks: PTMark[] };
type PTBlock = {
  _type: "block";
  _key: string;
  style: string;
  children: PTSpan[];
  markDefs: unknown[];
};

function parseInline(text: string): PTSpan[] {
  const spans: PTSpan[] = [];
  let remaining = text;
  while (remaining.length > 0) {
    // Bold **...**
    const bold = remaining.match(/\*\*(.+?)\*\*/);
    // Italic _..._ or *...*
    const italic = remaining.match(/[_*](.+?)[_*]/);

    const firstBold = bold?.index ?? Infinity;
    const firstItalic = italic?.index ?? Infinity;

    if (firstBold === Infinity && firstItalic === Infinity) {
      spans.push({ _type: "span", _key: k(), text: remaining, marks: [] });
      break;
    }

    if (firstBold <= firstItalic) {
      if (firstBold > 0) spans.push({ _type: "span", _key: k(), text: remaining.slice(0, firstBold), marks: [] });
      spans.push({ _type: "span", _key: k(), text: bold![1], marks: ["strong"] });
      remaining = remaining.slice(firstBold + bold![0].length);
    } else {
      if (firstItalic > 0) spans.push({ _type: "span", _key: k(), text: remaining.slice(0, firstItalic), marks: [] });
      spans.push({ _type: "span", _key: k(), text: italic![1], marks: ["em"] });
      remaining = remaining.slice(firstItalic + italic![0].length);
    }
  }
  return spans.filter(s => s.text.length > 0);
}

export function mdToPt(markdown: string): PTBlock[] {
  const blocks: PTBlock[] = [];
  const lines = markdown.split(/\r?\n/);
  let i = 0;

  while (i < lines.length) {
    const line = lines[i].trimEnd();
    i++;

    if (!line.trim()) continue;

    if (line.startsWith("### ")) {
      blocks.push({ _type: "block", _key: k(), style: "h3", children: [{ _type: "span", _key: k(), text: line.slice(4), marks: [] }], markDefs: [] });
    } else if (line.startsWith("## ")) {
      blocks.push({ _type: "block", _key: k(), style: "h2", children: [{ _type: "span", _key: k(), text: line.slice(3), marks: [] }], markDefs: [] });
    } else if (line.startsWith("> ")) {
      blocks.push({ _type: "block", _key: k(), style: "blockquote", children: [{ _type: "span", _key: k(), text: line.slice(2), marks: [] }], markDefs: [] });
    } else {
      blocks.push({ _type: "block", _key: k(), style: "normal", children: parseInline(line), markDefs: [] });
    }
  }

  return blocks;
}
