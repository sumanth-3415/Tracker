/**
 * TrackMate - Main Application Bootstrap & UI Controller
 */

class TrackMateApp {
  async init() {
    console.log('[TrackMate] Initializing application...');

    // 1. Initialize Theme
    const savedTheme = localStorage.getItem(CONFIG.STORAGE_KEYS.THEME) || CONFIG.DEFAULT_THEME;
    document.documentElement.setAttribute('data-theme', savedTheme);

    // 2. Initialize State & IndexedDB
    await window.state.init();

    // 3. Initialize Sync Engine
    window.syncEngine.init();

    // 4. Initialize Notifications
    window.notifications.init();

    // 5. Register Service Worker for PWA & Offline Support
    this.registerServiceWorker();

    // 6. Setup Keyboard Shortcuts & Global Events
    this.setupEventListeners();

    // 7. Initial Route
    await window.router.handleRoute();

    // Re-render view whenever state is updated
    window.state.on('state:updated', () => {
      window.router.handleRoute();
    });

    console.log('[TrackMate] Ready and operational 🚀');
  }

  registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('./service-worker.js')
          .then((reg) => {
            console.log('[ServiceWorker] Registered with scope:', reg.scope);
          })
          .catch((err) => {
            console.warn('[ServiceWorker] Registration failed:', err);
          });
      });
    }
  }

  setupEventListeners() {
    // Keyboard Shortcuts
    window.addEventListener('keydown', (e) => {
      // Q or Ctrl+K opens Quick Add
      if ((e.key === 'q' || e.key === 'Q') && !['INPUT', 'TEXTAREA'].includes(e.target.tagName)) {
        e.preventDefault();
        this.openQuickAddModal();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        this.openQuickAddModal();
      } else if (e.key === 'Escape') {
        // Close all active modals
        document.querySelectorAll('.modal-overlay.active').forEach((m) => m.classList.remove('active'));
        const fab = document.getElementById('fab-container');
        if (fab) fab.classList.remove('active');
      }
    });

    // Global Search input listener
    const searchInput = document.getElementById('global-search-input');
    if (searchInput) {
      let debounceTimer = null;
      searchInput.addEventListener('input', (e) => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          this.handleGlobalSearch(e.target.value);
        }, 200);
      });
    }
  }

  // Toggle Desktop Sidebar Collapse
  toggleSidebar() {
    const sidebar = document.getElementById('app-sidebar');
    if (sidebar) {
      sidebar.classList.toggle('collapsed');
      sidebar.classList.toggle('open');
    }
  }

  // Toggle Floating Action Button Menu
  toggleFAB() {
    const fab = document.getElementById('fab-container');
    if (fab) {
      fab.classList.toggle('active');
    }
  }

  // Open Quick Add Modal
  openQuickAddModal() {
    const modal = document.getElementById('quick-add-modal');
    const input = document.getElementById('quick-add-input');
    if (!modal || !input) return;

    input.value = '';
    this.updateQuickAddPreview('');
    modal.classList.add('active');
    setTimeout(() => input.focus(), 50);

    const fab = document.getElementById('fab-container');
    if (fab) fab.classList.remove('active');
  }

  closeQuickAddModal() {
    const modal = document.getElementById('quick-add-modal');
    if (modal) modal.classList.remove('active');
  }

  // Real-time Natural Language Quick Add preview
  updateQuickAddPreview(text) {
    const previewBox = document.getElementById('quick-add-preview');
    if (!previewBox) return;

    if (!text.trim()) {
      previewBox.innerHTML = `
        <div style="font-size: 11px; color: var(--text-muted);">
          💡 Try typing: <span style="color: var(--primary);">"Study DBMS tomorrow 7 PM !urgent #study"</span>
        </div>
      `;
      return;
    }

    const parsed = window.QuickAddParser.parse(text);
    previewBox.innerHTML = `
      <div style="display: flex; gap: 6px; flex-wrap: wrap; align-items: center; font-size: 11px;">
        <span style="font-weight: 700; color: var(--text-primary);">📝 ${parsed.title}</span>
        <span class="badge badge-${parsed.priority}">${parsed.priority}</span>
        ${parsed.date ? `<span class="badge" style="background: var(--bg-tertiary);">📅 ${parsed.date}</span>` : ''}
        ${parsed.time ? `<span class="badge" style="background: var(--bg-tertiary);">⏰ ${parsed.time}</span>` : ''}
        ${parsed.category ? `<span class="badge" style="background: var(--bg-tertiary);">🏷️ ${parsed.category}</span>` : ''}
        ${parsed.recurrence ? `<span class="badge" style="background: rgba(99, 102, 241, 0.2); color: var(--primary);">🔁 ${parsed.recurrence.label}</span>` : ''}
      </div>
    `;
  }

  // Save Quick Add Task
  async handleQuickAddSubmit(event) {
    event.preventDefault();
    const input = document.getElementById('quick-add-input');
    const text = input.value.trim();
    if (!text) return;

    const parsed = window.QuickAddParser.parse(text);
    const defaultTracker = window.state.trackers[0]?.id || 'default';

    const task = {
      id: window.db.generateUUID(),
      title: parsed.title,
      tracker_id: defaultTracker,
      priority: parsed.priority,
      status: 'not_started',
      due_date: parsed.date || new Date().toISOString().split('T')[0],
      due_time: parsed.time || '',
      category: parsed.category || '',
      tags: parsed.tags || [],
      recurring_pattern: parsed.recurrence ? parsed.recurrence.pattern : 'none',
      recurring_days: parsed.recurrence?.days || null,
      estimated_minutes: 30,
      actual_minutes: 0,
      subtasks: []
    };

    await window.state.saveTask(task);
    this.closeQuickAddModal();
    if (window.notifications) {
      window.notifications.showToast(`Task "${parsed.title}" added instantly! ⚡`);
    }
  }

  // Global Search
  handleGlobalSearch(query) {
    if (!query.trim()) return;
    window.location.hash = '#tasks';
    setTimeout(() => {
      const q = query.toLowerCase();
      const taskCards = document.querySelectorAll('.task-card-item');
      taskCards.forEach((card) => {
        const title = card.querySelector('.task-title-line')?.textContent.toLowerCase() || '';
        if (title.includes(q)) {
          card.style.display = 'flex';
        } else {
          card.style.display = 'none';
        }
      });
    }, 100);
  }
}

// Global App Instance
window.app = new TrackMateApp();
document.addEventListener('DOMContentLoaded', () => {
  window.app.init();
});

