/**
 * TrackMate - Global State Management & Event Bus
 */

class TrackMateState {
  constructor() {
    this.events = {};
    this.trackers = [];
    this.tasks = [];
    this.habits = [];
    this.habitLogs = [];
    this.goals = [];
    this.projects = [];
    this.notes = [];
    this.activityLogs = [];
    this.userProfile = null;
    this.activeFilter = 'all';
    this.currentDate = new Date();
    this.activeTrackerFilter = 'all';
  }

  // Event Bus
  on(event, handler) {
    if (!this.events[event]) this.events[event] = [];
    this.events[event].push(handler);
    return () => this.off(event, handler);
  }

  off(event, handler) {
    if (!this.events[event]) return;
    this.events[event] = this.events[event].filter((h) => h !== handler);
  }

  emit(event, data) {
    if (this.events[event]) {
      this.events[event].forEach((handler) => {
        try {
          handler(data);
        } catch (err) {
          console.error(`[EventBus] Error in handler for ${event}:`, err);
        }
      });
    }
  }

  // Initialize State & Seed Data if necessary
  async init() {
    await window.db.init();

    // Load or generate guest user profile
    let guestId = localStorage.getItem(CONFIG.STORAGE_KEYS.GUEST_USER_ID);
    if (!guestId) {
      guestId = window.db.generateUUID();
      localStorage.setItem(CONFIG.STORAGE_KEYS.GUEST_USER_ID, guestId);
    }

    let profile = await window.db.get('profiles', guestId);
    if (!profile) {
      profile = {
        id: guestId,
        username: 'Productivity Champion',
        email: '',
        created_at: new Date().toISOString(),
        theme: localStorage.getItem(CONFIG.STORAGE_KEYS.THEME) || CONFIG.DEFAULT_THEME,
        settings: {
          email_reports_enabled: false,
          report_recipient_email: '',
          notifications_enabled: true,
          grace_days_default: 1
        }
      };
      await window.db.put('profiles', profile);
    }
    this.userProfile = profile;

    // Clean slate initialization: Clear old demo data once for a fresh start
    if (localStorage.getItem('tm_clean_slate_fresh') !== 'true') {
      localStorage.setItem('tm_clean_slate_fresh', 'true');
      localStorage.setItem('tm_demo_seeded', 'true');
      await this.clearAllDataAndStartFresh();
    } else {
      await this.refreshAllData();
    }
  }

  async clearAllDataAndStartFresh() {
    await window.db.clear('trackers');
    await window.db.clear('tasks');
    await window.db.clear('habits');
    await window.db.clear('habit_logs');
    await window.db.clear('goals');
    await window.db.clear('projects');
    await window.db.clear('notes');
    await window.db.clear('activity_logs');
    localStorage.removeItem('tm_avatar_stats');
    await this.refreshAllData();
  }

  async refreshAllData() {
    this.trackers = await window.db.getAll('trackers');
    this.tasks = await window.db.getAll('tasks');
    this.habits = await window.db.getAll('habits');
    this.habitLogs = await window.db.getAll('habit_logs');
    this.goals = await window.db.getAll('goals');
    this.projects = await window.db.getAll('projects');
    this.notes = await window.db.getAll('notes');
    this.activityLogs = await window.db.getAll('activity_logs');
    this.emit('state:updated');
  }

  async seedDemoData() {
    // Zero hardcoded demo items - completely fresh start!
  }

  // --- CRUD Actions ---

  async saveTracker(trackerData) {
    const isNew = !trackerData.id;
    const tracker = {
      ...trackerData,
      id: trackerData.id || window.db.generateUUID(),
      user_id: this.userProfile.id,
      updated_at: new Date().toISOString(),
      created_at: trackerData.created_at || new Date().toISOString()
    };

    await window.db.put('trackers', tracker);
    await window.syncEngine.queueMutation('trackers', 'upsert', tracker);
    await this.refreshAllData();
    this.emit('tracker:saved', tracker);
    return tracker;
  }

  async deleteTracker(trackerId) {
    await window.db.delete('trackers', trackerId);
    await window.syncEngine.queueMutation('trackers', 'delete', { id: trackerId });
    await this.refreshAllData();
    this.emit('tracker:deleted', trackerId);
  }

  async saveTask(taskData) {
    const isNew = !taskData.id;
    const task = {
      ...taskData,
      id: taskData.id || window.db.generateUUID(),
      user_id: this.userProfile.id,
      updated_at: new Date().toISOString(),
      created_at: taskData.created_at || new Date().toISOString()
    };

    await window.db.put('tasks', task);
    await window.syncEngine.queueMutation('tasks', 'upsert', task);
    await this.refreshAllData();
    this.emit('task:saved', task);
    return task;
  }

  async toggleTaskCompletion(taskId, isCompleted) {
    const task = await window.db.get('tasks', taskId);
    if (!task) return;

    task.status = isCompleted ? 'completed' : 'in_progress';
    task.completed_at = isCompleted ? new Date().toISOString() : null;
    task.updated_at = new Date().toISOString();

    await window.db.put('tasks', task);
    await window.syncEngine.queueMutation('tasks', 'upsert', task);

    // Log Activity for Analytics & Award XP
    if (isCompleted) {
      const activity = {
        id: window.db.generateUUID(),
        type: 'task_completed',
        entity_id: taskId,
        title: task.title,
        tracker_id: task.tracker_id,
        date: new Date().toISOString().split('T')[0],
        timestamp: new Date().toISOString()
      };
      await window.db.put('activity_logs', activity);

      if (window.gamification) {
        window.gamification.addXP(20, 'Task Completed');
        window.gamification.triggerConfetti(50);
      }
    }

    await this.refreshAllData();
    this.emit('task:toggled', { task, isCompleted });
    if (window.streakEngine) window.streakEngine.evaluateOverallDailyStreak();
  }

  async deleteTask(taskId) {
    await window.db.delete('tasks', taskId);
    await window.syncEngine.queueMutation('tasks', 'delete', { id: taskId });
    await this.refreshAllData();
    this.emit('task:deleted', taskId);
  }

  async saveHabit(habitData) {
    const habit = {
      ...habitData,
      id: habitData.id || window.db.generateUUID(),
      user_id: this.userProfile.id,
      updated_at: new Date().toISOString(),
      created_at: habitData.created_at || new Date().toISOString(),
      current_streak: habitData.current_streak || 0,
      longest_streak: habitData.longest_streak || 0
    };

    await window.db.put('habits', habit);
    await window.syncEngine.queueMutation('habits', 'upsert', habit);
    await this.refreshAllData();
    this.emit('habit:saved', habit);
    return habit;
  }

  async toggleHabitDate(habitId, dateStr) {
    const habit = await window.db.get('habits', habitId);
    if (!habit) return;

    const logId = `${habitId}_${dateStr}`;
    const existingLog = await window.db.get('habit_logs', logId);
    const newCompleted = existingLog ? !existingLog.completed : true;

    const logObj = {
      id: logId,
      habit_id: habitId,
      date: dateStr,
      completed: newCompleted,
      timestamp: new Date().toISOString()
    };

    await window.db.put('habit_logs', logObj);

    // Award XP if completed
    if (newCompleted && window.gamification) {
      window.gamification.addXP(25, 'Habit Completed');
      window.gamification.triggerConfetti(40);
    }

    // Recalculate streak for this habit
    if (window.streakEngine) {
      await window.streakEngine.recalculateHabitStreak(habitId);
    }

    await this.refreshAllData();
    this.emit('habit:toggled', { habitId, dateStr, completed: newCompleted });
  }

  async deleteHabit(habitId) {
    await window.db.delete('habits', habitId);
    await window.syncEngine.queueMutation('habits', 'delete', { id: habitId });
    await this.refreshAllData();
    this.emit('habit:deleted', habitId);
  }
}

// Instantiate global State
window.state = new TrackMateState();

