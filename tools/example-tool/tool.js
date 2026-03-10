/**
 * Example Tool — Word Counter
 *
 * This file demonstrates the standard Larry Tools tool structure.
 * Copy it as a starting point for every new tool.
 */

const ExampleTool = {

  // ── Required metadata ──────────────────────────────────────────────

  /** Unique kebab-case identifier. Used in the URL hash (#word-counter). */
  id: 'word-counter',

  /** Human-readable name shown in the sidebar and tool header. */
  name: 'Word Counter',

  /** One-sentence description shown under the tool name. */
  description: 'Count words, characters, sentences and paragraphs in any text.',

  /** Emoji or single character used as the icon. */
  icon: '📝',

  /**
   * Category label.  Tools with the same category are grouped in the sidebar.
   * Use an existing category name to group your tool, or invent a new one.
   */
  category: 'Text',

  // ── Lifecycle ──────────────────────────────────────────────────────

  /**
   * render(container)
   *
   * Called first. Return an HTML string OR manipulate `container` directly.
   * Do NOT attach event listeners here — use init() for that.
   *
   * @param {HTMLElement} container  The empty <div class="tool-body"> element.
   * @returns {string|undefined}     HTML string, or undefined if you wrote to container.
   */
  render(container) {
    return /* html */`
      <div class="card">
        <div class="field">
          <label for="wc-input">Your text</label>
          <textarea class="textarea" id="wc-input" rows="10"
            placeholder="Paste or type your text here…"></textarea>
        </div>

        <div class="stat-row" id="wc-stats">
          <div class="stat-chip">Words <strong id="wc-words">0</strong></div>
          <div class="stat-chip">Characters <strong id="wc-chars">0</strong></div>
          <div class="stat-chip">Characters (no spaces) <strong id="wc-chars-ns">0</strong></div>
          <div class="stat-chip">Sentences <strong id="wc-sentences">0</strong></div>
          <div class="stat-chip">Paragraphs <strong id="wc-paragraphs">0</strong></div>
          <div class="stat-chip">Reading time <strong id="wc-read-time">0 sec</strong></div>
        </div>

        <div class="btn-row">
          <button class="btn btn-secondary" id="wc-clear">Clear</button>
        </div>
      </div>`;
  },

  /**
   * init(container)
   *
   * Called after render() has injected HTML into the DOM.
   * Attach all event listeners and initialise any state here.
   *
   * @param {HTMLElement} container  The populated <div class="tool-body"> element.
   */
  init(container) {
    const input      = container.querySelector('#wc-input');
    const clearBtn   = container.querySelector('#wc-clear');

    const update = () => {
      const text  = input.value;
      const words = text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
      const chars = text.length;
      const charsNoSpace = text.replace(/\s/g, '').length;
      const sentences = text === '' ? 0 : (text.match(/[.!?]+/g) || []).length;
      const paragraphs = text.trim() === '' ? 0
        : text.trim().split(/\n+/).filter(p => p.trim() !== '').length;
      const readSec = Math.ceil(words / (200 / 60));   // ~200 wpm average
      const readLabel = readSec < 60
        ? `${readSec} sec`
        : `${Math.ceil(readSec / 60)} min`;

      container.querySelector('#wc-words').textContent      = words.toLocaleString();
      container.querySelector('#wc-chars').textContent      = chars.toLocaleString();
      container.querySelector('#wc-chars-ns').textContent   = charsNoSpace.toLocaleString();
      container.querySelector('#wc-sentences').textContent  = sentences.toLocaleString();
      container.querySelector('#wc-paragraphs').textContent = paragraphs.toLocaleString();
      container.querySelector('#wc-read-time').textContent  = readLabel;
    };

    input.addEventListener('input', update);
    clearBtn.addEventListener('click', () => { input.value = ''; update(); input.focus(); });

    // Store references so destroy() can clean up
    this._input    = input;
    this._clearBtn = clearBtn;
    this._update   = update;
  },

  /**
   * destroy()
   *
   * Called when the user switches away from this tool.
   * Remove event listeners, clear timers/intervals, abort fetches, etc.
   * If you have nothing to clean up you can omit this method entirely.
   */
  destroy() {
    if (this._input)    this._input.removeEventListener('input', this._update);
    this._input    = null;
    this._clearBtn = null;
    this._update   = null;
  },

};

export default ExampleTool;
