/**
 * TrackMate - Goals & Projects View
 */

class GoalsView {
  static async render(container) {
    const goals = window.state.goals;
    const projects = window.state.projects;
    const tasks = window.state.tasks;

    container.innerHTML = `
      <div class="trackers-header-actions">
        <div>
          <h1 class="page-title">Goals & Projects</h1>
          <p style="font-size: var(--text-xs); color: var(--text-muted); margin-top: 2px;">
            Set long-term targets, milestone objectives, and track completion progress.
          </p>
        </div>
        <div style="display: flex; gap: 8px;">
          <button class="btn btn-outline" onclick="window.GoalsView.openGoalModal()">+ New Goal</button>
          <button class="btn btn-primary" onclick="window.GoalsView.openProjectModal()">+ New Project</button>
        </div>
      </div>

      <!-- Goals Section -->
      <div style="margin-bottom: var(--space-8);">
        <h2 style="font-size: var(--text-lg); font-weight: 700; margin-bottom: var(--space-4); display: flex; align-items: center; gap: 8px;">
          <span>🎯</span> Personal Goals (${goals.length})
        </h2>

        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: var(--space-4);">
          ${
            goals.length === 0
              ? `<div style="grid-column: 1/-1; padding: 2rem; background: var(--bg-secondary); border-radius: var(--radius-lg); text-align: center; border: 1px dashed var(--border-strong);">
                   <div style="font-size: 2rem; margin-bottom: 0.5rem;">🎯</div>
                   <div style="font-weight: 600;">No goals established yet</div>
                   <p style="font-size: var(--text-xs); color: var(--text-muted); margin-top: 4px;">Example: "Learn JavaScript (30 hours)" or "Read 12 Books"</p>
                 </div>`
              : goals.map((goal) => {
                  const pct = Math.min(100, Math.round(((goal.current_progress || 0) / (goal.target_value || 1)) * 100));
                  return `
                    <div class="card">
                      <div class="card-header">
                        <span class="card-title">${goal.title}</span>
                        <button class="btn-icon" onclick="window.GoalsView.deleteGoal('${goal.id}')">🗑️</button>
                      </div>
                      <p style="font-size: var(--text-xs); color: var(--text-muted); margin-bottom: var(--space-3);">${goal.description || ''}</p>
                      
                      <div style="margin-bottom: var(--space-3);">
                        <div style="display: flex; justify-content: space-between; font-size: var(--text-xs); font-weight: 600; margin-bottom: 4px;">
                          <span>Progress (${goal.current_progress || 0} / ${goal.target_value} ${goal.unit || 'hrs'})</span>
                          <span>${pct}%</span>
                        </div>
                        <div style="width: 100%; height: 8px; background: var(--bg-tertiary); border-radius: 4px; overflow: hidden;">
                          <div style="width: ${pct}%; height: 100%; background: var(--primary); transition: width 0.3s ease;"></div>
                        </div>
                      </div>

                      <div style="display: flex; justify-content: space-between; align-items: center; font-size: 11px; color: var(--text-muted);">
                        <span>📅 Deadline: ${goal.deadline || 'No deadline'}</span>
                        <button class="btn btn-sm btn-outline" onclick="window.GoalsView.incrementGoal('${goal.id}')">+ Log Progress</button>
                      </div>
                    </div>
                  `;
                }).join('')
          }
        </div>
      </div>

      <!-- Projects Section -->
      <div>
        <h2 style="font-size: var(--text-lg); font-weight: 700; margin-bottom: var(--space-4); display: flex; align-items: center; gap: 8px;">
          <span>🚀</span> Projects (${projects.length})
        </h2>

        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: var(--space-4);">
          ${
            projects.length === 0
              ? `<div style="grid-column: 1/-1; padding: 2rem; background: var(--bg-secondary); border-radius: var(--radius-lg); text-align: center; border: 1px dashed var(--border-strong);">
                   <div style="font-size: 2rem; margin-bottom: 0.5rem;">🚀</div>
                   <div style="font-weight: 600;">No projects created yet</div>
                   <p style="font-size: var(--text-xs); color: var(--text-muted); margin-top: 4px;">Create a project to bundle milestones, tasks, and deadlines!</p>
                 </div>`
              : projects.map((proj) => `
                <div class="card">
                  <div class="card-header">
                    <span class="card-title">${proj.name}</span>
                    <button class="btn-icon" onclick="window.GoalsView.deleteProject('${proj.id}')">🗑️</button>
                  </div>
                  <p style="font-size: var(--text-xs); color: var(--text-muted); margin-bottom: var(--space-3);">${proj.description || ''}</p>
                  
                  <div style="display: flex; gap: 6px; flex-direction: column; margin-bottom: var(--space-3);">
                    ${(proj.milestones || []).map((m, idx) => `
                      <label style="display: flex; align-items: center; gap: 8px; font-size: 12px; cursor: pointer;">
                        <input type="checkbox" ${m.completed ? 'checked' : ''} onchange="window.GoalsView.toggleMilestone('${proj.id}', ${idx})">
                        <span style="${m.completed ? 'text-decoration: line-through; opacity: 0.6;' : ''}">${m.title}</span>
                      </label>
                    `).join('')}
                  </div>

                  <div style="font-size: 11px; color: var(--text-muted);">
                    Target Deadline: ${proj.deadline || 'Ongoing'}
                  </div>
                </div>
              `).join('')
          }
        </div>
      </div>

      <!-- Goal Modal -->
      <div id="goal-modal" class="modal-overlay">
        <div class="modal-container">
          <div class="modal-header">
            <h2 class="modal-title">Create Goal</h2>
            <button class="btn-icon" onclick="document.getElementById('goal-modal').classList.remove('active')">✕</button>
          </div>
          <div class="modal-body">
            <form onsubmit="window.GoalsView.handleGoalSubmit(event)">
              <div class="form-group">
                <label class="form-label">Goal Title *</label>
                <input type="text" id="goal-title" class="form-control" placeholder="e.g. Master JavaScript Algorithms" required>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Target Metric Value</label>
                  <input type="number" id="goal-target" class="form-control" placeholder="e.g. 30" required>
                </div>
                <div class="form-group">
                  <label class="form-label">Unit of Measure</label>
                  <input type="text" id="goal-unit" class="form-control" placeholder="e.g. hours, books, miles" value="hours">
                </div>
              </div>
              <div class="form-group">
                <label class="form-label">Deadline</label>
                <input type="date" id="goal-deadline" class="form-control">
              </div>
              <div class="form-group">
                <label class="form-label">Description</label>
                <textarea id="goal-desc" class="form-textarea" placeholder="Why do you want to achieve this goal?"></textarea>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" onclick="document.getElementById('goal-modal').classList.remove('active')">Cancel</button>
                <button type="submit" class="btn btn-primary">Save Goal</button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <!-- Project Modal -->
      <div id="project-modal" class="modal-overlay">
        <div class="modal-container">
          <div class="modal-header">
            <h2 class="modal-title">Create Project</h2>
            <button class="btn-icon" onclick="document.getElementById('project-modal').classList.remove('active')">✕</button>
          </div>
          <div class="modal-body">
            <form onsubmit="window.GoalsView.handleProjectSubmit(event)">
              <div class="form-group">
                <label class="form-label">Project Name *</label>
                <input type="text" id="proj-name" class="form-control" placeholder="e.g. Final Year Capstone Project" required>
              </div>
              <div class="form-group">
                <label class="form-label">Description</label>
                <textarea id="proj-desc" class="form-textarea" placeholder="Project overview and deliverables"></textarea>
              </div>
              <div class="form-group">
                <label class="form-label">Target Deadline</label>
                <input type="date" id="proj-deadline" class="form-control">
              </div>
              <div class="form-group">
                <label class="form-label">Initial Milestones (One per line)</label>
                <textarea id="proj-milestones" class="form-textarea" placeholder="Research & Architecture&#10;Database Setup&#10;Feature Implementation&#10;Testing & Deployment"></textarea>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" onclick="document.getElementById('project-modal').classList.remove('active')">Cancel</button>
                <button type="submit" class="btn btn-primary">Save Project</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    `;
  }

  static openGoalModal() {
    document.getElementById('goal-modal').classList.add('active');
  }

  static openProjectModal() {
    document.getElementById('project-modal').classList.add('active');
  }

  static async handleGoalSubmit(event) {
    event.preventDefault();
    const title = document.getElementById('goal-title').value;
    const target_value = parseFloat(document.getElementById('goal-target').value) || 10;
    const unit = document.getElementById('goal-unit').value || 'hours';
    const deadline = document.getElementById('goal-deadline').value;
    const description = document.getElementById('goal-desc').value;

    const goal = {
      id: window.db.generateUUID(),
      title,
      target_value,
      current_progress: 0,
      unit,
      deadline,
      description,
      user_id: window.state.userProfile.id
    };

    await window.db.put('goals', goal);
    await window.syncEngine.queueMutation('goals', 'upsert', goal);
    await window.state.refreshAllData();
    document.getElementById('goal-modal').classList.remove('active');
    if (window.notifications) window.notifications.showToast(`Goal "${title}" saved! 🎯`);
  }

  static async handleProjectSubmit(event) {
    event.preventDefault();
    const name = document.getElementById('proj-name').value;
    const description = document.getElementById('proj-desc').value;
    const deadline = document.getElementById('proj-deadline').value;
    const rawMilestones = document.getElementById('proj-milestones').value;

    const milestones = rawMilestones
      .split('\n')
      .map((m) => m.trim())
      .filter(Boolean)
      .map((title) => ({ title, completed: false }));

    const project = {
      id: window.db.generateUUID(),
      name,
      description,
      deadline,
      milestones,
      user_id: window.state.userProfile.id
    };

    await window.db.put('projects', project);
    await window.syncEngine.queueMutation('projects', 'upsert', project);
    await window.state.refreshAllData();
    document.getElementById('project-modal').classList.remove('active');
    if (window.notifications) window.notifications.showToast(`Project "${name}" created! 🚀`);
  }

  static async incrementGoal(goalId) {
    const goal = await window.db.get('goals', goalId);
    if (!goal) return;
    const increment = prompt(`Enter amount to add to "${goal.title}" (${goal.unit}):`, '1');
    if (increment && !isNaN(increment)) {
      goal.current_progress = (goal.current_progress || 0) + parseFloat(increment);
      await window.db.put('goals', goal);
      await window.syncEngine.queueMutation('goals', 'upsert', goal);
      await window.state.refreshAllData();
      if (window.notifications) window.notifications.showToast('Goal progress updated! 📈');
    }
  }

  static async toggleMilestone(projectId, index) {
    const project = await window.db.get('projects', projectId);
    if (!project || !project.milestones[index]) return;
    project.milestones[index].completed = !project.milestones[index].completed;
    await window.db.put('projects', project);
    await window.syncEngine.queueMutation('projects', 'upsert', project);
    await window.state.refreshAllData();
  }

  static async deleteGoal(goalId) {
    if (confirm('Delete this goal?')) {
      await window.db.delete('goals', goalId);
      await window.syncEngine.queueMutation('goals', 'delete', { id: goalId });
      await window.state.refreshAllData();
    }
  }

  static async deleteProject(projectId) {
    if (confirm('Delete this project?')) {
      await window.db.delete('projects', projectId);
      await window.syncEngine.queueMutation('projects', 'delete', { id: projectId });
      await window.state.refreshAllData();
    }
  }
}

window.GoalsView = GoalsView;

