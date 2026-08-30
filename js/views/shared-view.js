/**
 * TrackMate - Shared Tracker Collaboration View
 */

class SharedView {
  static async render(container, trackerId, token) {
    const tracker = window.state.trackers.find((t) => t.id === trackerId) || {
      id: trackerId,
      name: 'Shared Collaboration Tracker',
      emoji: '🤝',
      color: '#6366f1',
      description: 'Collaborative shared tracker'
    };

    const tasks = window.state.tasks.filter((t) => t.tracker_id === trackerId);

    container.innerHTML = `
      <div style="background: linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(139, 92, 246, 0.08)); border: 1px solid var(--border-strong); border-radius: var(--radius-xl); padding: var(--space-6); margin-bottom: var(--space-6);">
        <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px;">
          <div style="display: flex; align-items: center; gap: 14px;">
            <div style="font-size: 32px;">${tracker.emoji || '🤝'}</div>
            <div>
              <h1 class="page-title">${tracker.name} (Shared)</h1>
              <p style="font-size: var(--text-xs); color: var(--text-muted); margin-top: 2px;">
                Collaborative workspace • Permission: <strong style="color: var(--accent-emerald);">Editor</strong>
              </p>
            </div>
          </div>
          <button class="btn btn-primary" onclick="window.TasksView.openTaskModal()">+ Add Shared Task</button>
        </div>
      </div>

      <div class="tasks-list-container">
        ${
          tasks.length === 0
            ? `<div style="text-align: center; padding: 3rem; background: var(--bg-secondary); border-radius: var(--radius-xl);">
                 <div style="font-size: 2rem; margin-bottom: 0.5rem;">🤝</div>
                 <div style="font-weight: 600;">No tasks in this shared tracker yet</div>
                 <p style="font-size: var(--text-xs); color: var(--text-muted); margin-top: 4px;">Add a task to start collaborating with team members.</p>
               </div>`
            : tasks.map((task) => `
              <div class="task-card-item ${task.status === 'completed' ? 'completed' : ''}">
                <div class="task-main-info">
                  <div class="task-custom-checkbox ${task.status === 'completed' ? 'checked' : ''}"
                       onclick="window.state.toggleTaskCompletion('${task.id}', ${task.status !== 'completed'})">
                    ${task.status === 'completed' ? '✓' : ''}
                  </div>
                  <div class="task-text-group">
                    <div class="task-title-line">${task.title}</div>
                    <div class="task-metadata-line">
                      <span class="badge badge-${task.priority || 'medium'}">${task.priority || 'medium'}</span>
                      ${task.due_date ? `<span>📅 ${task.due_date}</span>` : ''}
                    </div>
                  </div>
                </div>
              </div>
            `).join('')
        }
      </div>
    `;
  }
}

window.SharedView = SharedView;

