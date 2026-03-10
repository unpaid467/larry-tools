/**
 * Project Template Creator — Generate project folder structures and download setup scripts.
 * Ported from project_template_creator.py
 */

const ProjectTemplateCreatorTool = {
  id:          'project-template-creator',
  name:        'Project Template Creator',
  description: 'Choose a project template, set a name, preview the structure, then download a setup script.',
  icon:        '📁',
  category:    'Dev',

  /* ── Templates ─────────────────────────────────────────────────────────── */
  _templates: {
    'Python Package': {
      desc: 'Reusable Python library with tests, docs, and packaging config.',
      files: name => [
        `${name}/`,
        `${name}/src/`,
        `${name}/src/${name}/`,
        `${name}/src/${name}/__init__.py`,
        `${name}/src/${name}/core.py`,
        `${name}/tests/`,
        `${name}/tests/__init__.py`,
        `${name}/tests/test_core.py`,
        `${name}/docs/`,
        `${name}/docs/index.md`,
        `${name}/.gitignore`,
        `${name}/README.md`,
        `${name}/pyproject.toml`,
        `${name}/setup.cfg`,
        `${name}/LICENSE`,
      ],
    },
    'Python Script / CLI': {
      desc: 'Single-file or small CLI tool, virtual-env ready.',
      files: name => [
        `${name}/`,
        `${name}/main.py`,
        `${name}/requirements.txt`,
        `${name}/.gitignore`,
        `${name}/README.md`,
      ],
    },
    'Django Web App': {
      desc: 'Django project skeleton with an app, static files, and templates.',
      files: name => [
        `${name}/`,
        `${name}/manage.py`,
        `${name}/${name}/`,
        `${name}/${name}/__init__.py`,
        `${name}/${name}/settings.py`,
        `${name}/${name}/urls.py`,
        `${name}/${name}/wsgi.py`,
        `${name}/${name}/asgi.py`,
        `${name}/app/`,
        `${name}/app/__init__.py`,
        `${name}/app/models.py`,
        `${name}/app/views.py`,
        `${name}/app/urls.py`,
        `${name}/app/admin.py`,
        `${name}/app/apps.py`,
        `${name}/app/migrations/`,
        `${name}/app/migrations/__init__.py`,
        `${name}/templates/`,
        `${name}/templates/base.html`,
        `${name}/static/`,
        `${name}/static/css/`,
        `${name}/static/js/`,
        `${name}/requirements.txt`,
        `${name}/.gitignore`,
        `${name}/README.md`,
      ],
    },
    'FastAPI Service': {
      desc: 'FastAPI REST service with router layout and Pydantic models.',
      files: name => [
        `${name}/`,
        `${name}/main.py`,
        `${name}/app/`,
        `${name}/app/__init__.py`,
        `${name}/app/routers/`,
        `${name}/app/routers/__init__.py`,
        `${name}/app/routers/items.py`,
        `${name}/app/models/`,
        `${name}/app/models/__init__.py`,
        `${name}/app/models/item.py`,
        `${name}/app/dependencies.py`,
        `${name}/app/database.py`,
        `${name}/tests/`,
        `${name}/tests/test_main.py`,
        `${name}/requirements.txt`,
        `${name}/.env.example`,
        `${name}/.gitignore`,
        `${name}/README.md`,
        `${name}/Dockerfile`,
      ],
    },
    'Data Science Notebook': {
      desc: 'Data science project with a Jupyter notebook layout.',
      files: name => [
        `${name}/`,
        `${name}/data/`,
        `${name}/data/raw/`,
        `${name}/data/processed/`,
        `${name}/notebooks/`,
        `${name}/notebooks/01_eda.ipynb`,
        `${name}/notebooks/02_modelling.ipynb`,
        `${name}/src/`,
        `${name}/src/__init__.py`,
        `${name}/src/features.py`,
        `${name}/src/train.py`,
        `${name}/src/predict.py`,
        `${name}/models/`,
        `${name}/reports/`,
        `${name}/reports/figures/`,
        `${name}/requirements.txt`,
        `${name}/.gitignore`,
        `${name}/README.md`,
      ],
    },
    'Static Website': {
      desc: 'Plain HTML / CSS / JS website with a clean directory structure.',
      files: name => [
        `${name}/`,
        `${name}/index.html`,
        `${name}/assets/`,
        `${name}/assets/css/`,
        `${name}/assets/css/style.css`,
        `${name}/assets/js/`,
        `${name}/assets/js/main.js`,
        `${name}/assets/img/`,
        `${name}/pages/`,
        `${name}/.gitignore`,
        `${name}/README.md`,
      ],
    },
    'React / Vite App': {
      desc: 'React app bootstrapped with Vite, TypeScript-ready.',
      files: name => [
        `${name}/`,
        `${name}/index.html`,
        `${name}/vite.config.js`,
        `${name}/package.json`,
        `${name}/src/`,
        `${name}/src/main.jsx`,
        `${name}/src/App.jsx`,
        `${name}/src/App.css`,
        `${name}/src/index.css`,
        `${name}/src/components/`,
        `${name}/src/components/Navbar.jsx`,
        `${name}/src/pages/`,
        `${name}/src/pages/Home.jsx`,
        `${name}/src/hooks/`,
        `${name}/src/utils/`,
        `${name}/public/`,
        `${name}/.gitignore`,
        `${name}/README.md`,
      ],
    },
    'Node.js / Express API': {
      desc: 'Node.js REST API using Express with a routers / controllers layout.',
      files: name => [
        `${name}/`,
        `${name}/server.js`,
        `${name}/package.json`,
        `${name}/src/`,
        `${name}/src/routes/`,
        `${name}/src/routes/index.js`,
        `${name}/src/routes/items.js`,
        `${name}/src/controllers/`,
        `${name}/src/controllers/itemController.js`,
        `${name}/src/middleware/`,
        `${name}/src/middleware/auth.js`,
        `${name}/src/middleware/errorHandler.js`,
        `${name}/src/models/`,
        `${name}/src/config/`,
        `${name}/src/config/db.js`,
        `${name}/tests/`,
        `${name}/.env.example`,
        `${name}/.gitignore`,
        `${name}/README.md`,
      ],
    },
  },

  render() {
    const names = Object.keys(this._templates);
    return /* html */`
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;align-items:start;">

        <!-- Left: configuration -->
        <div style="display:flex;flex-direction:column;gap:12px;">
          <div class="card">
            <div class="field" style="margin-bottom:12px;">
              <label for="ptc-template">Template</label>
              <select class="select" id="ptc-template">
                ${names.map(n => `<option value="${n}">${n}</option>`).join('')}
              </select>
              <div id="ptc-desc" style="margin-top:6px;font-size:12px;color:var(--color-text-muted);"></div>
            </div>
            <div class="field" style="margin:0;">
              <label for="ptc-name">Project name</label>
              <input type="text" class="input" id="ptc-name" placeholder="my_project" value="my_project"
                style="font-family:var(--font-mono);">
            </div>
          </div>

          <div class="card">
            <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:var(--color-text-muted);margin-bottom:8px;">Download setup script</div>
            <p style="font-size:12px;color:var(--color-text-muted);margin-bottom:10px;">
              A script that creates the folder structure and empty placeholder files on your machine.
            </p>
            <div class="btn-row">
              <button class="btn btn-primary"   id="ptc-dl-ps">⬇ PowerShell (.ps1)</button>
              <button class="btn btn-secondary" id="ptc-dl-sh">⬇ Bash (.sh)</button>
            </div>
          </div>
        </div>

        <!-- Right: file tree preview -->
        <div class="card" style="overflow:auto;max-height:600px;">
          <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:var(--color-text-muted);margin-bottom:10px;">File structure preview</div>
          <div id="ptc-tree" style="font-family:var(--font-mono);font-size:12px;line-height:1.8;white-space:pre;"></div>
        </div>

      </div>`;
  },

  init(container) {
    const tmplSel = container.querySelector('#ptc-template');
    const nameIn  = container.querySelector('#ptc-name');
    const descEl  = container.querySelector('#ptc-desc');
    const treeEl  = container.querySelector('#ptc-tree');
    const dlPs    = container.querySelector('#ptc-dl-ps');
    const dlSh    = container.querySelector('#ptc-dl-sh');

    const update = () => {
      const key  = tmplSel.value;
      const name = (nameIn.value.trim() || 'my_project').replace(/[^\w\-]/g, '_');
      const tmpl = this._templates[key];
      descEl.textContent = tmpl.desc;

      const files = tmpl.files(name);
      treeEl.textContent = this._buildTree(files);
    };

    this._onTmpl   = update;
    this._onName   = update;
    this._onDlPs   = () => this._download(tmplSel.value, nameIn.value.trim() || 'my_project', 'ps');
    this._onDlSh   = () => this._download(tmplSel.value, nameIn.value.trim() || 'my_project', 'sh');

    tmplSel.addEventListener('change', this._onTmpl);
    nameIn.addEventListener('input', this._onName);
    dlPs.addEventListener('click', this._onDlPs);
    dlSh.addEventListener('click', this._onDlSh);

    this._tmplSel = tmplSel;
    this._nameIn  = nameIn;
    this._dlPs    = dlPs;
    this._dlSh    = dlSh;

    update();
  },

  _buildTree(files) {
    // Render a simple tree using box-drawing chars
    const lines = [];
    for (let i = 0; i < files.length; i++) {
      const path = files[i];
      const depth = (path.match(/\//g) || []).length - 1;
      const isDir = path.endsWith('/');
      const name  = path.replace(/\/$/, '').split('/').pop() + (isDir ? '/' : '');
      const isLast = i === files.length - 1 ||
        (files[i + 1] && (files[i + 1].match(/\//g) || []).length - 1 < depth);
      const prefix  = depth === 0 ? '' : '│   '.repeat(depth - 1) + (isLast ? '└── ' : '├── ');
      lines.push(`${prefix}${name}`);
    }
    return lines.join('\n');
  },

  _download(templateKey, rawName, type) {
    const name  = rawName.replace(/[^\w\-]/g, '_');
    const tmpl  = this._templates[templateKey];
    if (!tmpl) return;
    const files = tmpl.files(name);

    let script, filename, mime;

    if (type === 'ps') {
      const lines = [`# Project setup: ${name}`, `# Template: ${templateKey}`, `# Generated by Larry Tools`, ''];
      files.forEach(f => {
        if (f.endsWith('/')) {
          lines.push(`New-Item -ItemType Directory -Force -Path "${f.replace(/\/$/, '')}" | Out-Null`);
        } else {
          lines.push(`New-Item -ItemType File -Force -Path "${f}" | Out-Null`);
        }
      });
      lines.push('', 'Write-Host "Project created successfully!" -ForegroundColor Green');
      script   = lines.join('\r\n');
      filename = `setup_${name}.ps1`;
      mime     = 'text/plain';
    } else {
      const lines = [`#!/usr/bin/env bash`, `# Project setup: ${name}`, `# Template: ${templateKey}`, `# Generated by Larry Tools`, ''];
      files.forEach(f => {
        if (f.endsWith('/')) {
          lines.push(`mkdir -p "${f.replace(/\/$/, '')}"`);
        } else {
          const dir = f.split('/').slice(0, -1).join('/');
          if (dir) lines.push(`mkdir -p "${dir}"`);
          lines.push(`touch "${f}"`);
        }
      });
      lines.push('', 'echo "\u2713 Project created successfully!"');
      script   = lines.join('\n');
      filename = `setup_${name}.sh`;
      mime     = 'text/plain';
    }

    const blob = new Blob([script], { type: mime });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
    LarryTools.toast(`Downloaded ${filename}`, 'success');
  },

  destroy() {
    this._tmplSel?.removeEventListener('change', this._onTmpl);
    this._nameIn?.removeEventListener('input', this._onName);
    this._dlPs?.removeEventListener('click', this._onDlPs);
    this._dlSh?.removeEventListener('click', this._onDlSh);
    this._tmplSel = this._nameIn = this._dlPs = this._dlSh = null;
    this._onTmpl = this._onName = this._onDlPs = this._onDlSh = null;
  },
};

export default ProjectTemplateCreatorTool;
