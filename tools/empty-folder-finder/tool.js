/**
 * Empty Folder Finder — Traverse a directory tree and list folders that contain nothing.
 * Ported from empty_folder_finder.py.
 *
 * Uses the File System Access API (window.showDirectoryPicker) which is available in
 * modern Chromium-based browsers (Chrome ≥ 86, Edge ≥ 86).
 * Falls back to a help message in other browsers.
 */

const EmptyFolderFinderTool = {
  id:          'empty-folder-finder',
  name:        'Empty Folder Finder',
  description: 'Scan a directory tree and list every folder that contains no files or subdirectories.',
  icon:        '📂',
  category:    'Files',

  render() {
    const supported = typeof window.showDirectoryPicker === 'function';

    if (!supported) {
      return /* html */`
        <div class="card" style="max-width:540px;">
          <div style="font-size:32px;margin-bottom:12px;">⚠️</div>
          <h3 style="margin:0 0 8px;">File System Access API not available</h3>
          <p style="font-size:13px;color:var(--color-text-muted);line-height:1.6;margin-bottom:14px;">
            This tool requires the <strong>File System Access API</strong> (<code>showDirectoryPicker</code>),
            which is available in <strong>Chrome / Edge 86+</strong> but not in Firefox or Safari.
          </p>
          <p style="font-size:13px;color:var(--color-text-muted);line-height:1.6;margin-bottom:14px;">
            Alternatively, you can use this PowerShell one-liner to find empty folders on Windows:
          </p>
          <div class="output" id="eff-ps-hint" style="font-size:12px;white-space:pre-wrap;">Get-ChildItem -Path "C:\\YourFolder" -Recurse -Directory |
  Where-Object { -not (Get-ChildItem -Path $_.FullName -Force) } |
  Select-Object FullName</div>
          <div class="btn-row" style="margin-top:10px;">
            <button class="btn btn-secondary" id="eff-copy-ps">Copy script</button>
          </div>
        </div>`;
    }

    return /* html */`
      <div style="display:flex;flex-direction:column;gap:12px;">

        <div class="card">
          <div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap;">
            <button class="btn btn-primary" id="eff-pick">📂 Choose root folder</button>
            <span id="eff-label" style="font-size:13px;color:var(--color-text-muted);">No folder selected</span>
          </div>
        </div>

        <!-- Progress -->
        <div id="eff-progress-wrap" style="display:none;">
          <div class="card">
            <div style="font-size:13px;margin-bottom:8px;" id="eff-progress-label">Scanning…</div>
            <div style="background:var(--color-border);border-radius:4px;height:8px;overflow:hidden;">
              <div id="eff-progress-bar" style="height:100%;background:var(--color-accent);width:0;border-radius:4px;
                animation:eff-pulse 1.2s ease-in-out infinite alternate;"></div>
            </div>
            <style>@keyframes eff-pulse{from{opacity:.6}to{opacity:1}}</style>
            <button class="btn btn-ghost" id="eff-cancel" style="margin-top:10px;font-size:12px;">Cancel</button>
          </div>
        </div>

        <!-- Results -->
        <div id="eff-results" style="display:none;flex-direction:column;gap:10px;">
          <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">
            <div id="eff-summary" class="stat-chip"></div>
            <div style="display:flex;gap:8px;">
              <button class="btn btn-secondary" id="eff-copy-list">Copy paths</button>
              <button class="btn btn-primary"   id="eff-dl-ps">⬇ Cleanup PS1</button>
              <button class="btn btn-ghost"     id="eff-dl-sh">⬇ Cleanup .sh</button>
            </div>
          </div>
          <div class="card" style="overflow:auto;max-height:400px;">
            <div id="eff-list" style="font-family:var(--font-mono);font-size:12px;line-height:1.8;"></div>
          </div>
        </div>

        <div id="eff-empty" class="empty-state" style="display:none;">
          ✔ No empty folders found.
        </div>

      </div>`;
  },

  init(container) {
    const supported = typeof window.showDirectoryPicker === 'function';

    if (!supported) {
      // Fallback: wire up copy button for the PS hint
      const ps  = container.querySelector('#eff-ps-hint');
      const btn = container.querySelector('#eff-copy-ps');
      if (btn && ps) {
        this._onCopyPs = () => {
          navigator.clipboard.writeText(ps.textContent)
            .then(() => LarryTools.toast('Script copied!', 'success'))
            .catch(() => LarryTools.toast('Copy failed', 'error'));
        };
        btn.addEventListener('click', this._onCopyPs);
        this._copyPsBtn = btn;
      }
      return;
    }

    const pickBtn      = container.querySelector('#eff-pick');
    const labelEl      = container.querySelector('#eff-label');
    const progressWrap = container.querySelector('#eff-progress-wrap');
    const progressLbl  = container.querySelector('#eff-progress-label');
    const progressBar  = container.querySelector('#eff-progress-bar');
    const cancelBtn    = container.querySelector('#eff-cancel');
    const results      = container.querySelector('#eff-results');
    const emptyEl      = container.querySelector('#eff-empty');
    const summaryEl    = container.querySelector('#eff-summary');
    const listEl       = container.querySelector('#eff-list');
    const copyList     = container.querySelector('#eff-copy-list');
    const dlPs         = container.querySelector('#eff-dl-ps');
    const dlSh         = container.querySelector('#eff-dl-sh');

    this._cancelled = false;
    let emptyPaths = [];

    /** Recursively find empty directories.
     * A directory is "empty" if it has zero children (no files, no subdirs). */
    const findEmpty = async (dirHandle, path) => {
      if (this._cancelled) return [];

      progressLbl.textContent = `Scanning: ${path || '/'}`;

      const children = [];
      try {
        for await (const [name, handle] of dirHandle.entries()) {
          children.push({ name, handle });
        }
      } catch { return []; }

      if (children.length === 0) {
        return path ? [path] : [];
      }

      const empty = [];
      for (const { name, handle } of children) {
        if (this._cancelled) break;
        if (handle.kind === 'directory') {
          const subPath = path ? `${path}/${name}` : name;
          const sub = await findEmpty(handle, subPath);
          empty.push(...sub);
        }
      }
      return empty;
    };

    this._onPick = async () => {
      let dirHandle;
      try {
        dirHandle = await window.showDirectoryPicker({ mode: 'read' });
      } catch (e) {
        if (e.name !== 'AbortError') LarryTools.toast('Could not open folder', 'error');
        return;
      }

      this._cancelled = false;
      labelEl.textContent = `📂 ${dirHandle.name}`;
      results.style.display = 'none';
      emptyEl.style.display = 'none';
      progressWrap.style.display = 'block';
      progressBar.style.width = '100%';

      emptyPaths = await findEmpty(dirHandle, '');

      progressWrap.style.display = 'none';
      if (this._cancelled) return;

      if (!emptyPaths.length) {
        emptyEl.style.display = 'block';
        return;
      }

      summaryEl.textContent = `${emptyPaths.length} empty folder${emptyPaths.length !== 1 ? 's' : ''}`;
      listEl.innerHTML = emptyPaths.map(p =>
        `<div style="padding:2px 0;border-bottom:1px solid var(--color-border);">${p}</div>`
      ).join('');

      this._emptyPaths = emptyPaths;
      results.style.display = 'flex';
    };

    this._onCancel = () => {
      this._cancelled = true;
      progressWrap.style.display = 'none';
    };

    this._onCopyList = () => {
      if (!this._emptyPaths?.length) return;
      navigator.clipboard.writeText(this._emptyPaths.join('\n'))
        .then(() => LarryTools.toast(`${this._emptyPaths.length} path(s) copied!`, 'success'))
        .catch(() => LarryTools.toast('Copy failed', 'error'));
    };

    const dl = (content, filename) => {
      const blob = new Blob([content], { type: 'text/plain' });
      const a    = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: filename });
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 5000);
      LarryTools.toast(`Downloaded ${filename}`, 'success');
    };

    this._onDlPs = () => {
      const paths = this._emptyPaths;
      if (!paths?.length) return;
      const lines = ['# Remove empty folders (PowerShell)', '# Generated by Larry Tools', '# Review before running!', ''];
      paths.forEach(p => lines.push(`Remove-Item -Path "${p}" -Force`));
      dl(lines.join('\r\n'), 'remove_empty_folders.ps1');
    };

    this._onDlSh = () => {
      const paths = this._emptyPaths;
      if (!paths?.length) return;
      const lines = ['#!/usr/bin/env bash', '# Remove empty folders', '# Generated by Larry Tools', '# Review before running!', ''];
      paths.forEach(p => lines.push(`rmdir "${p}"`));
      dl(lines.join('\n'), 'remove_empty_folders.sh');
    };

    pickBtn.addEventListener('click', this._onPick);
    cancelBtn.addEventListener('click', this._onCancel);
    copyList.addEventListener('click', this._onCopyList);
    dlPs.addEventListener('click', this._onDlPs);
    dlSh.addEventListener('click', this._onDlSh);

    this._pickBtn   = pickBtn;
    this._cancelBtn = cancelBtn;
    this._copyList  = copyList;
    this._dlPs      = dlPs;
    this._dlSh      = dlSh;
  },

  destroy() {
    this._cancelled = true;
    this._pickBtn?.removeEventListener('click', this._onPick);
    this._cancelBtn?.removeEventListener('click', this._onCancel);
    this._copyList?.removeEventListener('click', this._onCopyList);
    this._dlPs?.removeEventListener('click', this._onDlPs);
    this._dlSh?.removeEventListener('click', this._onDlSh);
    this._copyPsBtn?.removeEventListener('click', this._onCopyPs);
    this._pickBtn = this._cancelBtn = this._copyList = this._dlPs = this._dlSh = null;
    this._copyPsBtn = null;
    this._onPick = this._onCancel = this._onCopyList = this._onDlPs = this._onDlSh = this._onCopyPs = null;
  },
};

export default EmptyFolderFinderTool;
