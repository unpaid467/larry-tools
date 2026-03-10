/**
 * Color Picker — Pick a colour; inspect HEX, RGB, HSL, HSV, CMYK and palette variants.
 * Ported from color_picker.py
 */

const ColorPickerTool = {
  id:          'color-picker',
  name:        'Color Picker',
  description: 'Pick any colour; see HEX, RGB, HSL, HSV, CMYK and palette variants.',
  icon:        '🎨',
  category:    'Design',

  // ── Colour math (ported from Python) ───────────────────────────────────────
  _hexStr(r, g, b) {
    return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0').toUpperCase()).join('');
  },
  _fg(r, g, b) { return (0.299 * r + 0.587 * g + 0.114 * b) > 140 ? '#111' : '#fff'; },
  _hexToRgb(hex) {
    hex = hex.replace(/^#/, '');
    if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
    const n = parseInt(hex, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  },
  _rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        case b: h = ((r - g) / d + 4) / 6; break;
      }
    }
    return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
  },
  _rgbToHsv(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), d = max - Math.min(r, g, b);
    let h = 0;
    if (d !== 0) {
      if (max === r) h = ((g - b) / d % 6) / 6;
      else if (max === g) h = ((b - r) / d + 2) / 6;
      else h = ((r - g) / d + 4) / 6;
    }
    return [Math.round(h * 360), Math.round(max === 0 ? 0 : d / max * 100), Math.round(max * 100)];
  },
  _hsvToRgb(h, s, v) {
    s /= 100; v /= 100;
    const i = Math.floor(h / 60) % 6, f = h / 60 - Math.floor(h / 60);
    const p = v * (1 - s), q = v * (1 - f * s), t = v * (1 - (1 - f) * s);
    return [[v, t, p], [q, v, p], [p, v, t], [p, q, v], [t, p, v], [v, p, q]][i]
      .map(c => Math.round(c * 255));
  },
  _rgbToCmyk(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const k = 1 - Math.max(r, g, b);
    if (k >= 1) return [0, 0, 0, 100];
    const inv = 1 - k;
    return [
      Math.round((1 - r - k) / inv * 100),
      Math.round((1 - g - k) / inv * 100),
      Math.round((1 - b - k) / inv * 100),
      Math.round(k * 100),
    ];
  },
  _triadic(r, g, b) {
    const [h, s, v] = this._rgbToHsv(r, g, b);
    return [this._hsvToRgb((h + 120) % 360, s, v), this._hsvToRgb((h + 240) % 360, s, v)];
  },
  _analogous(r, g, b) {
    const [h, s, v] = this._rgbToHsv(r, g, b);
    return [this._hsvToRgb((h + 30) % 360, s, v), this._hsvToRgb((h + 330) % 360, s, v)];
  },
  _splitComp(r, g, b) {
    const [h, s, v] = this._rgbToHsv(r, g, b);
    return [this._hsvToRgb((h + 150) % 360, s, v), this._hsvToRgb((h + 210) % 360, s, v)];
  },

  render() {
    const hasEyeDropper = typeof EyeDropper !== 'undefined';
    return /* html */`
      <div style="display:grid;grid-template-columns:220px 1fr;gap:20px;align-items:start;">

        <!-- Left: picker + swatch -->
        <div class="card" style="text-align:center;">
          <div id="cp-swatch" style="width:100%;height:150px;border-radius:8px;border:1px solid var(--color-border);margin-bottom:14px;transition:background 0.08s;background:#5A8DEE;"></div>

          <div class="field" style="text-align:left;margin-bottom:10px;">
            <label for="cp-native">Pick colour</label>
            <input type="color" id="cp-native" value="#5a8dee"
              style="width:100%;height:40px;border:1px solid var(--color-border);border-radius:4px;cursor:pointer;background:none;padding:2px;">
          </div>

          <div class="field" style="text-align:left;margin-bottom:10px;">
            <label for="cp-hex">HEX value</label>
            <div style="display:flex;gap:6px;">
              <input type="text" class="input" id="cp-hex" value="#5A8DEE" maxlength="7"
                style="font-family:var(--font-mono);text-transform:uppercase;">
              <button class="btn btn-secondary" id="cp-hex-copy" title="Copy HEX" style="flex-shrink:0;">⎘</button>
            </div>
          </div>

          ${hasEyeDropper ? `<button class="btn btn-secondary" id="cp-eyedrop" style="width:100%;">💧 Eyedropper</button>` : ''}
        </div>

        <!-- Right: colour values + palette -->
        <div style="display:flex;flex-direction:column;gap:14px;">

          <div class="card">
            <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:12px;">
              <div>
                <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--color-text-muted);margin-bottom:5px;">RGB</div>
                <div class="output" id="cp-rgb" style="min-height:0;padding:8px;font-size:12px;"></div>
                <button class="btn btn-ghost" id="cp-copy-rgb" style="font-size:11px;padding:3px 6px;margin-top:4px;">Copy</button>
              </div>
              <div>
                <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--color-text-muted);margin-bottom:5px;">HSL</div>
                <div class="output" id="cp-hsl" style="min-height:0;padding:8px;font-size:12px;"></div>
                <button class="btn btn-ghost" id="cp-copy-hsl" style="font-size:11px;padding:3px 6px;margin-top:4px;">Copy</button>
              </div>
              <div>
                <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--color-text-muted);margin-bottom:5px;">HSV</div>
                <div class="output" id="cp-hsv" style="min-height:0;padding:8px;font-size:12px;"></div>
                <button class="btn btn-ghost" id="cp-copy-hsv" style="font-size:11px;padding:3px 6px;margin-top:4px;">Copy</button>
              </div>
            </div>
            <div>
              <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--color-text-muted);margin-bottom:5px;">CMYK</div>
              <div class="output" id="cp-cmyk" style="min-height:0;padding:8px;font-size:12px;"></div>
            </div>
          </div>

          <div class="card">
            <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--color-text-muted);margin-bottom:10px;">Colour Palette  <span style="font-weight:400;text-transform:none;letter-spacing:0;">— click any swatch to copy its HEX</span></div>
            <div id="cp-palette" style="display:flex;flex-wrap:wrap;gap:8px;"></div>
          </div>

        </div>
      </div>`;
  },

  init(container) {
    const native  = container.querySelector('#cp-native');
    const hexIn   = container.querySelector('#cp-hex');
    const swatch  = container.querySelector('#cp-swatch');
    const rgbOut  = container.querySelector('#cp-rgb');
    const hslOut  = container.querySelector('#cp-hsl');
    const hsvOut  = container.querySelector('#cp-hsv');
    const cmykOut = container.querySelector('#cp-cmyk');
    const palette = container.querySelector('#cp-palette');
    const hexCopy = container.querySelector('#cp-hex-copy');
    const eyedrop = container.querySelector('#cp-eyedrop');
    const cpRgb   = container.querySelector('#cp-copy-rgb');
    const cpHsl   = container.querySelector('#cp-copy-hsl');
    const cpHsv   = container.querySelector('#cp-copy-hsv');

    const update = (r, g, b) => {
      const hex            = this._hexStr(r, g, b);
      const [hl, sl, ll]   = this._rgbToHsl(r, g, b);
      const [hv, sv, vv]   = this._rgbToHsv(r, g, b);
      const [c, m, y, k]   = this._rgbToCmyk(r, g, b);

      swatch.style.background = hex;
      native.value = hex.toLowerCase();
      hexIn.value  = hex;

      rgbOut.textContent  = `rgb(${r}, ${g}, ${b})`;
      hslOut.textContent  = `hsl(${hl}°, ${sl}%, ${ll}%)`;
      hsvOut.textContent  = `hsv(${hv}°, ${sv}%, ${vv}%)`;
      cmykOut.textContent = `cmyk(${c}%, ${m}%, ${y}%, ${k}%)`;

      const swatches = [
        { label: 'Original',      rgb: [r, g, b] },
        { label: 'Complement',    rgb: [255 - r, 255 - g, 255 - b] },
        ...this._triadic(r, g, b).map((c, i) => ({ label: `Triadic ${i + 1}`, rgb: c })),
        ...this._analogous(r, g, b).map((c, i) => ({ label: `Analogous ${i + 1}`, rgb: c })),
        ...this._splitComp(r, g, b).map((c, i) => ({ label: `Split Comp ${i + 1}`, rgb: c })),
        ...[20, 40, 60].map(d => ({ label: `Shade −${d}`, rgb: this._hsvToRgb(hv, sv, Math.max(0, vv - d)) })),
        ...[20, 40].map(d => ({ label: `Tint +${d}`,  rgb: this._hsvToRgb(hv, Math.max(0, sv - d), Math.min(100, vv + d)) })),
      ];

      palette.innerHTML = swatches.map(sw => {
        const [sr, sg, sb] = sw.rgb;
        const shex = this._hexStr(sr, sg, sb);
        return `<div title="${sw.label}: ${shex}"
          onclick="navigator.clipboard.writeText('${shex}').then(()=>LarryTools.toast('${shex} copied!','success'))"
          style="width:50px;cursor:pointer;">
          <div style="height:38px;border-radius:5px;background:${shex};border:1px solid rgba(0,0,0,.1);transition:transform .1s;" onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform=''"></div>
          <div style="font-size:10px;color:var(--color-text-muted);text-align:center;margin-top:3px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${sw.label}</div>
        </div>`;
      }).join('');
    };

    this._onNative = () => {
      const [r, g, b] = this._hexToRgb(native.value);
      update(r, g, b);
    };

    this._onHexInput = () => {
      const val = hexIn.value.trim();
      if (/^#?[0-9a-f]{6}$/i.test(val)) {
        const clean = val.startsWith('#') ? val : '#' + val;
        const [r, g, b] = this._hexToRgb(clean);
        update(r, g, b);
      }
    };

    this._onHexCopy = () => {
      navigator.clipboard.writeText(hexIn.value)
        .then(() => LarryTools.toast(`${hexIn.value} copied!`, 'success'))
        .catch(() => LarryTools.toast('Copy failed', 'error'));
    };

    this._onCpRgb = () => { navigator.clipboard.writeText(rgbOut.textContent).then(() => LarryTools.toast('RGB copied!', 'success')); };
    this._onCpHsl = () => { navigator.clipboard.writeText(hslOut.textContent).then(() => LarryTools.toast('HSL copied!', 'success')); };
    this._onCpHsv = () => { navigator.clipboard.writeText(hsvOut.textContent).then(() => LarryTools.toast('HSV copied!', 'success')); };

    native.addEventListener('input', this._onNative);
    hexIn.addEventListener('input', this._onHexInput);
    hexCopy.addEventListener('click', this._onHexCopy);
    cpRgb.addEventListener('click', this._onCpRgb);
    cpHsl.addEventListener('click', this._onCpHsl);
    cpHsv.addEventListener('click', this._onCpHsv);

    if (eyedrop) {
      this._onEyedrop = async () => {
        try {
          const dropper = new EyeDropper();
          const { sRGBHex } = await dropper.open();
          hexIn.value = sRGBHex.toUpperCase();
          const [r, g, b] = this._hexToRgb(sRGBHex);
          update(r, g, b);
        } catch (e) {
          if (e.name !== 'AbortError') LarryTools.toast('Eyedropper failed', 'error');
        }
      };
      eyedrop.addEventListener('click', this._onEyedrop);
      this._eyedrop = eyedrop;
    }

    update(90, 141, 238); // default #5A8DEE

    this._native = native; this._hexIn = hexIn; this._hexCopy = hexCopy;
    this._cpRgb = cpRgb; this._cpHsl = cpHsl; this._cpHsv = cpHsv;
  },

  destroy() {
    this._native?.removeEventListener('input', this._onNative);
    this._hexIn?.removeEventListener('input', this._onHexInput);
    this._hexCopy?.removeEventListener('click', this._onHexCopy);
    this._cpRgb?.removeEventListener('click', this._onCpRgb);
    this._cpHsl?.removeEventListener('click', this._onCpHsl);
    this._cpHsv?.removeEventListener('click', this._onCpHsv);
    this._eyedrop?.removeEventListener('click', this._onEyedrop);
    this._native = this._hexIn = this._hexCopy = this._cpRgb =
      this._cpHsl = this._cpHsv = this._eyedrop = null;
  },
};

export default ColorPickerTool;
