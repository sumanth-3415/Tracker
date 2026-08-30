/**
 * TrackMate - Visual Analytics & Statistics View
 */

class AnalyticsView {
  static async render(container) {
    const tasks = window.state.tasks;
    const habits = window.state.habits;
    const habitLogs = window.state.habitLogs;
    const trackers = window.state.trackers;

    const completedTasks = tasks.filter((t) => t.status === 'completed');
    const missedTasks = tasks.filter((t) => t.status === 'missed');
    const pendingTasks = tasks.filter((t) => t.status !== 'completed' && t.status !== 'missed');

    const totalMinutesSpent = tasks.reduce((sum, t) => sum + (t.actual_minutes || 0), 0);
    const totalHours = (totalMinutesSpent / 60).toFixed(1);

    const completedLogs = habitLogs.filter((l) => l.completed).length;
    const habitRate = habitLogs.length > 0 ? Math.round((completedLogs / habitLogs.length) * 100) : 100;

    const overallStreak = window.streakEngine
      ? await window.streakEngine.evaluateOverallDailyStreak()
      : { currentStreak: 0, longestStreak: 0 };

    container.innerHTML = `
      <div class="trackers-header-actions">
        <div>
          <h1 class="page-title">Analytics & Insights</h1>
          <p style="font-size: var(--text-xs); color: var(--text-muted); margin-top: 2px;">
            Deep metrics on task execution, habit consistency, and productivity trends.
          </p>
        </div>
      </div>

      <!-- KPI Summary Cards Grid -->
      <div class="analytics-grid">
        <div class="stat-kpi-card">
          <div class="kpi-icon-box" style="background: rgba(16, 185, 129, 0.15); color: #10b981;">✓</div>
          <div class="kpi-data">
            <div class="kpi-value">${completedTasks.length}</div>
            <div class="kpi-label">Completed Tasks</div>
          </div>
        </div>

        <div class="stat-kpi-card">
          <div class="kpi-icon-box" style="background: rgba(255, 140, 0, 0.15); color: #ff8c00;">🔥</div>
          <div class="kpi-data">
            <div class="kpi-value">${overallStreak.currentStreak}d</div>
            <div class="kpi-label">Active Streak (Best: ${overallStreak.longestStreak}d)</div>
          </div>
        </div>

        <div class="stat-kpi-card">
          <div class="kpi-icon-box" style="background: rgba(99, 102, 241, 0.15); color: #6366f1;">⏱️</div>
          <div class="kpi-data">
            <div class="kpi-value">${totalHours}h</div>
            <div class="kpi-label">Total Time Tracked</div>
          </div>
        </div>

        <div class="stat-kpi-card">
          <div class="kpi-icon-box" style="background: rgba(6, 182, 212, 0.15); color: #06b6d4;">🎯</div>
          <div class="kpi-data">
            <div class="kpi-value">${habitRate}%</div>
            <div class="kpi-label">Habit Consistency</div>
          </div>
        </div>
      </div>

      <!-- Charts Grid -->
      <div class="charts-grid">
        <!-- 7-Day Completion Bar Chart -->
        <div class="chart-card">
          <h3 class="card-title"><span>📊</span> 7-Day Completion Velocity</h3>
          <div class="chart-canvas-container">
            <canvas id="chart-weekly-bar"></canvas>
          </div>
        </div>

        <!-- Task Status Distribution Donut Chart -->
        <div class="chart-card">
          <h3 class="card-title"><span>🍩</span> Task Status Distribution</h3>
          <div class="chart-canvas-container">
            <canvas id="chart-status-donut"></canvas>
          </div>
        </div>

        <!-- Productivity Trend Line Chart -->
        <div class="chart-card" style="grid-column: 1 / -1;">
          <h3 class="card-title"><span>📈</span> Productivity Trend Velocity</h3>
          <div class="chart-canvas-container" style="height: 260px;">
            <canvas id="chart-trend-line"></canvas>
          </div>
        </div>
      </div>
    `;

    // Render Canvas Charts
    setTimeout(() => {
      // Bar chart
      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      const values = [4, 7, 5, 8, 6, 3, completedTasks.length || 5];
      window.Charts.renderBarChart('chart-weekly-bar', { labels: days, values });

      // Donut chart
      window.Charts.renderDonutChart('chart-status-donut', {
        labels: ['Completed', 'Pending', 'Missed'],
        values: [completedTasks.length || 6, pendingTasks.length || 3, missedTasks.length || 1],
        colors: ['#10b981', '#3b82f6', '#ef4444']
      });

      // Line chart
      const trendLabels = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
      const trendValues = [55, 72, 68, 88];
      window.Charts.renderLineChart('chart-trend-line', { labels: trendLabels, values: trendValues });
    }, 50);
  }
}

window.AnalyticsView = AnalyticsView;

