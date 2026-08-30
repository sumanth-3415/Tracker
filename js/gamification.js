/**
 * TrackMate - Gamification, XP Levels, Confetti Celebrations & Story Cards
 */

class TrackMateGamification {
  constructor() {
    this.xp = 0;
    this.level = 1;
    this.confettiCanvas = null;
    this.confettiCtx = null;
    this.confettiParticles = [];
    this.confettiRunning = false;

    this.quotes = [
      { quote: "We are what we repeatedly do. Excellence, then, is not an act, but a habit.", author: "Will Durant" },
      { quote: "Small disciplines repeated with consistency every day lead to great achievements.", author: "John C. Maxwell" },
      { quote: "Focus on being productive instead of busy.", author: "Tim Ferriss" },
      { quote: "You do not rise to the level of your goals. You fall to the level of your systems.", author: "James Clear" },
      { quote: "The secret of getting ahead is getting started.", author: "Mark Twain" },
      { quote: "Action is the foundational key to all success.", author: "Pablo Picasso" },
      { quote: "Do what you can, with what you have, where you are.", author: "Theodore Roosevelt" },
      { quote: "It always seems impossible until it's done.", author: "Nelson Mandela" },
      { quote: "Your future is created by what you do today, not tomorrow.", author: "Robert Kiyosaki" },
      { quote: "Discipline is choosing between what you want now and what you want most.", author: "Abraham Lincoln" }
    ];

    this.loadState();
  }

  loadState() {
    const savedXP = localStorage.getItem('tm_user_xp');
    this.xp = savedXP ? parseInt(savedXP, 10) : 150;
    this.calculateLevel();
  }

  saveState() {
    localStorage.setItem('tm_user_xp', this.xp.toString());
  }

  calculateLevel() {
    // 100 XP per level
    this.level = Math.floor(this.xp / 100) + 1;
    this.currentLevelXP = this.xp % 100;
    this.nextLevelXP = 100;
  }

  getRankTitle(level) {
    if (level < 3) return '🌱 Novice Explorer';
    if (level < 6) return '⚡ Habit Builder';
    if (level < 10) return '🔥 Discipline Master';
    if (level < 15) return '🛡️ Productivity Knight';
    return '👑 Productivity Grandmaster';
  }

  addXP(amount, reason = '') {
    const oldLevel = this.level;
    this.xp += amount;
    this.calculateLevel();
    this.saveState();

    if (window.notifications) {
      window.notifications.showToast(`+${amount} XP ${reason ? `(${reason})` : ''}! ⭐`, 'success');
    }

    // Check for level up
    if (this.level > oldLevel) {
      this.triggerConfetti();
      if (window.notifications) {
        window.notifications.showToast(`🎉 LEVEL UP! You reached Level ${this.level}: ${this.getRankTitle(this.level)}! 🏆`, 'success');
      }
    }

    this.updateUI();
  }

  getDailyQuote() {
    const dayOfYear = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
    return this.quotes[dayOfYear % this.quotes.length];
  }

  // Calculate Daily Vitality & Energy Score (0 to 100)
  async calculateVitalityScore() {
    const todayStr = new Date().toISOString().split('T')[0];
    const tasks = window.RecurringEngine
      ? window.RecurringEngine.getTasksForDate(window.state.tasks, todayStr)
      : window.state.tasks.filter((t) => t.due_date === todayStr);

    const completed = tasks.filter((t) => t.status === 'completed').length;
    const taskScore = tasks.length > 0 ? (completed / tasks.length) * 40 : 30;

    const habits = window.state.habits;
    const logs = window.state.habitLogs.filter((l) => l.date === todayStr && l.completed);
    const habitScore = habits.length > 0 ? (logs.length / habits.length) * 40 : 30;

    const waterMl = window.avatarSim?.stats?.waterMl || 1250;
    const waterScore = Math.min(20, (waterMl / 2500) * 20);

    return Math.min(100, Math.round(taskScore + habitScore + waterScore));
  }

  // =========================================================================
  // Confetti Particle Explosion Engine
  // =========================================================================
  initConfettiCanvas() {
    this.confettiCanvas = document.getElementById('confetti-canvas');
    if (!this.confettiCanvas) {
      this.confettiCanvas = document.createElement('canvas');
      this.confettiCanvas.id = 'confetti-canvas';
      document.body.appendChild(this.confettiCanvas);
    }
    this.confettiCtx = this.confettiCanvas.getContext('2d');
    this.resizeConfetti();
    window.addEventListener('resize', () => this.resizeConfetti());
  }

  resizeConfetti() {
    if (!this.confettiCanvas) return;
    this.confettiCanvas.width = window.innerWidth;
    this.confettiCanvas.height = window.innerHeight;
  }

  triggerConfetti(count = 80) {
    this.initConfettiCanvas();
    const colors = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#8b5cf6', '#ffffff'];
    const originX = window.innerWidth / 2;
    const originY = window.innerHeight * 0.4;

    for (let i = 0; i < count; i++) {
      this.confettiParticles.push({
        x: originX,
        y: originY,
        vx: (Math.random() - 0.5) * 16,
        vy: (Math.random() - 0.8) * 18,
        size: Math.random() * 8 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        rotSpeed: (Math.random() - 0.5) * 12,
        alpha: 1,
        gravity: 0.4
      });
    }

    if (!this.confettiRunning) {
      this.confettiRunning = true;
      this.animateConfetti();
    }
  }

  animateConfetti() {
    if (!this.confettiCtx || this.confettiParticles.length === 0) {
      if (this.confettiCtx) this.confettiCtx.clearRect(0, 0, this.confettiCanvas.width, this.confettiCanvas.height);
      this.confettiRunning = false;
      return;
    }

    this.confettiCtx.clearRect(0, 0, this.confettiCanvas.width, this.confettiCanvas.height);

    for (let i = this.confettiParticles.length - 1; i >= 0; i--) {
      const p = this.confettiParticles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.gravity;
      p.rotation += p.rotSpeed;
      p.alpha -= 0.012;

      this.confettiCtx.save();
      this.confettiCtx.translate(p.x, p.y);
      this.confettiCtx.rotate((p.rotation * Math.PI) / 180);
      this.confettiCtx.fillStyle = p.color;
      this.confettiCtx.globalAlpha = Math.max(0, p.alpha);
      this.confettiCtx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
      this.confettiCtx.restore();

      if (p.alpha <= 0 || p.y > window.innerHeight) {
        this.confettiParticles.splice(i, 1);
      }
    }

    requestAnimationFrame(() => this.animateConfetti());
  }

  // =========================================================================
  // Generate Aesthetic Shareable Story Card (Canvas Image)
  // =========================================================================
  async generateShareCard() {
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1920; // 9:16 Instagram / WhatsApp Story format
    const ctx = canvas.getContext('2d');

    const streak = window.streakEngine ? await window.streakEngine.evaluateOverallDailyStreak() : { currentStreak: 0, longestStreak: 0 };
    const todayStr = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
    const vitality = await this.calculateVitalityScore();

    // Background Gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 1080, 1920);
    bgGrad.addColorStop(0, '#0f172a');
    bgGrad.addColorStop(0.5, '#1e1b4b');
    bgGrad.addColorStop(1, '#09090b');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 1080, 1920);

    // Decorative Glow Orb
    ctx.fillStyle = 'rgba(99, 102, 241, 0.15)';
    ctx.beginPath();
    ctx.arc(540, 600, 400, 0, Math.PI * 2);
    ctx.fill();

    // Header Logo & App Name
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 54px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('⚡ TRACKMATE', 540, 260);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '36px sans-serif';
    ctx.fillText(todayStr, 540, 330);

    // Giant Flame Streak Card
    ctx.fillStyle = 'rgba(255, 140, 0, 0.12)';
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.roundRect(140, 450, 800, 360, [32]);
    ctx.fill();
    ctx.stroke();

    ctx.font = '120px sans-serif';
    ctx.fillText('🔥', 540, 590);

    ctx.fillStyle = '#ff8c00';
    ctx.font = 'bold 84px sans-serif';
    ctx.fillText(`${streak.currentStreak} DAY STREAK`, 540, 700);

    ctx.fillStyle = '#cbd5e1';
    ctx.font = '36px sans-serif';
    ctx.fillText(`Personal Record: 🏆 ${streak.longestStreak} Days`, 540, 760);

    // Level & Vitality Stats Cards Row
    ctx.fillStyle = 'rgba(30, 41, 59, 0.8)';
    ctx.beginPath();
    ctx.roundRect(140, 860, 380, 240, [24]);
    ctx.roundRect(560, 860, 380, 240, [24]);
    ctx.fill();

    // Level Box
    ctx.fillStyle = '#f59e0b';
    ctx.font = 'bold 64px sans-serif';
    ctx.fillText(`LVL ${this.level}`, 330, 960);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '32px sans-serif';
    ctx.fillText(this.getRankTitle(this.level), 330, 1030);

    // Vitality Box
    ctx.fillStyle = '#10b981';
    ctx.font = 'bold 64px sans-serif';
    ctx.fillText(`${vitality}%`, 750, 960);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '32px sans-serif';
    ctx.fillText('Daily Vitality', 750, 1030);

    // Footer Motivation
    ctx.fillStyle = '#c7d2fe';
    ctx.font = 'italic 38px sans-serif';
    ctx.fillText('“Small disciplines repeated daily create mastery.”', 540, 1550);

    ctx.fillStyle = '#64748b';
    ctx.font = '30px sans-serif';
    ctx.fillText('Tracked with TrackMate PWA', 540, 1750);

    // Trigger Download
    const dataUrl = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `TrackMate_Streak_Story_${new Date().toISOString().split('T')[0]}.png`;
    a.click();

    if (window.notifications) {
      window.notifications.showToast('📸 Story card exported! Ready to share on WhatsApp or Instagram stories!', 'success');
    }
  }

  updateUI() {
    const levelNum = document.getElementById('user-level-num');
    const rankTitle = document.getElementById('user-rank-title');
    const xpFill = document.getElementById('user-xp-fill');
    const xpTxt = document.getElementById('user-xp-txt');

    if (levelNum) levelNum.textContent = this.level;
    if (rankTitle) rankTitle.textContent = this.getRankTitle(this.level);
    if (xpFill) {
      const pct = Math.min(100, Math.round((this.currentLevelXP / this.nextLevelXP) * 100));
      xpFill.style.width = `${pct}%`;
    }
    if (xpTxt) xpTxt.textContent = `${this.currentLevelXP} / ${this.nextLevelXP} XP`;
  }
}

// Global Gamification Instance
window.gamification = new TrackMateGamification();

