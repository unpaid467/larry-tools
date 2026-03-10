/**
 * File Type Statistics — Analyse a folder and show file counts & sizes per extension.
 * Ported from file_type_stats.py (uses <input webkitdirectory>).
 */

const FileTypeStatsTool = {
  id:          'file-type-stats',
  name:        'File Type Statistics',
  description: 'Select a local folder to see file counts, sizes, and percentages broken down by extension.',
  icon:        '📊',
  category:    'Files',

  render() {
    return /* html */`
      <div style="display:flex;flex-direction:column;gap:12px;">
        <div class="card">
          <label style="display:flex;align-items:center;gap:12px;cursor:pointer;flex-wrap:wrap;">
            <span class="btn btn-primary" style="pointer-events:none;">📂 Choose folder</span>
            <span id="fts-label" style="font-size:13px;color:var(--color-text-muted);">No folder selected</span>
            <input type="file" id="fts-input" webkitdirectory style="position:absolute;opacity:0;pointer-events:none;width:1px;height:1px;">
          </label>
        </div>

        <div id="fts-results" style="display:none;flex-direction:column;gap:12px;">
          <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">
            <div id="fts-summary" class="stat-chip"></div>
            <div style="display:flex;gap:8px;">
              <select class="select" id="fts-sort" style="width:auto;">
                <option value="count-desc">Sort by count ↓</option>
                <option value="count-asc">Sort by count ↑</option>
                <option value="size-desc">Sort by size ↓</option>
                <option value="size-asc">Sort by size ↑</option>
                <option value="ext-asc">Sort by extension A→Z</option>
              </select>
              <button class="btn btn-secondary" id="fts-csv">Copy CSV</button>
            </div>
          </div>
          <div class="card" style="overflow:auto;">
            <table id="fts-table" style="width:100%;border-collapse:collapse;font-size:13px;"></table>
          </div>
        </div>

        <div id="fts-empty" class="empty-state" style="display:none;">
          No files found in the selected folder.
        </div>
      </div>`;
  },

  init(container) {
    const input   = container.querySelector('#fts-input');
    const labelEl = container.querySelector('#fts-label');
    const results = container.querySelector('#fts-results');
    const empty   = container.querySelector('#fts-empty');
    const summary = container.querySelector('#fts-summary');
    const sortSel = container.querySelector('#fts-sort');
    const csvBtn  = container.querySelector('#fts-csv');
    const table   = container.querySelector('#fts-table');

    // Clicking the styled label triggers the actual input
    const labelBtn = container.querySelector('.btn.btn-primary');
    this._onLabelClick = () => input.click();
    labelBtn.style.pointerEvents = 'auto';
    labelBtn.style.cursor = 'pointer';
    labelBtn.addEventListener('click', this._onLabelClick);

    let stats = [];

    const fmtSize = bytes => {
      if (bytes < 1024)           return `${bytes} B`;
      if (bytes < 1024 * 1024)    return `${(bytes / 1024).toFixed(1)} KB`;
      if (bytes < 1024 ** 3)      return `${(bytes / 1024 ** 2).toFixed(2)} MB`;
      return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
    };

    const renderTable = () => {
      const sorted = [...stats];
      switch (sortSel.value) {
        case 'count-desc': sorted.sort((a, b) => b.count - a.count); break;
        case 'count-asc':  sorted.sort((a, b) => a.count - b.count); break;
        case 'size-desc':  sorted.sort((a, b) => b.totalSize - a.totalSize); break;
        case 'size-asc':   sorted.sort((a, b) => a.totalSize - b.totalSize); break;
        case 'ext-asc':    sorted.sort((a, b) => a.ext.localeCompare(b.ext)); break;
      }
      const totalFiles = sorted.reduce((s, r) => s + r.count, 0);
      const totalBytes = sorted.reduce((s, r) => s + r.totalSize, 0);

      const header = `<thead><tr style="border-bottom:2px solid var(--color-border);">
        <th style="text-align:left;padding:8px;font-size:11px;text-transform:uppercase;letter-spacing:.05em;color:var(--color-text-muted);">Extension</th>
        <th style="text-align:right;padding:8px;font-size:11px;text-transform:uppercase;letter-spacing:.05em;color:var(--color-text-muted);">Files</th>
        <th style="text-align:right;padding:8px;font-size:11px;text-transform:uppercase;letter-spacing:.05em;color:var(--color-text-muted);">Total Size</th>
        <th style="text-align:right;padding:8px;font-size:11px;text-transform:uppercase;letter-spacing:.05em;color:var(--color-text-muted);">Avg Size</th>
        <th style="text-align:right;padding:8px;font-size:11px;text-transform:uppercase;letter-spacing:.05em;color:var(--color-text-muted);">% of total</th>
        <th style="padding:8px;font-size:11px;text-transform:uppercase;letter-spacing:.05em;color:var(--color-text-muted);">Bar</th>
      </tr></thead>`;

      const rows = sorted.map(r => {
        const pct = totalBytes > 0 ? (r.totalSize / totalBytes * 100).toFixed(1) : '0.0';
        const bar = `<div style="width:${Math.max(Number(pct), 1)}%;height:8px;border-radius:4px;background:var(--color-accent);opacity:.7;min-width:3px;"></div>`;
        return `<tr style="border-bottom:1px solid var(--color-border);">
          <td style="padding:7px 8px;font-family:var(--font-mono);font-weight:600;">${r.ext}</td>
          <td style="padding:7px 8px;text-align:right;">${r.count.toLocaleString()}</td>
          <td style="padding:7px 8px;text-align:right;font-family:var(--font-mono);">${fmtSize(r.totalSize)}</td>
          <td style="padding:7px 8px;text-align:right;font-family:var(--font-mono);">${fmtSize(Math.round(r.totalSize / r.count))}</td>
          <td style="padding:7px 8px;text-align:right;">${pct}%</td>
          <td style="padding:7px 8px;min-width:80px;">${bar}</td>
        </tr>`;
      }).join('');

      const foot = `<tfoot><tr style="border-top:2px solid var(--color-border);font-weight:600;">
        <td style="padding:8px;">Total</td>
        <td style="padding:8px;text-align:right;">${totalFiles.toLocaleString()}</td>
        <td style="padding:8px;text-align:right;font-family:var(--font-mono);">${fmtSize(totalBytes)}</td>
        <td colspan="3"></td>
      </tr></tfoot>`;

      table.innerHTML = header + '<tbody>' + rows + '</tbody>' + foot;
    };

    this._onFiles = (e) => {
      const files = Array.from(e.target.files || []);
      if (!files.length) return;

      const folderName = files[0].webkitRelativePath.split('/')[0] || 'folder';
      labelEl.textContent = `📂 ${folderName}  (${files.length.toLocaleString()} files)`;

      const map = new Map();
      for (const f of files) {
        const parts = f.name.split('.');
        const ext   = parts.length > 1 ? '.' + parts.pop().toLowerCase() : '(no extension)';
        const rec   = map.get(ext) || { ext, count: 0, totalSize: 0 };
        rec.count++;
        rec.totalSize += f.size;
        map.set(ext, rec);
      }

      stats = Array.from(map.values());

      if (!stats.length) {
        results.style.display = 'none';
        empty.style.display = 'block';
        return;
      }

      const totalBytes = stats.reduce((s, r) => s + r.totalSize, 0);
      summary.textContent = `${files.length.toLocaleString()} files · ${stats.length} extensions · ${this._fmtSize(totalBytes)}`;

      results.style.display = 'flex';
      empty.style.display   = 'none';
      renderTable();
    };

    this._onSort = renderTable;

    this._onCsv = () => {
      if (!stats.length) return;
      const csv = ['Extension,Files,Total Size (bytes),Avg Size (bytes)']
        .concat(stats.map(r => `${r.ext},${r.count},${r.totalSize},${Math.round(r.totalSize / r.count)}`))
        .join('\n');
      navigator.clipboard.writeText(csv)
        .then(() => LarryTools.toast('CSV copied!', 'success'))
        .catch(() => LarryTools.toast('Copy failed', 'error'));
    };

    input.addEventListener('change', this._onFiles);
    sortSel.addEventListener('change', this._onSort);
    csvBtn.addEventListener('click', this._onCsv);

    this._input   = input;
    this._sortSel = sortSel;
    this._csvBtn  = csvBtn;
    this._labelBtn = labelBtn;
  },

  _fmtSize(bytes) {
    if (bytes < 1024)        return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 ** 3)   return `${(bytes / 1024 ** 2).toFixed(2)} MB`;
    return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
  },

  destroy() {
    this._input?.removeEventListener('change', this._onFiles);
    this._sortSel?.removeEventListener('change', this._onSort);
    this._csvBtn?.removeEventListener('click', this._onCsv);
    this._labelBtn?.removeEventListener('click', this._onLabelClick);
    this._input = this._sortSel = this._csvBtn = this._labelBtn = null;
    this._onFiles = this._onSort = this._onCsv = this._onLabelClick = null;
  },
};

export default FileTypeStatsTool;
