/**
 * Text Hasher — Generate MD5, SHA-1, SHA-256, SHA-512 hashes.
 * Ported from text_hash.py
 * Uses Web Crypto API for SHA variants; pure-JS MD5 inline.
 */

// ── Minimal pure-JS MD5 (public domain algorithm, Wikipedia pseudocode) ──────
function _md5hex(str) {
  const bytes = [];
  for (let i = 0; i < str.length; i++) {
    const c = str.charCodeAt(i);
    if (c < 0x80)       { bytes.push(c); }
    else if (c < 0x800) { bytes.push(0xc0 | (c >> 6), 0x80 | (c & 0x3f)); }
    else                { bytes.push(0xe0 | (c >> 12), 0x80 | ((c >> 6) & 0x3f), 0x80 | (c & 0x3f)); }
  }
  const bitLen = bytes.length * 8;
  bytes.push(0x80);
  while ((bytes.length % 64) !== 56) bytes.push(0);
  for (let i = 0; i < 8; i++) bytes.push(i < 4 ? (bitLen >>> (i * 8)) & 0xff : 0);

  let [a, b, c, d] = [0x67452301, 0xefcdab89, 0x98badcfe, 0x10325476];

  const S = [7,12,17,22,7,12,17,22,7,12,17,22,7,12,17,22,
             5, 9,14,20,5, 9,14,20,5, 9,14,20,5, 9,14,20,
             4,11,16,23,4,11,16,23,4,11,16,23,4,11,16,23,
             6,10,15,21,6,10,15,21,6,10,15,21,6,10,15,21];
  const K = [
    0xd76aa478,0xe8c7b756,0x242070db,0xc1bdceee,0xf57c0faf,0x4787c62a,0xa8304613,0xfd469501,
    0x698098d8,0x8b44f7af,0xffff5bb1,0x895cd7be,0x6b901122,0xfd987193,0xa679438e,0x49b40821,
    0xf61e2562,0xc040b340,0x265e5a51,0xe9b6c7aa,0xd62f105d,0x02441453,0xd8a1e681,0xe7d3fbc8,
    0x21e1cde6,0xc33707d6,0xf4d50d87,0x455a14ed,0xa9e3e905,0xfcefa3f8,0x676f02d9,0x8d2a4c8a,
    0xfffa3942,0x8771f681,0x6d9d6122,0xfde5380c,0xa4beea44,0x4bdecfa9,0xf6bb4b60,0xbebfbc70,
    0x289b7ec6,0xeaa127fa,0xd4ef3085,0x04881d05,0xd9d4d039,0xe6db99e5,0x1fa27cf8,0xc4ac5665,
    0xf4292244,0x432aff97,0xab9423a7,0xfc93a039,0x655b59c3,0x8f0ccc92,0xffeff47d,0x85845dd1,
    0x6fa87e4f,0xfe2ce6e0,0xa3014314,0x4e0811a1,0xf7537e82,0xbd3af235,0x2ad7d2bb,0xeb86d391,
  ];

  const rol = (x, n) => (x << n) | (x >>> (32 - n));
  const add = (x, y) => (x + y) | 0;

  for (let off = 0; off < bytes.length; off += 64) {
    const M = new Int32Array(16);
    for (let j = 0; j < 16; j++)
      M[j] = bytes[off+j*4] | (bytes[off+j*4+1]<<8) | (bytes[off+j*4+2]<<16) | (bytes[off+j*4+3]<<24);

    let [A, B, C, D] = [a, b, c, d];
    for (let i = 0; i < 64; i++) {
      let F, g;
      if      (i < 16) { F = (B & C) | (~B & D); g = i; }
      else if (i < 32) { F = (D & B) | (~D & C); g = (5*i+1) % 16; }
      else if (i < 48) { F =  B ^ C ^ D;          g = (3*i+5) % 16; }
      else             { F =  C ^ (B | ~D);        g = (7*i) % 16; }
      F = add(add(add(F, A), M[g]|0), K[i]|0);
      A = D; D = C; C = B; B = add(B, rol(F, S[i]));
    }
    a = add(a, A); b = add(b, B); c = add(c, C); d = add(d, D);
  }

  const le = n => [n, n>>>8, n>>>16, n>>>24].map(b => (b&0xff).toString(16).padStart(2,'0')).join('');
  return le(a) + le(b) + le(c) + le(d);
}

// ── Web Crypto helper ────────────────────────────────────────────────────────
async function _subtleHex(text, alg) {
  const buf = await crypto.subtle.digest(alg, new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join('');
}

// ── Tool ────────────────────────────────────────────────────────────────────
const TextHasherTool = {
  id:          'text-hasher',
  name:        'Text Hasher',
  description: 'Generate MD5, SHA-1, SHA-256 or SHA-512 hash of any text. Live results.',
  icon:        '#️⃣',
  category:    'Security',

  render() {
    return /* html */`
      <div class="card" style="max-width:700px;">
        <div class="field">
          <label for="th-input">Input text</label>
          <textarea class="textarea" id="th-input" rows="7"
            placeholder="Type or paste text here — hashes update live…"></textarea>
        </div>

        <div style="display:flex;align-items:center;gap:16px;flex-wrap:wrap;margin-bottom:14px;">
          <div style="display:flex;align-items:center;gap:8px;">
            <label for="th-algo" style="font-size:12px;font-weight:700;color:var(--color-text-muted);text-transform:uppercase;letter-spacing:.05em;">Algorithm</label>
            <select class="select" id="th-algo" style="width:auto;">
              <option value="md5">MD5</option>
              <option value="SHA-1">SHA-1</option>
              <option value="SHA-256" selected>SHA-256</option>
              <option value="SHA-512">SHA-512</option>
            </select>
          </div>
          <label style="display:flex;align-items:center;gap:6px;font-size:13px;cursor:pointer;color:var(--color-text-muted);">
            <input type="checkbox" id="th-upper"> Uppercase output
          </label>
        </div>

        <div class="field" style="margin-bottom:0;">
          <label>Hash output</label>
          <div style="display:flex;gap:8px;">
            <input type="text" class="input" id="th-output" readonly
              placeholder="(enter text above)"
              style="font-family:var(--font-mono);font-size:13px;background:#f9f9fb;">
            <button class="btn btn-secondary" id="th-copy" style="flex-shrink:0;">Copy</button>
          </div>
        </div>

        <div class="divider"></div>

        <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:var(--color-text-muted);margin-bottom:8px;">All hashes at once</div>
        <div id="th-all" style="display:grid;gap:8px;"></div>
      </div>`;
  },

  init(container) {
    const input  = container.querySelector('#th-input');
    const algo   = container.querySelector('#th-algo');
    const upper  = container.querySelector('#th-upper');
    const output = container.querySelector('#th-output');
    const copyB  = container.querySelector('#th-copy');
    const allDiv = container.querySelector('#th-all');

    const ALL_ALGOS = [
      { key: 'md5',    label: 'MD5' },
      { key: 'SHA-1',  label: 'SHA-1' },
      { key: 'SHA-256',label: 'SHA-256' },
      { key: 'SHA-512',label: 'SHA-512' },
    ];

    allDiv.innerHTML = ALL_ALGOS.map(a =>
      `<div style="display:flex;align-items:center;gap:8px;font-size:12px;">
        <span style="width:56px;flex-shrink:0;font-weight:700;color:var(--color-text-muted);">${a.label}</span>
        <span class="output" id="th-hash-${a.key}" style="min-height:0;padding:6px 10px;flex:1;font-size:12px;overflow-x:auto;white-space:nowrap;">—</span>
        <button class="btn btn-ghost" onclick="navigator.clipboard.writeText(document.getElementById('th-hash-${a.key}').textContent).then(()=>LarryTools.toast('Copied!','success'))" style="font-size:11px;padding:4px 8px;flex-shrink:0;">Copy</button>
      </div>`
    ).join('');

    const computeHash = async (text, key) => {
      if (!text) return '—';
      try {
        const raw = key === 'md5' ? _md5hex(text) : await _subtleHex(text, key);
        return upper.checked ? raw.toUpperCase() : raw;
      } catch {
        return 'Error';
      }
    };

    let debounce = null;
    this._onInput = () => {
      clearTimeout(debounce);
      debounce = setTimeout(async () => {
        const text = input.value;
        const key  = algo.value;

        const main = await computeHash(text, key);
        output.value = text ? main : '';
        if (!text) output.placeholder = '(enter text above)';

        for (const a of ALL_ALGOS) {
          const el = container.querySelector(`#th-hash-${a.key}`);
          el.textContent = await computeHash(text, a.key);
        }
      }, 120);
    };

    this._onAlgoChange = this._onInput;
    this._onUpperChange = this._onInput;

    this._onCopy = () => {
      if (!output.value) { LarryTools.toast('Nothing to copy', 'error'); return; }
      navigator.clipboard.writeText(output.value)
        .then(() => LarryTools.toast('Copied!', 'success'))
        .catch(() => LarryTools.toast('Copy failed', 'error'));
    };

    input.addEventListener('input', this._onInput);
    algo.addEventListener('change', this._onAlgoChange);
    upper.addEventListener('change', this._onUpperChange);
    copyB.addEventListener('click', this._onCopy);

    this._input = input; this._algo = algo; this._upper = upper; this._copyB = copyB;
  },

  destroy() {
    this._input?.removeEventListener('input', this._onInput);
    this._algo?.removeEventListener('change', this._onAlgoChange);
    this._upper?.removeEventListener('change', this._onUpperChange);
    this._copyB?.removeEventListener('click', this._onCopy);
    this._input = this._algo = this._upper = this._copyB = null;
    this._onInput = this._onAlgoChange = this._onUpperChange = this._onCopy = null;
  },
};

export default TextHasherTool;
