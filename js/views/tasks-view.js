/**
 * TrackMate - Tasks View & Management
 */

class TasksView {
  static timerInterval = null;
  static activeTimerTaskId = null;
  static timerSeconds = 0;

  static async render(container) {
    const tasks = window.state.tasks;
    const trackers = window.state.trackers;
    const activeFilter = window.state.activeFilter || 'all';

    // Parse URL params for tracker filter if present
    const urlParams = new URLSearchParams(window.location.hash.split('?')[1] || '');
    const trackerFilter = urlParams.get('tracker');

    const trackerMap = new Map();
    trackers.forEach((t) => trackerMap.set(t.id, t));

    // Apply Filter Logic
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const tmrw = new Date(now);
    tmrw.setDate(now.getDate() + 1);
    const tmrwStr = tmrw.toISOString().split('T')[0];

    let filteredTasks = tasks;

    if (trackerFilter) {
      filteredTasks = filteredTasks.filter((t) => t.tracker_id === trackerFilter);
    }

    if (activeFilter === 'today') {
      filteredTasks = window.RecurringEngine
        ? window.RecurringEngine.getTasksForDate(filteredTasks, todayStr)
        : filteredTasks.filter((t) => t.due_date === todayStr);
    } else if (activeFilter === 'tomorrow') {
      filteredTasks = filteredTasks.filter((t) => t.due_date === tmrwStr);
    } else if (activeFilter === 'pending') {
      filteredTasks = filteredTasks.filter((t) => t.status !== 'completed');
    } else if (activeFilter === 'completed') {
      filteredTasks = filteredTasks.filter((t) => t.status === 'completed');
    } else if (activeFilter === 'high_priority') {
      filteredTasks = filteredTasks.filter((t) => t.priority === 'urgent' || t.priority === 'high');
    }

    container.innerHTML = `
      <div class="tasks-toolbar">
        <div>
          <h1 class="page-title">
            ${trackerFilter && trackerMap.has(trackerFilter) ? `${trackerMap.get(trackerFilter).emoji} ${trackerMap.get(trackerFilter).name}` : 'All Tasks'}
          </h1>
          <div style="font-size: var(--text-xs); color: var(--text-muted); margin-top: 2px;">
            ${filteredTasks.length} task${filteredTasks.length === 1 ? '' : 's'} displayed
          </div>
        </div>

        <button class="btn btn-primary" onclick="window.TasksView.openTaskModal()">
          <span>+</span> Add Task
        </button>
      </div>

      <!-- Filter Chips -->
      <div class="task-filter-chips">
        <button class="filter-chip ${activeFilter === 'all' ? 'active' : ''}" onclick="window.TasksView.setFilter('all')">All Tasks</button>
        <button class="filter-chip ${activeFilter === 'today' ? 'active' : ''}" onclick="window.TasksView.setFilter('today')">Today</button>
        <button class="filter-chip ${activeFilter === 'tomorrow' ? 'active' : ''}" onclick="window.TasksView.setFilter('tomorrow')">Tomorrow</button>
        <button class="filter-chip ${activeFilter === 'pending' ? 'active' : ''}" onclick="window.TasksView.setFilter('pending')">Pending</button>
        <button class="filter-chip ${activeFilter === 'completed' ? 'active' : ''}" onclick="window.TasksView.setFilter('completed')">Completed</button>
        <button class="filter-chip ${activeFilter === 'high_priority' ? 'active' : ''}" onclick="window.TasksView.setFilter('high_priority')">🔥 High Priority</button>
      </div>

      <!-- Tasks List -->
      <div class="tasks-list-container" style="margin-top: var(--space-4);">
        ${
          filteredTasks.length === 0
            ? `<div style="text-align: center; padding: 3rem; background: var(--bg-secondary); border-radius: var(--radius-xl); border: 1px dashed var(--border-strong);">
                 <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">📝</div>
                 <h3 style="font-size: var(--text-base); font-weight: 700;">No tasks found</h3>
                 <p style="font-size: var(--text-xs); color: var(--text-muted); margin-top: 4px;">Click "+ Add Task" to create one!</p>
               </div>`
            : filteredTasks.map((task) => {
                const trk = trackerMap.get(task.tracker_id);
                const subtasks = task.subtasks || [];
                const doneSubtasks = subtasks.filter((s) => s.completed).length;
                const isRunning = TasksView.activeTimerTaskId === task.id;

                return `
                  <div class="task-card-item ${task.status === 'completed' ? 'completed' : ''}" data-task-id="${task.id}">
                    <div class="task-main-info">
                      <div class="task-custom-checkbox ${task.status === 'completed' ? 'checked' : ''}" onclick="window.state.toggleTaskCompletion('${task.id}', ${task.status !== 'completed'})">
                        ${task.status === 'completed' ? '✓' : ''}
                      </div>

                      <div class="task-text-group">
                        <div class="task-title-line" onclick="window.TasksView.openTaskModal('${task.id}')" style="cursor: pointer;">
                          ${task.title}
                        </div>
                        <div class="task-metadata-line">
                          ${trk ? `<span class="badge" style="background: ${trk.color}22; color: ${trk.color}; font-size: 10px;">${trk.emoji} ${trk.name}</span>` : ''}
                          <span class="badge badge-${task.priority || 'medium'}">${task.priority || 'medium'}</span>
                          ${task.due_date ? `<span class="task-meta-item">📅 ${task.due_date} ${task.due_time ? task.due_time : ''}</span>` : ''}
                          ${task.recurring_pattern && task.recurring_pattern !== 'none' ? `<span class="task-meta-item">🔁 ${task.recurring_pattern}</span>` : ''}
                          ${subtasks.length > 0 ? `<span class="subtask-progress-box">☑️ ${doneSubtasks}/${subtasks.length}</span>` : ''}
                        </div>
                      </div>
                    </div>

                    <div class="task-actions-group">
                      <!-- Timer Button -->
                      <button class="time-tracker-pill ${isRunning ? 'running' : ''}" onclick="window.TasksView.toggleTaskTimer('${task.id}')" title="Track Time">
                        ⏱️ ${isRunning ? TasksView.formatSeconds(TasksView.timerSeconds) : `${task.actual_minutes || 0}m`}
                      </button>

                      <button class="btn-icon" title="Duplicate Task" onclick="window.TasksView.duplicateTask('${task.id}')">📋</button>
                      <button class="btn-icon" title="Edit Task" onclick="window.TasksView.openTaskModal('${task.id}')">✏️</button>
                      <button class="btn-icon" title="Delete Task" onclick="window.TasksView.deleteTask('${task.id}')">🗑️</button>
                    </div>
                  </div>
                `;
              }).join('')
        }
      </div>

      <!-- Add/Edit Task Modal -->
      <div id="task-modal" class="modal-overlay">
        <div class="modal-container">
          <div class="modal-header">
            <h2 id="task-modal-title" class="modal-title">Task Details</h2>
            <button class="btn-icon" onclick="window.TasksView.closeTaskModal()">✕</button>
          </div>
          <div class="modal-body">
            <form id="task-form" onsubmit="window.TasksView.handleTaskSubmit(event)">
              <input type="hidden" id="task-modal-id" value="">

              <div class="form-group">
                <label class="form-label">Task Title *</label>
                <input type="text" id="task-input-title" class="form-control" placeholder="What needs to be done?" required>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Tracker</label>
                  <select id="task-input-tracker" class="form-select">
                    ${trackers.map((t) => `<option value="${t.id}">${t.emoji} ${t.name}</option>`).join('')}
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">Priority</label>
                  <select id="task-input-priority" class="form-select">
                    <option value="urgent">🔴 Urgent</option>
                    <option value="high">🟠 High</option>
                    <option value="medium" selected>🔵 Medium</option>
                    <option value="low">⚪ Low</option>
                  </select>
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Due Date</label>
                  <input type="date" id="task-input-date" class="form-control" value="${todayStr}">
                </div>
                <div class="form-group">
                  <label class="form-label">Due Time</label>
                  <input type="time" id="task-input-time" class="form-control">
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Repeat Schedule</label>
                  <select id="task-input-recurring" class="form-select">
                    <option value="none">Does not repeat</option>
                    <option value="daily">Every day</option>
                    <option value="weekdays">Every weekday (Mon-Fri)</option>
                    <option value="weekends">Every weekend (Sat-Sun)</option>
                    <option value="weekly">Every week</option>
                    <option value="monthly">Every month</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">Estimated Time (mins)</label>
                  <input type="number" id="task-input-est-time" class="form-control" placeholder="e.g. 45" value="30">
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">Description / Notes</label>
                <textarea id="task-input-desc" class="form-textarea" placeholder="Add additional details or markdown notes..."></textarea>
              </div>

              <!-- Subtasks Builder -->
              <div class="form-group">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                  <label class="form-label" style="margin: 0;">Subtasks Checklist</label>
                  <button type="button" class="btn btn-sm btn-outline" onclick="window.TasksView.addSubtaskInput()">+ Subtask</button>
                </div>
                <div id="subtasks-container" style="display: flex; flex-direction: column; gap: 6px;"></div>
              </div>

              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" onclick="window.TasksView.closeTaskModal()">Cancel</button>
                <button type="submit" class="btn btn-primary">Save Task</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    `;
  }

  static setFilter(filter) {
    window.state.activeFilter = filter;
    this.render(document.getElementById('view-content'));
  }

  static openTaskModal(taskId = null) {
    const titleEl = document.getElementById('task-modal-title');
    const idEl = document.getElementById('task-modal-id');
    const titleInput = document.getElementById('task-input-title');
    const trackerSelect = document.getElementById('task-input-tracker');
    const prioritySelect = document.getElementById('task-input-priority');
    const dateInput = document.getElementById('task-input-date');
    const timeInput = document.getElementById('task-input-time');
    const recurringSelect = document.getElementById('task-input-recurring');
    const estTimeInput = document.getElementById('task-input-est-time');
    const descInput = document.getElementById('task-input-desc');
    const subtasksContainer = document.getElementById('subtasks-container');

    subtasksContainer.innerHTML = '';

    if (taskId) {
      const task = window.state.tasks.find((t) => t.id === taskId);
      if (task) {
        titleEl.textContent = 'Edit Task';
        idEl.value = task.id;
        titleInput.value = task.title;
        trackerSelect.value = task.tracker_id || '';
        prioritySelect.value = task.priority || 'medium';
        dateInput.value = task.due_date || '';
        timeInput.value = task.due_time || '';
        recurringSelect.value = task.recurring_pattern || 'none';
        estTimeInput.value = task.estimated_minutes || 0;
        descInput.value = task.description || '';

        if (Array.isArray(task.subtasks)) {
          task.subtasks.forEach((st) => this.addSubtaskInput(st.title, st.completed));
        }
      }
    } else {
      titleEl.textContent = 'Add New Task';
      idEl.value = '';
      titleInput.value = '';
      dateInput.value = new Date().toISOString().split('T')[0];
      timeInput.value = '';
      descInput.value = '';
    }

    document.getElementById('task-modal').classList.add('active');
  }

  static closeTaskModal() {
    document.getElementById('task-modal').classList.remove('active');
  }

  static addSubtaskInput(title = '', isChecked = false) {
    const container = document.getElementById('subtasks-container');
    const item = document.createElement('div');
    item.className = 'subtask-input-item';
    item.style.display = 'flex';
    item.style.alignItems = 'center';
    item.style.gap = '8px';
    item.innerHTML = `
      <input type="checkbox" class="subtask-checkbox" ${isChecked ? 'checked' : ''} style="width: 16px; height: 16px;">
      <input type="text" class="form-control subtask-title-input" value="${title}" placeholder="Subtask title..." style="padding: 4px 8px; font-size: 13px;">
      <button type="button" class="btn btn-icon btn-sm" onclick="this.parentElement.remove()">✕</button>
    `;
    container.appendChild(item);
  }

  static async handleTaskSubmit(event) {
    event.preventDefault();
    const id = document.getElementById('task-modal-id').value;
    const title = document.getElementById('task-input-title').value;
    const tracker_id = document.getElementById('task-input-tracker').value;
    const priority = document.getElementById('task-input-priority').value;
    const due_date = document.getElementById('task-input-date').value;
    const due_time = document.getElementById('task-input-time').value;
    const recurring_pattern = document.getElementById('task-input-recurring').value;
    const estimated_minutes = parseInt(document.getElementById('task-input-est-time').value, 10) || 0;
    const description = document.getElementById('task-input-desc').value;

    const subtasks = [];
    document.querySelectorAll('.subtask-input-item').forEach((item, index) => {
      const stTitle = item.querySelector('.subtask-title-input').value.trim();
      const isChecked = item.querySelector('.subtask-checkbox').checked;
      if (stTitle) {
        subtasks.push({ id: `st-${index + 1}`, title: stTitle, completed: isChecked });
      }
    });

    const taskData = {
      id: id || undefined,
      title,
      tracker_id,
      priority,
      status: 'not_started',
      due_date,
      due_time,
      recurring_pattern,
      estimated_minutes,
      description,
      subtasks
    };

    await window.state.saveTask(taskData);
    this.closeTaskModal();
    if (window.notifications) {
      window.notifications.showToast(`Task "${title}" saved! 📝`);
    }
  }

  static async duplicateTask(taskId) {
    const task = window.state.tasks.find((t) => t.id === taskId);
    if (!task) return;
    const copy = { ...task, id: undefined, title: `${task.title} (Copy)`, status: 'not_started' };
    await window.state.saveTask(copy);
    if (window.notifications) {
      window.notifications.showToast('Task duplicated! 📋');
    }
  }

  static async deleteTask(taskId) {
    if (confirm('Delete this task?')) {
      await window.state.deleteTask(taskId);
      if (window.notifications) {
        window.notifications.showToast('Task deleted.');
      }
    }
  }

  // Live Timer implementation
  static toggleTaskTimer(taskId) {
    if (this.activeTimerTaskId === taskId) {
      // Stop timer & save logged time
      clearInterval(this.timerInterval);
      const minutesLogged = Math.ceil(this.timerSeconds / 60);
      const task = window.state.tasks.find((t) => t.id === taskId);
      if (task) {
        task.actual_minutes = (task.actual_minutes || 0) + minutesLogged;
        window.state.saveTask(task);
      }
      this.activeTimerTaskId = null;
      this.timerSeconds = 0;
      if (window.notifications) window.notifications.showToast(`Logged ${minutesLogged}m to task! ⏱️`);
      this.render(document.getElementById('view-content'));
    } else {
      // Start timer
      if (this.timerInterval) clearInterval(this.timerInterval);
      this.activeTimerTaskId = taskId;
      this.timerSeconds = 0;
      this.timerInterval = setInterval(() => {
        this.timerSeconds++;
      }, 1000);
      this.render(document.getElementById('view-content'));
    }
  }

  static formatSeconds(totalSecs) {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
}

window.TasksView = TasksView;

