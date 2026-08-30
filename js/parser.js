/**
 * TrackMate - Natural Language Quick-Add Parser
 * Intelligently extracts Task Title, Due Date, Due Time, Priority, Category, and Recurring schedules
 * Example: "Study DBMS tomorrow 7 PM !urgent #study" ->
 * { title: "Study DBMS", date: "2026-08-31", time: "19:00", priority: "urgent", category: "study" }
 */

class QuickAddParser {
  static parse(input) {
    if (!input || typeof input !== 'string') {
      return { title: '', date: '', time: '', priority: 'medium', category: '', tags: [], recurrence: null };
    }

    let text = input.trim();
    let priority = 'medium';
    let category = '';
    const tags = [];
    let recurrence = null;
    let dueDate = '';
    let dueTime = '';

    // 1. Extract Priority (!urgent, !high, !medium, !low, p1, p2, p3, p4)
    if (/\b(!urgent|p1)\b/i.test(text)) {
      priority = 'urgent';
      text = text.replace(/\b(!urgent|p1)\b/gi, '');
    } else if (/\b(!high|p2)\b/i.test(text)) {
      priority = 'high';
      text = text.replace(/\b(!high|p2)\b/gi, '');
    } else if (/\b(!medium|p3)\b/i.test(text)) {
      priority = 'medium';
      text = text.replace(/\b(!medium|p3)\b/gi, '');
    } else if (/\b(!low|p4)\b/i.test(text)) {
      priority = 'low';
      text = text.replace(/\b(!low|p4)\b/gi, '');
    }

    // 2. Extract Category/Tags (#study, #fitness, #work)
    const tagMatches = text.match(/#([\w-]+)/g);
    if (tagMatches) {
      tagMatches.forEach((tag) => {
        const cleanTag = tag.replace('#', '');
        tags.push(cleanTag);
        if (!category) category = cleanTag.charAt(0).toUpperCase() + cleanTag.slice(1);
      });
      text = text.replace(/#([\w-]+)/g, '');
    }

    // 3. Extract Recurring Patterns ("every day", "every weekday", "every monday, wednesday", "every week")
    if (/\bevery\s+day\b/i.test(text)) {
      recurrence = { pattern: 'daily', label: 'Every Day' };
      text = text.replace(/\bevery\s+day\b/gi, '');
    } else if (/\bevery\s+weekday\b/i.test(text)) {
      recurrence = { pattern: 'weekdays', label: 'Every Weekday (Mon-Fri)', days: [1, 2, 3, 4, 5] };
      text = text.replace(/\bevery\s+weekday\b/gi, '');
    } else if (/\bevery\s+weekend\b/i.test(text)) {
      recurrence = { pattern: 'weekends', label: 'Every Weekend (Sat-Sun)', days: [6, 7] };
      text = text.replace(/\bevery\s+weekend\b/gi, '');
    } else if (/\bevery\s+(mon(?:day)?|tue(?:sday)?|wed(?:nesday)?|thu(?:rsday)?|fri(?:day)?|sat(?:urday)?|sun(?:day)?)(?:(?:\s*,\s*|\s+and\s+)(mon(?:day)?|tue(?:sday)?|wed(?:nesday)?|thu(?:rsday)?|fri(?:day)?|sat(?:urday)?|sun(?:day)?))*/i.test(text)) {
      const match = text.match(/\bevery\s+((?:(?:mon(?:day)?|tue(?:sday)?|wed(?:nesday)?|thu(?:rsday)?|fri(?:day)?|sat(?:urday)?|sun(?:day)?)(?:\s*,\s*|\s+and\s+|\s+)?)+)/i);
      if (match) {
        const dayMap = { mon: 1, monday: 1, tue: 2, tuesday: 2, wed: 3, wednesday: 3, thu: 4, thursday: 4, fri: 5, friday: 5, sat: 6, saturday: 6, sun: 7, sunday: 7 };
        const foundDays = [];
        const rawDays = match[1].toLowerCase().replace(/and/g, ',').split(/[\s,]+/);
        rawDays.forEach((d) => {
          if (dayMap[d]) foundDays.push(dayMap[d]);
        });
        recurrence = { pattern: 'custom_days', label: match[0], days: [...new Set(foundDays)] };
        text = text.replace(match[0], '');
      }
    }

    // 4. Extract Date ("today", "tomorrow", "next monday", etc.)
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    if (/\btoday\b/i.test(text)) {
      dueDate = todayStr;
      text = text.replace(/\btoday\b/gi, '');
    } else if (/\btomorrow\b/i.test(text)) {
      const tmrw = new Date();
      tmrw.setDate(now.getDate() + 1);
      dueDate = tmrw.toISOString().split('T')[0];
      text = text.replace(/\btomorrow\b/gi, '');
    } else if (/\bnext\s+(mon(?:day)?|tue(?:sday)?|wed(?:nesday)?|thu(?:rsday)?|fri(?:day)?|sat(?:urday)?|sun(?:day)?)\b/i.test(text)) {
      const match = text.match(/\bnext\s+(mon(?:day)?|tue(?:sday)?|wed(?:nesday)?|thu(?:rsday)?|fri(?:day)?|sat(?:urday)?|sun(?:day)?)\b/i);
      const targetDayStr = match[1].toLowerCase().substring(0, 3);
      const targetDayMap = { sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6 };
      const targetDayNum = targetDayMap[targetDayStr];
      const targetDate = new Date();
      const currentDayNum = targetDate.getDay();
      let diff = (targetDayNum + 7 - currentDayNum) % 7;
      if (diff === 0) diff = 7;
      targetDate.setDate(targetDate.getDate() + diff);
      dueDate = targetDate.toISOString().split('T')[0];
      text = text.replace(match[0], '');
    }

    // 5. Extract Time ("7 PM", "7:30 PM", "14:00", "at 9am")
    const timeMatch = text.match(/\b(?:at\s+)?([0-1]?[0-9]|2[0-3])(?::([0-5][0-9]))?\s*(am|pm)?\b/i);
    if (timeMatch) {
      let hours = parseInt(timeMatch[1], 10);
      const minutes = timeMatch[2] ? timeMatch[2] : '00';
      const meridian = timeMatch[3] ? timeMatch[3].toLowerCase() : null;

      if (meridian === 'pm' && hours < 12) hours += 12;
      if (meridian === 'am' && hours === 12) hours = 0;

      dueTime = `${hours.toString().padStart(2, '0')}:${minutes}`;
      text = text.replace(timeMatch[0], '');
    }

    // Default due date to today if not parsed
    if (!dueDate) dueDate = todayStr;

    // Clean up remaining text as Task Title
    const title = text.replace(/\s+/g, ' ').trim();

    return {
      title: title || 'New Task',
      date: dueDate,
      time: dueTime,
      priority,
      category,
      tags,
      recurrence
    };
  }
}

window.QuickAddParser = QuickAddParser;

