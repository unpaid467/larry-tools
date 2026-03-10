/**
 * Unit Converter — Convert between units across many categories.
 * Ported from unit_converter.py
 * All factors are expressed relative to the SI base unit for that category.
 * Temperature uses special non-linear handling.
 */

const CATEGORIES = {
  Length: {
    base: 'm',
    units: {
      'Picometer (pm)':               1e-12,
      'Nanometer (nm)':               1e-9,
      'Micrometer (μm)':              1e-6,
      'Millimeter (mm)':              1e-3,
      'Centimeter (cm)':              1e-2,
      'Meter (m)':                    1.0,
      'Kilometer (km)':               1e3,
      'Inch (in)':                    0.0254,
      'Foot (ft)':                    0.3048,
      'Yard (yd)':                    0.9144,
      'Mile (mi)':                    1609.344,
      'Nautical Mile (nmi)':          1852.0,
      'Astronomical Unit (AU)':       1.495978707e11,
      'Light Year (ly)':              9.4607304725808e15,
      '~ Width of a Hair':            8e-5,
      '~ Banana (~20 cm)':            0.20,
      '~ Door Height (~2 m)':         2.0,
      '~ Football Pitch (~105 m)':    105.0,
      '~ Eiffel Tower (~330 m)':      330.0,
      '~ Marathon (42.195 km)':       42195.0,
    },
  },
  'Weight / Mass': {
    base: 'kg',
    units: {
      'Milligram (mg)':               1e-6,
      'Gram (g)':                     1e-3,
      'Kilogram (kg)':                1.0,
      'Metric Ton (t)':               1e3,
      'Ounce (oz)':                   0.028349523125,
      'Pound (lb)':                   0.45359237,
      'Stone (st)':                   6.35029318,
      'Short Ton (US ton)':           907.18474,
      'Long Ton (UK ton)':            1016.0469088,
      '~ Postage Stamp (~100 mg)':    1e-4,
      '~ Smartphone (~185 g)':        0.185,
      '~ Bag of Sugar (1 kg)':        1.0,
      '~ Car (average, ~1400 kg)':    1400.0,
    },
  },
  Volume: {
    base: 'L',
    units: {
      'Milliliter (ml)':              1e-3,
      'Centiliter (cl)':              1e-2,
      'Deciliter (dl)':               0.1,
      'Liter (l)':                    1.0,
      'Cubic Meter (m³)':             1000.0,
      'Fluid Ounce US (fl oz)':       0.0295735295625,
      'Cup US':                       0.2365882365,
      'Pint US (pt)':                 0.473176473,
      'Quart US (qt)':                0.946352946,
      'Gallon US (gal)':              3.785411784,
      'Gallon UK (gal)':              4.54609,
      'Teaspoon US (tsp)':            0.00492892159375,
      'Tablespoon US (tbsp)':         0.01478676478125,
      '~ Coffee Cup (~237 ml)':       0.237,
      '~ Wine Bottle (750 ml)':       0.75,
      '~ Bathtub (~300 L)':           300.0,
      '~ Olympic Swimming Pool':      2500000.0,
    },
  },
  Area: {
    base: 'm²',
    units: {
      'Square Centimeter (cm²)':      1e-4,
      'Square Meter (m²)':            1.0,
      'Square Kilometer (km²)':       1e6,
      'Square Inch (in²)':            6.4516e-4,
      'Square Foot (ft²)':            0.09290304,
      'Square Yard (yd²)':            0.83612736,
      'Acre (ac)':                    4046.8564224,
      'Hectare (ha)':                 10000.0,
      'Square Mile (mi²)':            2589988.110336,
      '~ A4 Sheet of Paper':          0.0623,
      '~ Tennis Court (~261 m²)':     260.87,
      '~ Football Pitch (~7140 m²)':  7140.0,
    },
  },
  Temperature: {
    special: true,
    units: ['Celsius (°C)', 'Fahrenheit (°F)', 'Kelvin (K)', 'Rankine (°R)', 'Delisle (°De)', 'Newton (°N)', 'Réaumur (°Ré)', 'Rømer (°Rø)'],
  },
  Speed: {
    base: 'm/s',
    units: {
      'Meter/second (m/s)':           1.0,
      'Kilometer/hour (km/h)':        1 / 3.6,
      'Mile/hour (mph)':              0.44704,
      'Foot/second (ft/s)':           0.3048,
      'Knot (kn)':                    0.514444444,
      'Mach (sea level)':             340.29,
      'Speed of Light (c)':           299792458.0,
      '~ Human Walking (~5 km/h)':    1.39,
      '~ Cycling (~16 km/h)':         4.44,
      '~ Cheetah (~108 km/h)':        30.0,
    },
  },
  'Data Storage': {
    base: 'byte',
    units: {
      'Bit (b)':                      0.125,
      'Byte (B)':                     1,
      'Kilobyte (KB)':                1024,
      'Megabyte (MB)':                1024 ** 2,
      'Gigabyte (GB)':                1024 ** 3,
      'Terabyte (TB)':                1024 ** 4,
      'Petabyte (PB)':                1024 ** 5,
      'Kibibyte (KiB)':               1024,
      'Mebibyte (MiB)':               1024 ** 2,
      'Gibibyte (GiB)':               1024 ** 3,
    },
  },
  Time: {
    base: 's',
    units: {
      'Nanosecond (ns)':              1e-9,
      'Microsecond (μs)':             1e-6,
      'Millisecond (ms)':             1e-3,
      'Second (s)':                   1,
      'Minute (min)':                 60,
      'Hour (h)':                     3600,
      'Day (d)':                      86400,
      'Week (wk)':                    604800,
      'Month (avg)':                  2629800,
      'Year (365d)':                  31536000,
      'Decade':                       315360000,
      'Century':                      3153600000,
    },
  },
};

function convertTemp(val, fromLabel, toLabel) {
  const key = label => label.split('(')[1]?.replace(')', '').replace('°', '') ?? label;
  const from = key(fromLabel), to = key(toLabel);
  let c;
  switch (from) {
    case 'C':  c = val; break;
    case 'F':  c = (val - 32) * 5 / 9; break;
    case 'K':  c = val - 273.15; break;
    case 'R':  c = (val - 491.67) * 5 / 9; break;
    case 'De': c = 100 - val * 2 / 3; break;
    case 'N':  c = val * 100 / 33; break;
    case 'Ré': c = val * 5 / 4; break;
    case 'Rø': c = (val - 7.5) * 40 / 21; break;
    default:   c = val;
  }
  switch (to) {
    case 'C':  return c;
    case 'F':  return c * 9 / 5 + 32;
    case 'K':  return c + 273.15;
    case 'R':  return (c + 273.15) * 9 / 5;
    case 'De': return (100 - c) * 3 / 2;
    case 'N':  return c * 33 / 100;
    case 'Ré': return c * 4 / 5;
    case 'Rø': return c * 21 / 40 + 7.5;
    default:   return c;
  }
}

const UnitConverterTool = {
  id:          'unit-converter',
  name:        'Unit Converter',
  description: 'Convert length, weight, volume, area, temperature, speed, data and time.',
  icon:        '⚖️',
  category:    'Converters',

  render() {
    const catOpts = Object.keys(CATEGORIES).map(c => `<option value="${c}">${c}</option>`).join('');
    return /* html */`
      <div class="card" style="max-width:600px;">
        <div class="field">
          <label for="uc-cat">Category</label>
          <select class="select" id="uc-cat">${catOpts}</select>
        </div>

        <div style="display:grid;grid-template-columns:1fr auto 1fr;gap:10px;align-items:end;margin-bottom:16px;">
          <div class="field" style="margin:0;">
            <label for="uc-from">From</label>
            <select class="select" id="uc-from"></select>
          </div>
          <button class="btn btn-secondary" id="uc-swap" style="margin-bottom:1px;" title="Swap units">⇄</button>
          <div class="field" style="margin:0;">
            <label for="uc-to">To</label>
            <select class="select" id="uc-to"></select>
          </div>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
          <div class="field" style="margin:0;">
            <label for="uc-input">Value</label>
            <input type="number" class="input" id="uc-input" value="1" step="any"
              style="font-family:var(--font-mono);">
          </div>
          <div class="field" style="margin:0;">
            <label>Result</label>
            <input type="text" class="input" id="uc-result" readonly
              style="font-family:var(--font-mono);background:#f9f9fb;">
          </div>
        </div>

        <div class="stat-row" style="margin-top:14px;">
          <div class="stat-chip" id="uc-formula" style="flex:1;word-break:break-all;">Select units above</div>
          <button class="btn btn-ghost" id="uc-copy-result" style="font-size:11px;padding:4px 8px;">Copy</button>
        </div>
      </div>`;
  },

  init(container) {
    const catSel   = container.querySelector('#uc-cat');
    const fromSel  = container.querySelector('#uc-from');
    const toSel    = container.querySelector('#uc-to');
    const valIn    = container.querySelector('#uc-input');
    const result   = container.querySelector('#uc-result');
    const formula  = container.querySelector('#uc-formula');
    const swapBtn  = container.querySelector('#uc-swap');
    const copyBtn  = container.querySelector('#uc-copy-result');

    const populateUnits = () => {
      const cat = CATEGORIES[catSel.value];
      const units = cat.special ? cat.units : Object.keys(cat.units);
      const opts = units.map(u => `<option value="${u}">${u}</option>`).join('');
      fromSel.innerHTML = opts;
      toSel.innerHTML   = opts;
      if (units.length > 1) toSel.value = units[1];
      compute();
    };

    const compute = () => {
      const cat  = CATEGORIES[catSel.value];
      const from = fromSel.value;
      const to   = toSel.value;
      const val  = parseFloat(valIn.value);
      if (isNaN(val)) { result.value = ''; formula.textContent = 'Enter a numeric value'; return; }

      let res;
      if (cat.special) {
        res = convertTemp(val, from, to);
      } else {
        const fFactor = cat.units[from];
        const tFactor = cat.units[to];
        res = val * fFactor / tFactor;
      }

      const fmt = n => {
        if (isNaN(n) || !isFinite(n)) return 'Error';
        if (Math.abs(n) >= 1e15 || (Math.abs(n) > 0 && Math.abs(n) < 1e-6)) return n.toExponential(6);
        const str = parseFloat(n.toPrecision(10)).toString();
        return str;
      };

      result.value = fmt(res);
      formula.textContent = `${val} ${from} = ${fmt(res)} ${to}`;
    };

    this._onCat   = populateUnits;
    this._onUnit  = compute;
    this._onInput = compute;
    this._onSwap  = () => {
      const tmp = fromSel.value;
      fromSel.value = toSel.value;
      toSel.value = tmp;
      compute();
    };
    this._onCopy = () => {
      if (!result.value) { LarryTools.toast('Nothing to copy', 'error'); return; }
      navigator.clipboard.writeText(result.value)
        .then(() => LarryTools.toast('Copied!', 'success'))
        .catch(() => LarryTools.toast('Copy failed', 'error'));
    };

    catSel.addEventListener('change', this._onCat);
    fromSel.addEventListener('change', this._onUnit);
    toSel.addEventListener('change', this._onUnit);
    valIn.addEventListener('input', this._onInput);
    swapBtn.addEventListener('click', this._onSwap);
    copyBtn.addEventListener('click', this._onCopy);

    populateUnits();

    this._catSel = catSel; this._fromSel = fromSel; this._toSel = toSel;
    this._valIn  = valIn;  this._swapBtn = swapBtn; this._copyBtn = copyBtn;
  },

  destroy() {
    this._catSel?.removeEventListener('change', this._onCat);
    this._fromSel?.removeEventListener('change', this._onUnit);
    this._toSel?.removeEventListener('change', this._onUnit);
    this._valIn?.removeEventListener('input', this._onInput);
    this._swapBtn?.removeEventListener('click', this._onSwap);
    this._copyBtn?.removeEventListener('click', this._onCopy);
    this._catSel = this._fromSel = this._toSel = this._valIn =
      this._swapBtn = this._copyBtn = null;
  },
};

export default UnitConverterTool;
