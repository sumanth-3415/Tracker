/**
 * TrackMate - Dashboard View Renderer (With Dynamic User Activity Driven Avatar)
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
    const allTasks = window.state.tasks || [];
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

    // Active User Activities for Avatar Simulator
    const habits = window.state.habits || [];
    const habitLogs = window.state.habitLogs || [];

    // Combine user's habits and today's tasks into actionable items
    const userActivities = [];

    habits.forEach((h) => {
      const log = habitLogs.find((l) => l.habit_id === h.id && l.date === todayStr);
      const isDone = log ? log.completed : false;
      const animType = window.avatarSim ? window.avatarSim.detectActivityType(h.title) : 'general';
      userActivities.push({
        id: h.id,
        type: 'habit',
        title: h.title,
        emoji: h.emoji || '✨',
        animType,
        isCompleted: isDone,
        streak: h.current_streak || 0
      });
    });

    todayTasks.forEach((t) => {
      const animType = window.avatarSim ? window.avatarSim.detectActivityType(t.title, '', t.category, t.tags) : 'general';
      userActivities.push({
        id: t.id,
        type: 'task',
        title: t.title,
        emoji: '📝',
        animType,
        isCompleted: t.status === 'completed',
        priority: t.priority || 'medium'
      });
    });

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
      <!-- DYNAMIC LIVING AVATAR & REAL-WORLD ACTIVITY SIMULATOR                     -->
      <!-- ========================================================================= -->
      <div class="avatar-simulator-card">
        <div class="avatar-sim-header">
          <div class="avatar-sim-title">
            <span>✨</span> Interactive Living Avatar
          </div>
          <div style="font-size: 11px; color: var(--text-muted);">
            Completing any activity below automatically triggers its physical animation!
          </div>
        </div>

        <div class="avatar-sim-grid">
          <!-- Left: Canvas Simulation Arena -->
          <div class="avatar-stage-box">
            <div id="avatar-active-action-badge" class="sim-active-badge">
              <span style="color: var(--accent-emerald);">●</span> Live Physiological Avatar
            </div>
            <canvas id="avatar-canvas" class="avatar-canvas"></canvas>
          </div>

          <!-- Right: Dynamic User Activities List -->
          <div class="action-loggers-pad">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 2px;">
              <span style="font-size: var(--text-xs); font-weight: 700; color: var(--text-primary); text-transform: uppercase; letter-spacing: 0.05em;">
                ⚡ Your Active Activities & Routines
              </span>
              <button class="btn btn-sm btn-ghost" onclick="window.app.openQuickAddModal()" style="font-size: 11px; padding: 2px 6px;">
                + Add New
              </button>
            </div>

            <div style="display: flex; flex-direction: column; gap: var(--space-2); max-height: 240px; overflow-y: auto;">
              ${
                userActivities.length === 0
                  ? `
                    <div style="text-align: center; padding: 2rem; background: var(--bg-primary); border-radius: var(--radius-lg); border: 1px dashed var(--border-subtle);">
                      <div style="font-size: 24px; margin-bottom: 6px;">🎯</div>
                      <div style="font-size: 13px; font-weight: 600; color: var(--text-primary);">No activities added yet</div>
                      <div style="font-size: 11px; color: var(--text-muted); margin-top: 4px; margin-bottom: 12px;">Add any task or habit (e.g. "Drink Water", "Morning Walk", "Study Java") to see your avatar perform it!</div>
                      <button class="btn btn-sm btn-primary" onclick="window.app.openQuickAddModal()">+ Add Your First Activity</button>
                    </div>
                  `
                  : userActivities.map((act) => {
                      const badgeIcon = act.animType === 'drinking' ? '💧 Water'
                        : (act.animType === 'walking' ? '🚶 Walk'
                        : (act.animType === 'workout' ? '🏋️ Workout'
                        : (act.animType === 'studying' ? '🧠 Study'
                        : (act.animType === 'recharge' ? '🌙 Rest' : '✨ Activity'))));

                      return `
                        <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px 14px; background: var(--bg-primary); border-radius: var(--radius-md); border: 1px solid var(--border-subtle); gap: 10px;">
                          <div style="display: flex; align-items: center; gap: 10px; min-width: 0;">
                            <span style="font-size: 18px;">${act.emoji}</span>
                            <div style="min-width: 0;">
                              <div style="font-size: 13px; font-weight: 600; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                                ${act.title}
                              </div>
                              <div style="display: flex; align-items: center; gap: 6px; margin-top: 2px;">
                                <span class="badge" style="font-size: 10px; padding: 1px 6px; background: rgba(99, 102, 241, 0.15); color: #818cf8;">${badgeIcon}</span>
                                ${act.streak ? `<span style="font-size: 10px; color: #f59e0b;">🔥 ${act.streak}d</span>` : ''}
                              </div>
                            </div>
                          </div>

                          <button class="btn btn-sm ${act.isCompleted ? 'btn-secondary' : 'btn-primary'}"
                                  style="font-size: 11px; padding: 6px 12px; white-space: nowrap;"
                                  onclick="window.DashboardView.handleActivityClick('${act.id}', '${act.type}', '${act.title.replace(/'/g, "\\'")}', '${act.animType}')">
                            ${act.isCompleted ? '✓ Done' : '▶ Animate'}
                          </button>
                        </div>
                      `;
                    }).join('')
              }
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
                        <div class="dash-checkbox ${task.status === 'completed' ? 'checked' : ''}" onclick="window.DashboardView.handleTaskCheck('${task.id}', '${task.title.replace(/'/g, "\\'")}', ${task.status !== 'completed'})">
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
                <span>🔥</span> Daily Habits (${habits.length})
              </h2>
              <a href="#habits" class="btn btn-sm btn-ghost">View All →</a>
            </div>

            <div class="habits-container">
              ${
                habits.length === 0
                  ? `<div style="text-align: center; padding: 1.5rem; color: var(--text-muted);">No habits created yet.</div>`
                  : habits.slice(0, 4).map((habit) => {
                      const log = habitLogs.find((l) => l.habit_id === habit.id && l.date === todayStr);
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
                          <button class="habit-check-circle ${isDone ? 'completed' : ''}" onclick="window.DashboardView.handleHabitCheck('${habit.id}', '${habit.title.replace(/'/g, "\\'")}', '${todayStr}')">
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

    // Initialize Avatar Simulator Canvas
    setTimeout(() => {
      if (window.avatarSim) {
        window.avatarSim.initCanvas('avatar-canvas');
      }

      // Render Weekly Chart
      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      const values = [5, 8, 6, 9, 7, 4, completedTasks.length || 6];
      window.Charts.renderBarChart('dash-weekly-chart', { labels: days, values });
    }, 50);
  }

  // Handle activity click directly from Avatar Pad
  static async handleActivityClick(id, type, title, animType) {
    if (window.avatarSim) {
      window.avatarSim.triggerActivity(title, animType);
    }

    const todayStr = new Date().toISOString().split('T')[0];
    if (type === 'habit') {
      await window.state.toggleHabitDate(id, todayStr);
    } else {
      await window.state.toggleTaskCompletion(id, true);
    }
  }

  // Handle task checkbox with automatic avatar animation trigger
  static async handleTaskCheck(taskId, title, isCompleted) {
    if (isCompleted && window.avatarSim) {
      window.avatarSim.triggerActivity(title);
    }
    await window.state.toggleTaskCompletion(taskId, isCompleted);
  }

  // Handle habit check with automatic avatar animation trigger
  static async handleHabitCheck(habitId, title, dateStr) {
    if (window.avatarSim) {
      window.avatarSim.triggerActivity(title);
    }
    await window.state.toggleHabitDate(habitId, dateStr);
  }
}

window.DashboardView = DashboardView;
