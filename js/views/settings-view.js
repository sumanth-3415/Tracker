/**
 * TrackMate - Settings View (Local-First & Automated Messaging)
 */

class SettingsView {
  static async render(container) {
    const profile = window.state.userProfile || {};
    const guestId = profile.id || localStorage.getItem(CONFIG.STORAGE_KEYS.GUEST_USER_ID) || 'Unknown';
    const currentTheme = localStorage.getItem(CONFIG.STORAGE_KEYS.THEME) || 'dark';

    const recipientEmail = localStorage.getItem(CONFIG.STORAGE_KEYS.GUEST_USER_EMAIL) || profile.email || '';
    const dailyReportTime = localStorage.getItem(CONFIG.STORAGE_KEYS.DAILY_REPORT_TIME) || '20:30';

    container.innerHTML = `
      <div class="trackers-header-actions">
        <div>
          <h1 class="page-title">Settings & Preferences</h1>
          <p style="font-size: var(--text-xs); color: var(--text-muted); margin-top: 2px;">
            Configure notifications, daily/weekly/monthly automated messaging, themes and backups.
          </p>
        </div>
      </div>

      <div class="settings-container">
        <!-- Local Storage Architecture Card -->
        <div class="settings-section-card">
          <h3 class="settings-section-title">📱 100% Local-First & Private</h3>
          <p class="settings-section-desc">
            All your trackers, tasks, habits, and streak data are stored directly on this device using IndexedDB. No external database or signup required.
          </p>

          <div class="settings-item-row">
            <div class="settings-item-info">
              <div class="settings-item-name">Device Anonymous Profile ID</div>
              <div class="settings-item-hint" style="font-family: var(--font-mono); font-size: 11px;">${guestId}</div>
            </div>
            <button class="btn btn-sm btn-outline" onclick="navigator.clipboard.writeText('${guestId}'); window.notifications.showToast('Profile ID copied!');">
              Copy ID
            </button>
          </div>

          <div class="form-group" style="margin-top: var(--space-4);">
            <label class="form-label">Display Name</label>
            <input type="text" id="setting-username" class="form-control" value="${profile.username || 'Productivity Champion'}">
          </div>
        </div>

        <!-- Automated Messaging & Reporting Schedules -->
        <div class="settings-section-card">
          <h3 class="settings-section-title">✉️ Automated Messaging & Report Schedules</h3>
          <p class="settings-section-desc">
            Configure automated daily progress messages, weekly performance digests, and monthly reviews.
          </p>

          <div class="form-group">
            <label class="form-label">Report Destination Email (Gmail)</label>
            <input type="email" id="setting-report-email" class="form-control"
                   placeholder="e.g. yourname@gmail.com"
                   value="${recipientEmail}">
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Daily Summary Notification Time</label>
              <input type="time" id="setting-daily-time" class="form-control" value="${dailyReportTime}">
            </div>
            <div class="form-group">
              <label class="form-label">Weekly Digest Schedule</label>
              <select id="setting-weekly-day" class="form-select">
                <option value="0" selected>Every Sunday Evening (20:00)</option>
                <option value="1">Every Monday Morning (08:00)</option>
                <option value="5">Every Friday Evening (18:00)</option>
              </select>
            </div>
          </div>

          <div style="display: flex; gap: 8px; margin-top: var(--space-2);">
            <button class="btn btn-primary" onclick="window.SettingsView.saveNotificationPreferences()">Save Preferences</button>
            <button class="btn btn-outline" onclick="window.notifications.requestPermission()">Enable Push Reminders</button>
          </div>
        </div>

        <!-- Appearance & Theme Selector -->
        <div class="settings-section-card">
          <h3 class="settings-section-title">🎨 Appearance & Theme</h3>
          <p class="settings-section-desc">Choose your preferred visual aesthetic and color contrast.</p>

          <div class="theme-options-grid">
            <div class="theme-card-option ${currentTheme === 'dark' ? 'active' : ''}" onclick="window.SettingsView.setTheme('dark')">
              🌙 Dark Mode (Default)
            </div>
            <div class="theme-card-option ${currentTheme === 'light' ? 'active' : ''}" onclick="window.SettingsView.setTheme('light')">
              ☀️ Clean Light
            </div>
            <div class="theme-card-option ${currentTheme === 'midnight' ? 'active' : ''}" onclick="window.SettingsView.setTheme('midnight')">
              🌌 Midnight OLED
            </div>
          </div>
        </div>

        <!-- Backup, Export & Reset Card -->
        <div class="settings-section-card">
          <h3 class="settings-section-title">💾 Local Data Backup & Restore</h3>
          <p class="settings-section-desc">Download a complete JSON backup of your productivity database or restore from a previous file.</p>

          <div style="display: flex; gap: 8px; flex-wrap: wrap;">
            <button class="btn btn-outline" onclick="window.SettingsView.exportAllData()">📦 Export Full JSON Backup</button>
            <label class="btn btn-outline" style="cursor: pointer;">
              📥 Restore JSON Backup
              <input type="file" id="backup-file-input" accept=".json" style="display: none;" onchange="window.SettingsView.importData(event)">
            </label>
            <button class="btn btn-danger" onclick="window.SettingsView.resetLocalData()">⚠️ Clear All Data</button>
          </div>
        </div>
      </div>
    `;
  }

  static setTheme(themeName) {
    document.documentElement.setAttribute('data-theme', themeName);
    localStorage.setItem(CONFIG.STORAGE_KEYS.THEME, themeName);
    this.render(document.getElementById('view-content'));
  }

  static saveNotificationPreferences() {
    const email = document.getElementById('setting-report-email').value;
    const time = document.getElementById('setting-daily-time').value;

    localStorage.setItem(CONFIG.STORAGE_KEYS.GUEST_USER_EMAIL, email);
    localStorage.setItem(CONFIG.STORAGE_KEYS.DAILY_REPORT_TIME, time);

    if (window.notifications) {
      window.notifications.showToast('Automated messaging & notification preferences saved! 🔔');
    }
  }

  static async exportAllData() {
    const backup = await window.db.exportFullDatabase();
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `TrackMate_Full_Backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    if (window.notifications) window.notifications.showToast('Backup downloaded successfully! 📦');
  }

  static async importData(event) {
    const file = event.target.files[0];
    if (!file) return;
    try {
      const text = await file.text();
      const json = JSON.parse(text);
      await window.db.importFullDatabase(json);
      await window.state.refreshAllData();
      if (window.notifications) window.notifications.showToast('Backup restored successfully! 🎉');
      this.render(document.getElementById('view-content'));
    } catch (err) {
      alert('Failed to import backup: ' + err.message);
    }
  }

  static async resetLocalData() {
    if (confirm('Are you sure you want to reset and delete all local trackers, tasks and habits? This cannot be undone!')) {
      await window.db.clear('trackers');
      await window.db.clear('tasks');
      await window.db.clear('habits');
      await window.db.clear('habit_logs');
      await window.db.clear('goals');
      await window.db.clear('projects');
      await window.db.clear('notes');
      await window.state.refreshAllData();
      if (window.notifications) window.notifications.showToast('All local data cleared.');
      window.location.hash = '#dashboard';
    }
  }
}

window.SettingsView = SettingsView;
