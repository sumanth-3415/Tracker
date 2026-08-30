/**
 * TrackMate - Dynamic Interactive Avatar & Real-World Activity Simulator
 * Automatically detects the activity type from user's custom tasks and habits
 * and triggers realistic physical simulations (drinking, walking, lifting, studying, recharging).
 */

class AvatarSimulator {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this.animFrameId = null;

    // Active animation state
    this.currentMode = 'idle'; // 'idle' | 'drinking' | 'walking' | 'workout' | 'studying' | 'recharge' | 'victory'
    this.currentActivityName = '';
    this.animTimer = 0;
    this.particles = [];
    this.bubbles = [];
    this.modeTimeout = null;

    // Dynamic metrics tracked from user's real logs
    this.completedCount = 0;
  }

  initCanvas(canvasId = 'avatar-canvas') {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = (rect.width || 320) * dpr;
    this.canvas.height = (rect.height || 320) * dpr;

    this.ctx = this.canvas.getContext('2d');
    this.ctx.scale(dpr, dpr);
    this.width = rect.width || 320;
    this.height = rect.height || 320;

    this.startLoop();
  }

  startLoop() {
    if (this.animFrameId) cancelAnimationFrame(this.animFrameId);

    const render = () => {
      this.draw();
      this.animFrameId = requestAnimationFrame(render);
    };
    this.animFrameId = requestAnimationFrame(render);
  }

  // Detect activity type based on user-entered title, category, and tags
  detectActivityType(title = '', trackerType = '', category = '', tags = []) {
    const text = `${title} ${trackerType} ${category} ${(tags || []).join(' ')}`.toLowerCase();

    // 1. Water / Hydration
    if (text.match(/water|hydrat|drink|fluid|bottle|glass|liquid|juice|tea|coffee/)) {
      return 'drinking';
    }
    // 2. Walking / Running / Cardio / Steps
    if (text.match(/walk|run|jog|step|cardio|trek|hike|marathon|stride/)) {
      return 'walking';
    }
    // 3. Gym / Workout / Fitness / Pushups / Weights / Sport
    if (text.match(/workout|gym|exercise|pushup|pullup|squat|bench|dumb|weight|lift|bicep|rep|set|fitness|training|muscle|sport|football|cricket|yoga/)) {
      return 'workout';
    }
    // 4. Study / Coding / Reading / Academic / Work / Research
    if (text.match(/study|learn|read|book|code|program|dev|course|exam|assign|research|algo|dsa|java|python|javascript|write|focus|work|project/)) {
      return 'studying';
    }
    // 5. Rest / Sleep / Meditation / Wellness
    if (text.match(/sleep|rest|meditat|nap|breath|relax|zen|mindful|wake/)) {
      return 'recharge';
    }

    return 'victory';
  }

  // Trigger animation for any user activity
  triggerActivity(activityName, customType = null) {
    const type = customType || this.detectActivityType(activityName);
    this.currentMode = type;
    this.currentActivityName = activityName;
    this.animTimer = 0;
    this.completedCount++;

    // Play appropriate synthesized sound
    this.playSound(type);

    // Update simulation badge in DOM
    const badge = document.getElementById('avatar-active-action-badge');
    if (badge) {
      badge.textContent = `● Simulating: ${activityName}`;
      badge.style.color = '#38bdf8';
    }

    if (this.modeTimeout) clearTimeout(this.modeTimeout);
    this.modeTimeout = setTimeout(() => {
      this.currentMode = 'idle';
      this.currentActivityName = '';
      if (badge) {
        badge.textContent = '● Live Physiological Avatar';
        badge.style.color = 'var(--accent-emerald)';
      }
    }, 5000);
  }

  // Master Draw Cycle
  draw() {
    if (!this.ctx) return;
    const { ctx, width, height } = this;
    ctx.clearRect(0, 0, width, height);

    this.animTimer += 0.05;

    switch (this.currentMode) {
      case 'drinking':
        this.drawDrinkingSimulation();
        break;
      case 'walking':
        this.drawWalkingSimulation();
        break;
      case 'workout':
        this.drawWorkoutSimulation();
        break;
      case 'studying':
        this.drawStudySimulation();
        break;
      case 'recharge':
        this.drawRechargeSimulation();
        break;
      case 'victory':
        this.drawVictorySimulation();
        break;
      default:
        this.drawIdleAvatar();
        break;
    }

    this.updateParticles();
  }

  // =========================================================================
  // 1. DRINKING WATER SIMULATION (Throat -> Stomach -> Liquid Wave)
  // =========================================================================
  drawDrinkingSimulation() {
    const { ctx, width, height } = this;
    const cx = width / 2;
    const cy = height / 2 + 10;
    const breath = Math.sin(this.animTimer * 2) * 2;

    // Body Outline
    ctx.save();
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';

    // Head
    ctx.beginPath();
    ctx.arc(cx, cy - 80, 24, 0, Math.PI * 2);
    ctx.stroke();

    // Neck & Esophagus Channel
    ctx.beginPath();
    ctx.moveTo(cx - 8, cy - 56);
    ctx.lineTo(cx - 8, cy - 35);
    ctx.lineTo(cx + 8, cy - 35);
    ctx.lineTo(cx + 8, cy - 56);
    ctx.strokeStyle = 'rgba(6, 182, 212, 0.4)';
    ctx.stroke();

    // Torso Frame
    ctx.beginPath();
    ctx.moveTo(cx - 40, cy - 35 + breath);
    ctx.quadraticCurveTo(cx - 50, cy + 30, cx - 35, cy + 80);
    ctx.lineTo(cx + 35, cy + 80);
    ctx.quadraticCurveTo(cx + 50, cy + 30, cx + 40, cy - 35 + breath);
    ctx.closePath();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.stroke();

    // Stomach Cavity
    const stomachY = cy + 15;
    ctx.beginPath();
    ctx.ellipse(cx, stomachY + 20, 26, 22, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(30, 41, 59, 0.8)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(6, 182, 212, 0.6)';
    ctx.stroke();

    // Water Liquid Inside Stomach with Wave
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(cx, stomachY + 20, 24, 20, 0, 0, Math.PI * 2);
    ctx.clip();

    ctx.fillStyle = 'rgba(6, 182, 212, 0.8)';
    ctx.beginPath();
    ctx.moveTo(cx - 30, stomachY + 50);
    const fillLevel = stomachY + 30 - Math.min(25, this.animTimer * 5);
    for (let x = cx - 30; x <= cx + 30; x += 4) {
      const wave = Math.sin((x + this.animTimer * 20) * 0.15) * 3;
      ctx.lineTo(x, fillLevel + wave);
    }
    ctx.lineTo(cx + 30, stomachY + 50);
    ctx.closePath();
    ctx.fill();

    // Rising Bubbles
    if (Math.random() < 0.35) {
      this.bubbles.push({
        x: cx + (Math.random() * 20 - 10),
        y: stomachY + 35,
        r: Math.random() * 2.5 + 1,
        speed: Math.random() * 1 + 0.5
      });
    }
    this.bubbles.forEach((b, i) => {
      b.y -= b.speed;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.fill();
      if (b.y < fillLevel) this.bubbles.splice(i, 1);
    });
    ctx.restore();

    // Tilting Water Glass
    const glassX = cx + 45;
    const glassY = cy - 75;
    ctx.save();
    ctx.translate(glassX, glassY);
    ctx.rotate(-0.55);

    ctx.beginPath();
    ctx.moveTo(-12, -20);
    ctx.lineTo(-8, 20);
    ctx.lineTo(8, 20);
    ctx.lineTo(12, -20);
    ctx.closePath();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#06b6d4';
    ctx.beginPath();
    ctx.moveTo(-10, 0);
    ctx.lineTo(-8, 18);
    ctx.lineTo(8, 18);
    ctx.lineTo(10, 0);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Glowing Stream into mouth & stomach
    ctx.beginPath();
    ctx.moveTo(glassX - 18, glassY + 12);
    ctx.quadraticCurveTo(cx + 8, cy - 70, cx, cy - 65);
    ctx.lineTo(cx, cy - 35);
    ctx.lineTo(cx, stomachY + 5);
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.shadowColor = '#06b6d4';
    ctx.shadowBlur = 10;
    ctx.stroke();
    ctx.shadowBlur = 0;

    ctx.restore();

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`💧 ${this.currentActivityName || 'Hydrating Body'}`, cx, height - 12);
  }

  // =========================================================================
  // 2. WALKING / RUNNING SIMULATION
  // =========================================================================
  drawWalkingSimulation() {
    const { ctx, width, height } = this;
    const cx = width / 2;
    const cy = height / 2 + 10;

    // Moving Ground
    const groundY = cy + 90;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, groundY);
    ctx.lineTo(width, groundY);
    ctx.stroke();

    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 3;
    const offset = (this.animTimer * 60) % 40;
    for (let x = -40 + offset; x < width + 40; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, groundY + 4);
      ctx.lineTo(x + 20, groundY + 4);
      ctx.stroke();
    }

    const stride = Math.sin(this.animTimer * 6);
    const headBob = Math.abs(Math.cos(this.animTimer * 6)) * 4;

    ctx.save();
    ctx.strokeStyle = '#10b981';
    ctx.fillStyle = '#10b981';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Head
    ctx.beginPath();
    ctx.arc(cx, cy - 60 - headBob, 16, 0, Math.PI * 2);
    ctx.fill();

    // Torso
    const shoulderX = cx;
    const shoulderY = cy - 40 - headBob;
    const hipX = cx;
    const hipY = cy + 10 - headBob;

    ctx.beginPath();
    ctx.moveTo(shoulderX, shoulderY);
    ctx.lineTo(hipX, hipY);
    ctx.stroke();

    // Legs
    const leftFootX = hipX + stride * 24;
    const leftFootY = groundY - Math.max(0, -stride * 12);
    ctx.beginPath();
    ctx.moveTo(hipX, hipY);
    ctx.lineTo(hipX + stride * 12, hipY + 35);
    ctx.lineTo(leftFootX, leftFootY);
    ctx.stroke();

    const rightFootX = hipX - stride * 24;
    const rightFootY = groundY - Math.max(0, stride * 12);
    ctx.strokeStyle = '#059669';
    ctx.beginPath();
    ctx.moveTo(hipX, hipY);
    ctx.lineTo(hipX - stride * 12, hipY + 35);
    ctx.lineTo(rightFootX, rightFootY);
    ctx.stroke();

    // Arms
    ctx.strokeStyle = '#10b981';
    ctx.beginPath();
    ctx.moveTo(shoulderX, shoulderY + 5);
    ctx.lineTo(shoulderX - stride * 18, shoulderY + 30);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(shoulderX, shoulderY + 5);
    ctx.lineTo(shoulderX + stride * 18, shoulderY + 30);
    ctx.stroke();

    ctx.restore();

    ctx.fillStyle = '#10b981';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`🚶 ${this.currentActivityName || 'Active Movement'}`, cx, height - 12);
  }

  // =========================================================================
  // 3. WORKOUT / GYM / STRENGTH SIMULATION
  // =========================================================================
  drawWorkoutSimulation() {
    const { ctx, width, height } = this;
    const cx = width / 2;
    const cy = height / 2 + 10;
    const curl = Math.abs(Math.sin(this.animTimer * 4));

    ctx.save();
    ctx.strokeStyle = '#f97316';
    ctx.fillStyle = '#f97316';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';

    // Head
    ctx.beginPath();
    ctx.arc(cx, cy - 65, 18, 0, Math.PI * 2);
    ctx.fill();

    // Torso
    ctx.beginPath();
    ctx.moveTo(cx, cy - 45);
    ctx.lineTo(cx, cy + 15);
    ctx.stroke();

    // Legs
    ctx.beginPath();
    ctx.moveTo(cx, cy + 15);
    ctx.lineTo(cx - 20, cy + 85);
    ctx.moveTo(cx, cy + 15);
    ctx.lineTo(cx + 20, cy + 85);
    ctx.stroke();

    // Left Arm & Dumbbell
    const leftHandX = cx - 30;
    const leftHandY = cy - 20 - curl * 35;
    ctx.beginPath();
    ctx.moveTo(cx - 10, cy - 40);
    ctx.lineTo(cx - 35, cy - 20);
    ctx.lineTo(leftHandX, leftHandY);
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(leftHandX - 8, leftHandY - 4, 16, 8);
    ctx.fillRect(leftHandX - 12, leftHandY - 10, 6, 20);
    ctx.fillRect(leftHandX + 6, leftHandY - 10, 6, 20);

    // Right Arm & Dumbbell
    const rightHandX = cx + 30;
    const rightHandY = cy - 20 - curl * 35;
    ctx.beginPath();
    ctx.moveTo(cx + 10, cy - 40);
    ctx.lineTo(cx + 35, cy - 20);
    ctx.lineTo(rightHandX, rightHandY);
    ctx.stroke();

    ctx.fillRect(rightHandX - 8, rightHandY - 4, 16, 8);
    ctx.fillRect(rightHandX - 12, rightHandY - 10, 6, 20);
    ctx.fillRect(rightHandX + 6, rightHandY - 10, 6, 20);

    // Muscle Energy Glow
    if (curl > 0.7) {
      ctx.shadowColor = '#f97316';
      ctx.shadowBlur = 20;
      ctx.strokeStyle = '#fbbf24';
      ctx.beginPath();
      ctx.arc(cx, cy - 10, 48, 0, Math.PI * 2);
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    ctx.restore();

    ctx.fillStyle = '#f97316';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`🏋️ ${this.currentActivityName || 'Strength Workout'}`, cx, height - 12);
  }

  // =========================================================================
  // 4. STUDY / CODING / BRAIN POWER SIMULATION
  // =========================================================================
  drawStudySimulation() {
    const { ctx, width, height } = this;
    const cx = width / 2;
    const cy = height / 2 + 10;

    ctx.save();
    // Desk & Laptop
    const deskY = cy + 40;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cx - 60, deskY);
    ctx.lineTo(cx + 60, deskY);
    ctx.stroke();

    ctx.fillStyle = '#6366f1';
    ctx.fillRect(cx - 20, deskY - 18, 28, 18);
    ctx.strokeStyle = '#ffffff';
    ctx.strokeRect(cx - 20, deskY - 18, 28, 18);

    // Glowing screen light
    ctx.fillStyle = 'rgba(99, 102, 241, 0.25)';
    ctx.beginPath();
    ctx.moveTo(cx - 20, deskY - 18);
    ctx.lineTo(cx - 45, cy - 30);
    ctx.lineTo(cx + 15, cy - 30);
    ctx.lineTo(cx + 8, deskY - 18);
    ctx.closePath();
    ctx.fill();

    // Sitting Avatar
    ctx.strokeStyle = '#8b5cf6';
    ctx.fillStyle = '#8b5cf6';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';

    ctx.beginPath();
    ctx.arc(cx - 25, cy - 35, 18, 0, Math.PI * 2);
    ctx.fill();

    // Brain Synapse Pulse Energy
    const pulseR = 24 + Math.sin(this.animTimer * 8) * 4;
    ctx.strokeStyle = '#c084fc';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#8b5cf6';
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.arc(cx - 25, cy - 35, pulseR, 0, Math.PI * 2);
    ctx.stroke();
    ctx.shadowBlur = 0;

    ctx.lineWidth = 6;
    ctx.strokeStyle = '#8b5cf6';
    ctx.beginPath();
    ctx.moveTo(cx - 25, cy - 15);
    ctx.lineTo(cx - 25, deskY - 2);
    ctx.lineTo(cx - 5, deskY - 5);
    ctx.stroke();

    ctx.restore();

    // Rising knowledge particles
    if (Math.random() < 0.25) {
      const symbols = ['💡', '{ }', '⭐', '🧠', '101', '++'];
      this.particles.push({
        x: cx - 25 + (Math.random() * 30 - 15),
        y: cy - 50,
        vx: (Math.random() - 0.5) * 1.5,
        vy: -Math.random() * 1.5 - 1,
        text: symbols[Math.floor(Math.random() * symbols.length)],
        alpha: 1
      });
    }

    ctx.fillStyle = '#8b5cf6';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`🧠 ${this.currentActivityName || 'Deep Focus & Study'}`, cx, height - 12);
  }

  // =========================================================================
  // 5. REST & RECHARGE SIMULATION
  // =========================================================================
  drawRechargeSimulation() {
    const { ctx, width, height } = this;
    const cx = width / 2;
    const cy = height / 2 + 10;

    ctx.save();
    const auraR = 60 + Math.sin(this.animTimer * 3) * 8;
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#10b981';
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.arc(cx, cy, auraR, 0, Math.PI * 2);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Resting Figure
    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.arc(cx, cy - 20, 20, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    if (Math.random() < 0.2) {
      this.particles.push({
        x: cx + (Math.random() * 40 - 20),
        y: cy - 30,
        vx: 0.5,
        vy: -1,
        text: 'zzz',
        alpha: 1
      });
    }

    ctx.fillStyle = '#10b981';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`🌙 ${this.currentActivityName || 'Rest & Recharge'}`, cx, height - 12);
  }

  // =========================================================================
  // 6. GENERAL VICTORY & STAR CELEBRATION
  // =========================================================================
  drawVictorySimulation() {
    const { ctx, width, height } = this;
    const cx = width / 2;
    const cy = height / 2 + 10;
    const jump = Math.abs(Math.sin(this.animTimer * 6)) * 20;

    ctx.save();
    ctx.strokeStyle = '#f59e0b';
    ctx.fillStyle = '#f59e0b';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';

    // Head
    ctx.beginPath();
    ctx.arc(cx, cy - 60 - jump, 18, 0, Math.PI * 2);
    ctx.fill();

    // Torso
    ctx.beginPath();
    ctx.moveTo(cx, cy - 40 - jump);
    ctx.lineTo(cx, cy + 15 - jump);
    ctx.stroke();

    // Victory Arms Raised (V-shape)
    ctx.beginPath();
    ctx.moveTo(cx, cy - 35 - jump);
    ctx.lineTo(cx - 30, cy - 70 - jump);
    ctx.moveTo(cx, cy - 35 - jump);
    ctx.lineTo(cx + 30, cy - 70 - jump);
    ctx.stroke();

    // Legs
    ctx.beginPath();
    ctx.moveTo(cx, cy + 15 - jump);
    ctx.lineTo(cx - 20, cy + 70 - jump);
    ctx.moveTo(cx, cy + 15 - jump);
    ctx.lineTo(cx + 20, cy + 70 - jump);
    ctx.stroke();

    ctx.restore();

    if (Math.random() < 0.3) {
      this.particles.push({
        x: cx + (Math.random() * 60 - 30),
        y: cy - 70 - jump,
        vx: (Math.random() - 0.5) * 2,
        vy: -Math.random() * 2,
        text: '✨',
        alpha: 1
      });
    }

    ctx.fillStyle = '#f59e0b';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`🎉 ${this.currentActivityName || 'Completed!'}`, cx, height - 12);
  }

  // =========================================================================
  // 7. IDLE BREATHING AVATAR
  // =========================================================================
  drawIdleAvatar() {
    const { ctx, width, height } = this;
    const cx = width / 2;
    const cy = height / 2 + 10;
    const breath = Math.sin(this.animTimer * 1.5) * 2;

    ctx.save();
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';

    // Head
    ctx.beginPath();
    ctx.arc(cx, cy - 70 + breath, 22, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(99, 102, 241, 0.1)';
    ctx.fill();
    ctx.stroke();

    // Torso Frame
    ctx.beginPath();
    ctx.moveTo(cx - 35, cy - 40 + breath);
    ctx.quadraticCurveTo(cx - 45, cy + 20, cx - 30, cy + 70);
    ctx.lineTo(cx + 30, cy + 70);
    ctx.quadraticCurveTo(cx + 45, cy + 20, cx + 35, cy - 40 + breath);
    ctx.closePath();
    ctx.stroke();

    ctx.restore();

    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Check off any activity below to animate your avatar', cx, height - 12);
  }

  updateParticles() {
    const { ctx } = this;
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx || 0;
      p.y += p.vy || 0;
      p.alpha -= 0.02;

      if (p.text) {
        ctx.fillStyle = `rgba(255, 255, 255, ${p.alpha})`;
        ctx.font = '12px sans-serif';
        ctx.fillText(p.text, p.x, p.y);
      } else {
        ctx.fillStyle = p.color || `rgba(255, 255, 255, ${p.alpha})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }

      if (p.alpha <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  // Audio synthesizer cues
  playSound(type) {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'drinking') {
        osc.frequency.setValueAtTime(450, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(700, ctx.currentTime + 0.15);
      } else if (type === 'walking') {
        osc.frequency.setValueAtTime(220, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(160, ctx.currentTime + 0.1);
      } else if (type === 'workout') {
        osc.frequency.setValueAtTime(320, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(540, ctx.currentTime + 0.2);
      } else if (type === 'studying') {
        osc.frequency.setValueAtTime(520, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.25);
      } else {
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.2);
      }

      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);

      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch (e) {}
  }
}

// Global Avatar Simulator Instance
window.avatarSim = new AvatarSimulator();
