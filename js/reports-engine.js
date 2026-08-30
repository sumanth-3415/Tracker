/**
 * TrackMate - Multi-Interval Reports Engine (Daily, Weekly & Monthly)
 * Compiles rich summaries, Excel-compatible CSV exports, and formatted Gmail/Email reports.
 */

class TrackMateReportsEngine {
  // 1. Daily Report Compiler
  static async compileDailyReport(targetDateStr = null) {
    const dateStr = targetDateStr || new Date().toISOString().split('T')[0];
    const tasks = await window.db.getAll('tasks');
    const habits = await window.db.getAll('habits');
    const trackers = await window.db.getAll('trackers');
    const logs = await window.db.getAll('habit_logs');

    const trackerMap = new Map();
    trackers.forEach((t) => trackerMap.set(t.id, t.name));

    const dateTasks = window.RecurringEngine
      ? window.RecurringEngine.getTasksForDate(tasks, dateStr)
      : tasks.filter((t) => t.due_date === dateStr);

    const completedTasks = dateTasks.filter((t) => t.status === 'completed');
    const pendingTasks = dateTasks.filter((t) => t.status !== 'completed' && t.status !== 'missed');
    const missedTasks = dateTasks.filter((t) => t.status === 'missed');

    const habitRows = [];
    let completedHabitsCount = 0;

    for (const habit of habits) {
      const log = logs.find((l) => l.habit_id === habit.id && l.date === dateStr);
      const isCompleted = log ? log.completed : false;
      if (isCompleted) completedHabitsCount++;

      habitRows.push({
        habit_name: habit.title,
        tracker_name: trackerMap.get(habit.tracker_id) || 'General',
        is_completed: isCompleted,
        current_streak: habit.current_streak || 0,
        longest_streak: habit.longest_streak || 0
      });
    }

    const taskCompletionRate = dateTasks.length > 0
      ? Math.round((completedTasks.length / dateTasks.length) * 100)
      : (habits.length > 0 ? Math.round((completedHabitsCount / habits.length) * 100) : 100);

    const totalMinutesSpent = dateTasks.reduce((acc, t) => acc + (t.actual_minutes || 0), 0);
    const hoursSpent = Math.floor(totalMinutesSpent / 60);
    const minsSpent = totalMinutesSpent % 60;
    const timeSpentFormatted = `${hoursSpent}h ${minsSpent}m`;

    return {
      type: 'daily',
      date: dateStr,
      title: `Daily Productivity Report (${dateStr})`,
      tasks: dateTasks,
      completedTasks,
      pendingTasks,
      missedTasks,
      habits: habitRows,
      completedHabitsCount,
      totalHabitsCount: habits.length,
      completionRate: taskCompletionRate,
      timeSpentFormatted,
      totalMinutesSpent,
      trackerMap
    };
  }

  // 2. Weekly Report Compiler (Last 7 Days)
  static async compileWeeklyReport(endDateStr = null) {
    const end = endDateStr ? new Date(endDateStr) : new Date();
    const start = new Date(end);
    start.setDate(end.getDate() - 6);

    const startStr = start.toISOString().split('T')[0];
    const endStr = end.toISOString().split('T')[0];

    const tasks = await window.db.getAll('tasks');
    const habits = await window.db.getAll('habits');
    const trackers = await window.db.getAll('trackers');
    const logs = await window.db.getAll('habit_logs');

    const trackerMap = new Map();
    trackers.forEach((t) => trackerMap.set(t.id, t.name));

    const dayBreakdowns = [];
    let totalTasksWeek = 0;
    let totalCompletedWeek = 0;
    let totalMinsWeek = 0;

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    let bestDay = { name: 'None', completedCount: -1 };

    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const dStr = d.toISOString().split('T')[0];
      const dName = dayNames[d.getDay()];

      const dTasks = window.RecurringEngine
        ? window.RecurringEngine.getTasksForDate(tasks, dStr)
        : tasks.filter((t) => t.due_date === dStr);

      const dCompleted = dTasks.filter((t) => t.status === 'completed');
      const dMins = dTasks.reduce((sum, t) => sum + (t.actual_minutes || 0), 0);

      totalTasksWeek += dTasks.length;
      totalCompletedWeek += dCompleted.length;
      totalMinsWeek += dMins;

      if (dCompleted.length > bestDay.completedCount) {
        bestDay = { name: `${dName} (${dStr})`, completedCount: dCompleted.length };
      }

      dayBreakdowns.push({
        date: dStr,
        dayName: dName,
        tasksCount: dTasks.length,
        completedCount: dCompleted.length,
        rate: dTasks.length > 0 ? Math.round((dCompleted.length / dTasks.length) * 100) : 100,
        timeSpentMins: dMins
      });
    }

    const weekRate = totalTasksWeek > 0 ? Math.round((totalCompletedWeek / totalTasksWeek) * 100) : 100;
    const weekHours = Math.floor(totalMinsWeek / 60);
    const weekMins = totalMinsWeek % 60;

    return {
      type: 'weekly',
      dateRange: `${startStr} to ${endStr}`,
      title: `Weekly Productivity Report (${startStr} to ${endStr})`,
      totalTasks: totalTasksWeek,
      totalCompleted: totalCompletedWeek,
      completionRate: weekRate,
      totalMinutes: totalMinsWeek,
      timeSpentFormatted: `${weekHours}h ${weekMins}m`,
      bestDay: bestDay.name,
      dayBreakdowns,
      habitsCount: habits.length,
      trackerMap
    };
  }

  // 3. Monthly Report Compiler (Last 30 Days / Calendar Month)
  static async compileMonthlyReport(targetMonth = null, targetYear = null) {
    const now = new Date();
    const year = targetYear || now.getFullYear();
    const month = targetMonth !== null ? targetMonth : now.getMonth(); // 0-indexed

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const monthTitle = `${monthNames[month]} ${year}`;

    const startStr = `${year}-${(month + 1).toString().padStart(2, '0')}-01`;
    const endStr = `${year}-${(month + 1).toString().padStart(2, '0')}-${daysInMonth.toString().padStart(2, '0')}`;

    const tasks = await window.db.getAll('tasks');
    const habits = await window.db.getAll('habits');
    const trackers = await window.db.getAll('trackers');

    const trackerMap = new Map();
    trackers.forEach((t) => trackerMap.set(t.id, t.name));

    let monthTasksTotal = 0;
    let monthCompletedTotal = 0;
    let monthMinsTotal = 0;

    for (let d = 1; d <= daysInMonth; d++) {
      const dStr = `${year}-${(month + 1).toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`;
      const dTasks = window.RecurringEngine
        ? window.RecurringEngine.getTasksForDate(tasks, dStr)
        : tasks.filter((t) => t.due_date === dStr);

      const dCompleted = dTasks.filter((t) => t.status === 'completed');
      monthTasksTotal += dTasks.length;
      monthCompletedTotal += dCompleted.length;
      monthMinsTotal += dTasks.reduce((sum, t) => sum + (t.actual_minutes || 0), 0);
    }

    const monthRate = monthTasksTotal > 0 ? Math.round((monthCompletedTotal / monthTasksTotal) * 100) : 100;
    const monthHours = Math.floor(monthMinsTotal / 60);
    const monthMins = monthMinsTotal % 60;

    return {
      type: 'monthly',
      monthTitle,
      dateRange: `${startStr} to ${endStr}`,
      title: `Monthly Productivity Digest - ${monthTitle}`,
      totalTasks: monthTasksTotal,
      totalCompleted: monthCompletedTotal,
      completionRate: monthRate,
      timeSpentFormatted: `${monthHours}h ${monthMins}m`,
      totalMinutes: monthMinsTotal,
      habitsCount: habits.length,
      trackersCount: trackers.length
    };
  }

  // 4. Generate Formatted Email Summary (Daily / Weekly / Monthly)
  static async generateEmailSummary(type = 'daily', targetParam = null) {
    const overallStreak = window.streakEngine
      ? await window.streakEngine.evaluateOverallDailyStreak()
      : { currentStreak: 0, longestStreak: 0 };

    let subject = '';
    let body = '';

    if (type === 'daily') {
      const report = await this.compileDailyReport(targetParam);
      subject = `Daily Productivity Report - ${report.date}`;

      body = `TrackMate - Daily Productivity Report\n`;
      body += `Date: ${report.date}\n\n`;
      body += `===================================\n`;
      body += `DAILY TASK & HABIT SUMMARY\n`;
      body += `===================================\n\n`;
      body += `Tasks Status:\n`;
      body += `- Total Scheduled: ${report.tasks.length}\n`;
      body += `- Completed: ${report.completedTasks.length}\n`;
      body += `- Pending: ${report.pendingTasks.length}\n`;
      body += `- Missed: ${report.missedTasks.length}\n`;
      body += `- Completion Rate: ${report.completionRate}%\n\n`;

      body += `🔥 Active Streak: ${overallStreak.currentStreak} days (Best: 🏆 ${overallStreak.longestStreak} days)\n`;
      body += `Habits Completed: ${report.completedHabitsCount}/${report.totalHabitsCount}\n`;
      body += `Total Time Tracked: ${report.timeSpentFormatted}\n\n`;

      if (report.completedTasks.length > 0) {
        body += `Top Completed Tasks:\n`;
        report.completedTasks.slice(0, 5).forEach((t, idx) => {
          body += `${idx + 1}. ${t.title} (${t.actual_minutes || 0}m)\n`;
        });
        body += `\n`;
      }

      if (report.pendingTasks.length > 0) {
        body += `Pending Tasks for Attention:\n`;
        report.pendingTasks.slice(0, 5).forEach((t, idx) => {
          body += `${idx + 1}. ${t.title} [Priority: ${t.priority || 'medium'}]\n`;
        });
        body += `\n`;
      }
    } else if (type === 'weekly') {
      const report = await this.compileWeeklyReport(targetParam);
      subject = `Weekly Productivity Report - ${report.dateRange}`;

      body = `TrackMate - Weekly Productivity Digest\n`;
      body += `Range: ${report.dateRange}\n\n`;
      body += `===================================\n`;
      body += `WEEKLY PERFORMANCE SUMMARY\n`;
      body += `===================================\n\n`;
      body += `- Total Tasks Handled: ${report.totalTasks}\n`;
      body += `- Completed Tasks: ${report.totalCompleted}\n`;
      body += `- Weekly Completion Rate: ${report.completionRate}%\n`;
      body += `- Total Time Invested: ${report.timeSpentFormatted}\n`;
      body += `- Most Productive Day: ${report.bestDay}\n`;
      body += `- Current Streak: 🔥 ${overallStreak.currentStreak} days\n\n`;

      body += `Day-by-Day Breakdown:\n`;
      report.dayBreakdowns.forEach((day) => {
        body += `• ${day.dayName} (${day.date}): ${day.completedCount}/${day.tasksCount} done (${day.rate}%) - ${Math.round(day.timeSpentMins / 60)}h\n`;
      });
      body += `\n`;
    } else if (type === 'monthly') {
      const report = await this.compileMonthlyReport();
      subject = `Monthly Productivity Report - ${report.monthTitle}`;

      body = `TrackMate - Monthly Executive Summary\n`;
      body += `Month: ${report.monthTitle} (${report.dateRange})\n\n`;
      body += `===================================\n`;
      body += `MONTHLY MILESTONE & OUTPUT REPORT\n`;
      body += `===================================\n\n`;
      body += `- Total Tasks Planned: ${report.totalTasks}\n`;
      body += `- Total Tasks Completed: ${report.totalCompleted}\n`;
      body += `- Monthly Success Rate: ${report.completionRate}%\n`;
      body += `- Total Hours Tracked: ${report.timeSpentFormatted}\n`;
      body += `- Longest Streak Achieved: 🏆 ${overallStreak.longestStreak} days\n`;
      body += `- Trackers Managed: ${report.trackersCount}\n\n`;
    }

    body += `Generated automatically by TrackMate Personal Productivity.\n`;
    return { subject, body };
  }

  // 5. Excel / CSV Export for Daily, Weekly, or Monthly
  static async exportExcelReport(type = 'daily', targetParam = null) {
    const rows = [];

    if (type === 'daily') {
      const report = await this.compileDailyReport(targetParam);
      rows.push(['Date', 'Tracker', 'Task / Habit', 'Type', 'Status', 'Priority', 'Time Spent (mins)', 'Completion %']);

      report.tasks.forEach((t) => {
        rows.push([
          report.date,
          report.trackerMap.get(t.tracker_id) || 'General',
          `"${(t.title || '').replace(/"/g, '""')}"`,
          'Task',
          t.status || 'not_started',
          t.priority || 'medium',
          t.actual_minutes || 0,
          `${report.completionRate}%`
        ]);
      });

      report.habits.forEach((h) => {
        rows.push([
          report.date,
          h.tracker_name,
          `"[Habit] ${(h.habit_name || '').replace(/"/g, '""')}"`,
          'Habit',
          h.is_completed ? 'Completed' : 'Incomplete',
          'Medium',
          0,
          `${report.completionRate}%`
        ]);
      });

      this.downloadCSV(rows, `TrackMate_Daily_Report_${report.date}.csv`);
    } else if (type === 'weekly') {
      const report = await this.compileWeeklyReport(targetParam);
      rows.push(['Date', 'Day', 'Tasks Planned', 'Tasks Completed', 'Completion Rate %', 'Time Spent (mins)']);

      report.dayBreakdowns.forEach((d) => {
        rows.push([d.date, d.dayName, d.tasksCount, d.completedCount, `${d.rate}%`, d.timeSpentMins]);
      });

      this.downloadCSV(rows, `TrackMate_Weekly_Report_${report.dateRange.replace(/\s+/g, '_')}.csv`);
    } else if (type === 'monthly') {
      const report = await this.compileMonthlyReport();
      rows.push(['Metric', 'Value']);
      rows.push(['Month', report.monthTitle]);
      rows.push(['Date Range', report.dateRange]);
      rows.push(['Total Tasks', report.totalTasks]);
      rows.push(['Completed Tasks', report.totalCompleted]);
      rows.push(['Monthly Completion Rate', `${report.completionRate}%`]);
      rows.push(['Total Time Tracked', report.timeSpentFormatted]);

      this.downloadCSV(rows, `TrackMate_Monthly_Report_${report.monthTitle.replace(/\s+/g, '_')}.csv`);
    }
  }

  static downloadCSV(rows, filename) {
    const csvContent = '\uFEFF' + rows.map((r) => r.join(',')).join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    if (window.notifications) {
      window.notifications.showToast(`📊 Report downloaded: ${filename}!`);
    }
  }

  // 6. Direct Gmail / Mailto Dispatch
  static async sendViaGmail(type = 'daily', recipientEmail = '', targetParam = null) {
    const { subject, body } = await this.generateEmailSummary(type, targetParam);
    const to = encodeURIComponent(recipientEmail || '');
    const su = encodeURIComponent(subject);
    const bodyEncoded = encodeURIComponent(body);

    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${to}&su=${su}&body=${bodyEncoded}`;
    window.open(gmailUrl, '_blank');
  }

  static async sendViaMailto(type = 'daily', recipientEmail = '', targetParam = null) {
    const { subject, body } = await this.generateEmailSummary(type, targetParam);
    const to = encodeURIComponent(recipientEmail || '');
    const su = encodeURIComponent(subject);
    const bodyEncoded = encodeURIComponent(body);

    window.location.href = `mailto:${to}?subject=${su}&body=${bodyEncoded}`;
  }
}

window.ReportsEngine = TrackMateReportsEngine;
