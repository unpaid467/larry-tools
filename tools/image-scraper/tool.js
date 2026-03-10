/**
 * Image Scraper — Extract all image URLs from pasted HTML source.
 * Ported from image_scraper.py.
 *
 * Browser CORS rules prevent fetching arbitrary third-party pages directly.
 * To work around this, paste the raw HTML source of the page (Ctrl+U → Ctrl+A → Ctrl+C)
 * and the tool will extract every image reference.
 */

const ImageScraperTool = {
  id:          'image-scraper',
  name:        'Image Scraper',
  description: 'Paste the HTML source of any page to extract all image URLs (src, srcset, data-src, background-image, linked images).',
  icon:        '🕷️',
  category:    'Network',

  render() {
    return /* html */`
      <div style="display:flex;flex-direction:column;gap:12px;">

        <!-- Info banner -->
        <div class="card" style="background:hsl(45 80% 96%);border:1px solid hsl(45 70% 85%);">
          <strong style="font-size:13px;">ℹ How to use</strong>
          <ol style="font-size:13px;margin:6px 0 0 18px;line-height:1.8;color:var(--color-text-muted);">
            <li>Open the target page in your browser</li>
            <li>View source: <kbd style="background:#fff;border:1px solid #ccc;border-radius:3px;padding:1px 5px;font-size:12px;">Ctrl+U</kbd> (or right-click → View Page Source)</li>
            <li>Select all (<kbd style="background:#fff;border:1px solid #ccc;border-radius:3px;padding:1px 5px;font-size:12px;">Ctrl+A</kbd>) and copy (<kbd style="background:#fff;border:1px solid #ccc;border-radius:3px;padding:1px 5px;font-size:12px;">Ctrl+C</kbd>)</li>
            <li>Paste into the box below and click <strong>Extract Images</strong></li>
          </ol>
        </div>

        <div class="card">
          <div style="display:flex;gap:8px;margin-bottom:10px;flex-wrap:wrap;align-items:flex-end;">
            <div class="field" style="margin:0;flex:1;min-width:200px;">
              <label for="is-base">Optional base URL  <span style="font-weight:400;font-size:11px;color:var(--color-text-muted);">— resolves relative paths like /img/photo.jpg</span></label>
              <input type="text" class="input" id="is-base" placeholder="https://example.com"
                style="font-family:var(--font-mono);">
            </div>
          </div>
          <div class="field" style="margin-bottom:10px;">
            <label for="is-html">Pasted HTML source</label>
            <textarea class="textarea" id="is-html" rows="10"
              placeholder="Paste the entire HTML source of the page here…"></textarea>
          </div>
          <div class="btn-row">
            <button class="btn btn-primary"   id="is-extract">Extract Images</button>
            <button class="btn btn-ghost"     id="is-clear">Clear</button>
          </div>
        </div>

        <!-- Filters -->
        <div class="card" id="is-filter-row" style="display:none;">
          <div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap;">
            <span style="font-size:12px;font-weight:600;color:var(--color-text-muted);">Filter:</span>
            <label style="display:flex;gap:5px;font-size:12px;cursor:pointer;"><input type="checkbox" id="is-f-jpg" checked> JPG/JPEG</label>
            <label style="display:flex;gap:5px;font-size:12px;cursor:pointer;"><input type="checkbox" id="is-f-png" checked> PNG</label>
            <label style="display:flex;gap:5px;font-size:12px;cursor:pointer;"><input type="checkbox" id="is-f-gif" checked> GIF</label>
            <label style="display:flex;gap:5px;font-size:12px;cursor:pointer;"><input type="checkbox" id="is-f-webp" checked> WebP</label>
            <label style="display:flex;gap:5px;font-size:12px;cursor:pointer;"><input type="checkbox" id="is-f-svg" checked> SVG</label>
            <label style="display:flex;gap:5px;font-size:12px;cursor:pointer;"><input type="checkbox" id="is-f-other" checked> Other</label>
            <label style="display:flex;gap:5px;font-size:12px;cursor:pointer;margin-left:auto;"><input type="checkbox" id="is-dedup" checked> De-duplicate</label>
          </div>
        </div>

        <!-- Results -->
        <div id="is-results" style="display:none;flex-direction:column;gap:10px;">
          <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">
            <div id="is-summary" class="stat-chip"></div>
            <div style="display:flex;gap:8px;">
              <button class="btn btn-secondary" id="is-copy-all">Copy all URLs</button>
              <button class="btn btn-ghost"     id="is-dl-txt">⬇ URLs.txt</button>
            </div>
          </div>
          <div class="card" style="overflow:auto;max-height:400px;">
            <div id="is-list" style="display:flex;flex-direction:column;gap:6px;"></div>
          </div>
        </div>

        <div id="is-empty" class="empty-state" style="display:none;">
          No image URLs found in the pasted HTML.
        </div>

      </div>`;
  },

  init(container) {
    const htmlEl    = container.querySelector('#is-html');
    const baseEl    = container.querySelector('#is-base');
    const extractBtn= container.querySelector('#is-extract');
    const clearBtn  = container.querySelector('#is-clear');
    const filterRow = container.querySelector('#is-filter-row');
    const results   = container.querySelector('#is-results');
    const emptyEl   = container.querySelector('#is-empty');
    const summaryEl = container.querySelector('#is-summary');
    const listEl    = container.querySelector('#is-list');
    const copyAll   = container.querySelector('#is-copy-all');
    const dlTxt     = container.querySelector('#is-dl-txt');

    const fJpg  = container.querySelector('#is-f-jpg');
    const fPng  = container.querySelector('#is-f-png');
    const fGif  = container.querySelector('#is-f-gif');
    const fWebp = container.querySelector('#is-f-webp');
    const fSvg  = container.querySelector('#is-f-svg');
    const fOther= container.querySelector('#is-f-other');
    const dedup = container.querySelector('#is-dedup');

    let allUrls = [];

    const extractUrls = (html, base) => {
      const urls = new Set();
      const add = u => {
        if (!u || u.startsWith('data:')) return;
        try {
          const resolved = base ? new URL(u, base).href : u;
          if (/^https?:\/\/|^\/\//i.test(resolved) || resolved.startsWith('/') || resolved.startsWith('./') || !base) {
            urls.add(base ? new URL(u, base).href : u);
          }
        } catch { urls.add(u); }
      };

      // img src
      for (const m of html.matchAll(/\bsrc\s*=\s*["']([^"']+)["']/gi)) add(m[1]);
      // srcset — multiple URLs per srcset
      for (const m of html.matchAll(/\bsrcset\s*=\s*["']([^"']+)["']/gi)) {
        for (const part of m[1].split(',')) {
          const url = part.trim().split(/\s+/)[0];
          add(url);
        }
      }
      // data-src, data-lazy, data-original (lazy-load patterns)
      for (const m of html.matchAll(/\bdata-(?:src|lazy|original|img|bg|url)\s*=\s*["']([^"']+)["']/gi)) add(m[1]);
      // background-image and background: url(...)
      for (const m of html.matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/gi)) add(m[1]);
      // <a href> pointing to image files
      for (const m of html.matchAll(/\bhref\s*=\s*["']([^"']+\.(?:jpe?g|png|gif|webp|bmp|svg|tiff?|ico|avif)(?:\?[^"']*)?)["']/gi)) add(m[1]);
      // content (og:image)
      for (const m of html.matchAll(/\bcontent\s*=\s*["'](https?:\/\/[^"']+\.(?:jpe?g|png|gif|webp|bmp|svg|tiff?|ico|avif)(?:\?[^"']*)?)["']/gi)) add(m[1]);

      return [...urls];
    };

    const classifyExt = url => {
      const clean = url.split('?')[0].split('#')[0].toLowerCase();
      if (/\.(jpe?g)$/.test(clean)) return 'jpg';
      if (/\.png$/.test(clean))   return 'png';
      if (/\.gif$/.test(clean))   return 'gif';
      if (/\.webp$/.test(clean))  return 'webp';
      if (/\.svg$/.test(clean))   return 'svg';
      return 'other';
    };

    const renderList = () => {
      const active = new Set();
      if (fJpg.checked)  active.add('jpg');
      if (fPng.checked)  active.add('png');
      if (fGif.checked)  active.add('gif');
      if (fWebp.checked) active.add('webp');
      if (fSvg.checked)  active.add('svg');
      if (fOther.checked)active.add('other');

      let filtered = allUrls.filter(u => active.has(classifyExt(u)));
      if (dedup.checked) filtered = [...new Set(filtered)];

      summaryEl.textContent = `${filtered.length} image URL${filtered.length !== 1 ? 's' : ''}`;

      listEl.innerHTML = filtered.map((url, i) => {
        const safe = url.replace(/"/g, '%22');
        return `<div style="display:flex;align-items:center;gap:8px;padding:4px 0;border-bottom:1px solid var(--color-border);">
          <span style="font-size:11px;color:var(--color-text-muted);min-width:28px;">${i + 1}</span>
          <a href="${safe}" target="_blank" rel="noopener noreferrer"
            style="font-size:12px;font-family:var(--font-mono);color:var(--color-accent);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;"
            title="${safe}">${url}</a>
          <button class="btn btn-ghost" style="padding:2px 8px;font-size:11px;flex-shrink:0;"
            onclick="navigator.clipboard.writeText('${safe.replace(/'/g, "\\'")}').then(()=>LarryTools.toast('Copied!','success'))">⎘</button>
        </div>`;
      }).join('');

      this._filteredUrls = filtered;
    };

    this._onExtract = () => {
      const html = htmlEl.value.trim();
      if (!html) { LarryTools.toast('Please paste HTML source first', 'error'); return; }

      const base = baseEl.value.trim() || '';
      allUrls = extractUrls(html, base);

      if (!allUrls.length) {
        results.style.display = 'none';
        emptyEl.style.display = 'block';
        filterRow.style.display = 'none';
        return;
      }

      filterRow.style.display = 'block';
      results.style.display   = 'flex';
      emptyEl.style.display   = 'none';
      renderList();
    };

    this._onClear = () => {
      htmlEl.value = '';
      allUrls = [];
      results.style.display   = 'none';
      emptyEl.style.display   = 'none';
      filterRow.style.display = 'none';
    };

    this._onFilter = renderList;

    this._onCopyAll = () => {
      const urls = this._filteredUrls || [];
      if (!urls.length) { LarryTools.toast('Nothing to copy', 'error'); return; }
      navigator.clipboard.writeText(urls.join('\n'))
        .then(() => LarryTools.toast(`${urls.length} URLs copied!`, 'success'))
        .catch(() => LarryTools.toast('Copy failed', 'error'));
    };

    this._onDlTxt = () => {
      const urls = this._filteredUrls || [];
      if (!urls.length) { LarryTools.toast('Nothing to export', 'error'); return; }
      const blob = new Blob([urls.join('\n')], { type: 'text/plain' });
      const a    = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: 'image_urls.txt' });
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 5000);
      LarryTools.toast('Downloaded image_urls.txt', 'success');
    };

    extractBtn.addEventListener('click', this._onExtract);
    clearBtn.addEventListener('click', this._onClear);
    [fJpg, fPng, fGif, fWebp, fSvg, fOther, dedup].forEach(cb => cb.addEventListener('change', this._onFilter));
    copyAll.addEventListener('click', this._onCopyAll);
    dlTxt.addEventListener('click', this._onDlTxt);

    this._extractBtn = extractBtn;
    this._clearBtn   = clearBtn;
    this._filters    = [fJpg, fPng, fGif, fWebp, fSvg, fOther, dedup];
    this._copyAll    = copyAll;
    this._dlTxt      = dlTxt;
  },

  destroy() {
    this._extractBtn?.removeEventListener('click', this._onExtract);
    this._clearBtn?.removeEventListener('click', this._onClear);
    this._filters?.forEach(cb => cb.removeEventListener('change', this._onFilter));
    this._copyAll?.removeEventListener('click', this._onCopyAll);
    this._dlTxt?.removeEventListener('click', this._onDlTxt);
    this._extractBtn = this._clearBtn = this._copyAll = this._dlTxt = null;
    this._filters = null;
    this._onExtract = this._onClear = this._onFilter = this._onCopyAll = this._onDlTxt = null;
  },
};

export default ImageScraperTool;
