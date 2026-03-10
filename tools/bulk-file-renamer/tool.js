/**
 * Bulk File Renamer — Apply transforms to a list of filenames, preview results, export renamed list.
 * Ported from bulk_file_renamer.py.
 *
 * NOTE: Browsers cannot rename files directly. This tool generates a preview and lets you
 * download a PowerShell / bash rename script, or copy the new names.
 */

const BulkFileRenamerTool = {
  id:          'bulk-file-renamer',
  name:        'Bulk File Renamer',
  description: 'Paste a list of filenames, apply transforms (case, prefix, suffix, replace, regex, numbering) and get a rename script.',
  icon:        '✏️',
  category:    'Files',

  render() {
    return /* html */`
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;align-items:start;">

        <!-- Left: input + options -->
        <div style="display:flex;flex-direction:column;gap:10px;">

          <div class="card">
            <div class="field" style="margin:0;">
              <label for="bfr-input">Filenames  <span style="font-weight:400;font-size:11px;color:var(--color-text-muted);">one per line</span></label>
              <textarea class="textarea" id="bfr-input" rows="8"
                placeholder="report.docx&#10;IMG_0001.jpg&#10;my notes.txt&#10;data_2.csv"></textarea>
            </div>
          </div>

          <div class="card">
            <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:var(--color-text-muted);margin-bottom:10px;">Transforms <span style="font-weight:400;text-transform:none;font-size:11px;">(applied in order)</span></div>

            <!-- Case -->
            <div style="margin-bottom:10px;">
              <label style="font-size:12px;font-weight:600;display:block;margin-bottom:4px;">Case</label>
              <select class="select" id="bfr-case" style="width:auto;">
                <option value="">Keep as-is</option>
                <option value="lower">lowercase</option>
                <option value="upper">UPPERCASE</option>
                <option value="title">Title Case</option>
                <option value="snake">snake_case</option>
                <option value="kebab">kebab-case</option>
              </select>
            </div>

            <!-- Spaces ↔ _ -->
            <div style="margin-bottom:10px;">
              <label style="font-size:12px;font-weight:600;display:block;margin-bottom:4px;">Spaces</label>
              <select class="select" id="bfr-spaces" style="width:auto;">
                <option value="">Keep as-is</option>
                <option value="to_underscore">Replace spaces with _</option>
                <option value="to_hyphen">Replace spaces with -</option>
                <option value="remove">Remove spaces</option>
              </select>
            </div>

            <!-- Prefix / Suffix -->
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px;">
              <div>
                <label style="font-size:12px;font-weight:600;display:block;margin-bottom:4px;">Prefix</label>
                <input type="text" class="input" id="bfr-prefix" placeholder="e.g. 2024_"
                  style="font-family:var(--font-mono);font-size:12px;">
              </div>
              <div>
                <label style="font-size:12px;font-weight:600;display:block;margin-bottom:4px;">Suffix  <span style="font-weight:400;font-size:11px;color:var(--color-text-muted);">(before ext)</span></label>
                <input type="text" class="input" id="bfr-suffix" placeholder="e.g. _v2"
                  style="font-family:var(--font-mono);font-size:12px;">
              </div>
            </div>

            <!-- Find / Replace -->
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px;">
              <div>
                <label style="font-size:12px;font-weight:600;display:block;margin-bottom:4px;">Find</label>
                <input type="text" class="input" id="bfr-find" placeholder="old text"
                  style="font-family:var(--font-mono);font-size:12px;">
              </div>
              <div>
                <label style="font-size:12px;font-weight:600;display:block;margin-bottom:4px;">Replace with</label>
                <input type="text" class="input" id="bfr-replace" placeholder="new text"
                  style="font-family:var(--font-mono);font-size:12px;">
              </div>
            </div>
            <label style="display:flex;gap:6px;font-size:12px;cursor:pointer;margin-bottom:10px;">
              <input type="checkbox" id="bfr-regex"> Use regular expression
            </label>

            <!-- Sequential numbering -->
            <div style="margin-bottom:0;">
              <label style="font-size:12px;font-weight:600;display:block;margin-bottom:4px;">Sequential numbering</label>
              <div style="display:flex;gap:8px;align-items:center;">
                <label style="display:flex;gap:5px;font-size:12px;cursor:pointer;white-space:nowrap;">
                  <input type="checkbox" id="bfr-num-enable"> Enable
                </label>
                <input type="number" class="input" id="bfr-num-start" value="1" min="0" style="width:60px;font-size:12px;">
                <span style="font-size:12px;color:var(--color-text-muted);">start · pad</span>
                <input type="number" class="input" id="bfr-num-pad" value="3" min="1" max="9" style="width:50px;font-size:12px;">
                <span style="font-size:12px;color:var(--color-text-muted);">digits · sep</span>
                <input type="text" class="input" id="bfr-num-sep" value="_" style="width:40px;font-size:12px;font-family:var(--font-mono);">
              </div>
            </div>
          </div>

        </div>

        <!-- Right: live preview + export -->
        <div style="display:flex;flex-direction:column;gap:10px;">

          <div class="card">
            <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:var(--color-text-muted);margin-bottom:8px;">Preview</div>
            <div id="bfr-preview-wrap" style="overflow:auto;max-height:400px;">
              <table id="bfr-preview" style="width:100%;border-collapse:collapse;font-size:12px;font-family:var(--font-mono);"></table>
            </div>
            <div id="bfr-empty-hint" style="color:var(--color-text-muted);font-size:13px;padding:10px 0;">
              Enter filenames on the left to see a preview.
            </div>
          </div>

          <div class="card">
            <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:var(--color-text-muted);margin-bottom:8px;">Export</div>
            <div class="btn-row">
              <button class="btn btn-primary"   id="bfr-dl-ps">⬇ PowerShell</button>
              <button class="btn btn-secondary" id="bfr-dl-sh">⬇ Bash</button>
              <button class="btn btn-ghost"     id="bfr-copy-new">Copy new names</button>
            </div>
          </div>

        </div>
      </div>`;
  },

  init(container) {
    const nameInput  = container.querySelector('#bfr-input');
    const caseEl     = container.querySelector('#bfr-case');
    const spacesEl   = container.querySelector('#bfr-spaces');
    const prefixEl   = container.querySelector('#bfr-prefix');
    const suffixEl   = container.querySelector('#bfr-suffix');
    const findEl     = container.querySelector('#bfr-find');
    const replaceEl  = container.querySelector('#bfr-replace');
    const regexEl    = container.querySelector('#bfr-regex');
    const numEnable  = container.querySelector('#bfr-num-enable');
    const numStart   = container.querySelector('#bfr-num-start');
    const numPad     = container.querySelector('#bfr-num-pad');
    const numSep     = container.querySelector('#bfr-num-sep');
    const previewTable = container.querySelector('#bfr-preview');
    const emptyHint  = container.querySelector('#bfr-empty-hint');
    const dlPs       = container.querySelector('#bfr-dl-ps');
    const dlSh       = container.querySelector('#bfr-dl-sh');
    const copyNew    = container.querySelector('#bfr-copy-new');

    let renamed = [];

    const transform = (filename, index) => {
      const dot    = filename.lastIndexOf('.');
      let stem = dot > 0 ? filename.slice(0, dot) : filename;
      let ext  = dot > 0 ? filename.slice(dot)    : '';

      // Case
      switch (caseEl.value) {
        case 'lower': stem = stem.toLowerCase(); ext = ext.toLowerCase(); break;
        case 'upper': stem = stem.toUpperCase(); ext = ext.toUpperCase(); break;
        case 'title': stem = stem.replace(/\b\w/g, c => c.toUpperCase()); break;
        case 'snake': stem = stem.trim().replace(/[\s\-]+/g, '_').toLowerCase(); break;
        case 'kebab': stem = stem.trim().replace(/[\s_]+/g, '-').toLowerCase(); break;
      }

      // Spaces
      switch (spacesEl.value) {
        case 'to_underscore': stem = stem.replace(/ /g, '_'); break;
        case 'to_hyphen':     stem = stem.replace(/ /g, '-'); break;
        case 'remove':        stem = stem.replace(/ /g, '');  break;
      }

      // Find / replace
      const find = findEl.value;
      if (find) {
        try {
          const pattern = regexEl.checked ? new RegExp(find, 'g') : find;
          stem = stem.replaceAll(pattern, replaceEl.value);
        } catch { /* invalid regex — skip */ }
      }

      // Suffix before extension
      stem = (prefixEl.value || '') + stem + (suffixEl.value || '');

      // Sequential number
      if (numEnable.checked) {
        const n   = parseInt(numStart.value || '1') + index;
        const pad = parseInt(numPad.value || '3');
        const sep = numSep.value;
        stem = stem + sep + String(n).padStart(pad, '0');
      }

      return stem + ext;
    };

    const update = () => {
      const lines = nameInput.value.split('\n').map(l => l.trim()).filter(Boolean);
      if (!lines.length) {
        previewTable.innerHTML = '';
        previewTable.style.display = 'none';
        emptyHint.style.display = 'block';
        renamed = [];
        return;
      }

      renamed = lines.map((l, i) => ({ old: l, new: transform(l, i) }));
      emptyHint.style.display = 'none';
      previewTable.style.display = '';

      const header = `<thead><tr style="border-bottom:2px solid var(--color-border);">
        <th style="text-align:left;padding:5px 8px;font-size:11px;text-transform:uppercase;color:var(--color-text-muted);">Before</th>
        <th style="text-align:left;padding:5px 8px;font-size:11px;text-transform:uppercase;color:var(--color-text-muted);">After</th>
      </tr></thead>`;

      const rows = renamed.map(r => {
        const changed = r.old !== r.new;
        return `<tr style="border-bottom:1px solid var(--color-border);">
          <td style="padding:5px 8px;color:var(--color-text-muted);">${r.old}</td>
          <td style="padding:5px 8px;${changed ? 'color:var(--color-accent);font-weight:600;' : ''}">${r.new}</td>
        </tr>`;
      }).join('');

      previewTable.innerHTML = header + '<tbody>' + rows + '</tbody>';
    };

    this._onUpdate = update;

    [nameInput, caseEl, spacesEl, prefixEl, suffixEl, findEl, replaceEl,
     regexEl, numEnable, numStart, numPad, numSep].forEach(el => {
      el.addEventListener(el.tagName === 'SELECT' || el.type === 'checkbox' ? 'change' : 'input', this._onUpdate);
    });

    this._onDlPs = () => {
      if (!renamed.length) { LarryTools.toast('Nothing to export', 'error'); return; }
      const lines = ['# Bulk rename script (PowerShell)', '# Generated by Larry Tools', '# Run from the folder containing your files', ''];
      renamed.forEach(r => {
        if (r.old !== r.new)
          lines.push(`Rename-Item -Path "${r.old}" -NewName "${r.new}"`);
      });
      this._dl(lines.join('\r\n'), 'rename.ps1');
    };

    this._onDlSh = () => {
      if (!renamed.length) { LarryTools.toast('Nothing to export', 'error'); return; }
      const lines = ['#!/usr/bin/env bash', '# Bulk rename script', '# Generated by Larry Tools', '# Run from the folder containing your files', ''];
      renamed.forEach(r => {
        if (r.old !== r.new)
          lines.push(`mv "${r.old}" "${r.new}"`);
      });
      this._dl(lines.join('\n'), 'rename.sh');
    };

    this._onCopyNew = () => {
      if (!renamed.length) { LarryTools.toast('Nothing to copy', 'error'); return; }
      navigator.clipboard.writeText(renamed.map(r => r.new).join('\n'))
        .then(() => LarryTools.toast('New names copied!', 'success'))
        .catch(() => LarryTools.toast('Copy failed', 'error'));
    };

    dlPs.addEventListener('click', this._onDlPs);
    dlSh.addEventListener('click', this._onDlSh);
    copyNew.addEventListener('click', this._onCopyNew);

    this._inputs   = [nameInput, caseEl, spacesEl, prefixEl, suffixEl, findEl, replaceEl, regexEl, numEnable, numStart, numPad, numSep];
    this._dlPs     = dlPs;
    this._dlSh     = dlSh;
    this._copyNew  = copyNew;

    update();
  },

  _dl(content, filename) {
    const blob = new Blob([content], { type: 'text/plain' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
    LarryTools.toast(`Downloaded ${filename}`, 'success');
  },

  destroy() {
    this._inputs?.forEach(el => {
      const ev = el.tagName === 'SELECT' || el.type === 'checkbox' ? 'change' : 'input';
      el.removeEventListener(ev, this._onUpdate);
    });
    this._dlPs?.removeEventListener('click', this._onDlPs);
    this._dlSh?.removeEventListener('click', this._onDlSh);
    this._copyNew?.removeEventListener('click', this._onCopyNew);
    this._inputs = this._dlPs = this._dlSh = this._copyNew = null;
    this._onUpdate = this._onDlPs = this._onDlSh = this._onCopyNew = null;
  },
};

export default BulkFileRenamerTool;
