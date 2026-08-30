/**
 * TrackMate - Global Configuration, Constants & Templates
 * 100% Local-First (IndexedDB) with Automated Daily, Weekly & Monthly Reports
 */

const CONFIG = {
  APP_NAME: 'TrackMate',
  VERSION: '2.0.0',
  DEFAULT_THEME: 'dark',
  STORAGE_KEYS: {
    GUEST_USER_ID: 'tm_guest_user_id',
    GUEST_USER_NAME: 'tm_guest_user_name',
    GUEST_USER_EMAIL: 'tm_guest_user_email',
    THEME: 'tm_theme',
    DAILY_REPORT_TIME: 'tm_daily_report_time',
    WEEKLY_REPORT_DAY: 'tm_weekly_report_day',
    MONTHLY_REPORT_DAY: 'tm_monthly_report_day',
    EMAIL_NOTIFICATIONS_ENABLED: 'tm_email_notif_enabled',
    SETTINGS: 'tm_settings',
    LAST_DAILY_MSG: 'tm_last_daily_msg',
    LAST_WEEKLY_MSG: 'tm_last_weekly_msg',
    LAST_MONTHLY_MSG: 'tm_last_monthly_msg'
  },
  TRACKER_TYPES: {
    TASK: { id: 'task', label: 'Task Tracker', icon: '📝', color: '#6366f1' },
    HABIT: { id: 'habit', label: 'Habit Tracker', icon: '🔥', color: '#f59e0b' },
    STUDY: { id: 'study', label: 'Study Tracker', icon: '📚', color: '#10b981' },
    WORK: { id: 'work', label: 'Work Tracker', icon: '💼', color: '#3b82f6' },
    FITNESS: { id: 'fitness', label: 'Fitness Tracker', icon: '🏃', color: '#ec4899' },
    PROJECT: { id: 'project', label: 'Project Tracker', icon: '🚀', color: '#8b5cf6' },
    GOAL: { id: 'goal', label: 'Goal Tracker', icon: '🎯', color: '#06b6d4' },
    CUSTOM: { id: 'custom', label: 'Custom Tracker', icon: '⚙️', color: '#14b8a6' }
  },
  PRIORITIES: {
    URGENT: { id: 'urgent', label: 'Urgent', color: '#ef4444', badgeClass: 'badge-urgent' },
    HIGH: { id: 'high', label: 'High', color: '#f97316', badgeClass: 'badge-high' },
    MEDIUM: { id: 'medium', label: 'Medium', color: '#3b82f6', badgeClass: 'badge-medium' },
    LOW: { id: 'low', label: 'Low', color: '#64748b', badgeClass: 'badge-low' }
  },
  TASK_STATUSES: {
    NOT_STARTED: { id: 'not_started', label: 'Not Started', color: '#94a3b8' },
    IN_PROGRESS: { id: 'in_progress', label: 'In Progress', color: '#3b82f6' },
    COMPLETED: { id: 'completed', label: 'Completed', color: '#10b981' },
    MISSED: { id: 'missed', label: 'Missed', color: '#ef4444' },
    CANCELLED: { id: 'cancelled', label: 'Cancelled', color: '#6b7280' }
  },
  STREAK_MILESTONES: [3, 7, 14, 30, 60, 100, 365],
  DEMO_TRACKERS: [],
  DEMO_HABITS: []
};

// Export to global scope
window.CONFIG = CONFIG;
