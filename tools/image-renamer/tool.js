/**
 * Image Renamer — Rename images using the N_foldername scheme, preview results, download scripts.
 * Ported from image_renamer.py (uses <input webkitdirectory accept="image/*">).
 *
 * Scheme: <N>_<foldername>.<ext>  — ordered by lastModified ascending.
 * Since browsers cannot rename files, this tool downloads a PowerShell / bash script.
 */

const ImageRenamerTool = {
  id:          'image-renamer',
  name:        'Image Renamer',
  description: 'Select a folder of images; preview the N_foldername rename scheme and download a rename script.',
  icon:        '🖼️',
  category:    'Files',

  render() {
    return /* html */`
      <div style="display:flex;flex-direction:column;gap:12px;">

        <div class="card">
          <div style="display:flex;flex-wrap:wrap;gap:12px;align-items:flex-end;">
            <div>
              <label style="display:flex;align-items:center;gap:10px;cursor:pointer;">
                <span class="btn btn-primary" id="ir-pick-btn">🖼️ Choose image folder</span>
                <span id="ir-label" style="font-size:13px;color:var(--color-text-muted);">No folder selected</span>
              </label>
              <input type="file" id="ir-input" webkitdirectory accept="image/*"
                style="position:absolute;opacity:0;pointer-events:none;width:1px;height:1px;">
            </div>

            <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
              <div>
                <label style="font-size:12px;font-weight:600;display:block;margin-bottom:4px;">Start number</label>
                <input type="number" class="input" id="ir-start" value="1" min="1" style="width:70px;">
              </div>
              <div>
                <label style="font-size:12px;font-weight:600;display:block;margin-bottom:4px;">Pad digits</label>
                <input type="number" class="input" id="ir-pad" value="3" min="1" max="6" style="width:60px;">
              </div>
              <div>
                <label style="font-size:12px;font-weight:600;display:block;margin-bottom:4px;">Separator</label>
                <input type="text" class="input" id="ir-sep" value="_" maxlength="5"
                  style="width:50px;font-family:var(--font-mono);">
              </div>
              <div>
                <label style="font-size:12px;font-weight:600;display:block;margin-bottom:4px;">Sort by</label>
                <select class="select" id="ir-order" style="width:auto;">
                  <option value="modified">Date modified</option>
                  <option value="name">Filename A→Z</option>
                  <option value="size">File size</option>
                </select>
              </div>
              <div style="padding-top:20px;">
                <button class="btn btn-secondary" id="ir-preview-btn">Preview</button>
              </div>
            </div>
          </div>
        </div>

        <!-- Results -->
        <div id="ir-results" style="display:none;flex-direction:column;gap:10px;">
          <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">
            <div id="ir-summary" class="stat-chip"></div>
            <div style="display:flex;gap:8px;">
              <button class="btn btn-primary"   id="ir-dl-ps">⬇ PowerShell</button>
              <button class="btn btn-secondary" id="ir-dl-sh">⬇ Bash</button>
            </div>
          </div>

          <div class="card" style="overflow:auto;max-height:450px;">
            <table id="ir-table" style="width:100%;border-collapse:collapse;font-size:12px;font-family:var(--font-mono);"></table>
          </div>
        </div>

        <div id="ir-empty" class="empty-state" style="display:none;">
          No image files found in the selected folder.
        </div>

      </div>`;
  },

  init(container) {
    const pickBtn  = container.querySelector('#ir-pick-btn');
    const input    = container.querySelector('#ir-input');
    const labelEl  = container.querySelector('#ir-label');
    const startEl  = container.querySelector('#ir-start');
    const padEl    = container.querySelector('#ir-pad');
    const sepEl    = container.querySelector('#ir-sep');
    const orderEl  = container.querySelector('#ir-order');
    const prevBtn  = container.querySelector('#ir-preview-btn');
    const results  = container.querySelector('#ir-results');
    const emptyEl  = container.querySelector('#ir-empty');
    const summaryEl= container.querySelector('#ir-summary');
    const tableEl  = container.querySelector('#ir-table');
    const dlPs     = container.querySelector('#ir-dl-ps');
    const dlSh     = container.querySelector('#ir-dl-sh');

    let files = [];
    let folderName = '';
    let renamed = [];

    this._onPickClick = () => input.click();
    pickBtn.addEventListener('click', this._onPickClick);

    const IMAGE_EXTS = new Set(['jpg','jpeg','png','gif','bmp','webp','tiff','tif','svg','heic','avif','ico']);

    this._onFiles = e => {
      const all = Array.from(e.target.files || []);
      folderName = all[0]?.webkitRelativePath.split('/')[0] || 'images';
      files = all.filter(f => {
        const ext = f.name.split('.').pop().toLowerCase();
        return IMAGE_EXTS.has(ext);
      });
      labelEl.textContent = `📂 ${folderName}  (${files.length} image${files.length !== 1 ? 's' : ''} of ${all.length} files)`;
    };

    const buildPreview = () => {
      if (!files.length) { LarryTools.toast('Please choose a folder first', 'error'); return; }

      const sorted = [...files];
      switch (orderEl.value) {
        case 'modified': sorted.sort((a, b) => a.lastModified - b.lastModified); break;
        case 'name':     sorted.sort((a, b) => a.name.localeCompare(b.name)); break;
        case 'size':     sorted.sort((a, b) => a.size - b.size); break;
      }

      const start = parseInt(startEl.value || '1');
      const pad   = parseInt(padEl.value   || '3');
      const sep   = sepEl.value || '_';
      const folder = folderName.replace(/[^\w\-]/g, '_');

      renamed = sorted.map((f, i) => {
        const ext   = f.name.includes('.') ? '.' + f.name.split('.').pop().toLowerCase() : '';
        const n     = String(start + i).padStart(pad, '0');
        return { old: f.name, new: `${n}${sep}${folder}${ext}` };
      });

      if (!renamed.length) {
        results.style.display = 'none';
        emptyEl.style.display = 'block';
        return;
      }

      summaryEl.textContent = `${renamed.length} image${renamed.length !== 1 ? 's' : ''} will be renamed`;

      const header = `<thead><tr style="border-bottom:2px solid var(--color-border);">
        <th style="text-align:left;padding:6px 8px;font-size:11px;text-transform:uppercase;color:var(--color-text-muted);">#</th>
        <th style="text-align:left;padding:6px 8px;font-size:11px;text-transform:uppercase;color:var(--color-text-muted);">Original</th>
        <th style="text-align:left;padding:6px 8px;font-size:11px;text-transform:uppercase;color:var(--color-text-muted);">→ New name</th>
      </tr></thead>`;

      const rows = renamed.map((r, i) => `<tr style="border-bottom:1px solid var(--color-border);">
        <td style="padding:5px 8px;color:var(--color-text-muted);">${i + 1}</td>
        <td style="padding:5px 8px;">${r.old}</td>
        <td style="padding:5px 8px;color:var(--color-accent);font-weight:600;">${r.new}</td>
      </tr>`).join('');

      tableEl.innerHTML = header + '<tbody>' + rows + '</tbody>';
      results.style.display = 'flex';
      emptyEl.style.display = 'none';
    };

    const dl = (content, filename) => {
      if (!renamed.length) { LarryTools.toast('Run preview first', 'error'); return; }
      const blob = new Blob([content], { type: 'text/plain' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href = url; a.download = filename; a.click();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
      LarryTools.toast(`Downloaded ${filename}`, 'success');
    };

    this._onPreview = buildPreview;

    this._onDlPs = () => {
      const lines = ['# Image Rename Script (PowerShell)', '# Generated by Larry Tools', '# Run from the folder containing your images', ''];
      renamed.forEach(r => {
        if (r.old !== r.new)
          lines.push(`Rename-Item -Path "${r.old}" -NewName "${r.new}"`);
      });
      dl(lines.join('\r\n'), 'rename_images.ps1');
    };

    this._onDlSh = () => {
      const lines = ['#!/usr/bin/env bash', '# Image Rename Script', '# Generated by Larry Tools', '# Run from the folder containing your images', ''];
      renamed.forEach(r => {
        if (r.old !== r.new)
          lines.push(`mv "${r.old}" "${r.new}"`);
      });
      dl(lines.join('\n'), 'rename_images.sh');
    };

    input.addEventListener('change', this._onFiles);
    prevBtn.addEventListener('click', this._onPreview);
    dlPs.addEventListener('click', this._onDlPs);
    dlSh.addEventListener('click', this._onDlSh);

    this._input   = input;
    this._prevBtn = prevBtn;
    this._dlPs    = dlPs;
    this._dlSh    = dlSh;
    this._pickBtn = pickBtn;
  },

  destroy() {
    this._input?.removeEventListener('change', this._onFiles);
    this._prevBtn?.removeEventListener('click', this._onPreview);
    this._dlPs?.removeEventListener('click', this._onDlPs);
    this._dlSh?.removeEventListener('click', this._onDlSh);
    this._pickBtn?.removeEventListener('click', this._onPickClick);
    this._input = this._prevBtn = this._dlPs = this._dlSh = this._pickBtn = null;
    this._onFiles = this._onPreview = this._onDlPs = this._onDlSh = this._onPickClick = null;
  },
};

export default ImageRenamerTool;
