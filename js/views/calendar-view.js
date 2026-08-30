/**
 * TrackMate - Interactive Full Calendar View
 */

class CalendarView {
  static currentDate = new Date();
  static viewMode = 'month'; // 'month' | 'week' | 'day'

  static async render(container) {
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();

    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const monthTitle = `${monthNames[month]} ${year}`;

    // Get First day of month and total days
    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sun
    const firstDayMon = firstDayIndex === 0 ? 6 : firstDayIndex - 1; // 0 is Mon
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const prevMonthDays = new Date(year, month, 0).getDate();

    const allTasks = window.state.tasks;
    const allHabits = window.state.habits;
    const allHabitLogs = window.state.habitLogs;

    // Build day cells
    const dayCells = [];

    // Previous month padding days
    for (let i = firstDayMon - 1; i >= 0; i--) {
      const dNum = prevMonthDays - i;
      const prevDate = new Date(year, month - 1, dNum);
      const dateStr = prevDate.toISOString().split('T')[0];
      dayCells.push({ dNum, dateStr, isOtherMonth: true, isToday: false });
    }

    // Current month days
    const todayStr = new Date().toISOString().split('T')[0];
    for (let d = 1; d <= daysInMonth; d++) {
      const curDate = new Date(year, month, d);
      const dateStr = curDate.toISOString().split('T')[0];
      dayCells.push({
        dNum: d,
        dateStr,
        isOtherMonth: false,
        isToday: dateStr === todayStr
      });
    }

    // Next month padding days to complete grid (multiples of 7)
    const remaining = 7 - (dayCells.length % 7);
    if (remaining < 7) {
      for (let n = 1; n <= remaining; n++) {
        const nextDate = new Date(year, month + 1, n);
        const dateStr = nextDate.toISOString().split('T')[0];
        dayCells.push({ dNum: n, dateStr, isOtherMonth: true, isToday: false });
      }
    }

    container.innerHTML = `
      <div class="calendar-header">
        <div>
          <h1 class="page-title">Calendar Schedule</h1>
          <p style="font-size: var(--text-xs); color: var(--text-muted); margin-top: 2px;">
            View scheduled tasks, deadlines, habit streaks and past records.
          </p>
        </div>

        <div class="calendar-nav-group">
          <button class="btn btn-outline btn-sm" onclick="window.CalendarView.prevMonth()">‹ Prev</button>
          <button class="btn btn-secondary btn-sm" onclick="window.CalendarView.goToday()">Today</button>
          <button class="btn btn-outline btn-sm" onclick="window.CalendarView.nextMonth()">Next ›</button>
          <div class="calendar-current-month">${monthTitle}</div>
        </div>
      </div>

      <!-- Month Calendar Grid -->
      <div class="calendar-month-grid">
        <div class="calendar-day-header">Mon</div>
        <div class="calendar-day-header">Tue</div>
        <div class="calendar-day-header">Wed</div>
        <div class="calendar-day-header">Thu</div>
        <div class="calendar-day-header">Fri</div>
        <div class="calendar-day-header">Sat</div>
        <div class="calendar-day-header">Sun</div>

        ${dayCells.map((cell) => {
          const dateTasks = window.RecurringEngine
            ? window.RecurringEngine.getTasksForDate(allTasks, cell.dateStr)
            : allTasks.filter((t) => t.due_date === cell.dateStr);

          const hasCompleted = dateTasks.some((t) => t.status === 'completed');
          const hasPending = dateTasks.some((t) => t.status !== 'completed');

          return `
            <div class="calendar-day-cell ${cell.isOtherMonth ? 'other-month' : ''} ${cell.isToday ? 'today' : ''}"
                 onclick="window.CalendarView.openDateDetailModal('${cell.dateStr}')">
              <div class="cal-day-number">
                <span>${cell.dNum}</span>
              </div>

              <!-- Desktop Task Pills -->
              <div class="cal-events-list">
                ${dateTasks.slice(0, 2).map((t) => `
                  <div class="cal-event-pill ${t.status === 'completed' ? 'completed' : 'pending'}">
                    ${t.status === 'completed' ? '✓' : '•'} ${t.title}
                  </div>
                `).join('')}
                ${dateTasks.length > 2 ? `<div style="font-size: 10px; color: var(--text-muted);">+${dateTasks.length - 2} more</div>` : ''}
              </div>

              <!-- Mobile Dots Indicator -->
              <div class="cal-event-dots-row">
                ${hasCompleted ? '<div class="cal-dot" style="background: #10b981;"></div>' : ''}
                ${hasPending ? '<div class="cal-dot" style="background: #f59e0b;"></div>' : ''}
              </div>
            </div>
          `;
        }).join('')}
      </div>

      <!-- Date Detail Agenda Modal -->
      <div id="date-agenda-modal" class="modal-overlay">
        <div class="modal-container">
          <div class="modal-header">
            <h2 id="agenda-modal-date-title" class="modal-title">Agenda for Date</h2>
            <button class="btn-icon" onclick="document.getElementById('date-agenda-modal').classList.remove('active')">✕</button>
          </div>
          <div class="modal-body" id="agenda-modal-body"></div>
          <div class="modal-footer">
            <button class="btn btn-secondary" onclick="document.getElementById('date-agenda-modal').classList.remove('active')">Close</button>
            <button class="btn btn-primary" id="agenda-add-task-btn">+ Add Task for Date</button>
          </div>
        </div>
      </div>
    `;
  }

  static prevMonth() {
    this.currentDate.setMonth(this.currentDate.getMonth() - 1);
    this.render(document.getElementById('view-content'));
  }

  static nextMonth() {
    this.currentDate.setMonth(this.currentDate.getMonth() + 1);
    this.render(document.getElementById('view-content'));
  }

  static goToday() {
    this.currentDate = new Date();
    this.render(document.getElementById('view-content'));
  }

  static openDateDetailModal(dateStr) {
    const modal = document.getElementById('date-agenda-modal');
    const titleEl = document.getElementById('agenda-modal-date-title');
    const bodyEl = document.getElementById('agenda-modal-body');
    const addBtn = document.getElementById('agenda-add-task-btn');

    titleEl.textContent = `Agenda for ${dateStr}`;

    const allTasks = window.state.tasks;
    const dateTasks = window.RecurringEngine
      ? window.RecurringEngine.getTasksForDate(allTasks, dateStr)
      : allTasks.filter((t) => t.due_date === dateStr);

    const habits = window.state.habits;
    const habitLogs = window.state.habitLogs;

    bodyEl.innerHTML = `
      <div style="margin-bottom: var(--space-4);">
        <h4 style="font-size: var(--text-sm); font-weight: 700; margin-bottom: 8px;">Scheduled Tasks (${dateTasks.length})</h4>
        ${
          dateTasks.length === 0
            ? `<div style="font-size: var(--text-xs); color: var(--text-muted);">No tasks scheduled.</div>`
            : dateTasks.map((t) => `
              <div style="display: flex; align-items: center; justify-content: space-between; padding: 8px; background: var(--bg-primary); border-radius: 8px; margin-bottom: 4px;">
                <div style="display: flex; align-items: center; gap: 8px;">
                  <span style="font-size: 14px;">${t.status === 'completed' ? '✅' : '⏳'}</span>
                  <span style="font-size: 13px; font-weight: 500; ${t.status === 'completed' ? 'text-decoration: line-through; opacity: 0.6;' : ''}">${t.title}</span>
                </div>
                <span class="badge badge-${t.priority || 'medium'}">${t.priority || 'medium'}</span>
              </div>
            `).join('')
        }
      </div>

      <div>
        <h4 style="font-size: var(--text-sm); font-weight: 700; margin-bottom: 8px;">Habits on this Date</h4>
        ${
          habits.map((h) => {
            const log = habitLogs.find((l) => l.habit_id === h.id && l.date === dateStr);
            const isDone = log ? log.completed : false;
            return `
              <div style="display: flex; align-items: center; justify-content: space-between; padding: 8px; background: var(--bg-primary); border-radius: 8px; margin-bottom: 4px;">
                <div style="display: flex; align-items: center; gap: 8px;">
                  <span>${h.emoji || '🔥'}</span>
                  <span style="font-size: 13px;">${h.title}</span>
                </div>
                <span style="font-size: 12px; font-weight: 600; color: ${isDone ? '#10b981' : '#f59e0b'};">
                  ${isDone ? 'Completed ✓' : 'Incomplete'}
                </span>
              </div>
            `;
          }).join('')
        }
      </div>
    `;

    addBtn.onclick = () => {
      modal.classList.remove('active');
      window.location.hash = '#tasks';
      setTimeout(() => {
        if (window.TasksView) {
          window.TasksView.openTaskModal();
          const dInput = document.getElementById('task-input-date');
          if (dInput) dInput.value = dateStr;
        }
      }, 100);
    };

    modal.classList.add('active');
  }
}

window.CalendarView = CalendarView;

