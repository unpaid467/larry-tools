# Creating Tools for Larry Tools

This document is the complete reference for developers who want to add a new tool to Larry Tools.

---

## Table of Contents

1. [Project structure](#project-structure)
2. [Quick start](#quick-start)
3. [Tool file reference](#tool-file-reference)
   - [Required metadata](#required-metadata)
   - [Lifecycle methods](#lifecycle-methods)
4. [Registering your tool](#registering-your-tool)
5. [UI component classes](#ui-component-classes)
6. [Global helpers](#global-helpers)
7. [Categories](#categories)
8. [Dos & don'ts](#dos--donts)
9. [Full example](#full-example)

---

## Project structure

```
larry-tools/
├── index.html                  ← App shell (do not edit)
├── assets/
│   ├── css/
│   │   └── main.css            ← Global styles & UI components
│   └── js/
│       └── app.js              ← Core engine (do not edit)
├── tools/
│   ├── index.js                ← Tool registry  ← YOU EDIT THIS
│   ├── example-tool/
│   │   └── tool.js             ← Reference implementation
│   └── your-tool/              ← Your new tool folder
│       └── tool.js
└── CREATING_TOOLS.md           ← This file
```

---

## Quick start

```bash
# 1. Copy the example tool folder
cp -r tools/example-tool tools/my-tool

# 2. Edit tools/my-tool/tool.js  (change id, name, render, init, …)

# 3. Register it in tools/index.js
```

---

## Tool file reference

Each tool is a **plain JavaScript ES module** that exports a single default object.

```js
// tools/my-tool/tool.js

const MyTool = {
  // ── metadata ──
  id:          'my-tool',
  name:        'My Tool',
  description: 'A short sentence about what this tool does.',
  icon:        '🛠',
  category:    'Utilities',

  // ── lifecycle ──
  render(container)  { /* … */ },
  init(container)    { /* … */ },
  destroy()          { /* … */ },
};

export default MyTool;
```

---

### Required metadata

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | `string` | ✅ | Unique kebab-case ID. Used in the URL hash (`#my-tool`). Must be globally unique. |
| `name` | `string` | ✅ | Human-readable name shown in the sidebar and tool header. |
| `description` | `string` | ✅ | One-sentence description shown under the tool name. |
| `icon` | `string` | ✅ | Emoji shown as the tool icon. |
| `category` | `string` | ✅ | Groups tools in the sidebar (see [Categories](#categories)). |
| `secret` | `boolean` | ❌ | Set to `true` to hide this tool until the secret unlock sequence is entered. |

---

### Lifecycle methods

#### `render(container)` — **Required**

Called first, before the tool is mounted. Use it to provide the initial HTML.

- **Option A — return an HTML string** (recommended for simple tools):
  ```js
  render(container) {
    return `<div class="card"> … </div>`;
  }
  ```
- **Option B — write directly to `container`** (useful when programmatically building DOM):
  ```js
  render(container) {
    const p = document.createElement('p');
    p.textContent = 'Hello!';
    container.appendChild(p);
    // return nothing (undefined)
  }
  ```

> ⚠️ Do **not** attach event listeners inside `render()`. Use `init()` for that.

---

#### `init(container)` — Optional

Called right after `render()` once the HTML is in the DOM.

- Attach all event listeners here.
- Start timers, initialise third-party libraries, fetch initial data, etc.
- Save any references you'll need in `destroy()` on `this`.

```js
init(container) {
  this._btn = container.querySelector('#my-btn');
  this._onClick = () => { /* … */ };
  this._btn.addEventListener('click', this._onClick);
},
```

---

#### `destroy()` — Optional

Called when the user navigates away from your tool.

- Remove every event listener you attached.
- Cancel `setInterval` / `setTimeout` / `requestAnimationFrame`.
- Abort pending `fetch` requests.
- Nullify saved references to avoid memory leaks.

```js
destroy() {
  if (this._btn) this._btn.removeEventListener('click', this._onClick);
  this._btn     = null;
  this._onClick = null;
},
```

If your tool has no side-effects you can omit `destroy()` entirely.

---

## Registering your tool

Open **`tools/index.js`** and add your tool:

```js
// tools/index.js
import ExampleTool from './example-tool/tool.js';
import MyTool      from './my-tool/tool.js';       // ← add import

export default [
  ExampleTool,
  MyTool,       // ← add to array
];
```

The array order determines the display order in the sidebar.

---

## UI component classes

`main.css` ships a set of ready-made utility classes you can use inside `render()` without writing any custom CSS.

### Layout
| Class | Description |
|---|---|
| `.card` | White rounded container with border and shadow |
| `.field` | Vertical form field wrapper |
| `.btn-row` | Horizontal flex row for buttons |
| `.stat-row` | Horizontal flex row for stat chips |
| `.divider` | 1px horizontal rule |

### Form elements
| Class | Element | Description |
|---|---|---|
| `.input` | `<input>` | Styled text input |
| `.textarea` | `<textarea>` | Styled multi-line input (monospace) |
| `.select` | `<select>` | Styled dropdown |

### Buttons
| Class | Description |
|---|---|
| `.btn.btn-primary` | Filled accent-colour button |
| `.btn.btn-secondary` | Outlined neutral button |
| `.btn.btn-ghost` | Transparent button |
| `.btn.btn-danger` | Red destructive button |

### Display
| Class | Description |
|---|---|
| `.output` | Monospace read-only result box |
| `.stat-chip` | Small badge — wrap a `<strong>` for the value |
| `.empty-state` | Centered empty/no-result message area |

### Example usage
```html
<div class="card">
  <div class="field">
    <label for="my-input">Input</label>
    <input class="input" id="my-input" type="text" placeholder="Type something…" />
  </div>
  <div class="btn-row">
    <button class="btn btn-primary" id="run-btn">Run</button>
    <button class="btn btn-secondary" id="clear-btn">Clear</button>
  </div>
  <div class="divider"></div>
  <div class="output" id="result">Result will appear here…</div>
  <div class="stat-row">
    <div class="stat-chip">Length <strong id="len">0</strong></div>
  </div>
</div>
```

---

## Global helpers

### `LarryTools.toast(message, type?, duration?)`

Show a non-blocking notification at the bottom-right corner of the screen.

```js
// From anywhere in your tool:
LarryTools.toast('Copied to clipboard!');              // default (dark)
LarryTools.toast('Done!', 'success');                 // green
LarryTools.toast('Something went wrong.', 'error');   // red
LarryTools.toast('Copied!', 'success', 1500);         // custom duration (ms)
```

---

## Categories

Use one of the existing categories to keep the sidebar organised, or create a new one if your tool genuinely doesn't fit.

| Category | For |
|---|---|
| `Text` | Text manipulation, counters, formatters |
| `Data` | JSON, CSV, XML, data conversion |
| `Encoding` | Base64, URL encode, hash tools |
| `Generators` | Password, UUID, Lorem ipsum, colour palettes |
| `Converters` | Unit conversion, timestamp, number base |
| `Dev` | Developer utilities (regex tester, diff, etc.) |
| `Math` | Calculators, expressions |
| `Network` | IP info, DNS, URL parser |
| `🔒 Secret` | Hidden tools — only visible after the unlock sequence |

### Secret tools

Add `secret: true` to your tool object to hide it from the sidebar and welcome screen until the unlock sequence is entered on the logo. Users enter the sequence by clicking the letters in **Larry Tools** in this order: **a → a → y → y → T → T → s → s**. Entering the sequence again hides all secret tools.

```js
const MySecretTool = {
  id:       'my-secret-tool',
  name:     'My Secret Tool',
  icon:     '🕵',
  category: '🔒 Secret',
  secret:   true,          // ← the only extra field needed
  render()  { /* … */ },
  init()    { /* … */ },
};
```

---

## Dos & don'ts

| ✅ Do | ❌ Don't |
|---|---|
| Keep each tool in its own folder | Put multiple tools in one file |
| Use the shared CSS classes | Add `<style>` tags or inline styles |
| Clean up in `destroy()` | Leave dangling event listeners |
| Use `LarryTools.toast()` for feedback | Use `alert()` or `confirm()` |
| Prefix element IDs with your tool ID | Use generic IDs like `#input` or `#output` |
| Handle empty/edge-case input gracefully | Throw uncaught errors |
| Keep `render()` pure (no side effects) | Attach listeners inside `render()` |

---

## Full example

```js
// tools/hash-generator/tool.js

const HashGeneratorTool = {
  id:          'hash-generator',
  name:        'Hash Generator',
  description: 'Generate MD5, SHA-1, and SHA-256 hashes from any text.',
  icon:        '#️⃣',
  category:    'Encoding',

  render() {
    return `
      <div class="card">
        <div class="field">
          <label for="hg-input">Input text</label>
          <textarea class="textarea" id="hg-input" rows="5"
            placeholder="Enter text to hash…"></textarea>
        </div>
        <div class="btn-row">
          <button class="btn btn-primary" id="hg-run">Generate</button>
          <button class="btn btn-secondary" id="hg-clear">Clear</button>
        </div>
        <div class="divider"></div>
        <div class="field">
          <label>SHA-256</label>
          <div class="output" id="hg-sha256">—</div>
        </div>
      </div>`;
  },

  async init(container) {
    const input    = container.querySelector('#hg-input');
    const runBtn   = container.querySelector('#hg-run');
    const clearBtn = container.querySelector('#hg-clear');
    const sha256El = container.querySelector('#hg-sha256');

    this._onRun = async () => {
      const text = input.value;
      if (!text) { LarryTools.toast('Enter some text first.', 'error'); return; }

      const encoded = new TextEncoder().encode(text);
      const hashBuf = await crypto.subtle.digest('SHA-256', encoded);
      const hex = Array.from(new Uint8Array(hashBuf))
        .map(b => b.toString(16).padStart(2, '0')).join('');

      sha256El.textContent = hex;
      LarryTools.toast('Hash generated!', 'success');
    };

    this._onClear = () => {
      input.value = '';
      sha256El.textContent = '—';
      input.focus();
    };

    runBtn.addEventListener('click', this._onRun);
    clearBtn.addEventListener('click', this._onClear);

    this._runBtn   = runBtn;
    this._clearBtn = clearBtn;
  },

  destroy() {
    if (this._runBtn)   this._runBtn.removeEventListener('click', this._onRun);
    if (this._clearBtn) this._clearBtn.removeEventListener('click', this._onClear);
    this._runBtn   = null;
    this._clearBtn = null;
    this._onRun    = null;
    this._onClear  = null;
  },
};

export default HashGeneratorTool;
```

Then in **`tools/index.js`**:
```js
import HashGeneratorTool from './hash-generator/tool.js';

export default [
  // … existing tools …
  HashGeneratorTool,
];
```

That's all — the tool will automatically appear in the sidebar under the **Encoding** category.
