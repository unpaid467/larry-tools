/**
 * PyInstaller Helper — Build PyInstaller commands interactively.
 * Ported from pyinstaller_helper.py
 */

const PyInstallerHelperTool = {
  id:          'pyinstaller-helper',
  name:        'PyInstaller Helper',
  description: 'Build PyInstaller commands with an interactive checklist. Copy to run in terminal.',
  icon:        '📦',
  category:    'Dev',

  render() {
    return /* html */`
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;align-items:start;">

        <!-- Left: options -->
        <div style="display:flex;flex-direction:column;gap:10px;">

          <div class="card">
            <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:var(--color-text-muted);margin-bottom:10px;">Script</div>
            <div class="field" style="margin:0;">
              <label for="pi-script">Python entry-point file (.py)</label>
              <input type="text" class="input" id="pi-script" placeholder="e.g. main.py or C:/project/main.py"
                style="font-family:var(--font-mono);">
            </div>
          </div>

          <div class="card">
            <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:var(--color-text-muted);margin-bottom:10px;">Build Mode</div>
            <label style="display:flex;gap:8px;cursor:pointer;margin-bottom:6px;font-size:13px;">
              <input type="radio" name="pi-mode" value="--onefile" id="pi-onefile" checked> <span><strong>--onefile</strong> — bundle everything into a single .exe</span>
            </label>
            <label style="display:flex;gap:8px;cursor:pointer;font-size:13px;">
              <input type="radio" name="pi-mode" value="--onedir"> <span><strong>--onedir</strong> — output a folder (faster startup)</span>
            </label>
          </div>

          <div class="card">
            <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:var(--color-text-muted);margin-bottom:10px;">Executable Behaviour</div>
            <div id="pi-opts-behaviour"></div>
          </div>

          <div class="card">
            <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:var(--color-text-muted);margin-bottom:10px;">Naming &amp; Icons</div>
            <div id="pi-opts-naming"></div>
          </div>

          <div class="card">
            <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:var(--color-text-muted);margin-bottom:10px;">Files, Imports &amp; Paths</div>
            <div id="pi-opts-imports"></div>
          </div>

          <div class="card">
            <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:var(--color-text-muted);margin-bottom:10px;">Optimisation &amp; Debug</div>
            <div id="pi-opts-debug"></div>
          </div>

        </div>

        <!-- Right: live command + copy -->
        <div style="position:sticky;top:20px;display:flex;flex-direction:column;gap:12px;">
          <div class="card">
            <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:var(--color-text-muted);margin-bottom:8px;">Generated Command</div>
            <div class="output" id="pi-command" style="white-space:pre-wrap;min-height:80px;font-size:12px;line-height:1.6;"></div>
            <div class="btn-row" style="margin-top:10px;">
              <button class="btn btn-primary" id="pi-copy">Copy command</button>
              <button class="btn btn-ghost"   id="pi-reset">Reset all</button>
            </div>
          </div>
          <div class="card" style="font-size:12px;color:var(--color-text-muted);line-height:1.6;">
            <strong style="color:var(--color-text);">Quick start</strong><br>
            1. Install: <code style="background:#f0f0f4;padding:1px 4px;border-radius:3px;">pip install pyinstaller</code><br>
            2. Configure options on the left<br>
            3. Copy the command and run it in your project directory
          </div>
        </div>

      </div>`;
  },

  init(container) {
    const OPTS = {
      behaviour: [
        { flag: '--windowed',    label: '--windowed / --noconsole', tip: 'Hide the console window (GUI apps only). Windows / macOS.' },
        { flag: '--console',     label: '--console',                tip: 'Force a console window (default for scripts; reverses --windowed).' },
        { flag: '--uac-admin',   label: '--uac-admin',             tip: 'Request UAC elevation on Windows (run as Administrator).' },
      ],
      naming: [
        { flag: '--name',        label: '--name', tip: 'Application name (overrides default which is the script stem).',  input: { id: 'pi-name',    placeholder: 'MyApp' } },
        { flag: '--icon',        label: '--icon', tip: 'Path to .ico (Windows) or .icns (macOS) icon file.',              input: { id: 'pi-icon',    placeholder: 'app.ico' } },
        { flag: '--version-file',label: '--version-file', tip: 'Path to a Windows version-info file.',                   input: { id: 'pi-verfile', placeholder: 'version.txt' } },
      ],
      imports: [
        { flag: '--add-data',    label: '--add-data',     tip: 'Include extra data files. Format: SRC:DEST (use ; on Windows).',  input: { id: 'pi-adddata',  placeholder: 'data/;data/' } },
        { flag: '--hidden-import', label: '--hidden-import', tip: 'Force-include a module that PyInstaller misses.',              input: { id: 'pi-hidden',   placeholder: 'module.name' } },
        { flag: '--collect-all', label: '--collect-all', tip: 'Collect all sub-modules & data for a package.',                    input: { id: 'pi-collect',  placeholder: 'package_name' } },
        { flag: '--exclude-module',label: '--exclude-module', tip: 'Exclude a module from the bundle.',                          input: { id: 'pi-exclude',  placeholder: 'test_module' } },
        { flag: '--paths',       label: '--paths',        tip: 'Extra directories to search for imports (like PYTHONPATH).',      input: { id: 'pi-paths',    placeholder: 'src;lib' } },
      ],
      debug: [
        { flag: '--clean',       label: '--clean',         tip: 'Clean PyInstaller cache before building. Recommended after changes.' },
        { flag: '--noupx',       label: '--noupx',         tip: 'Disable UPX compression (sometimes helps with antivirus false positives).' },
        { flag: '--strip',       label: '--strip',         tip: 'Strip symbols from executables and shared libs (Linux / macOS).' },
        { flag: '--debug all',   label: '--debug all',     tip: 'Enable all debug output in the frozen app (very verbose).' },
        { flag: '--log-level DEBUG', label: '--log-level DEBUG', tip: 'Verbose build output — helpful for diagnosing problems.' },
      ],
    };

    const buildGroup = (parentId, opts) => {
      const el = container.querySelector(`#${parentId}`);
      opts.forEach(opt => {
        const row = document.createElement('div');
        row.style.cssText = 'margin-bottom:10px;';

        if (opt.input) {
          row.innerHTML = `
            <label style="display:flex;gap:7px;cursor:pointer;font-size:13px;align-items:flex-start;margin-bottom:4px;">
              <input type="checkbox" data-flag="${opt.flag}" style="margin-top:2px;"> <span><strong>${opt.label}</strong></span>
            </label>
            <div style="font-size:12px;color:var(--color-text-muted);margin-bottom:4px;padding-left:22px;">${opt.tip}</div>
            <div style="padding-left:22px;">
              <input type="text" class="input" id="${opt.input.id}" placeholder="${opt.input.placeholder}"
                style="font-family:var(--font-mono);font-size:12px;max-width:300px;" disabled>
            </div>`;
          const cb  = row.querySelector('input[type=checkbox]');
          const inp = row.querySelector(`#${opt.input.id}`);
          cb.addEventListener('change', () => { inp.disabled = !cb.checked; rebuild(); });
          inp.addEventListener('input', rebuild);
        } else {
          row.innerHTML = `
            <label style="display:flex;gap:7px;cursor:pointer;font-size:13px;align-items:flex-start;margin-bottom:3px;">
              <input type="checkbox" data-flag="${opt.flag}" style="margin-top:2px;"> <span><strong>${opt.label}</strong></span>
            </label>
            <div style="font-size:12px;color:var(--color-text-muted);padding-left:22px;">${opt.tip}</div>`;
          row.querySelector('input').addEventListener('change', rebuild);
        }
        el.appendChild(row);
      });
    };

    buildGroup('pi-opts-behaviour', OPTS.behaviour);
    buildGroup('pi-opts-naming',    OPTS.naming);
    buildGroup('pi-opts-imports',   OPTS.imports);
    buildGroup('pi-opts-debug',     OPTS.debug);

    const script  = container.querySelector('#pi-script');
    const modeEls = container.querySelectorAll('input[name="pi-mode"]');
    const cmdEl   = container.querySelector('#pi-command');

    const rebuild = () => {
      const parts = ['pyinstaller'];
      const mode = [...modeEls].find(r => r.checked)?.value ?? '--onefile';
      parts.push(mode);

      container.querySelectorAll('[data-flag]').forEach(cb => {
        if (!cb.checked) return;
        const flag = cb.dataset.flag;
        const row  = cb.closest('[style]');
        const inp  = row?.querySelector('input[type=text]');
        if (inp && !inp.disabled && inp.value.trim()) {
          parts.push(`${flag} "${inp.value.trim()}"`);
        } else {
          parts.push(flag);
        }
      });

      const sc = script.value.trim() || '<your_script.py>';
      parts.push(`"${sc}"`);
      cmdEl.textContent = parts.join(' \\\n    ');
    };

    this._onInput = rebuild;
    script.addEventListener('input', rebuild);
    modeEls.forEach(r => r.addEventListener('change', rebuild));

    this._onCopy = () => {
      navigator.clipboard.writeText(cmdEl.textContent.replace(/ \\\n    /g, ' '))
        .then(() => LarryTools.toast('Command copied!', 'success'))
        .catch(() => LarryTools.toast('Copy failed', 'error'));
    };

    this._onReset = () => {
      container.querySelectorAll('[data-flag]').forEach(cb => { cb.checked = false; });
      container.querySelectorAll('#pi-opts-naming input[type=text], #pi-opts-imports input[type=text]').forEach(i => { i.value = ''; i.disabled = true; });
      container.querySelector('#pi-onefile').checked = true;
      script.value = '';
      rebuild();
    };

    container.querySelector('#pi-copy').addEventListener('click', this._onCopy);
    container.querySelector('#pi-reset').addEventListener('click', this._onReset);

    rebuild();

    this._script   = script;
    this._copyBtn  = container.querySelector('#pi-copy');
    this._resetBtn = container.querySelector('#pi-reset');
    this._modeEls  = modeEls;
  },

  destroy() {
    this._script?.removeEventListener('input', this._onInput);
    this._modeEls?.forEach(r => r.removeEventListener('change', this._onInput));
    this._copyBtn?.removeEventListener('click', this._onCopy);
    this._resetBtn?.removeEventListener('click', this._onReset);
    this._script = this._copyBtn = this._resetBtn = this._modeEls = null;
    this._onInput = this._onCopy = this._onReset = null;
  },
};

export default PyInstallerHelperTool;
