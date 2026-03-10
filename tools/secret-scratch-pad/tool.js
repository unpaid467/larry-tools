/**
 * Secret Scratch Pad — Secret Tool
 *
 * A private notepad that auto-saves to localStorage.
 * Only visible when secret mode is active.
 *
 * Demonstrates the `secret: true` flag that hides a tool
 * until the correct unlock sequence is entered.
 */

const SecretScratchPad = {

  id:          'secret-scratch-pad',
  name:        'Scratch Pad',
  description: 'A private notepad that auto-saves in your browser.',
  icon:        '🗒',
  category:    '🔒 Secret',

  /**
   * secret: true — this tool is invisible until the unlock sequence is entered.
   * The app engine checks this flag to show/hide the tool.
   */
  secret: true,

  _STORAGE_KEY: 'larrytools__secret_scratch',

  render() {
    return /* html */`
      <div class="card">
        <div class="field">
          <label for="ssp-pad">Notes <span style="font-weight:400;text-transform:none;letter-spacing:0;color:#aaa;font-size:11px;">— auto-saved locally</span></label>
          <textarea class="textarea" id="ssp-pad" rows="18"
            placeholder="Only you can see this…" spellcheck="false"></textarea>
        </div>
        <div class="btn-row">
          <button class="btn btn-secondary" id="ssp-clear">Clear</button>
          <button class="btn btn-ghost"     id="ssp-copy">Copy</button>
          <span style="margin-left:auto;font-size:11px;color:#aaa;line-height:1;align-self:center;"
                id="ssp-saved"></span>
        </div>
      </div>`;
  },

  init(container) {
    const pad      = container.querySelector('#ssp-pad');
    const clearBtn = container.querySelector('#ssp-clear');
    const copyBtn  = container.querySelector('#ssp-copy');
    const savedMsg = container.querySelector('#ssp-saved');

    // Restore saved content
    pad.value = localStorage.getItem(this._STORAGE_KEY) ?? '';

    let saveTimer = null;
    this._onInput = () => {
      clearTimeout(saveTimer);
      savedMsg.textContent = '';
      saveTimer = setTimeout(() => {
        localStorage.setItem(this._STORAGE_KEY, pad.value);
        savedMsg.textContent = 'Saved ✓';
        setTimeout(() => { savedMsg.textContent = ''; }, 1500);
      }, 600);
    };

    this._onClear = () => {
      if (!pad.value) return;
      pad.value = '';
      localStorage.removeItem(this._STORAGE_KEY);
      pad.focus();
      LarryTools.toast('Scratch pad cleared', '');
    };

    this._onCopy = () => {
      if (!pad.value) { LarryTools.toast('Nothing to copy', 'error'); return; }
      navigator.clipboard.writeText(pad.value)
        .then(() => LarryTools.toast('Copied to clipboard!', 'success'))
        .catch(() => LarryTools.toast('Copy failed', 'error'));
    };

    pad.addEventListener('input', this._onInput);
    clearBtn.addEventListener('click', this._onClear);
    copyBtn.addEventListener('click', this._onCopy);

    this._pad      = pad;
    this._clearBtn = clearBtn;
    this._copyBtn  = copyBtn;
    this._saveTimer = saveTimer;
  },

  destroy() {
    clearTimeout(this._saveTimer);
    if (this._pad)      this._pad.removeEventListener('input', this._onInput);
    if (this._clearBtn) this._clearBtn.removeEventListener('click', this._onClear);
    if (this._copyBtn)  this._copyBtn.removeEventListener('click', this._onCopy);
    this._pad = this._clearBtn = this._copyBtn = this._onInput =
      this._onClear = this._onCopy = this._saveTimer = null;
  },
};

export default SecretScratchPad;
