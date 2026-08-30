/**
 * TrackMate - Global Configuration, Constants & Templates
 * 100% Local-First (IndexedDB) with Automated Daily, Weekly & Monthly Reports
 */

const CONFIG = {
  APP_NAME: 'TrackMate',
  VERSION: '1.2.0',
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
  DEMO_TRACKERS: [
    {
      id: 'tracker-study-demo',
      name: 'Academic & Tech Study',
      description: 'Track daily study sessions, DSA practice, and course assignments',
      type: 'study',
      icon: '📚',
      emoji: '📚',
      color: '#10b981',
      is_private: true,
      custom_fields: [
        { name: 'Subject', type: 'text' },
        { name: 'Study Hours', type: 'number' },
        { name: 'Difficulty', type: 'select', options: ['Easy', 'Medium', 'Hard'] }
      ]
    },
    {
      id: 'tracker-coding-demo',
      name: 'Coding & Dev Projects',
      description: 'Track code commits, feature development, and bugs',
      type: 'work',
      icon: '💻',
      emoji: '💻',
      color: '#6366f1',
      is_private: true,
      custom_fields: [
        { name: 'Repository', type: 'text' },
        { name: 'Estimated Hours', type: 'number' }
      ]
    },
    {
      id: 'tracker-fitness-demo',
      name: 'Health & Fitness',
      description: 'Track workouts, hydration, calories and active routines',
      type: 'fitness',
      icon: '🏃',
      emoji: '🏃',
      color: '#ec4899',
      is_private: true,
      custom_fields: [
        { name: 'Exercise', type: 'text' },
        { name: 'Sets', type: 'number' },
        { name: 'Reps', type: 'number' },
        { name: 'Weight (kg)', type: 'number' },
        { name: 'Calories', type: 'number' }
      ]
    },
    {
      id: 'tracker-habits-demo',
      name: 'Daily Routines & Habits',
      description: 'Build positive lifestyle and productivity habits',
      type: 'habit',
      icon: '🔥',
      emoji: '🔥',
      color: '#f59e0b',
      is_private: true,
      custom_fields: []
    }
  ],
  DEMO_HABITS: [
    {
      id: 'habit-study-java',
      tracker_id: 'tracker-study-demo',
      title: 'Study Java & Data Structures',
      description: 'Practice 1 hour of core algorithms and OOP concepts',
      emoji: '☕',
      target_frequency: 'daily',
      custom_days: [1, 2, 3, 4, 5, 6, 7],
      current_streak: 5,
      longest_streak: 14,
      reminder_time: '19:00',
      grace_days_per_week: 1
    },
    {
      id: 'habit-read-books',
      tracker_id: 'tracker-habits-demo',
      title: 'Read 20 Pages',
      description: 'Non-fiction, technical, or self-development books',
      emoji: '📖',
      target_frequency: 'daily',
      custom_days: [1, 2, 3, 4, 5, 6, 7],
      current_streak: 12,
      longest_streak: 28,
      reminder_time: '21:30',
      grace_days_per_week: 1
    },
    {
      id: 'habit-workout',
      tracker_id: 'tracker-fitness-demo',
      title: 'Morning Workout & Cardio',
      description: '45 mins strength or cardio training',
      emoji: '💪',
      target_frequency: 'custom',
      custom_days: [1, 2, 3, 4, 5],
      current_streak: 4,
      longest_streak: 9,
      reminder_time: '07:00',
      grace_days_per_week: 1
    },
    {
      id: 'habit-drink-water',
      tracker_id: 'tracker-fitness-demo',
      title: 'Drink 3L Water',
      description: 'Maintain hydration throughout the day',
      emoji: '💧',
      target_frequency: 'daily',
      custom_days: [1, 2, 3, 4, 5, 6, 7],
      current_streak: 8,
      longest_streak: 18,
      reminder_time: '12:00',
      grace_days_per_week: 0
    }
  ]
};

// Export to global scope
window.CONFIG = CONFIG;
