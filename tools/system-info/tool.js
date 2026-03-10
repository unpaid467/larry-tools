/**
 * System Info — Display browser, platform, screen, and network information.
 * Ported from system_info.py (adapted for browser environment).
 */

const SystemInfoTool = {
  id:          'system-info',
  name:        'System Info',
  description: 'View browser, platform, screen, hardware and network information available in this environment.',
  icon:        '💻',
  category:    'System',

  render() {
    return /* html */`
      <div style="display:flex;flex-direction:column;gap:12px;">
        <div style="display:flex;justify-content:flex-end;gap:8px;">
          <button class="btn btn-ghost"      id="si-refresh">↻ Refresh</button>
          <button class="btn btn-secondary"  id="si-copy-all">Copy all as text</button>
        </div>
        <div id="si-sections" style="display:grid;grid-template-columns:1fr 1fr;gap:12px;"></div>
      </div>`;
  },

  init(container) {
    const sections = container.querySelector('#si-sections');

    const gather = () => {
      const nav = navigator;
      const scr = screen;
      const conn = nav.connection || nav.mozConnection || nav.webkitConnection || null;
      const now  = new Date();

      return [
        {
          title: '🌐 Browser',
          rows: [
            ['User Agent',        nav.userAgent],
            ['Browser language',  nav.language],
            ['Languages',         (nav.languages || []).join(', ') || '—'],
            ['Cookies enabled',   nav.cookieEnabled ? 'Yes' : 'No'],
            ['Online',            nav.onLine ? 'Yes' : 'No'],
            ['Do Not Track',      nav.doNotTrack ?? '—'],
            ['JavaScript engine', `${nav.userAgent.includes('Chrome') ? 'V8' : nav.userAgent.includes('Firefox') ? 'SpiderMonkey' : nav.userAgent.includes('Safari') ? 'JavaScriptCore' : 'Unknown'}`],
          ],
        },
        {
          title: '🖥️ Platform',
          rows: [
            ['Platform',          nav.platform || '—'],
            ['OS (heuristic)',     this._detectOS(nav.userAgent)],
            ['Local time',        now.toLocaleString()],
            ['UTC offset',        `UTC${now.getTimezoneOffset() <= 0 ? '+' : ''}${-now.getTimezoneOffset() / 60}h`],
            ['Time zone',         Intl.DateTimeFormat().resolvedOptions().timeZone || '—'],
          ],
        },
        {
          title: '🖱️ Screen',
          rows: [
            ['Screen resolution', `${scr.width} × ${scr.height} px`],
            ['Available area',    `${scr.availWidth} × ${scr.availHeight} px`],
            ['Colour depth',      `${scr.colorDepth}-bit`],
            ['Pixel depth',       `${scr.pixelDepth}-bit`],
            ['Device pixel ratio',`${window.devicePixelRatio}×`],
            ['Viewport size',     `${window.innerWidth} × ${window.innerHeight} px`],
            ['Orientation',       screen.orientation?.type ?? '—'],
          ],
        },
        {
          title: '⚙️ Hardware',
          rows: [
            ['CPU threads (logical)', nav.hardwareConcurrency != null ? `${nav.hardwareConcurrency} cores` : '—'],
            ['Device memory',     nav.deviceMemory != null ? `~${nav.deviceMemory} GB (approximate)` : '— (not exposed)'],
            ['Touch points',      nav.maxTouchPoints != null ? `${nav.maxTouchPoints}` : '—'],
            ['Vendor',            nav.vendor || '—'],
          ],
        },
        {
          title: '📶 Network',
          rows: conn ? [
            ['Effective type',    conn.effectiveType || '—'],
            ['Downlink speed',    conn.downlink != null ? `~${conn.downlink} Mbps` : '—'],
            ['Round-trip time',   conn.rtt != null ? `~${conn.rtt} ms` : '—'],
            ['Save-Data mode',    conn.saveData ? 'On' : 'Off'],
          ] : [
            ['Connection API',    'Not available in this browser'],
          ],
        },
        {
          title: '🔒 Permissions & APIs',
          rows: [
            ['Clipboard API',     typeof navigator.clipboard !== 'undefined' ? '✔ Available' : '✘ Not available'],
            ['Geolocation API',   'geolocation' in nav ? '✔ Available' : '✘ Not available'],
            ['Notifications API', 'Notification' in window ? '✔ Available' : '✘ Not available'],
            ['EyeDropper API',    typeof EyeDropper !== 'undefined' ? '✔ Available' : '✘ Not available'],
            ['Web Crypto API',    typeof crypto?.subtle !== 'undefined' ? '✔ Available' : '✘ Not available'],
            ['File System Access', typeof window.showDirectoryPicker === 'function' ? '✔ Available' : '✘ Not available'],
            ['WebGL',             (() => { try { return !!document.createElement('canvas').getContext('webgl') ? '✔ Available' : '✘ Not available'; } catch { return '✘ Error'; } })()],
          ],
        },
        {
          title: '📍 Page',
          rows: [
            ['URL',               location.href],
            ['Protocol',          location.protocol],
            ['Host',              location.host || 'localhost (file)'],
            ['Referrer',          document.referrer || '— (direct / no referrer)'],
          ],
        },
      ];
    };

    const render = () => {
      const data = gather();
      let allText = '';

      sections.innerHTML = data.map(section => {
        const rowsHtml = section.rows.map(([k, v]) => {
          allText += `${k}: ${v}\n`;
          return `<tr>
            <td style="padding:5px 10px 5px 0;font-size:12px;font-weight:600;color:var(--color-text-muted);white-space:nowrap;vertical-align:top;">${k}</td>
            <td style="padding:5px 0;font-size:12px;font-family:var(--font-mono);word-break:break-all;">${v}</td>
          </tr>`;
        }).join('');
        allText += '\n';

        return `<div class="card" style="overflow:hidden;">
          <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:var(--color-text-muted);margin-bottom:8px;">${section.title}</div>
          <table style="width:100%;border-collapse:collapse;">${rowsHtml}</table>
        </div>`;
      }).join('');

      this._allText = allText;
    };

    render();

    this._onRefresh  = render;
    this._onCopyAll  = () => {
      navigator.clipboard.writeText(this._allText || '')
        .then(() => LarryTools.toast('Copied!', 'success'))
        .catch(() => LarryTools.toast('Copy failed', 'error'));
    };

    container.querySelector('#si-refresh').addEventListener('click', this._onRefresh);
    container.querySelector('#si-copy-all').addEventListener('click', this._onCopyAll);

    this._refreshBtn = container.querySelector('#si-refresh');
    this._copyAllBtn = container.querySelector('#si-copy-all');
  },

  _detectOS(ua) {
    if (/Windows NT 10/.test(ua)) return 'Windows 10 / 11';
    if (/Windows NT 6\.3/.test(ua)) return 'Windows 8.1';
    if (/Windows NT 6\.1/.test(ua)) return 'Windows 7';
    if (/Mac OS X/.test(ua))  return 'macOS';
    if (/Android/.test(ua))   return 'Android';
    if (/iPhone|iPad/.test(ua))return 'iOS';
    if (/Linux/.test(ua))     return 'Linux';
    return 'Unknown';
  },

  destroy() {
    this._refreshBtn?.removeEventListener('click', this._onRefresh);
    this._copyAllBtn?.removeEventListener('click', this._onCopyAll);
    this._refreshBtn = this._copyAllBtn = null;
    this._onRefresh = this._onCopyAll = null;
  },
};

export default SystemInfoTool;
