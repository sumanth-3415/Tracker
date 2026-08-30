/**
 * TrackMate - Habits View & Gamified Streak Tracker
 */

class HabitsView {
  static async render(container) {
    const habits = window.state.habits;
    const trackers = window.state.trackers;
    const habitLogs = window.state.habitLogs;

    const trackerMap = new Map();
    trackers.forEach((t) => trackerMap.set(t.id, t));

    // Get current week's dates (Monday to Sunday)
    const today = new Date();
    const currentDay = today.getDay(); // 0 is Sun, 1 is Mon...
    const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay;

    const weekDays = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + mondayOffset + i);
      const dateStr = d.toISOString().split('T')[0];
      const dayLetters = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
      weekDays.push({
        name: dayLetters[i],
        date: dateStr,
        dayNum: d.getDate(),
        isToday: dateStr === today.toISOString().split('T')[0]
      });
    }

    // Heatmap data
    const heatmapCells = window.streakEngine
      ? await window.streakEngine.getHabitHeatmapData(91)
      : [];

    container.innerHTML = `
      <div class="trackers-header-actions">
        <div>
          <h1 class="page-title">Habits & Streaks</h1>
          <p style="font-size: var(--text-xs); color: var(--text-muted); margin-top: 2px;">
            Build lasting daily routines with streak motivation and grace periods.
          </p>
        </div>
        <button class="btn btn-primary" onclick="window.HabitsView.openHabitModal()">
          <span>+</span> Create Habit
        </button>
      </div>

      <!-- Habits List -->
      <div class="habits-container">
        ${
          habits.length === 0
            ? `<div style="text-align: center; padding: 3rem; background: var(--bg-secondary); border-radius: var(--radius-xl); border: 1px dashed var(--border-strong);">
                 <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">🔥</div>
                 <h3 style="font-size: var(--text-base); font-weight: 700;">No habits created yet</h3>
                 <p style="font-size: var(--text-xs); color: var(--text-muted); margin-top: 4px;">Start building a streak by adding a habit!</p>
               </div>`
            : habits.map((habit) => {
                const trk = trackerMap.get(habit.tracker_id);

                return `
                  <div class="habit-row-card">
                    <div class="habit-main-col">
                      <div class="habit-emoji-box">${habit.emoji || '✨'}</div>
                      <div class="habit-info-group">
                        <div class="habit-name">${habit.title}</div>
                        <div class="habit-target-freq">
                          ${trk ? `<span class="badge" style="background: ${trk.color}22; color: ${trk.color}; font-size: 10px; margin-right: 6px;">${trk.emoji} ${trk.name}</span>` : ''}
                          <span>${habit.target_frequency || 'Daily'}</span>
                          ${habit.reminder_time ? ` • ⏰ ${habit.reminder_time}` : ''}
                        </div>
                      </div>
                    </div>

                    <!-- 7-Day Bubbles -->
                    <div class="habit-days-row">
                      ${weekDays.map((wd) => {
                        const log = habitLogs.find((l) => l.habit_id === habit.id && l.date === wd.date);
                        const isDone = log ? log.completed : false;
                        return `
                          <div class="habit-day-bubble">
                            <span class="habit-day-name">${wd.name}</span>
                            <button class="habit-check-circle ${isDone ? 'completed' : ''} ${wd.isToday ? 'today' : ''}"
                              onclick="window.state.toggleHabitDate('${habit.id}', '${wd.date}')"
                              title="${wd.date}">
                              ${isDone ? '✓' : wd.dayNum}
                            </button>
                          </div>
                        `;
                      }).join('')}
                    </div>

                    <!-- Streak Badge & Actions -->
                    <div style="display: flex; align-items: center; gap: var(--space-4);">
                      <div class="habit-streak-badge">
                        <span class="habit-streak-fire">🔥</span>
                        <div>
                          <div class="habit-streak-count">${habit.current_streak || 0}d</div>
                          <div style="font-size: 10px; color: var(--text-muted);">Best: ${habit.longest_streak || 0}d</div>
                        </div>
                      </div>

                      <button class="btn-icon" title="Edit Habit" onclick="window.HabitsView.openHabitModal('${habit.id}')">✏️</button>
                      <button class="btn-icon" title="Delete Habit" onclick="window.HabitsView.deleteHabit('${habit.id}')">🗑️</button>
                    </div>
                  </div>
                `;
              }).join('')
        }
      </div>

      <!-- Streak Heatmap Activity -->
      <div class="card" style="margin-top: var(--space-8);">
        <div class="card-header">
          <h2 class="card-title">
            <span>📅</span> Activity Heatmap (Last 90 Days)
          </h2>
          <div style="display: flex; align-items: center; gap: 6px; font-size: 11px; color: var(--text-muted);">
            <span>Less</span>
            <div class="heatmap-cell" style="width: 10px; height: 10px;"></div>
            <div class="heatmap-cell level-1" style="width: 10px; height: 10px;"></div>
            <div class="heatmap-cell level-2" style="width: 10px; height: 10px;"></div>
            <div class="heatmap-cell level-3" style="width: 10px; height: 10px;"></div>
            <div class="heatmap-cell level-4" style="width: 10px; height: 10px;"></div>
            <span>More</span>
          </div>
        </div>

        <div class="heatmap-container">
          <div class="heatmap-grid">
            ${heatmapCells.map((c) => `
              <div class="heatmap-cell ${c.level ? `level-${c.level}` : ''}" title="${c.date}: ${c.count} habits done"></div>
            `).join('')}
          </div>
        </div>
      </div>

      <!-- Create/Edit Habit Modal -->
      <div id="habit-modal" class="modal-overlay">
        <div class="modal-container">
          <div class="modal-header">
            <h2 id="habit-modal-title" class="modal-title">Create Habit</h2>
            <button class="btn-icon" onclick="window.HabitsView.closeHabitModal()">✕</button>
          </div>
          <div class="modal-body">
            <form id="habit-form" onsubmit="window.HabitsView.handleHabitSubmit(event)">
              <input type="hidden" id="habit-modal-id" value="">

              <div class="form-row">
                <div class="form-group" style="flex: 3;">
                  <label class="form-label">Habit Name *</label>
                  <input type="text" id="habit-input-title" class="form-control" placeholder="e.g. Read 20 Pages" required>
                </div>
                <div class="form-group" style="flex: 1;">
                  <label class="form-label">Emoji</label>
                  <input type="text" id="habit-input-emoji" class="form-control" value="🔥" style="text-align: center;">
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Tracker</label>
                  <select id="habit-input-tracker" class="form-select">
                    ${trackers.map((t) => `<option value="${t.id}">${t.emoji} ${t.name}</option>`).join('')}
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">Frequency Target</label>
                  <select id="habit-input-frequency" class="form-select">
                    <option value="daily">Every Day</option>
                    <option value="weekdays">Weekdays Only (Mon-Fri)</option>
                    <option value="weekends">Weekends (Sat-Sun)</option>
                    <option value="custom">Custom Days</option>
                  </select>
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Daily Reminder Time</label>
                  <input type="time" id="habit-input-reminder" class="form-control" value="20:00">
                </div>
                <div class="form-group">
                  <label class="form-label">Weekly Grace Days</label>
                  <input type="number" id="habit-input-grace" class="form-control" value="1" min="0" max="3">
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">Notes / Motivation</label>
                <textarea id="habit-input-desc" class="form-textarea" placeholder="Why is this habit important to you?"></textarea>
              </div>

              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" onclick="window.HabitsView.closeHabitModal()">Cancel</button>
                <button type="submit" class="btn btn-primary">Save Habit</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    `;
  }

  static openHabitModal(habitId = null) {
    const titleEl = document.getElementById('habit-modal-title');
    const idEl = document.getElementById('habit-modal-id');
    const titleInput = document.getElementById('habit-input-title');
    const emojiInput = document.getElementById('habit-input-emoji');
    const trackerSelect = document.getElementById('habit-input-tracker');
    const freqSelect = document.getElementById('habit-input-frequency');
    const reminderInput = document.getElementById('habit-input-reminder');
    const graceInput = document.getElementById('habit-input-grace');
    const descInput = document.getElementById('habit-input-desc');

    if (habitId) {
      const habit = window.state.habits.find((h) => h.id === habitId);
      if (habit) {
        titleEl.textContent = 'Edit Habit';
        idEl.value = habit.id;
        titleInput.value = habit.title;
        emojiInput.value = habit.emoji || '🔥';
        trackerSelect.value = habit.tracker_id || '';
        freqSelect.value = habit.target_frequency || 'daily';
        reminderInput.value = habit.reminder_time || '20:00';
        graceInput.value = habit.grace_days_per_week ?? 1;
        descInput.value = habit.description || '';
      }
    } else {
      titleEl.textContent = 'Create Habit';
      idEl.value = '';
      titleInput.value = '';
      emojiInput.value = '🔥';
      descInput.value = '';
    }

    document.getElementById('habit-modal').classList.add('active');
  }

  static closeHabitModal() {
    document.getElementById('habit-modal').classList.remove('active');
  }

  static async handleHabitSubmit(event) {
    event.preventDefault();
    const id = document.getElementById('habit-modal-id').value;
    const title = document.getElementById('habit-input-title').value;
    const emoji = document.getElementById('habit-input-emoji').value;
    const tracker_id = document.getElementById('habit-input-tracker')?.value || 'general';
    const reminder_time = document.getElementById('habit-input-reminder').value;
    const grace_days_per_week = parseInt(document.getElementById('habit-input-grace').value, 10) || 1;
    const description = document.getElementById('habit-input-desc').value;

    const habitData = {
      id: id || undefined,
      title,
      emoji,
      tracker_id,
      target_frequency,
      reminder_time,
      grace_days_per_week,
      description
    };

    await window.state.saveHabit(habitData);
    this.closeHabitModal();
    if (window.notifications) {
      window.notifications.showToast(`Habit "${title}" saved! 🔥`);
    }
  }

  static async deleteHabit(habitId) {
    if (confirm('Delete this habit and all its streak history?')) {
      await window.state.deleteHabit(habitId);
      if (window.notifications) {
        window.notifications.showToast('Habit deleted.');
      }
    }
  }
}

window.HabitsView = HabitsView;

