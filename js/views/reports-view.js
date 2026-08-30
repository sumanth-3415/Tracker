/**
 * TrackMate - Reports View with Daily, Weekly & Monthly Report Selectors
 */

class ReportsView {
  static currentTab = 'daily'; // 'daily' | 'weekly' | 'monthly'
  static selectedDate = new Date().toISOString().split('T')[0];

  static async render(container) {
    const overallStreak = window.streakEngine
      ? await window.streakEngine.evaluateOverallDailyStreak()
      : { currentStreak: 0, longestStreak: 0 };

    container.innerHTML = `
      <div class="reports-header-box">
        <div>
          <h1 class="page-title" style="color: var(--text-primary);">Productivity Reports & Messaging</h1>
          <p style="font-size: var(--text-xs); color: var(--text-muted); margin-top: 4px;">
            Automated Daily task completion summaries, Weekly performance digests, and Monthly reviews.
          </p>
        </div>

        <!-- Interval Tabs Selector -->
        <div class="calendar-view-type-tabs">
          <button class="cal-tab-btn ${this.currentTab === 'daily' ? 'active' : ''}" onclick="window.ReportsView.switchTab('daily')">📅 Daily</button>
          <button class="cal-tab-btn ${this.currentTab === 'weekly' ? 'active' : ''}" onclick="window.ReportsView.switchTab('weekly')">📊 Weekly</button>
          <button class="cal-tab-btn ${this.currentTab === 'monthly' ? 'active' : ''}" onclick="window.ReportsView.switchTab('monthly')">🏆 Monthly</button>
        </div>
      </div>

      <div id="report-content-container">
        <!-- Rendered dynamically by selected tab -->
      </div>

      <!-- Gmail Summary Modal -->
      <div id="gmail-modal" class="modal-overlay">
        <div class="modal-container">
          <div class="modal-header">
            <h2 id="gmail-modal-title" class="modal-title">✉️ Send Report Summary</h2>
            <button class="btn-icon" onclick="document.getElementById('gmail-modal').classList.remove('active')">✕</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label class="form-label">Recipient Email Address</label>
              <input type="email" id="gmail-recipient-input" class="form-control"
                     placeholder="e.g. yourname@gmail.com"
                     value="${localStorage.getItem(CONFIG.STORAGE_KEYS.GUEST_USER_EMAIL) || window.state.userProfile?.settings?.report_recipient_email || ''}">
            </div>
            <div class="form-group">
              <label class="form-label">Generated Report Preview</label>
              <textarea id="gmail-body-preview" class="form-textarea" style="height: 200px; font-family: var(--font-mono); font-size: 11px;" readonly></textarea>
            </div>
            <div style="display: flex; gap: 8px; flex-wrap: wrap;">
              <button class="btn btn-primary" onclick="window.ReportsView.dispatchGmail()">🚀 Open in Gmail Composer</button>
              <button class="btn btn-outline" onclick="window.ReportsView.dispatchMailto()">📧 Open Default Mail Client</button>
              <button class="btn btn-secondary" onclick="window.ReportsView.copyGmailText()">📋 Copy Text</button>
            </div>
          </div>
        </div>
      </div>
    `;

    await this.renderCurrentTab();
  }

  static switchTab(tab) {
    this.currentTab = tab;
    this.render(document.getElementById('view-content'));
  }

  static async renderCurrentTab() {
    const container = document.getElementById('report-content-container');
    if (!container) return;

    if (this.currentTab === 'daily') {
      const report = await window.ReportsEngine.compileDailyReport(this.selectedDate);
      container.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: var(--space-4); flex-wrap: wrap; gap: 10px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <label class="form-label" style="margin: 0;">Select Date:</label>
            <input type="date" class="form-control" value="${this.selectedDate}" onchange="window.ReportsView.handleDateChange(this.value)" style="width: auto;">
          </div>
          <div style="display: flex; gap: 8px;">
            <button class="btn btn-primary" onclick="window.ReportsEngine.exportExcelReport('daily', '${this.selectedDate}')">📊 Download Excel (.CSV)</button>
            <button class="btn btn-outline" onclick="window.ReportsView.openGmailModal('daily')">✉️ Send Daily Summary</button>
          </div>
        </div>

        <!-- Daily KPIs -->
        <div class="analytics-grid" style="margin-bottom: var(--space-6);">
          <div class="stat-kpi-card">
            <div class="kpi-data">
              <div class="kpi-value">${report.completionRate}%</div>
              <div class="kpi-label">Completion Rate</div>
            </div>
          </div>
          <div class="stat-kpi-card">
            <div class="kpi-data">
              <div class="kpi-value">${report.completedTasks.length} / ${report.tasks.length}</div>
              <div class="kpi-label">Tasks Completed</div>
            </div>
          </div>
          <div class="stat-kpi-card">
            <div class="kpi-data">
              <div class="kpi-value">${report.completedHabitsCount} / ${report.totalHabitsCount}</div>
              <div class="kpi-label">Habits Done</div>
            </div>
          </div>
          <div class="stat-kpi-card">
            <div class="kpi-data">
              <div class="kpi-value">${report.timeSpentFormatted}</div>
              <div class="kpi-label">Time Tracked</div>
            </div>
          </div>
        </div>

        <!-- Daily Table -->
        <div class="card">
          <div class="card-header">
            <h3 class="card-title"><span>📋</span> Daily Task & Habit Breakdown (${report.date})</h3>
          </div>
          <div class="report-table-wrapper">
            <table class="report-table">
              <thead>
                <tr>
                  <th>Tracker</th>
                  <th>Title</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Priority</th>
                  <th>Time Spent</th>
                </tr>
              </thead>
              <tbody>
                ${
                  report.tasks.length === 0 && report.habits.length === 0
                    ? `<tr><td colspan="6" style="text-align: center; padding: 2rem; color: var(--text-muted);">No entries recorded for this date.</td></tr>`
                    : `
                      ${report.tasks.map((t) => `
                        <tr>
                          <td>${report.trackerMap.get(t.tracker_id) || 'General'}</td>
                          <td style="font-weight: 600;">${t.title}</td>
                          <td><span class="badge" style="background: var(--bg-tertiary);">Task</span></td>
                          <td><span class="badge badge-${t.status === 'completed' ? 'completed' : 'pending'}">${t.status}</span></td>
                          <td><span class="badge badge-${t.priority || 'medium'}">${t.priority || 'medium'}</span></td>
                          <td>${t.actual_minutes || 0}m</td>
                        </tr>
                      `).join('')}
                      ${report.habits.map((h) => `
                        <tr>
                          <td>${h.tracker_name}</td>
                          <td style="font-weight: 600;">[Habit] ${h.habit_name}</td>
                          <td><span class="badge" style="background: rgba(255, 140, 0, 0.2); color: #ff8c00;">Habit</span></td>
                          <td><span class="badge badge-${h.is_completed ? 'completed' : 'missed'}">${h.is_completed ? 'Completed' : 'Incomplete'}</span></td>
                          <td>Medium</td>
                          <td>-</td>
                        </tr>
                      `).join('')}
                    `
                }
              </tbody>
            </table>
          </div>
        </div>
      `;
    } else if (this.currentTab === 'weekly') {
      const report = await window.ReportsEngine.compileWeeklyReport(this.selectedDate);
      container.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: var(--space-4); flex-wrap: wrap; gap: 10px;">
          <div><strong>Week Period:</strong> ${report.dateRange}</div>
          <div style="display: flex; gap: 8px;">
            <button class="btn btn-primary" onclick="window.ReportsEngine.exportExcelReport('weekly', '${this.selectedDate}')">📊 Download Excel (.CSV)</button>
            <button class="btn btn-outline" onclick="window.ReportsView.openGmailModal('weekly')">✉️ Send Weekly Summary</button>
          </div>
        </div>

        <!-- Weekly KPIs -->
        <div class="analytics-grid" style="margin-bottom: var(--space-6);">
          <div class="stat-kpi-card">
            <div class="kpi-data">
              <div class="kpi-value">${report.completionRate}%</div>
              <div class="kpi-label">Weekly Success Rate</div>
            </div>
          </div>
          <div class="stat-kpi-card">
            <div class="kpi-data">
              <div class="kpi-value">${report.totalCompleted} / ${report.totalTasks}</div>
              <div class="kpi-label">Total Tasks Finished</div>
            </div>
          </div>
          <div class="stat-kpi-card">
            <div class="kpi-data">
              <div class="kpi-value">${report.bestDay}</div>
              <div class="kpi-label">Most Productive Day</div>
            </div>
          </div>
          <div class="stat-kpi-card">
            <div class="kpi-data">
              <div class="kpi-value">${report.timeSpentFormatted}</div>
              <div class="kpi-label">Total Time Invested</div>
            </div>
          </div>
        </div>

        <!-- Day-by-Day Table -->
        <div class="card">
          <div class="card-header">
            <h3 class="card-title"><span>📅</span> 7-Day Performance Breakdown</h3>
          </div>
          <div class="report-table-wrapper">
            <table class="report-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Day</th>
                  <th>Tasks Scheduled</th>
                  <th>Completed</th>
                  <th>Success Rate</th>
                  <th>Time Tracked</th>
                </tr>
              </thead>
              <tbody>
                ${report.dayBreakdowns.map((d) => `
                  <tr>
                    <td>${d.date}</td>
                    <td style="font-weight: 700;">${d.dayName}</td>
                    <td>${d.tasksCount}</td>
                    <td style="font-weight: 600; color: #10b981;">${d.completedCount}</td>
                    <td><span class="badge badge-${d.rate >= 75 ? 'completed' : 'pending'}">${d.rate}%</span></td>
                    <td>${Math.round(d.timeSpentMins / 60)}h ${d.timeSpentMins % 60}m</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;
    } else if (this.currentTab === 'monthly') {
      const report = await window.ReportsEngine.compileMonthlyReport();
      container.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: var(--space-4); flex-wrap: wrap; gap: 10px;">
          <div><strong>Month:</strong> ${report.monthTitle} (${report.dateRange})</div>
          <div style="display: flex; gap: 8px;">
            <button class="btn btn-primary" onclick="window.ReportsEngine.exportExcelReport('monthly')">📊 Download Excel (.CSV)</button>
            <button class="btn btn-outline" onclick="window.ReportsView.openGmailModal('monthly')">✉️ Send Monthly Digest</button>
          </div>
        </div>

        <!-- Monthly KPIs -->
        <div class="analytics-grid" style="margin-bottom: var(--space-6);">
          <div class="stat-kpi-card">
            <div class="kpi-data">
              <div class="kpi-value">${report.completionRate}%</div>
              <div class="kpi-label">Monthly Completion Velocity</div>
            </div>
          </div>
          <div class="stat-kpi-card">
            <div class="kpi-data">
              <div class="kpi-value">${report.totalCompleted} / ${report.totalTasks}</div>
              <div class="kpi-label">Total Monthly Tasks</div>
            </div>
          </div>
          <div class="stat-kpi-card">
            <div class="kpi-data">
              <div class="kpi-value">${report.timeSpentFormatted}</div>
              <div class="kpi-label">Monthly Hours Invested</div>
            </div>
          </div>
          <div class="stat-kpi-card">
            <div class="kpi-data">
              <div class="kpi-value">${report.trackersCount}</div>
              <div class="kpi-label">Active Trackers Managed</div>
            </div>
          </div>
        </div>
      `;
    }
  }

  static async handleDateChange(newDate) {
    this.selectedDate = newDate;
    await this.renderCurrentTab();
  }

  static async openGmailModal(type = 'daily') {
    const modal = document.getElementById('gmail-modal');
    const titleEl = document.getElementById('gmail-modal-title');
    const previewEl = document.getElementById('gmail-body-preview');

    titleEl.textContent = `✉️ Send ${type.toUpperCase()} Summary`;
    const { body } = await window.ReportsEngine.generateEmailSummary(type, this.selectedDate);
    previewEl.value = body;
    modal.dataset.reportType = type;
    modal.classList.add('active');
  }

  static dispatchGmail() {
    const modal = document.getElementById('gmail-modal');
    const type = modal.dataset.reportType || 'daily';
    const email = document.getElementById('gmail-recipient-input').value;
    if (email) localStorage.setItem(CONFIG.STORAGE_KEYS.GUEST_USER_EMAIL, email);
    window.ReportsEngine.sendViaGmail(type, email, this.selectedDate);
    modal.classList.remove('active');
  }

  static dispatchMailto() {
    const modal = document.getElementById('gmail-modal');
    const type = modal.dataset.reportType || 'daily';
    const email = document.getElementById('gmail-recipient-input').value;
    if (email) localStorage.setItem(CONFIG.STORAGE_KEYS.GUEST_USER_EMAIL, email);
    window.ReportsEngine.sendViaMailto(type, email, this.selectedDate);
    modal.classList.remove('active');
  }

  static copyGmailText() {
    const preview = document.getElementById('gmail-body-preview');
    navigator.clipboard.writeText(preview.value);
    if (window.notifications) {
      window.notifications.showToast('Report text copied to clipboard! 📋');
    }
  }
}

window.ReportsView = ReportsView;
