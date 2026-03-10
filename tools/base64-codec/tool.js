/**
 * Base64 Codec — Encode / decode text in Base64.
 * Ported from base64_codec.py
 */

const Base64CodecTool = {
  id:          'base64-codec',
  name:        'Base64 Codec',
  description: 'Encode or decode text in Base64, with URL-safe and MIME wrap options.',
  icon:        '🔣',
  category:    'Encoding',

  render() {
    return /* html */`
      <div class="card">
        <div style="display:flex;gap:20px;margin-bottom:14px;flex-wrap:wrap;">
          <label style="display:flex;align-items:center;gap:7px;font-size:13px;cursor:pointer;color:var(--color-text-muted)">
            <input type="checkbox" id="b64-urlsafe"> URL-safe alphabet&nbsp;(- and _ instead of + and /)
          </label>
          <label style="display:flex;align-items:center;gap:7px;font-size:13px;cursor:pointer;color:var(--color-text-muted)">
            <input type="checkbox" id="b64-wrap"> Wrap output at 76 chars&nbsp;(MIME)
          </label>
        </div>

        <div style="display:grid;grid-template-columns:1fr 116px 1fr;gap:12px;align-items:start;">
          <div class="field" style="margin:0">
            <label for="b64-input">Input</label>
            <textarea class="textarea" id="b64-input" rows="12"
              placeholder="Enter text to encode, or Base64 to decode…"></textarea>
          </div>

          <div style="display:flex;flex-direction:column;gap:8px;margin-top:24px;">
            <button class="btn btn-primary" id="b64-encode">Encode →</button>
            <button class="btn btn-secondary" id="b64-decode">← Decode</button>
            <button class="btn btn-ghost" id="b64-swap" style="margin-top:8px;">⇅ Swap</button>
          </div>

          <div class="field" style="margin:0">
            <label>Output</label>
            <textarea class="textarea" id="b64-output" rows="12" readonly
              style="background:#f9f9fb" placeholder="Result will appear here…"></textarea>
          </div>
        </div>

        <div class="divider"></div>

        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">
          <div class="stat-chip" id="b64-status">—</div>
          <div style="display:flex;gap:8px;">
            <button class="btn btn-ghost"      id="b64-clear">Clear</button>
            <button class="btn btn-secondary"  id="b64-copy">Copy Output</button>
          </div>
        </div>
      </div>`;
  },

  init(container) {
    const input   = container.querySelector('#b64-input');
    const output  = container.querySelector('#b64-output');
    const status  = container.querySelector('#b64-status');
    const urlSafe = container.querySelector('#b64-urlsafe');
    const wrap    = container.querySelector('#b64-wrap');

    this._onEncode = () => {
      try {
        const raw = input.value;
        let result = btoa(unescape(encodeURIComponent(raw)));
        if (urlSafe.checked) result = result.replace(/\+/g, '-').replace(/\//g, '_');
        if (wrap.checked) result = result.match(/.{1,76}/g).join('\n');
        output.value = result;
        const bytes = new TextEncoder().encode(raw).length;
        const chars = result.replace(/\n/g, '').length;
        status.textContent = `Encoded · ${bytes.toLocaleString()} bytes → ${chars.toLocaleString()} chars`;
      } catch (e) {
        output.value = `Error: ${e.message}`;
        status.textContent = 'Error';
      }
    };

    this._onDecode = () => {
      try {
        let raw = input.value.trim().replace(/\s/g, '');
        if (urlSafe.checked) raw = raw.replace(/-/g, '+').replace(/_/g, '/');
        while (raw.length % 4) raw += '=';
        const result = decodeURIComponent(escape(atob(raw)));
        output.value = result;
        const bytes = new TextEncoder().encode(result).length;
        status.textContent = `Decoded · ${raw.length.toLocaleString()} chars → ${bytes.toLocaleString()} bytes`;
      } catch (e) {
        output.value = `Error: ${e.message}`;
        status.textContent = 'Error — invalid Base64 input';
      }
    };

    this._onSwap = () => {
      const tmp = input.value;
      input.value = output.value;
      output.value = tmp;
    };

    this._onClear = () => {
      input.value = ''; output.value = '';
      status.textContent = '—';
      input.focus();
    };

    this._onCopy = () => {
      if (!output.value) { LarryTools.toast('Nothing to copy', 'error'); return; }
      navigator.clipboard.writeText(output.value)
        .then(() => LarryTools.toast('Copied!', 'success'))
        .catch(() => LarryTools.toast('Copy failed', 'error'));
    };

    const enc = container.querySelector('#b64-encode');
    const dec = container.querySelector('#b64-decode');
    const swp = container.querySelector('#b64-swap');
    const clr = container.querySelector('#b64-clear');
    const cpy = container.querySelector('#b64-copy');

    enc.addEventListener('click', this._onEncode);
    dec.addEventListener('click', this._onDecode);
    swp.addEventListener('click', this._onSwap);
    clr.addEventListener('click', this._onClear);
    cpy.addEventListener('click', this._onCopy);

    this._enc = enc; this._dec = dec; this._swp = swp;
    this._clr = clr; this._cpy = cpy;
  },

  destroy() {
    this._enc?.removeEventListener('click', this._onEncode);
    this._dec?.removeEventListener('click', this._onDecode);
    this._swp?.removeEventListener('click', this._onSwap);
    this._clr?.removeEventListener('click', this._onClear);
    this._cpy?.removeEventListener('click', this._onCopy);
    this._enc = this._dec = this._swp = this._clr = this._cpy = null;
    this._onEncode = this._onDecode = this._onSwap = this._onClear = this._onCopy = null;
  },
};

export default Base64CodecTool;
