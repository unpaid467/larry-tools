/**
 * DateTime Clipboard — Copy the current date/time in a chosen format.
 * Ported from datetime_clipboard.py
 */

const DateTimeClipboardTool = {
  id:          'datetime-clipboard',
  name:        'DateTime Clipboard',
  description: 'Copy the current date & time to clipboard in a chosen format.',
  icon:        '📋',
  category:    'Utilities',

  _p: n => String(n).padStart(2, '0'),

  _getFormats() {
    const p = this._p;
    return [
      { label: 'YYYY_MM_DD-HH_MM_SS  (default)', fn: d => `${d.getFullYear()}_${p(d.getMonth()+1)}_${p(d.getDate())}-${p(d.getHours())}_${p(d.getMinutes())}_${p(d.getSeconds())}` },
      { label: 'YYYY-MM-DD HH:MM:SS',            fn: d => `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}` },
      { label: 'YYYYMMDD_HHMMSS',                fn: d => `${d.getFullYear()}${p(d.getMonth()+1)}${p(d.getDate())}_${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}` },
      { label: 'YYYY-MM-DD',                     fn: d => `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}` },
      { label: 'HH:MM:SS',                       fn: d => `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}` },
      { label: 'DD/MM/YYYY HH:MM:SS',            fn: d => `${p(d.getDate())}/${p(d.getMonth()+1)}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}` },
      { label: 'ISO 8601 (UTC)',                  fn: d => d.toISOString() },
      { label: 'Unix timestamp (seconds)',        fn: d => String(Math.floor(d.getTime() / 1000)) },
      { label: 'Unix timestamp (milliseconds)',   fn: d => String(d.getTime()) },
    ];
  },

  render() {
    const fmts = this._getFormats();
    return /* html */`
      <div class="card" style="max-width:580px;">

        <div class="field">
          <label for="dtc-fmt">Format</label>
          <select class="select" id="dtc-fmt">
            ${fmts.map((f, i) => `<option value="${i}">${f.label}</option>`).join('')}
          </select>
        </div>

        <div class="field">
          <label>Live preview</label>
          <div class="output" id="dtc-preview" style="font-size:15px;"></div>
        </div>

        <div class="btn-row">
          <button class="btn btn-primary" id="dtc-copy">📋&nbsp;Copy to clipboard</button>
          <button class="btn btn-ghost"   id="dtc-refresh">↻ Refresh</button>
        </div>

        <div class="divider"></div>

        <div class="field" style="margin-bottom:0;">
          <label for="dtc-custom">
            Custom format
            <span style="font-weight:400;text-transform:none;letter-spacing:0;font-size:11px;color:var(--color-text-muted);">&nbsp;— tokens: YYYY MM DD HH mm SS</span>
          </label>
          <div style="display:flex;gap:8px;">
            <input type="text" class="input" id="dtc-custom" placeholder="e.g. YYYY/MM/DD HH:mm:SS"
              style="font-family:var(--font-mono);">
            <button class="btn btn-secondary" id="dtc-custom-copy">Copy</button>
          </div>
          <div class="output" id="dtc-custom-preview" style="margin-top:8px;font-size:13px;">—</div>
        </div>

      </div>`;
  },

  init(container) {
    const fmts     = this._getFormats();
    const p        = this._p;
    const select   = container.querySelector('#dtc-fmt');
    const preview  = container.querySelector('#dtc-preview');
    const copyBtn  = container.querySelector('#dtc-copy');
    const refresh  = container.querySelector('#dtc-refresh');
    const custom   = container.querySelector('#dtc-custom');
    const custCopy = container.querySelector('#dtc-custom-copy');
    const custPrev = container.querySelector('#dtc-custom-preview');

    const updateMain = () => {
      preview.textContent = fmts[parseInt(select.value)].fn(new Date());
    };

    const updateCustom = () => {
      const pat = custom.value;
      if (!pat) { custPrev.textContent = '—'; return; }
      const d = new Date();
      custPrev.textContent = pat
        .replace('YYYY', d.getFullYear())
        .replace('MM',   p(d.getMonth() + 1))
        .replace('DD',   p(d.getDate()))
        .replace('HH',   p(d.getHours()))
        .replace('mm',   p(d.getMinutes()))
        .replace('SS',   p(d.getSeconds()));
    };

    updateMain();
    this._ticker = setInterval(updateMain, 1000);

    this._onSelect  = updateMain;
    this._onRefresh = updateMain;

    this._onCopy = () => {
      const txt = preview.textContent;
      navigator.clipboard.writeText(txt)
        .then(() => LarryTools.toast('Copied: ' + txt, 'success'))
        .catch(() => LarryTools.toast('Copy failed', 'error'));
    };

    this._onCustomInput = updateCustom;

    this._onCustomCopy = () => {
      const val = custPrev.textContent;
      if (!val || val === '—') { LarryTools.toast('Nothing to copy', 'error'); return; }
      navigator.clipboard.writeText(val)
        .then(() => LarryTools.toast('Copied!', 'success'))
        .catch(() => LarryTools.toast('Copy failed', 'error'));
    };

    select.addEventListener('change', this._onSelect);
    copyBtn.addEventListener('click', this._onCopy);
    refresh.addEventListener('click', this._onRefresh);
    custom.addEventListener('input', this._onCustomInput);
    custCopy.addEventListener('click', this._onCustomCopy);

    this._select = select; this._copyBtn = copyBtn; this._refresh = refresh;
    this._custom = custom; this._custCopy = custCopy;
  },

  destroy() {
    clearInterval(this._ticker);
    this._ticker = null;
    this._select?.removeEventListener('change', this._onSelect);
    this._copyBtn?.removeEventListener('click', this._onCopy);
    this._refresh?.removeEventListener('click', this._onRefresh);
    this._custom?.removeEventListener('input', this._onCustomInput);
    this._custCopy?.removeEventListener('click', this._onCustomCopy);
    this._select = this._copyBtn = this._refresh = this._custom = this._custCopy = null;
  },
};

export default DateTimeClipboardTool;
