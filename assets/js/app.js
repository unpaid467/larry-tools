/**
 * Larry Tools — Core Engine
 * Loads tools from the registry, renders the sidebar, handles routing.
 */

import tools from '../../tools/index.js';

// Secret unlock sequence: click a,a,y,y,T,T,s,s on the logo letters
const SECRET_SEQUENCE = ['a', 'a', 'y', 'y', 'T', 'T', 's', 's'];

class LarryTools {
  constructor() {
    this.tools            = tools;
    this.currentTool      = null;
    this._toastEl         = null;
    this._secretUnlocked  = false;
    this._secretProgress  = 0;

    this._createToastContainer();
    this._setupSecretSequence();
    this._renderSidebar();
    this._setupMobileMenu();
    this._setupSearch();
    this._handleRouting();

    window.addEventListener('hashchange', () => this._handleRouting());
  }

  // -------------------------------------------------------
  // Sidebar
  // -------------------------------------------------------
  _renderSidebar(filter = '') {
    const nav = document.getElementById('tool-nav');
    const lc  = filter.toLowerCase();

    // Group tools by category (hide secret tools unless unlocked)
    const categories = {};
    for (const tool of this.tools) {
      if (tool.secret && !this._secretUnlocked) continue;
      if (lc && !tool.name.toLowerCase().includes(lc) &&
                !tool.description?.toLowerCase().includes(lc)) continue;
      const cat = tool.category || 'General';
      if (!categories[cat]) categories[cat] = [];
      categories[cat].push(tool);
    }

    if (Object.keys(categories).length === 0) {
      nav.innerHTML = `
        <div class="empty-state">
          <span class="empty-icon">🔍</span>
          <p>No tools found</p>
        </div>`;
      return;
    }

    let html = '';
    for (const [category, catTools] of Object.entries(categories)) {
      html += `
        <div class="nav-category">
          <span class="category-label">${category}</span>
          <ul>
            ${catTools.map(t => `
              <li>
                <a href="#${t.id}" class="tool-link${this.currentTool?.id === t.id ? ' active' : ''}"
                   data-id="${t.id}">
                  <span class="tool-icon">${t.icon ?? '🔧'}</span>
                  <span class="tool-name">${t.name}</span>
                </a>
              </li>
            `).join('')}
          </ul>
        </div>`;
    }

    nav.innerHTML = html;
  }

  _setActiveSidebarLink(id) {
    document.querySelectorAll('.tool-link').forEach(el => {
      el.classList.toggle('active', el.dataset.id === id);
    });
  }

  // -------------------------------------------------------
  // Mobile menu
  // -------------------------------------------------------
  _setupMobileMenu() {
    const sidebar  = document.getElementById('sidebar');
    const overlay  = document.getElementById('sidebar-overlay');
    const openBtn  = document.getElementById('menu-toggle');
    const closeBtn = document.getElementById('sidebar-close');

    const open  = () => { sidebar.classList.add('open'); overlay.classList.add('visible'); };
    const close = () => { sidebar.classList.remove('open'); overlay.classList.remove('visible'); };

    openBtn.addEventListener('click', open);
    closeBtn.addEventListener('click', close);
    overlay.addEventListener('click', close);

    // Close sidebar when a tool is selected (mobile)
    document.getElementById('tool-nav').addEventListener('click', e => {
      if (e.target.closest('.tool-link')) close();
    });
  }

  // -------------------------------------------------------
  // Search
  // -------------------------------------------------------
  _setupSearch() {
    document.getElementById('tool-search').addEventListener('input', e => {
      this._renderSidebar(e.target.value.trim());
    });
  }

  // -------------------------------------------------------
  // Routing (hash-based)
  // -------------------------------------------------------
  _handleRouting() {
    const id   = window.location.hash.slice(1);
    // Secret tools are only reachable when secret mode is active
    const tool = id ? this.tools.find(t => t.id === id && (!t.secret || this._secretUnlocked)) : null;

    if (tool) {
      this._loadTool(tool);
    } else {
      this._showWelcome();
    }
  }

  // -------------------------------------------------------
  // Load a tool
  // -------------------------------------------------------
  _loadTool(tool) {
    // Destroy previous tool
    if (this.currentTool?.destroy) {
      try { this.currentTool.destroy(); } catch (_) { /* ignore */ }
    }
    this.currentTool = tool;

    // Update sidebar active state
    this._setActiveSidebarLink(tool.id);

    // Update topbar title
    document.getElementById('topbar-title').textContent = tool.name;

    // Render tool
    const main = document.getElementById('tool-content');
    main.innerHTML = `
      <div class="tool-header">
        <span class="tool-header-icon">${tool.icon ?? '🔧'}</span>
        <div>
          <h1>${tool.name}</h1>
          ${tool.description ? `<p>${tool.description}</p>` : ''}
        </div>
      </div>
      <div class="tool-body" id="tool-body"></div>`;

    const body = document.getElementById('tool-body');

    // Support both string returns and direct DOM manipulation
    const rendered = tool.render(body);
    if (typeof rendered === 'string') body.innerHTML = rendered;

    if (tool.init) {
      try { tool.init(body); } catch (err) { console.error(`[${tool.id}] init error:`, err); }
    }
  }

  // -------------------------------------------------------
  // Welcome screen
  // -------------------------------------------------------
  _showWelcome() {
    if (this.currentTool?.destroy) {
      try { this.currentTool.destroy(); } catch (_) { /* ignore */ }
    }
    this.currentTool = null;
    this._setActiveSidebarLink(null);
    document.getElementById('topbar-title').textContent = 'Larry Tools';

    const cards = this.tools
      .filter(t => !t.secret || this._secretUnlocked)
      .map(t => `
        <a href="#${t.id}" class="welcome-tool-card">
          <span class="wc-icon">${t.icon ?? '🔧'}</span>
          <span class="wc-name">${t.name}</span>
        </a>`).join('');

    document.getElementById('tool-content').innerHTML = `
      <div class="welcome">
        <span class="welcome-icon">⚙</span>
        <h1>Larry Tools</h1>
        <p>A free, open toolkit. Pick a tool from the sidebar or below to get started.</p>
        <div class="welcome-grid">${cards}</div>
      </div>`;
  }

  // -------------------------------------------------------
  // Secret sequence
  // -------------------------------------------------------
  _setupSecretSequence() {
    document.getElementById('logo-text').addEventListener('click', e => {
      const char = e.target.dataset.char;
      if (!char) return;   // space or icon clicked

      if (char === SECRET_SEQUENCE[this._secretProgress]) {
        this._secretProgress++;
        if (this._secretProgress === SECRET_SEQUENCE.length) {
          this._secretProgress = 0;
          this._toggleSecret();
        }
      } else {
        // Wrong letter — reset, but still check if it starts the sequence
        this._secretProgress = (char === SECRET_SEQUENCE[0]) ? 1 : 0;
      }
    });
  }

  _toggleSecret() {
    this._secretUnlocked = !this._secretUnlocked;
    const logoText = document.getElementById('logo-text');
    logoText.classList.toggle('secret-active', this._secretUnlocked);

    this._renderSidebar();

    if (this._secretUnlocked) {
      this.toast('🔓 Secret tools unlocked', 'success');
    } else {
      // If the user is currently viewing a secret tool, send them to welcome
      if (this.currentTool?.secret) {
        window.location.hash = '';
      }
      this.toast('🔒 Secret tools hidden', '');
    }
  }

  // -------------------------------------------------------
  // Toast helper (exposed globally so tools can use it)
  // -------------------------------------------------------
  _createToastContainer() {
    const el = document.createElement('div');
    el.className = 'toast-container';
    document.body.appendChild(el);
    this._toastEl = el;
  }

  toast(message, type = '', duration = 2500) {
    const t = document.createElement('div');
    t.className = `toast${type ? ' ' + type : ''}`;
    t.textContent = message;
    this._toastEl.appendChild(t);
    setTimeout(() => t.remove(), duration);
  }
}

// Boot
const app = new LarryTools();

// Expose toast globally so tools can call: LarryTools.toast('Copied!')
window.LarryTools = { toast: (msg, type, dur) => app.toast(msg, type, dur) };
