/**
 * TrackMate - Trackers View & Custom Tracker Builder
 */

class TrackersView {
  static async render(container) {
    const trackers = window.state.trackers;
    const tasks = window.state.tasks;
    const habits = window.state.habits;

    container.innerHTML = `
      <div class="trackers-header-actions">
        <div>
          <h1 class="page-title">My Trackers</h1>
          <p style="font-size: var(--text-xs); color: var(--text-muted); margin-top: 2px;">
            Create and organize customized tracking systems for tasks, study, fitness, and habits.
          </p>
        </div>
        <div style="display: flex; gap: 8px;">
          <button class="btn btn-primary" onclick="window.TrackersView.openCreateTrackerModal()">
            <span>+</span> Create Tracker
          </button>
        </div>
      </div>

      <!-- Trackers Cards Grid -->
      <div class="trackers-grid">
        ${
          trackers.length === 0
            ? `<div style="grid-column: 1 / -1; text-align: center; padding: 4rem; background: var(--bg-secondary); border-radius: var(--radius-xl); border: 1px dashed var(--border-strong);">
                 <div style="font-size: 3rem; margin-bottom: 1rem;">🎯</div>
                 <h3 style="font-size: var(--text-lg); font-weight: 700; margin-bottom: 0.5rem;">No trackers yet</h3>
                 <p style="font-size: var(--text-sm); color: var(--text-muted); margin-bottom: 1.5rem;">Create your first tracker for Study, Work, Habits, Fitness, or custom routines!</p>
                 <button class="btn btn-primary" onclick="window.TrackersView.openCreateTrackerModal()">Create Your First Tracker</button>
               </div>`
            : trackers.map((t) => {
                const trackerTasks = tasks.filter((task) => task.tracker_id === t.id);
                const trackerHabits = habits.filter((h) => h.tracker_id === t.id);
                const completedTasks = trackerTasks.filter((task) => task.status === 'completed');

                return `
                  <div class="tracker-card" style="--tracker-color: ${t.color || '#6366f1'}; --tracker-light-bg: ${t.color}22;" onclick="window.TrackersView.viewTrackerDetails('${t.id}')">
                    <div class="tracker-card-top">
                      <div class="tracker-badge-icon">${t.emoji || t.icon || '📝'}</div>
                      <div style="display: flex; gap: 4px;" onclick="event.stopPropagation()">
                        <button class="tracker-menu-btn" title="Share Tracker" onclick="window.TrackersView.openShareModal('${t.id}')">
                          🔗
                        </button>
                        <button class="tracker-menu-btn" title="Delete Tracker" onclick="window.TrackersView.confirmDeleteTracker('${t.id}')">
                          🗑️
                        </button>
                      </div>
                    </div>
                    <h3 class="tracker-title">${t.name}</h3>
                    <p class="tracker-desc">${t.description || 'Custom tracker'}</p>

                    ${
                      t.custom_fields && t.custom_fields.length > 0
                        ? `<div style="display: flex; gap: 4px; flex-wrap: wrap; margin-bottom: 12px;">
                             ${t.custom_fields.map((f) => `<span class="badge" style="background: var(--bg-tertiary); font-size: 10px;">🏷️ ${f.name}</span>`).join('')}
                           </div>`
                        : ''
                    }

                    <div class="tracker-stats-row">
                      <div class="tracker-stat-item">
                        <span class="tracker-stat-val">${trackerTasks.length}</span>
                        <span class="tracker-stat-lbl">Tasks</span>
                      </div>
                      <div class="tracker-stat-item">
                        <span class="tracker-stat-val">${trackerHabits.length}</span>
                        <span class="tracker-stat-lbl">Habits</span>
                      </div>
                      <div class="tracker-stat-item">
                        <span class="tracker-stat-val">${trackerTasks.length > 0 ? Math.round((completedTasks.length / trackerTasks.length) * 100) : 0}%</span>
                        <span class="tracker-stat-lbl">Completed</span>
                      </div>
                    </div>
                  </div>
                `;
              }).join('')
        }
      </div>

      <!-- Tracker Creation / Customization Modal Shell -->
      <div id="tracker-modal" class="modal-overlay">
        <div class="modal-container">
          <div class="modal-header">
            <h2 id="tracker-modal-title" class="modal-title">Create New Tracker</h2>
            <button class="btn-icon" onclick="window.TrackersView.closeTrackerModal()">✕</button>
          </div>
          <div class="modal-body">
            <form id="tracker-form" onsubmit="window.TrackersView.handleTrackerSubmit(event)">
              <input type="hidden" id="tracker-id" value="">

              <div class="form-group">
                <label class="form-label">Tracker Preset Type</label>
                <select id="tracker-type-select" class="form-select" onchange="window.TrackersView.handleTypePresetChange(this.value)">
                  <option value="custom">⚙️ Custom Tracker (Define Your Own)</option>
                  <option value="study">📚 Study Tracker</option>
                  <option value="work">💼 Work / Dev Tracker</option>
                  <option value="fitness">🏃 Fitness Tracker</option>
                  <option value="habit">🔥 Habit Tracker</option>
                  <option value="task">📝 Task Tracker</option>
                  <option value="goal">🎯 Goal Tracker</option>
                  <option value="project">🚀 Project Tracker</option>
                </select>
              </div>

              <div class="form-row">
                <div class="form-group" style="flex: 2;">
                  <label class="form-label">Tracker Name *</label>
                  <input type="text" id="tracker-name" class="form-control" placeholder="e.g. Master's Study Tracker" required>
                </div>
                <div class="form-group" style="flex: 1;">
                  <label class="form-label">Emoji / Icon</label>
                  <input type="text" id="tracker-emoji" class="form-control" value="📚" style="text-align: center;">
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">Description</label>
                <textarea id="tracker-description" class="form-textarea" placeholder="What are you tracking in this system?"></textarea>
              </div>

              <div class="form-group">
                <label class="form-label">Theme Accent Color</label>
                <div class="color-picker-palette" id="color-palette">
                  ${['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#8b5cf6', '#06b6d4', '#14b8a6', '#f97316', '#3b82f6'].map((c, i) => `
                    <div class="color-swatch ${i === 0 ? 'active' : ''}" style="background-color: ${c};" onclick="window.TrackersView.selectColor('${c}', this)"></div>
                  `).join('')}
                </div>
                <input type="hidden" id="tracker-color" value="#6366f1">
              </div>

              <!-- Custom Fields Section -->
              <div class="form-group">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                  <label class="form-label" style="margin: 0;">Custom Tracking Fields</label>
                  <button type="button" class="btn btn-sm btn-outline" onclick="window.TrackersView.addCustomFieldRow()">+ Add Field</button>
                </div>
                <div id="custom-fields-list" class="custom-fields-container">
                  <div style="font-size: 11px; color: var(--text-muted); text-align: center; padding: 4px;" id="no-fields-msg">
                    No custom fields added yet.
                  </div>
                </div>
              </div>

              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" onclick="window.TrackersView.closeTrackerModal()">Cancel</button>
                <button type="submit" class="btn btn-primary">Save Tracker</button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <!-- Share Tracker Modal -->
      <div id="share-modal" class="modal-overlay">
        <div class="modal-container">
          <div class="modal-header">
            <h2 class="modal-title">🔗 Share Tracker</h2>
            <button class="btn-icon" onclick="document.getElementById('share-modal').classList.remove('active')">✕</button>
          </div>
          <div class="modal-body">
            <p style="font-size: var(--text-sm); color: var(--text-secondary); margin-bottom: var(--space-4);">
              Collaborate on this tracker with friends or colleagues. Anyone with the link can participate according to your permission setting.
            </p>
            <div class="form-group">
              <label class="form-label">Permission Access</label>
              <select id="share-permission" class="form-select">
                <option value="editor">Editor (Can add, complete, and edit tasks)</option>
                <option value="viewer">Viewer (Read-only access)</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Secure Share Link</label>
              <div style="display: flex; gap: 8px;">
                <input type="text" id="share-link-input" class="form-control" readonly value="" style="font-family: var(--font-mono); font-size: 12px;">
                <button class="btn btn-primary" onclick="window.TrackersView.copyShareLink()">Copy</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  static selectColor(color, element) {
    document.getElementById('tracker-color').value = color;
    document.querySelectorAll('.color-swatch').forEach((s) => s.classList.remove('active'));
    element.classList.add('active');
  }

  static openCreateTrackerModal() {
    document.getElementById('tracker-id').value = '';
    document.getElementById('tracker-name').value = '';
    document.getElementById('tracker-emoji').value = '📝';
    document.getElementById('tracker-description').value = '';
    document.getElementById('tracker-modal-title').textContent = 'Create New Tracker';
    document.getElementById('custom-fields-list').innerHTML = '';
    document.getElementById('tracker-modal').classList.add('active');
  }

  static closeTrackerModal() {
    document.getElementById('tracker-modal').classList.remove('active');
  }

  static handleTypePresetChange(type) {
    const nameInput = document.getElementById('tracker-name');
    const emojiInput = document.getElementById('tracker-emoji');
    const fieldsList = document.getElementById('custom-fields-list');
    fieldsList.innerHTML = '';

    if (type === 'study') {
      nameInput.value = 'Study & Academics';
      emojiInput.value = '📚';
      this.addCustomFieldRow('Subject', 'text');
      this.addCustomFieldRow('Study Hours', 'number');
      this.addCustomFieldRow('Difficulty', 'select');
    } else if (type === 'fitness') {
      nameInput.value = 'Fitness & Health';
      emojiInput.value = '🏃';
      this.addCustomFieldRow('Exercise', 'text');
      this.addCustomFieldRow('Sets', 'number');
      this.addCustomFieldRow('Reps', 'number');
      this.addCustomFieldRow('Weight (kg)', 'number');
    } else if (type === 'work') {
      nameInput.value = 'Work & Projects';
      emojiInput.value = '💼';
      this.addCustomFieldRow('Owner / Assignee', 'text');
      this.addCustomFieldRow('Estimated Hours', 'number');
    }
  }

  static addCustomFieldRow(name = '', type = 'text') {
    const list = document.getElementById('custom-fields-list');
    const noMsg = document.getElementById('no-fields-msg');
    if (noMsg) noMsg.remove();

    const row = document.createElement('div');
    row.className = 'custom-field-row';
    row.innerHTML = `
      <input type="text" class="form-control field-name-input" placeholder="Field name (e.g. Subject, Weight)" value="${name}">
      <select class="form-select field-type-select">
        <option value="text" ${type === 'text' ? 'selected' : ''}>Text</option>
        <option value="number" ${type === 'number' ? 'selected' : ''}>Number</option>
        <option value="select" ${type === 'select' ? 'selected' : ''}>Dropdown</option>
        <option value="date" ${type === 'date' ? 'selected' : ''}>Date</option>
      </select>
      <button type="button" class="btn btn-icon btn-danger btn-sm" onclick="this.parentElement.remove()">✕</button>
    `;
    list.appendChild(row);
  }

  static async handleTrackerSubmit(event) {
    event.preventDefault();
    try {
      const id = document.getElementById('tracker-id')?.value;
      const name = document.getElementById('tracker-name')?.value?.trim();
      const emoji = document.getElementById('tracker-emoji')?.value?.trim() || '📝';
      const description = document.getElementById('tracker-description')?.value?.trim() || '';
      const color = document.getElementById('tracker-color')?.value || '#6366f1';
      const type = document.getElementById('tracker-type-select')?.value || 'custom';

      if (!name) {
        if (window.notifications) window.notifications.showToast('Please enter a tracker name');
        return;
      }

      const customFields = [];
      document.querySelectorAll('.custom-field-row').forEach((row) => {
        const fieldName = row.querySelector('.field-name-input')?.value?.trim();
        const fieldType = row.querySelector('.field-type-select')?.value || 'text';
        if (fieldName) {
          customFields.push({ name: fieldName, type: fieldType });
        }
      });

      const trackerData = {
        id: id || undefined,
        name,
        emoji,
        description,
        color,
        type,
        custom_fields: customFields,
        is_private: true
      };

      await window.state.saveTracker(trackerData);
      this.closeTrackerModal();
      if (window.notifications) {
        window.notifications.showToast(`Tracker "${name}" saved! 🎯`);
      }
    } catch (err) {
      console.error('[TrackersView] Error saving tracker:', err);
      if (window.notifications) {
        window.notifications.showToast('Could not save tracker. Check console.');
      }
    }
  }

  static async confirmDeleteTracker(trackerId) {
    if (confirm('Are you sure you want to delete this tracker and all its associated tasks?')) {
      await window.state.deleteTracker(trackerId);
      if (window.notifications) {
        window.notifications.showToast('Tracker deleted.');
      }
    }
  }

  static viewTrackerDetails(trackerId) {
    window.location.hash = `#tasks?tracker=${trackerId}`;
  }

  static openShareModal(trackerId) {
    const token = window.db.generateUUID();
    const shareUrl = `${window.location.origin}${window.location.pathname}#shared/${trackerId}?token=${token}`;
    document.getElementById('share-link-input').value = shareUrl;
    document.getElementById('share-modal').classList.add('active');
  }

  static copyShareLink() {
    const input = document.getElementById('share-link-input');
    input.select();
    navigator.clipboard.writeText(input.value);
    if (window.notifications) {
      window.notifications.showToast('Share link copied to clipboard! 📋');
    }
  }
}

window.TrackersView = TrackersView;

