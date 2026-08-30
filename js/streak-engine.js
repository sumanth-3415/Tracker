/**
 * TrackMate - Gamified Streak, Grace Days & Milestone Engine
 */

class TrackMateStreakEngine {
  constructor() {
    this.milestones = CONFIG.STREAK_MILESTONES || [3, 7, 14, 30, 60, 100, 365];
  }

  // Recalculate streak for a specific habit
  async recalculateHabitStreak(habitId) {
    const habit = await window.db.get('habits', habitId);
    if (!habit) return { currentStreak: 0, longestStreak: 0 };

    const logs = await window.db.queryByIndex('habit_logs', 'habit_id', habitId);
    const logMap = new Map();
    logs.forEach((l) => logMap.set(l.date, l.completed));

    const today = new Date();
    let currentStreak = 0;
    let longestStreak = habit.longest_streak || 0;
    let graceDaysUsed = 0;
    const maxGraceDays = habit.grace_days_per_week ?? 1;

    // Check consecutive days moving backwards from today (or yesterday if today not yet checked)
    let checkDate = new Date(today);
    let todayStr = checkDate.toISOString().split('T')[0];
    let isTodayCompleted = logMap.get(todayStr) === true;

    // If today is completed, start counting from today; otherwise if today is unchecked, start from yesterday
    if (isTodayCompleted) {
      currentStreak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      // Check yesterday first
      checkDate.setDate(checkDate.getDate() - 1);
    }

    // Traverse backwards up to 365 days
    for (let i = 0; i < 365; i++) {
      const dateStr = checkDate.toISOString().split('T')[0];
      const dayOfWeek = checkDate.getDay() === 0 ? 7 : checkDate.getDay(); // 1=Mon .. 7=Sun

      // Check if habit was scheduled for this day
      let isScheduled = true;
      if (habit.target_frequency === 'custom' && Array.isArray(habit.custom_days)) {
        isScheduled = habit.custom_days.includes(dayOfWeek);
      } else if (habit.target_frequency === 'weekdays') {
        isScheduled = dayOfWeek >= 1 && dayOfWeek <= 5;
      } else if (habit.target_frequency === 'weekends') {
        isScheduled = dayOfWeek === 6 || dayOfWeek === 7;
      }

      if (!isScheduled) {
        // Skip non-scheduled days without breaking streak
        checkDate.setDate(checkDate.getDate() - 1);
        continue;
      }

      const completed = logMap.get(dateStr) === true;
      if (completed) {
        currentStreak++;
      } else if (graceDaysUsed < maxGraceDays) {
        // Apply grace day
        graceDaysUsed++;
      } else {
        // Streak breaks
        break;
      }

      checkDate.setDate(checkDate.getDate() - 1);
    }

    if (currentStreak > longestStreak) {
      longestStreak = currentStreak;
    }

    // Check if new milestone reached
    if (this.milestones.includes(currentStreak) && currentStreak !== habit.current_streak) {
      this.triggerMilestoneCelebration(habit.title, currentStreak);
    }

    // Update habit in DB
    habit.current_streak = currentStreak;
    habit.longest_streak = longestStreak;
    habit.updated_at = new Date().toISOString();
    await window.db.put('habits', habit);
    await window.syncEngine.queueMutation('habits', 'upsert', habit);

    return { currentStreak, longestStreak };
  }

  // Calculate overall productivity streak across all tasks and habits
  async evaluateOverallDailyStreak() {
    const habits = await window.db.getAll('habits');
    const tasks = await window.db.getAll('tasks');
    const logs = await window.db.getAll('habit_logs');

    let maxCurrentStreak = 0;
    let maxLongestStreak = 0;

    habits.forEach((h) => {
      if ((h.current_streak || 0) > maxCurrentStreak) maxCurrentStreak = h.current_streak;
      if ((h.longest_streak || 0) > maxLongestStreak) maxLongestStreak = h.longest_streak;
    });

    return {
      currentStreak: maxCurrentStreak,
      longestStreak: maxLongestStreak
    };
  }

  // Generate GitHub-style heatmap data for the past N days
  async getHabitHeatmapData(daysCount = 90) {
    const logs = await window.db.getAll('habit_logs');
    const dateCountMap = {};

    logs.forEach((log) => {
      if (log.completed) {
        dateCountMap[log.date] = (dateCountMap[log.date] || 0) + 1;
      }
    });

    const cells = [];
    const today = new Date();
    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const count = dateCountMap[dateStr] || 0;

      let level = 0;
      if (count >= 4) level = 4;
      else if (count >= 3) level = 3;
      else if (count >= 2) level = 2;
      else if (count >= 1) level = 1;

      cells.push({ date: dateStr, count, level, dayOfWeek: d.getDay() });
    }
    return cells;
  }

  // Celebrate milestone with modal feedback
  triggerMilestoneCelebration(name, days) {
    if (window.notifications) {
      window.notifications.showToast(`🔥 Milestone Unlocked! ${days} Day Streak on "${name}"! 🏆`);
    }
  }
}

window.streakEngine = new TrackMateStreakEngine();

