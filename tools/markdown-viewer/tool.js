/**
 * Markdown Viewer — Live editor/preview with full markdown rendering.
 * Ported from markdown_viewer.py
 */

// ── Markdown → HTML converter ─────────────────────────────────────────────────
function _mdToHtml(md) {
  const esc = s => s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');

  const lines = md.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  const out = [];
  let i = 0;

  const inline = rawText => {
    // Escape first, then apply inline styles via placeholders
    let t = esc(rawText);
    // Code spans (preserve inner content)
    const codeSlots = [];
    t = t.replace(/`([^`\n]+?)`/g, (_, c) => { codeSlots.push(c); return `\x00CODE${codeSlots.length - 1}\x00`; });
    // Bold-italic
    t = t.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
    // Bold
    t = t.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
         .replace(/__(.+?)__/g, '<strong>$1</strong>');
    // Italic
    t = t.replace(/(?<!\*)\*([^*\n]+?)\*(?!\*)/g, '<em>$1</em>')
         .replace(/(?<!_)_([^_\n]+?)_(?!_)/g, '<em>$1</em>');
    // Strikethrough
    t = t.replace(/~~(.+?)~~/g, '<del>$1</del>');
    // Images
    t = t.replace(/!\[([^\]]*?)\]\([^)]*?\)/g, '<span class="mv-img">[Image: $1]</span>');
    // Links
    t = t.replace(/\[([^\]]+?)\]\(([^)]+?)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
    // Restore code slots
    t = t.replace(/\x00CODE(\d+)\x00/g, (_, idx) => `<code>${esc(codeSlots[parseInt(idx)])}</code>`);
    return t;
  };

  while (i < lines.length) {
    const line = lines[i];
    const stripped = line.trim();

    // Fenced code block
    const fenceMatch = stripped.match(/^(`{3,}|~{3,})(.*)/);
    if (fenceMatch) {
      const fence = fenceMatch[1][0].repeat(fenceMatch[1].length);
      const lang  = esc(fenceMatch[2].trim());
      i++;
      const codeLines = [];
      while (i < lines.length && !lines[i].trim().startsWith(fence)) {
        codeLines.push(esc(lines[i]));
        i++;
      }
      out.push(`<pre><code${lang ? ` class="language-${lang}"` : ''}>${codeLines.join('\n')}</code></pre>`);
      i++;
      continue;
    }

    // ATX headings
    const hMatch = line.match(/^(#{1,6})\s+(.*?)(?:\s+#+)?$/);
    if (hMatch) {
      const lvl = hMatch[1].length;
      out.push(`<h${lvl}>${inline(hMatch[2])}</h${lvl}>`);
      i++; continue;
    }

    // Setext H1/H2
    if (i + 1 < lines.length) {
      if (lines[i + 1].match(/^=+\s*$/) && stripped) {
        out.push(`<h1>${inline(stripped)}</h1>`);
        i += 2; continue;
      }
      if (lines[i + 1].match(/^-+\s*$/) && stripped && !stripped.startsWith('-')) {
        out.push(`<h2>${inline(stripped)}</h2>`);
        i += 2; continue;
      }
    }

    // Horizontal rule
    if (/^(---+|___+|\*\*\*+)\s*$/.test(stripped)) {
      out.push('<hr>');
      i++; continue;
    }

    // Blockquote
    if (stripped.startsWith('>')) {
      const bqLines = [];
      while (i < lines.length && lines[i].trim().startsWith('>')) {
        bqLines.push(lines[i].replace(/^>\s?/, ''));
        i++;
      }
      out.push(`<blockquote>${_mdToHtml(bqLines.join('\n'))}</blockquote>`);
      continue;
    }

    // Unordered list
    if (/^(\s*)[-*+]\s/.test(line)) {
      const items = [];
      while (i < lines.length && /^(\s*)[-*+]\s/.test(lines[i])) {
        items.push(`<li>${inline(lines[i].replace(/^\s*[-*+]\s/, ''))}</li>`);
        i++;
      }
      out.push(`<ul>${items.join('')}</ul>`);
      continue;
    }

    // Ordered list
    if (/^\d+\.\s/.test(stripped)) {
      const items = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i].trim())) {
        items.push(`<li>${inline(lines[i].replace(/^\s*\d+\.\s/, ''))}</li>`);
        i++;
      }
      out.push(`<ol>${items.join('')}</ol>`);
      continue;
    }

    // Table
    if (i + 1 < lines.length && /^\|?[-:| ]+\|?$/.test(lines[i + 1]) && stripped.includes('|')) {
      const header = stripped.split('|').filter(Boolean).map(c => `<th>${inline(c.trim())}</th>`).join('');
      i += 2; // skip separator
      const rows = [];
      while (i < lines.length && lines[i].includes('|')) {
        const cells = lines[i].split('|').filter(Boolean).map(c => `<td>${inline(c.trim())}</td>`).join('');
        rows.push(`<tr>${cells}</tr>`);
        i++;
      }
      out.push(`<table><thead><tr>${header}</tr></thead><tbody>${rows.join('')}</tbody></table>`);
      continue;
    }

    // Blank line
    if (!stripped) {
      i++; continue;
    }

    // Paragraph
    const paraLines = [];
    while (i < lines.length && lines[i].trim() && !lines[i].match(/^(#{1,6}|>|[-*+]|\d+\.|\`{3,}|~{3,}|---+|___+|\*\*\*+)/)) {
      paraLines.push(lines[i]);
      i++;
    }
    if (paraLines.length) out.push(`<p>${inline(paraLines.join(' '))}</p>`);
  }

  return out.join('\n');
}

// ── Tool ────────────────────────────────────────────────────────────────────
const MarkdownViewerTool = {
  id:          'markdown-viewer',
  name:        'Markdown Viewer',
  description: 'Live markdown editor/preview — type on the left, see rendered HTML on the right.',
  icon:        '📄',
  category:    'Text',

  _defaultMd: `# Markdown Viewer

Type or paste markdown in the **editor** on the left.

## Features

- **Bold**, *italic*, ~~strikethrough~~, \`inline code\`
- Headings H1–H6
- Ordered and unordered lists
- Blockquotes
- Fenced code blocks
- Tables
- Horizontal rules
- [Links](https://example.com)

## Code Example

\`\`\`javascript
function greet(name) {
  return \`Hello, \${name}!\`;
}
\`\`\`

## Table

| Column A | Column B | Column C |
|----------|----------|----------|
| One      | Two      | Three    |
| Alpha    | Beta     | Gamma    |

> This is a **blockquote**.

---
*Start editing above!*
`,

  render() {
    return /* html */`
      <style>
        #mv-preview { font-family: var(--font-sans); font-size: 14px; line-height: 1.7; color: var(--color-text); }
        #mv-preview h1,#mv-preview h2 { border-bottom: 1px solid var(--color-border); padding-bottom: 6px; margin: 18px 0 10px; }
        #mv-preview h3,#mv-preview h4 { margin: 14px 0 8px; }
        #mv-preview h1 { font-size: 1.9em; } #mv-preview h2 { font-size: 1.5em; }
        #mv-preview h3 { font-size: 1.25em; } #mv-preview h4 { font-size: 1.1em; }
        #mv-preview p { margin: 0 0 10px; }
        #mv-preview ul,#mv-preview ol { padding-left: 24px; margin: 6px 0 10px; }
        #mv-preview li { margin: 3px 0; }
        #mv-preview code { background: #f0f0f4; border-radius: 3px; padding: 1px 5px; font-family: var(--font-mono); font-size: 12px; color: #c7254e; }
        #mv-preview pre { background: #f4f4f6; border-radius: 6px; padding: 14px 16px; overflow-x: auto; margin: 10px 0; }
        #mv-preview pre code { background: none; color: var(--color-text); padding: 0; font-size: 13px; }
        #mv-preview blockquote { border-left: 4px solid var(--color-accent); margin: 0 0 10px; padding: 6px 14px; color: var(--color-text-muted); background: #f8f8fa; border-radius: 0 4px 4px 0; }
        #mv-preview table { border-collapse: collapse; width: 100%; margin: 10px 0; font-size: 13px; }
        #mv-preview th,#mv-preview td { border: 1px solid var(--color-border); padding: 7px 12px; text-align: left; }
        #mv-preview th { background: var(--color-bg); font-weight: 700; }
        #mv-preview hr { border: none; border-top: 2px solid var(--color-border); margin: 18px 0; }
        #mv-preview a { color: var(--color-accent); text-decoration: none; }
        #mv-preview a:hover { text-decoration: underline; }
        #mv-preview .mv-img { color: var(--color-text-muted); font-style: italic; }
      </style>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:0;height:calc(100vh - 160px);min-height:400px;">

        <div style="display:flex;flex-direction:column;border:1px solid var(--color-border);border-radius:8px 0 0 8px;overflow:hidden;">
          <div style="background:var(--color-bg);border-bottom:1px solid var(--color-border);padding:8px 14px;display:flex;justify-content:space-between;align-items:center;">
            <span style="font-size:12px;font-weight:700;color:var(--color-text-muted);text-transform:uppercase;letter-spacing:.05em;">Editor</span>
            <div style="display:flex;gap:6px;">
              <button class="btn btn-ghost" id="mv-clear" style="font-size:11px;padding:3px 8px;">Clear</button>
              <button class="btn btn-ghost" id="mv-copy-src" style="font-size:11px;padding:3px 8px;">Copy MD</button>
              <button class="btn btn-ghost" id="mv-copy-html" style="font-size:11px;padding:3px 8px;">Copy HTML</button>
            </div>
          </div>
          <textarea id="mv-editor" style="flex:1;resize:none;border:none;outline:none;padding:16px;font-family:var(--font-mono);font-size:13px;line-height:1.6;background:#fff;color:var(--color-text);"></textarea>
        </div>

        <div style="display:flex;flex-direction:column;border:1px solid var(--color-border);border-left:none;border-radius:0 8px 8px 0;overflow:hidden;">
          <div style="background:var(--color-bg);border-bottom:1px solid var(--color-border);padding:8px 14px;">
            <span style="font-size:12px;font-weight:700;color:var(--color-text-muted);text-transform:uppercase;letter-spacing:.05em;">Preview</span>
          </div>
          <div id="mv-preview" style="flex:1;overflow-y:auto;padding:16px 20px;background:#fff;"></div>
        </div>

      </div>`;
  },

  init(container) {
    const editor  = container.querySelector('#mv-editor');
    const preview = container.querySelector('#mv-preview');
    const clear   = container.querySelector('#mv-clear');
    const copySrc = container.querySelector('#mv-copy-src');
    const copyHtml = container.querySelector('#mv-copy-html');

    const render = () => {
      preview.innerHTML = _mdToHtml(editor.value);
    };

    editor.value = this._defaultMd;
    render();

    this._onInput   = render;
    this._onClear   = () => { editor.value = ''; render(); editor.focus(); };
    this._onCopySrc = () => {
      navigator.clipboard.writeText(editor.value)
        .then(() => LarryTools.toast('Markdown copied!', 'success'))
        .catch(() => LarryTools.toast('Copy failed', 'error'));
    };
    this._onCopyHtml = () => {
      navigator.clipboard.writeText(preview.innerHTML)
        .then(() => LarryTools.toast('HTML copied!', 'success'))
        .catch(() => LarryTools.toast('Copy failed', 'error'));
    };

    editor.addEventListener('input', this._onInput);
    clear.addEventListener('click', this._onClear);
    copySrc.addEventListener('click', this._onCopySrc);
    copyHtml.addEventListener('click', this._onCopyHtml);

    this._editor = editor; this._clear = clear;
    this._copySrc = copySrc; this._copyHtml = copyHtml;
  },

  destroy() {
    this._editor?.removeEventListener('input', this._onInput);
    this._clear?.removeEventListener('click', this._onClear);
    this._copySrc?.removeEventListener('click', this._onCopySrc);
    this._copyHtml?.removeEventListener('click', this._onCopyHtml);
    this._editor = this._clear = this._copySrc = this._copyHtml = null;
    this._onInput = this._onClear = this._onCopySrc = this._onCopyHtml = null;
  },
};

export default MarkdownViewerTool;
