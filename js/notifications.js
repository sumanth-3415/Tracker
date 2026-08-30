/**
 * TrackMate - Automated Notifications & Periodic Summary Messaging
 * Handles Daily task completion alerts, Weekly digest reminders, and Monthly reviews.
 */

class TrackMateNotificationManager {
  constructor() {
    this.ticker = null;
    this.sentAlerts = new Set();
  }

  init() {
    this.startReminderTicker();
  }

  async requestPermission() {
    if (!('Notification' in window)) {
      this.showToast('Browser notifications are not supported on this device.');
      return false;
    }
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      this.showToast('Automated notifications enabled successfully! 🔔');
      return true;
    } else {
      this.showToast('Notifications permission was denied.');
      return false;
    }
  }

  showToast(message, type = 'info') {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.className = 'toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `
      <span style="font-size: 16px;">${type === 'warning' ? '⚠️' : (type === 'success' ? '✅' : '✨')}</span>
      <span>${message}</span>
    `;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }

  sendBrowserNotification(title, options = {}) {
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, {
          icon: './assets/icons/icon.svg',
          badge: './assets/icons/icon.svg',
          ...options
        });
      } catch (err) {
        console.warn('[Notifications] Error triggering notification:', err);
      }
    }
  }

  // Ticker that runs every 60 seconds to check time-based reminders and daily/weekly/monthly messages
  startReminderTicker() {
    if (this.ticker) clearInterval(this.ticker);

    this.ticker = setInterval(async () => {
      const now = new Date();
      const currentHours = now.getHours().toString().padStart(2, '0');
      const currentMins = now.getMinutes().toString().padStart(2, '0');
      const currentTimeStr = `${currentHours}:${currentMins}`;
      const todayStr = now.toISOString().split('T')[0];
      const dayOfWeek = now.getDay(); // 0 is Sunday
      const dayOfMonth = now.getDate();
      const daysInCurrentMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

      // 1. Task Due Time Reminders
      const tasks = await window.db.getAll('tasks');
      tasks.forEach((task) => {
        if (
          task.due_date === todayStr &&
          task.due_time === currentTimeStr &&
          task.status !== 'completed' &&
          !this.sentAlerts.has(`task_${task.id}_${todayStr}`)
        ) {
          this.sentAlerts.add(`task_${task.id}_${todayStr}`);
          const msg = `Task Due Now: "${task.title}"`;
          this.showToast(msg, 'warning');
          this.sendBrowserNotification('Task Reminder ⏰', { body: msg });
        }
      });

      // 2. Daily Summary Message (Default: 20:30)
      const dailyTime = localStorage.getItem(CONFIG.STORAGE_KEYS.DAILY_REPORT_TIME) || '20:30';
      if (currentTimeStr === dailyTime && !this.sentAlerts.has(`daily_summary_${todayStr}`)) {
        this.sentAlerts.add(`daily_summary_${todayStr}`);
        const dailyReport = await window.ReportsEngine.compileDailyReport(todayStr);
        const msg = `Daily Progress: ${dailyReport.completedTasks.length}/${dailyReport.tasks.length} tasks completed (${dailyReport.completionRate}%). Check habits!`;
        this.showToast(msg, 'success');
        this.sendBrowserNotification('📊 Daily Task Summary', { body: msg });
      }

      // 3. Weekly Digest Notification (Sundays at 20:00)
      if (dayOfWeek === 0 && currentHours === '20' && currentMins === '00' && !this.sentAlerts.has(`weekly_digest_${todayStr}`)) {
        this.sentAlerts.add(`weekly_digest_${todayStr}`);
        const weeklyReport = await window.ReportsEngine.compileWeeklyReport(todayStr);
        const msg = `Weekly Digest: ${weeklyReport.totalCompleted} tasks completed this week (${weeklyReport.completionRate}% success rate)!`;
        this.showToast(msg, 'success');
        this.sendBrowserNotification('📅 Weekly Productivity Report Ready', { body: msg });
      }

      // 4. Monthly Review Notification (Last Day of Month at 21:00)
      if (dayOfMonth === daysInCurrentMonth && currentHours === '21' && currentMins === '00' && !this.sentAlerts.has(`monthly_review_${todayStr}`)) {
        this.sentAlerts.add(`monthly_review_${todayStr}`);
        const monthlyReport = await window.ReportsEngine.compileMonthlyReport();
        const msg = `Monthly Review: You achieved a ${monthlyReport.completionRate}% completion rate for ${monthlyReport.monthTitle}!`;
        this.showToast(msg, 'success');
        this.sendBrowserNotification('🏆 Monthly Productivity Summary', { body: msg });
      }

      // 5. Incomplete Streak Warning (at 21:30)
      if (currentHours === '21' && currentMins === '30' && !this.sentAlerts.has(`streak_warn_${todayStr}`)) {
        this.sentAlerts.add(`streak_warn_${todayStr}`);
        const habits = await window.db.getAll('habits');
        for (const habit of habits) {
          if ((habit.current_streak || 0) > 1) {
            const log = await window.db.get('habit_logs', `${habit.id}_${todayStr}`);
            if (!log || !log.completed) {
              const warningMsg = `Habit "${habit.title}" is incomplete today! Your ${habit.current_streak}-day streak is at risk 🔥`;
              this.showToast(warningMsg, 'warning');
              this.sendBrowserNotification('🔥 Streak Warning', { body: warningMsg });
              break;
            }
          }
        }
      }
    }, 60000);
  }
}

window.notifications = new TrackMateNotificationManager();
