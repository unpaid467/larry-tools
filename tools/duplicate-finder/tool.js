/**
 * Duplicate File Finder — Hash every file with SHA-256 and group duplicates.
 * Ported from duplicate_file_finder.py (uses <input webkitdirectory> + Web Crypto).
 */

const DuplicateFinderTool = {
  id:          'duplicate-finder',
  name:        'Duplicate File Finder',
  description: 'Scan a folder, hash every file with SHA-256, and show groups of exact duplicates.',
  icon:        '🗂️',
  category:    'Files',

  render() {
    return /* html */`
      <div style="display:flex;flex-direction:column;gap:12px;">

        <div class="card">
          <label style="display:flex;align-items:center;gap:12px;cursor:pointer;flex-wrap:wrap;">
            <span class="btn btn-primary" id="df-pick-btn">📂 Choose folder</span>
            <span id="df-label" style="font-size:13px;color:var(--color-text-muted);">No folder selected</span>
            <input type="file" id="df-input" webkitdirectory
              style="position:absolute;opacity:0;pointer-events:none;width:1px;height:1px;">
          </label>
        </div>

        <!-- Progress -->
        <div id="df-progress-wrap" style="display:none;">
          <div class="card">
            <div style="font-size:13px;margin-bottom:8px;" id="df-progress-label">Hashing files…</div>
            <div style="background:var(--color-border);border-radius:4px;height:8px;overflow:hidden;">
              <div id="df-progress-bar" style="height:100%;background:var(--color-accent);width:0%;transition:width .15s;border-radius:4px;"></div>
            </div>
            <button class="btn btn-ghost" id="df-cancel" style="margin-top:10px;font-size:12px;">Cancel</button>
          </div>
        </div>

        <!-- Results -->
        <div id="df-results" style="display:none;flex-direction:column;gap:12px;">
          <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">
            <div id="df-summary" class="stat-chip"></div>
            <button class="btn btn-secondary" id="df-copy-report">Copy report</button>
          </div>
          <div id="df-groups" style="display:flex;flex-direction:column;gap:10px;"></div>
        </div>

        <div id="df-empty" class="empty-state" style="display:none;">
          ✔ No duplicate files found.
        </div>

      </div>`;
  },

  init(container) {
    const pickBtn     = container.querySelector('#df-pick-btn');
    const input       = container.querySelector('#df-input');
    const labelEl     = container.querySelector('#df-label');
    const progressWrap= container.querySelector('#df-progress-wrap');
    const progressBar = container.querySelector('#df-progress-bar');
    const progressLbl = container.querySelector('#df-progress-label');
    const cancelBtn   = container.querySelector('#df-cancel');
    const results     = container.querySelector('#df-results');
    const emptyEl     = container.querySelector('#df-empty');
    const summaryEl   = container.querySelector('#df-summary');
    const groupsEl    = container.querySelector('#df-groups');
    const copyReport  = container.querySelector('#df-copy-report');

    this._cancelled = false;

    this._onPickClick = () => input.click();
    pickBtn.addEventListener('click', this._onPickClick);

    const fmtSize = bytes => {
      if (bytes < 1024)        return `${bytes} B`;
      if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
      if (bytes < 1024 ** 3)   return `${(bytes / 1024 ** 2).toFixed(2)} MB`;
      return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
    };

    const hashFile = async file => {
      const buf = await file.arrayBuffer();
      const digest = await crypto.subtle.digest('SHA-256', buf);
      return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, '0')).join('');
    };

    this._onFiles = async e => {
      const files = Array.from(e.target.files || []);
      if (!files.length) return;

      const folderName = files[0].webkitRelativePath.split('/')[0] || 'folder';
      labelEl.textContent = `📂 ${folderName}  (${files.length.toLocaleString()} files)`;

      this._cancelled = false;
      results.style.display = 'none';
      emptyEl.style.display = 'none';
      progressWrap.style.display = 'block';
      progressBar.style.width = '0%';

      const hashMap = new Map(); // hash → [fileInfo…]

      for (let i = 0; i < files.length; i++) {
        if (this._cancelled) break;
        const f = files[i];
        progressLbl.textContent = `Hashing ${i + 1} / ${files.length} — ${f.name}`;
        progressBar.style.width = `${((i + 1) / files.length * 100).toFixed(0)}%`;

        let h;
        try { h = await hashFile(f); } catch { h = `ERROR_${i}`; }

        const arr = hashMap.get(h) || [];
        arr.push({ name: f.name, path: f.webkitRelativePath, size: f.size });
        hashMap.set(h, arr);
      }

      progressWrap.style.display = 'none';
      if (this._cancelled) return;

      const dupeGroups = [...hashMap.values()].filter(g => g.length > 1);

      if (!dupeGroups.length) {
        emptyEl.style.display = 'block';
        return;
      }

      const wastedBytes = dupeGroups.reduce((s, g) => s + g[0].size * (g.length - 1), 0);
      const totalDupes  = dupeGroups.reduce((s, g) => s + g.length - 1, 0);
      summaryEl.textContent =
        `${dupeGroups.length} duplicate group${dupeGroups.length !== 1 ? 's' : ''} · ${totalDupes} extra file${totalDupes !== 1 ? 's' : ''} · ${fmtSize(wastedBytes)} wasted`;

      groupsEl.innerHTML = dupeGroups.map((group, gi) => {
        const rows = group.map(f => `<tr style="border-bottom:1px solid var(--color-border);">
          <td style="padding:5px 8px;font-family:var(--font-mono);font-size:12px;">${f.name}</td>
          <td style="padding:5px 8px;font-size:11px;color:var(--color-text-muted);font-family:var(--font-mono);">${f.path}</td>
          <td style="padding:5px 8px;text-align:right;font-family:var(--font-mono);font-size:12px;">${fmtSize(f.size)}</td>
        </tr>`).join('');

        return `<div class="card" style="overflow:hidden;border-left:3px solid var(--color-accent);">
          <div style="font-size:12px;font-weight:600;margin-bottom:6px;">Group ${gi + 1} · ${group.length} identical files · ${fmtSize(group[0].size)} each</div>
          <table style="width:100%;border-collapse:collapse;font-size:13px;">
            <thead><tr style="border-bottom:1px solid var(--color-border);">
              <th style="text-align:left;padding:5px 8px;font-size:11px;text-transform:uppercase;letter-spacing:.05em;color:var(--color-text-muted);">File</th>
              <th style="text-align:left;padding:5px 8px;font-size:11px;text-transform:uppercase;letter-spacing:.05em;color:var(--color-text-muted);">Path</th>
              <th style="text-align:right;padding:5px 8px;font-size:11px;text-transform:uppercase;letter-spacing:.05em;color:var(--color-text-muted);">Size</th>
            </tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </div>`;
      }).join('');

      // Build report text for clipboard
      this._report = [`Duplicate File Report`, `Generated: ${new Date().toLocaleString()}`, ''];
      dupeGroups.forEach((g, i) => {
        this._report.push(`--- Group ${i + 1} (${g.length} files, ${fmtSize(g[0].size)} each) ---`);
        g.forEach(f => this._report.push(`  ${f.path}`));
        this._report.push('');
      });

      results.style.display = 'flex';
    };

    this._onCancel = () => { this._cancelled = true; progressWrap.style.display = 'none'; };

    this._onCopyReport = () => {
      if (!this._report) return;
      navigator.clipboard.writeText(this._report.join('\n'))
        .then(() => LarryTools.toast('Report copied!', 'success'))
        .catch(() => LarryTools.toast('Copy failed', 'error'));
    };

    input.addEventListener('change', this._onFiles);
    cancelBtn.addEventListener('click', this._onCancel);
    copyReport.addEventListener('click', this._onCopyReport);
    this._input      = input;
    this._cancelBtn  = cancelBtn;
    this._copyReport = copyReport;
    this._pickBtn    = pickBtn;
  },

  destroy() {
    this._cancelled = true;
    this._input?.removeEventListener('change', this._onFiles);
    this._cancelBtn?.removeEventListener('click', this._onCancel);
    this._copyReport?.removeEventListener('click', this._onCopyReport);
    this._pickBtn?.removeEventListener('click', this._onPickClick);
    this._input = this._cancelBtn = this._copyReport = this._pickBtn = null;
    this._onFiles = this._onCancel = this._onCopyReport = this._onPickClick = null;
  },
};

export default DuplicateFinderTool;
