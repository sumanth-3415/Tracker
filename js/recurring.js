/**
 * TrackMate - Recurring Task Rule & Schedule Engine
 * Determines valid task occurrences for any date without duplicate records
 */

class TrackMateRecurringEngine {
  // Check if a task applies to a specific target date (YYYY-MM-DD)
  static isTaskScheduledOnDate(task, targetDateStr) {
    if (!task) return false;

    // Direct match on due_date
    if (task.due_date === targetDateStr) return true;

    // If no recurring rule, it only shows on its due_date
    if (!task.recurring_pattern || task.recurring_pattern === 'none') {
      return false;
    }

    const taskCreatedDate = new Date(task.created_at || task.due_date || '2000-01-01');
    taskCreatedDate.setHours(0, 0, 0, 0);

    const targetDate = new Date(targetDateStr);
    targetDate.setHours(0, 0, 0, 0);

    // If target date is before task was created, it shouldn't show
    if (targetDate < taskCreatedDate) return false;

    const dayOfWeek = targetDate.getDay() === 0 ? 7 : targetDate.getDay(); // 1=Mon ... 7=Sun

    switch (task.recurring_pattern) {
      case 'daily':
        return true;

      case 'weekdays':
        return dayOfWeek >= 1 && dayOfWeek <= 5;

      case 'weekends':
        return dayOfWeek === 6 || dayOfWeek === 7;

      case 'weekly': {
        const diffTime = Math.abs(targetDate - taskCreatedDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays % 7 === 0;
      }

      case 'monthly':
        return targetDate.getDate() === taskCreatedDate.getDate();

      case 'custom_days':
        if (Array.isArray(task.recurring_days)) {
          return task.recurring_days.includes(dayOfWeek);
        }
        return false;

      default:
        return false;
    }
  }

  // Filter tasks for a target date
  static getTasksForDate(tasks, targetDateStr) {
    if (!Array.isArray(tasks)) return [];
    return tasks.filter((task) => this.isTaskScheduledOnDate(task, targetDateStr));
  }
}

window.RecurringEngine = TrackMateRecurringEngine;

