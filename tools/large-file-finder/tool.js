/**
 * Large File Finder — Scan a folder and filter files by size threshold.
 * Ported from large_file_finder.py (uses <input webkitdirectory>).
 */

const LargeFileFinderTool = {
  id:          'large-file-finder',
  name:        'Large File Finder',
  description: 'Open a folder and find files that are larger (or smaller) than a given size threshold.',
  icon:        '🔍',
  category:    'Files',

  render() {
    return /* html */`
      <div style="display:flex;flex-direction:column;gap:12px;">

        <div class="card">
          <div style="display:flex;flex-wrap:wrap;gap:12px;align-items:flex-end;">

            <div>
              <label style="display:flex;align-items:center;gap:10px;cursor:pointer;">
                <span class="btn btn-primary" id="lff-pick-btn">📂 Choose folder</span>
                <span id="lff-label" style="font-size:13px;color:var(--color-text-muted);">No folder selected</span>
              </label>
              <input type="file" id="lff-input" webkitdirectory
                style="position:absolute;opacity:0;pointer-events:none;width:1px;height:1px;">
            </div>

            <div style="display:flex;gap:6px;align-items:center;">
              <select class="select" id="lff-mode" style="width:auto;">
                <option value="larger">Larger than</option>
                <option value="smaller">Smaller than</option>
              </select>
              <input type="number" class="input" id="lff-size" value="10" min="0" step="1"
                style="width:80px;text-align:right;">
              <select class="select" id="lff-unit" style="width:auto;">
                <option value="1">B</option>
                <option value="1024">KB</option>
                <option value="1048576" selected>MB</option>
                <option value="1073741824">GB</option>
              </select>
              <button class="btn btn-secondary" id="lff-go">Search</button>
            </div>

          </div>
        </div>

        <div id="lff-results" style="display:none;flex-direction:column;gap:12px;">
          <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">
            <div id="lff-summary" class="stat-chip"></div>
            <div style="display:flex;gap:8px;">
              <select class="select" id="lff-sort" style="width:auto;">
                <option value="size-desc">Largest first</option>
                <option value="size-asc">Smallest first</option>
                <option value="name-asc">Name A→Z</option>
              </select>
              <button class="btn btn-secondary" id="lff-copy-paths">Copy paths</button>
            </div>
          </div>

          <div class="card" style="overflow:auto;max-height:450px;">
            <table id="lff-table" style="width:100%;border-collapse:collapse;font-size:13px;"></table>
          </div>
        </div>

        <div id="lff-empty" class="empty-state" style="display:none;">
          No files match the current filter.
        </div>

      </div>`;
  },

  init(container) {
    const pickBtn  = container.querySelector('#lff-pick-btn');
    const input    = container.querySelector('#lff-input');
    const labelEl  = container.querySelector('#lff-label');
    const modeEl   = container.querySelector('#lff-mode');
    const sizeEl   = container.querySelector('#lff-size');
    const unitEl   = container.querySelector('#lff-unit');
    const goBtn    = container.querySelector('#lff-go');
    const results  = container.querySelector('#lff-results');
    const emptyEl  = container.querySelector('#lff-empty');
    const summary  = container.querySelector('#lff-summary');
    const sortSel  = container.querySelector('#lff-sort');
    const copyBtn  = container.querySelector('#lff-copy-paths');
    const tableEl  = container.querySelector('#lff-table');

    let allFiles = [];
    let filtered = [];

    this._onPickClick = () => input.click();
    pickBtn.addEventListener('click', this._onPickClick);

    const fmtSize = bytes => {
      if (bytes < 1024)        return `${bytes} B`;
      if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
      if (bytes < 1024 ** 3)   return `${(bytes / 1024 ** 2).toFixed(2)} MB`;
      return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
    };

    const renderTable = () => {
      const sorted = [...filtered];
      switch (sortSel.value) {
        case 'size-desc': sorted.sort((a, b) => b.size - a.size); break;
        case 'size-asc':  sorted.sort((a, b) => a.size - b.size); break;
        case 'name-asc':  sorted.sort((a, b) => a.name.localeCompare(b.name)); break;
      }

      const header = `<thead><tr style="border-bottom:2px solid var(--color-border);">
        <th style="text-align:left;padding:8px;font-size:11px;text-transform:uppercase;letter-spacing:.05em;color:var(--color-text-muted);">#</th>
        <th style="text-align:left;padding:8px;font-size:11px;text-transform:uppercase;letter-spacing:.05em;color:var(--color-text-muted);">Filename</th>
        <th style="text-align:left;padding:8px;font-size:11px;text-transform:uppercase;letter-spacing:.05em;color:var(--color-text-muted);">Path</th>
        <th style="text-align:right;padding:8px;font-size:11px;text-transform:uppercase;letter-spacing:.05em;color:var(--color-text-muted);">Size</th>
      </tr></thead>`;

      const rows = sorted.map((f, i) => `<tr style="border-bottom:1px solid var(--color-border);">
        <td style="padding:6px 8px;color:var(--color-text-muted);font-size:12px;">${i + 1}</td>
        <td style="padding:6px 8px;font-family:var(--font-mono);font-size:12px;">${f.name}</td>
        <td style="padding:6px 8px;font-size:11px;color:var(--color-text-muted);font-family:var(--font-mono);">${f.path}</td>
        <td style="padding:6px 8px;text-align:right;font-family:var(--font-mono);">${fmtSize(f.size)}</td>
      </tr>`).join('');

      tableEl.innerHTML = header + '<tbody>' + rows + '</tbody>';
    };

    const runSearch = () => {
      if (!allFiles.length) { LarryTools.toast('Please choose a folder first', 'error'); return; }
      const threshold = (parseFloat(sizeEl.value) || 0) * parseInt(unitEl.value);
      const mode = modeEl.value;
      filtered = allFiles.filter(f => mode === 'larger' ? f.size > threshold : f.size < threshold);

      if (!filtered.length) {
        results.style.display = 'none';
        emptyEl.style.display = 'block';
        return;
      }
      const total = filtered.reduce((s, f) => s + f.size, 0);
      summary.textContent = `${filtered.length.toLocaleString()} file${filtered.length !== 1 ? 's' : ''} matched · ${fmtSize(total)} total`;
      results.style.display = 'flex';
      emptyEl.style.display = 'none';
      renderTable();
    };

    this._onFiles = e => {
      const files = Array.from(e.target.files || []);
      if (!files.length) return;
      const folderName = files[0].webkitRelativePath.split('/')[0] || 'folder';
      labelEl.textContent = `📂 ${folderName}  (${files.length.toLocaleString()} files)`;
      allFiles = files.map(f => ({
        name: f.name,
        path: f.webkitRelativePath,
        size: f.size,
      }));
    };

    this._onGo   = runSearch;
    this._onSort = renderTable;

    this._onCopyPaths = () => {
      if (!filtered.length) return;
      const text = filtered.map(f => f.path).join('\n');
      navigator.clipboard.writeText(text)
        .then(() => LarryTools.toast(`${filtered.length} path(s) copied!`, 'success'))
        .catch(() => LarryTools.toast('Copy failed', 'error'));
    };

    input.addEventListener('change', this._onFiles);
    goBtn.addEventListener('click', this._onGo);
    sortSel.addEventListener('change', this._onSort);
    copyBtn.addEventListener('click', this._onCopyPaths);

    this._input   = input;
    this._goBtn   = goBtn;
    this._sortSel = sortSel;
    this._copyBtn = copyBtn;
    this._pickBtn = pickBtn;
  },

  destroy() {
    this._input?.removeEventListener('change', this._onFiles);
    this._goBtn?.removeEventListener('click', this._onGo);
    this._sortSel?.removeEventListener('change', this._onSort);
    this._copyBtn?.removeEventListener('click', this._onCopyPaths);
    this._pickBtn?.removeEventListener('click', this._onPickClick);
    this._input = this._goBtn = this._sortSel = this._copyBtn = this._pickBtn = null;
    this._onFiles = this._onGo = this._onSort = this._onCopyPaths = this._onPickClick = null;
  },
};

export default LargeFileFinderTool;
