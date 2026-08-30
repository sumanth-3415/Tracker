/**
 * TrackMate - Dashboard View Renderer (With RPG Gamification, Focus Room & Avatar Simulator)
 */

class DashboardView {
  static async render(container) {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    // Format greeting
    const hour = now.getHours();
    let greeting = 'Good morning 👋';
    if (hour >= 12 && hour < 17) greeting = 'Good afternoon ☀️';
    else if (hour >= 17) greeting = 'Good evening 🌙';

    const dateOptions = { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' };
    const formattedDate = now.toLocaleDateString('en-US', dateOptions);

    // Compute Today's Tasks
    const allTasks = window.state.tasks;
    const todayTasks = window.RecurringEngine
      ? window.RecurringEngine.getTasksForDate(allTasks, todayStr)
      : allTasks.filter((t) => t.due_date === todayStr);

    const completedTasks = todayTasks.filter((t) => t.status === 'completed');
    const completionPct = todayTasks.length > 0
      ? Math.round((completedTasks.length / todayTasks.length) * 100)
      : 100;

    // Gamification & Daily Quote
    const dailyQuote = window.gamification ? window.gamification.getDailyQuote() : { quote: 'Excellence is a habit.', author: 'Aristotle' };
    const userLevel = window.gamification ? window.gamification.level : 1;
    const rankTitle = window.gamification ? window.gamification.getRankTitle(userLevel) : '🌱 Novice Explorer';
    const currentLevelXP = window.gamification ? window.gamification.currentLevelXP : 0;
    const vitalityScore = window.gamification ? await window.gamification.calculateVitalityScore() : 80;

    // Compute Overall Streaks
    const streakInfo = window.streakEngine
      ? await window.streakEngine.evaluateOverallDailyStreak()
      : { currentStreak: 0, longestStreak: 0 };

    const radius = 38;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (completionPct / 100) * circumference;

    container.innerHTML = `
      <!-- Daily Motivational Quote Banner -->
      <div class="daily-quote-card">
        <div class="quote-icon-box">✨</div>
        <div>
          <div class="quote-text">“${dailyQuote.quote}”</div>
          <div class="quote-author">— ${dailyQuote.author}</div>
        </div>
      </div>

      <!-- RPG Level & XP Progression Banner -->
      <div class="xp-level-container">
        <div class="level-badge-group">
          <div class="level-shield">
            <span class="level-shield-num" id="user-level-num">${userLevel}</span>
            <span class="level-shield-lbl">LVL</span>
          </div>
          <div>
            <div class="level-title-text" id="user-rank-title">${rankTitle}</div>
            <div class="level-rank-title">⚡ Productivity Rank</div>
          </div>
        </div>

        <div class="xp-bar-wrapper">
          <div class="xp-bar-info">
            <span>XP Progress to Next Level</span>
            <span id="user-xp-txt">${currentLevelXP} / 100 XP</span>
          </div>
          <div class="xp-bar-track">
            <div id="user-xp-fill" class="xp-bar-fill" style="width: ${currentLevelXP}%;"></div>
          </div>
        </div>

        <div class="xp-buttons-group">
          <button class="btn btn-sm btn-primary" onclick="window.focusRoom.openFocusRoom()" title="Launch Pomodoro Focus Mode with Ambient Soundscapes">
            🎧 Cozy Focus Room
          </button>
          <button class="btn btn-sm btn-outline" onclick="window.gamification.generateShareCard()" title="Generate Instagram/WhatsApp Story Card">
            📸 Share Story Card
          </button>
        </div>
      </div>

      <!-- Dashboard Hero -->
      <div class="dashboard-hero">
        <div>
          <h1 class="greeting-text">${greeting}</h1>
          <div class="today-date-text">
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
            </svg>
            <span>${formattedDate}</span>
          </div>
        </div>

        <div class="hero-stats-row">
          <div class="hero-progress-block">
            <div class="progress-ring-container">
              <svg width="90" height="90">
                <circle class="progress-ring-bg" stroke-width="8" fill="transparent" r="${radius}" cx="45" cy="45" />
                <circle class="progress-ring-circle" stroke="#6366f1" stroke-width="8" stroke-linecap="round" fill="transparent"
                  r="${radius}" cx="45" cy="45" style="stroke-dasharray: ${circumference}; stroke-dashoffset: ${strokeDashoffset};" />
              </svg>
              <div class="progress-ring-text">${completionPct}%</div>
            </div>
            <div class="hero-progress-info">
              <span class="hero-progress-num">${completedTasks.length} / ${todayTasks.length}</span>
              <span class="hero-progress-label">Tasks Completed</span>
            </div>
          </div>
        </div>
      </div>

      <!-- ========================================================================= -->
      <!-- INTERACTIVE LIVING AVATAR & REAL-WORLD ACTION SIMULATOR                   -->
      <!-- ========================================================================= -->
      <div class="avatar-simulator-card">
        <div class="avatar-sim-header">
          <div class="avatar-sim-title">
            <span>✨</span> Interactive Life Avatar & Action Simulator
          </div>
          <div style="font-size: 11px; color: var(--text-muted);">
            Log real physical actions below to see live physical animations!
          </div>
        </div>

        <div class="avatar-sim-grid">
          <!-- Left: Canvas Simulation Arena -->
          <div class="avatar-stage-box">
            <div class="sim-active-badge">
              <span style="color: var(--accent-emerald);">●</span> Live Physiological Avatar
            </div>
            <canvas id="avatar-canvas" class="avatar-canvas"></canvas>
          </div>

          <!-- Right: Real-World Action Loggers & Live Meters -->
          <div class="action-loggers-pad">
            <!-- Hydration Metric -->
            <div class="sim-metric-group">
              <div class="sim-metric-top">
                <span style="color: #06b6d4;">💧 Hydration Level</span>
                <span id="sim-water-txt" style="font-family: var(--font-mono); color: #06b6d4;">1250 / 2500 ml (50%)</span>
              </div>
              <div class="sim-progress-track">
                <div id="sim-water-fill" class="sim-progress-fill fill-water" style="width: 50%;"></div>
              </div>
              <div class="action-buttons-row">
                <button class="btn-sim-action btn-sim-water" onclick="window.avatarSim.triggerDrink(250)">+250ml Glass 💧</button>
                <button class="btn-sim-action btn-sim-water" onclick="window.avatarSim.triggerDrink(500)">+500ml Bottle 🌊</button>
              </div>
            </div>

            <!-- Steps / Walking Metric -->
            <div class="sim-metric-group">
              <div class="sim-metric-top">
                <span style="color: #10b981;">🚶 Steps & Movement</span>
                <span id="sim-walk-txt" style="font-family: var(--font-mono); color: #10b981;">4500 / 10000 steps (45%)</span>
              </div>
              <div class="sim-progress-track">
                <div id="sim-walk-fill" class="sim-progress-fill fill-walk" style="width: 45%;"></div>
              </div>
              <div class="action-buttons-row">
                <button class="btn-sim-action btn-sim-walk" onclick="window.avatarSim.triggerWalk(1000)">+1,000 Steps 👟</button>
                <button class="btn-sim-action btn-sim-walk" onclick="window.avatarSim.triggerWalk(2500)">+2,500 Walk 🏃</button>
              </div>
            </div>

            <!-- Workout Reps Metric -->
            <div class="sim-metric-group">
              <div class="sim-metric-top">
                <span style="color: #f97316;">🏋️ Strength & Workout</span>
                <span id="sim-workout-txt" style="font-family: var(--font-mono); color: #f97316;">25 / 50 reps (50%)</span>
              </div>
              <div class="sim-progress-track">
                <div id="sim-workout-fill" class="sim-progress-fill fill-workout" style="width: 50%;"></div>
              </div>
              <div class="action-buttons-row">
                <button class="btn-sim-action btn-sim-workout" onclick="window.avatarSim.triggerWorkout(10)">+10 Reps 💪</button>
                <button class="btn-sim-action btn-sim-workout" onclick="window.avatarSim.triggerWorkout(25)">+25 Pushups / Dumbbell 🔥</button>
              </div>
            </div>

            <!-- Study Focus Metric -->
            <div class="sim-metric-group">
              <div class="sim-metric-top">
                <span style="color: #8b5cf6;">🧠 Study & Brain Focus</span>
                <span id="sim-study-txt" style="font-family: var(--font-mono); color: #8b5cf6;">45 / 90 mins (50%)</span>
              </div>
              <div class="sim-progress-track">
                <div id="sim-study-fill" class="sim-progress-fill fill-brain" style="width: 50%;"></div>
              </div>
              <div class="action-buttons-row">
                <button class="btn-sim-action btn-sim-brain" onclick="window.avatarSim.triggerStudy(30)">+30m Study 📚</button>
                <button class="btn-sim-action btn-sim-brain" onclick="window.avatarSim.triggerStudy(60)">+60m Deep Focus 💻</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Streak Flame Banner Card & Daily Vitality Gauge -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: var(--space-4); margin-bottom: var(--space-6);">
        <!-- Streak Card -->
        <div class="streak-card" style="margin-bottom: 0;">
          <div class="streak-info-left">
            <div class="streak-flame-icon">🔥</div>
            <div>
              <div class="streak-title">${streakInfo.currentStreak} Day Streak!</div>
              <div class="streak-subtitle">Personal Best: 🏆 ${streakInfo.longestStreak} days</div>
            </div>
          </div>
          <div class="streak-milestone-pill">
            ${streakInfo.currentStreak >= 7 ? '⭐ Streak Master' : '🚀 Keep Going!'}
          </div>
        </div>

        <!-- Vitality Score Card -->
        <div class="vitality-card">
          <div class="vitality-left">
            <div class="vitality-icon">⚡</div>
            <div>
              <div class="vitality-val">${vitalityScore}%</div>
              <div class="vitality-lbl">Daily Vitality & Energy Score</div>
            </div>
          </div>
          <div class="badge" style="background: rgba(16, 185, 129, 0.2); color: #10b981; font-weight: 700;">
            ${vitalityScore >= 80 ? '⚡ Peak Flow' : '🌱 Building Up'}
          </div>
        </div>
      </div>

      <!-- Main Dashboard Grid -->
      <div class="dashboard-grid">
        <!-- Today's Tasks Widget -->
        <div class="widget-span-8">
          <div class="card">
            <div class="card-header">
              <h2 class="card-title">
                <span>📝</span> Today's Tasks (${todayTasks.length})
              </h2>
              <button class="btn btn-sm btn-primary" onclick="window.app.openQuickAddModal()">
                + Add Task
              </button>
            </div>

            <div id="dash-tasks-list" class="tasks-list-container">
              ${
                todayTasks.length === 0
                  ? `<div style="text-align: center; padding: 2rem; color: var(--text-muted);">
                       <div style="font-size: 2rem; margin-bottom: 0.5rem;">🎉</div>
                       <div>No tasks scheduled for today! Enjoy your day or add one.</div>
                     </div>`
                  : todayTasks.map((task) => `
                    <div class="dash-task-item ${task.status === 'completed' ? 'completed' : ''}" data-task-id="${task.id}">
                      <div class="dash-task-left">
                        <div class="dash-checkbox ${task.status === 'completed' ? 'checked' : ''}" onclick="window.state.toggleTaskCompletion('${task.id}', ${task.status !== 'completed'})">
                          ${task.status === 'completed' ? '✓' : ''}
                        </div>
                        <div class="dash-task-title">${task.title}</div>
                      </div>
                      <div style="display: flex; align-items: center; gap: 8px;">
                        <span class="badge badge-${task.priority || 'medium'}">${task.priority || 'medium'}</span>
                        ${task.due_time ? `<span style="font-size: 11px; color: var(--text-muted); font-family: var(--font-mono);">${task.due_time}</span>` : ''}
                      </div>
                    </div>
                  `).join('')
              }
            </div>
          </div>
        </div>

        <!-- Today's Habits Widget -->
        <div class="widget-span-4">
          <div class="card">
            <div class="card-header">
              <h2 class="card-title">
                <span>🔥</span> Daily Habits (${window.state.habits.length})
              </h2>
              <a href="#habits" class="btn btn-sm btn-ghost">View All →</a>
            </div>

            <div class="habits-container">
              ${
                window.state.habits.length === 0
                  ? `<div style="text-align: center; padding: 1.5rem; color: var(--text-muted);">No habits created yet.</div>`
                  : window.state.habits.slice(0, 4).map((habit) => {
                      const log = window.state.habitLogs.find((l) => l.habit_id === habit.id && l.date === todayStr);
                      const isDone = log ? log.completed : false;
                      return `
                        <div style="display: flex; align-items: center; justify-content: space-between; padding: 8px 12px; background: var(--bg-primary); border-radius: var(--radius-md); border: 1px solid var(--border-subtle);">
                          <div style="display: flex; align-items: center; gap: 10px;">
                            <span style="font-size: 20px;">${habit.emoji || '✨'}</span>
                            <div>
                              <div style="font-size: 13px; font-weight: 600; color: var(--text-primary);">${habit.title}</div>
                              <div style="font-size: 11px; color: #ff8c00;">🔥 ${habit.current_streak || 0} days</div>
                            </div>
                          </div>
                          <button class="habit-check-circle ${isDone ? 'completed' : ''}" onclick="window.state.toggleHabitDate('${habit.id}', '${todayStr}')">
                            ${isDone ? '✓' : ''}
                          </button>
                        </div>
                      `;
                    }).join('')
              }
            </div>
          </div>
        </div>

        <!-- Quick Productivity Analytics Summary Widget -->
        <div class="widget-span-12">
          <div class="card">
            <div class="card-header">
              <h2 class="card-title">
                <span>📊</span> Weekly Productivity Snapshot
              </h2>
              <a href="#analytics" class="btn btn-sm btn-outline">Full Analytics →</a>
            </div>
            <div class="chart-canvas-container" style="height: 180px;">
              <canvas id="dash-weekly-chart"></canvas>
            </div>
          </div>
        </div>
      </div>
    `;

    // Initialize Avatar Simulator Canvas & Metrics
    setTimeout(() => {
      if (window.avatarSim) {
        window.avatarSim.initCanvas('avatar-canvas');
        window.avatarSim.updateUIMetrics();
      }

      // Render Weekly Chart
      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      const values = [5, 8, 6, 9, 7, 4, completedTasks.length || 6];
      window.Charts.renderBarChart('dash-weekly-chart', { labels: days, values });
    }, 50);
  }
}

window.DashboardView = DashboardView;
