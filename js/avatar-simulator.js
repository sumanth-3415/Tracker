/**
 * TrackMate - Interactive Living Avatar & Real-World Action Simulator
 * Simulates drinking water (throat to stomach filling), walking strides,
 * gym workouts, and study brain synapse energy.
 */

class AvatarSimulator {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this.animFrameId = null;

    // Physiological Stats
    this.stats = {
      waterMl: 1250,
      waterTarget: 2500,
      steps: 4500,
      stepsTarget: 10000,
      workoutReps: 25,
      workoutTarget: 50,
      studyMins: 45,
      studyTarget: 90
    };

    // Animation Control
    this.currentMode = 'idle'; // 'idle' | 'drinking' | 'walking' | 'workout' | 'studying'
    this.animTimer = 0;
    this.particles = [];
    this.bubbles = [];

    // Load saved stats from IndexedDB / localStorage if available
    this.loadStats();
  }

  loadStats() {
    const saved = localStorage.getItem('tm_avatar_stats');
    if (saved) {
      try {
        this.stats = { ...this.stats, ...JSON.parse(saved) };
      } catch (e) {}
    }
  }

  saveStats() {
    localStorage.setItem('tm_avatar_stats', JSON.stringify(this.stats));
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

  // Master Draw Cycle
  draw() {
    if (!this.ctx) return;
    const { ctx, width, height } = this;
    ctx.clearRect(0, 0, width, height);

    this.animTimer += 0.05;

    // Route animation based on current active mode
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
      default:
        this.drawIdleAvatar();
        break;
    }

    this.updateParticles();
  }

  // =========================================================================
  // 1. DRINKING WATER SIMULATION (Throat -> Stomach -> Body Hydration)
  // =========================================================================
  drawDrinkingSimulation() {
    const { ctx, width, height } = this;
    const cx = width / 2;
    const cy = height / 2 + 10;
    const breath = Math.sin(this.animTimer * 2) * 2;

    // 1. Draw Body Silhouette Outline
    ctx.save();
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.fillStyle = 'rgba(15, 23, 42, 0.6)';

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

    // Torso / Body Frame
    ctx.beginPath();
    ctx.moveTo(cx - 40, cy - 35 + breath);
    ctx.quadraticCurveTo(cx - 50, cy + 30, cx - 35, cy + 80);
    ctx.lineTo(cx + 35, cy + 80);
    ctx.quadraticCurveTo(cx + 50, cy + 30, cx + 40, cy - 35 + breath);
    ctx.closePath();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.stroke();

    // 2. Stomach Cavity with Rising Water Fluid
    const stomachY = cy + 15;
    const fillPercent = Math.min(1, this.stats.waterMl / this.stats.waterTarget);
    const stomachHeight = 45;
    const waterLevel = stomachY + stomachHeight - (fillPercent * stomachHeight);

    // Stomach Background Glow
    ctx.beginPath();
    ctx.ellipse(cx, stomachY + 20, 26, 22, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(30, 41, 59, 0.8)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(6, 182, 212, 0.6)';
    ctx.stroke();

    // Water Liquid inside stomach with animated wave
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(cx, stomachY + 20, 24, 20, 0, 0, Math.PI * 2);
    ctx.clip(); // Clip inside stomach

    // Liquid fill
    ctx.fillStyle = 'rgba(6, 182, 212, 0.75)';
    ctx.beginPath();
    ctx.moveTo(cx - 30, stomachY + 50);
    for (let x = cx - 30; x <= cx + 30; x += 4) {
      const wave = Math.sin((x + this.animTimer * 20) * 0.15) * 3;
      ctx.lineTo(x, waterLevel + wave);
    }
    ctx.lineTo(cx + 30, stomachY + 50);
    ctx.closePath();
    ctx.fill();

    // Bubbles inside stomach
    if (Math.random() < 0.3) {
      this.bubbles.push({
        x: cx + (Math.random() * 20 - 10),
        y: stomachY + 30,
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
      if (b.y < waterLevel) this.bubbles.splice(i, 1);
    });
    ctx.restore();

    // 3. Tilting Water Glass near mouth
    const glassX = cx + 45;
    const glassY = cy - 75;
    ctx.save();
    ctx.translate(glassX, glassY);
    ctx.rotate(-0.55); // Tilted pouring angle

    // Glass body
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

    // Water inside glass
    ctx.fillStyle = '#06b6d4';
    ctx.beginPath();
    ctx.moveTo(-10, 0);
    ctx.lineTo(-8, 18);
    ctx.lineTo(8, 18);
    ctx.lineTo(10, 0);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // 4. Flowing Stream of Water into Mouth & Throat
    ctx.beginPath();
    ctx.moveTo(glassX - 18, glassY + 12);
    ctx.quadraticCurveTo(cx + 8, cy - 70, cx, cy - 65); // Into mouth
    ctx.lineTo(cx, cy - 35); // Down throat
    ctx.lineTo(cx, stomachY + 5); // Into stomach
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.shadowColor = '#06b6d4';
    ctx.shadowBlur = 10;
    ctx.stroke();
    ctx.shadowBlur = 0;

    ctx.restore();

    // Floating text banner
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`💧 Hydrating... (${this.stats.waterMl} / ${this.stats.waterTarget} ml)`, cx, height - 15);
  }

  // =========================================================================
  // 2. WALKING SIMULATION (Moving terrain, arm/leg stride cycles)
  // =========================================================================
  drawWalkingSimulation() {
    const { ctx, width, height } = this;
    const cx = width / 2;
    const cy = height / 2 + 10;

    // 1. Moving Ground Terrain
    const groundY = cy + 90;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, groundY);
    ctx.lineTo(width, groundY);
    ctx.stroke();

    // Moving Dashes on Ground
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 3;
    const offset = (this.animTimer * 60) % 40;
    for (let x = -40 + offset; x < width + 40; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, groundY + 4);
      ctx.lineTo(x + 20, groundY + 4);
      ctx.stroke();
    }

    // 2. Walking Character Skeletal Kinematics
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

    // Left Leg (swings with stride)
    const leftFootX = hipX + stride * 24;
    const leftKneeY = hipY + 35;
    const leftFootY = groundY - Math.max(0, -stride * 12);

    ctx.beginPath();
    ctx.moveTo(hipX, hipY);
    ctx.lineTo(hipX + stride * 12, leftKneeY);
    ctx.lineTo(leftFootX, leftFootY);
    ctx.stroke();

    // Right Leg (opposite stride)
    const rightFootX = hipX - stride * 24;
    const rightKneeY = hipY + 35;
    const rightFootY = groundY - Math.max(0, stride * 12);

    ctx.strokeStyle = '#059669'; // Slightly darker for depth
    ctx.beginPath();
    ctx.moveTo(hipX, hipY);
    ctx.lineTo(hipX - stride * 12, rightKneeY);
    ctx.lineTo(rightFootX, rightFootY);
    ctx.stroke();

    // Arms swinging
    ctx.strokeStyle = '#10b981';
    // Back Arm
    ctx.beginPath();
    ctx.moveTo(shoulderX, shoulderY + 5);
    ctx.lineTo(shoulderX - stride * 18, shoulderY + 30);
    ctx.stroke();

    // Front Arm
    ctx.beginPath();
    ctx.moveTo(shoulderX, shoulderY + 5);
    ctx.lineTo(shoulderX + stride * 18, shoulderY + 30);
    ctx.stroke();

    ctx.restore();

    // Dust particles on step impact
    if (Math.abs(stride) > 0.8 && Math.random() < 0.4) {
      this.particles.push({
        x: cx - 15,
        y: groundY - 2,
        vx: (Math.random() - 0.5) * 2 - 2,
        vy: -Math.random() * 2,
        alpha: 1,
        color: '#10b981'
      });
    }

    // Step count display
    ctx.fillStyle = '#10b981';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`🚶 Walking... (${this.stats.steps} / ${this.stats.stepsTarget} steps)`, cx, height - 15);
  }

  // =========================================================================
  // 3. WORKOUT SIMULATION (Bicep Curls with glowing muscle energy)
  // =========================================================================
  drawWorkoutSimulation() {
    const { ctx, width, height } = this;
    const cx = width / 2;
    const cy = height / 2 + 10;

    const curl = Math.abs(Math.sin(this.animTimer * 4)); // 0 to 1

    ctx.save();
    ctx.strokeStyle = '#f97316';
    ctx.fillStyle = '#f97316';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';

    // Head
    ctx.beginPath();
    ctx.arc(cx, cy - 65, 18, 0, Math.PI * 2);
    ctx.fill();

    // Torso (Broad posture)
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

    // Left Arm with Dumbbell (Curls up and down)
    const leftElbowX = cx - 35;
    const leftElbowY = cy - 20;
    const leftHandX = cx - 30;
    const leftHandY = cy - 20 - curl * 35;

    ctx.beginPath();
    ctx.moveTo(cx - 10, cy - 40);
    ctx.lineTo(leftElbowX, leftElbowY);
    ctx.lineTo(leftHandX, leftHandY);
    ctx.stroke();

    // Left Dumbbell Weight
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(leftHandX - 8, leftHandY - 4, 16, 8);
    ctx.fillRect(leftHandX - 12, leftHandY - 10, 6, 20);
    ctx.fillRect(leftHandX + 6, leftHandY - 10, 6, 20);

    // Right Arm with Dumbbell
    const rightElbowX = cx + 35;
    const rightElbowY = cy - 20;
    const rightHandX = cx + 30;
    const rightHandY = cy - 20 - curl * 35;

    ctx.beginPath();
    ctx.moveTo(cx + 10, cy - 40);
    ctx.lineTo(rightElbowX, rightElbowY);
    ctx.lineTo(rightHandX, rightHandY);
    ctx.stroke();

    // Right Dumbbell
    ctx.fillRect(rightHandX - 8, rightHandY - 4, 16, 8);
    ctx.fillRect(rightHandX - 12, rightHandY - 10, 6, 20);
    ctx.fillRect(rightHandX + 6, rightHandY - 10, 6, 20);

    // Glowing Muscle Aura on Top of Curl
    if (curl > 0.7) {
      ctx.shadowColor = '#f97316';
      ctx.shadowBlur = 20;
      ctx.strokeStyle = '#fbbf24';
      ctx.beginPath();
      ctx.arc(cx, cy - 10, 50, 0, Math.PI * 2);
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    ctx.restore();

    ctx.fillStyle = '#f97316';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`🏋️ Lifting Reps (${this.stats.workoutReps} / ${this.stats.workoutTarget} reps)`, cx, height - 15);
  }

  // =========================================================================
  // 4. STUDY SIMULATION (Desk & Brain Synapse Energy Sparks)
  // =========================================================================
  drawStudySimulation() {
    const { ctx, width, height } = this;
    const cx = width / 2;
    const cy = height / 2 + 10;

    ctx.save();

    // 1. Study Desk & Laptop
    const deskY = cy + 40;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cx - 60, deskY);
    ctx.lineTo(cx + 60, deskY);
    ctx.stroke();

    // Laptop
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

    // 2. Focused Avatar Sitting
    ctx.strokeStyle = '#8b5cf6';
    ctx.fillStyle = '#8b5cf6';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';

    // Head
    ctx.beginPath();
    ctx.arc(cx - 25, cy - 35, 18, 0, Math.PI * 2);
    ctx.fill();

    // Brain Synapse Pulse Energy around head
    const pulseR = 24 + Math.sin(this.animTimer * 8) * 4;
    ctx.strokeStyle = '#c084fc';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#8b5cf6';
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.arc(cx - 25, cy - 35, pulseR, 0, Math.PI * 2);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Torso sitting
    ctx.lineWidth = 6;
    ctx.strokeStyle = '#8b5cf6';
    ctx.beginPath();
    ctx.moveTo(cx - 25, cy - 15);
    ctx.lineTo(cx - 25, deskY - 2);
    ctx.lineTo(cx - 5, deskY - 5); // Arms on desk
    ctx.stroke();

    ctx.restore();

    // Rising knowledge particle sparks (Code symbols)
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
    ctx.fillText(`🧠 Deep Focus (${this.stats.studyMins} / ${this.stats.studyTarget} mins)`, cx, height - 15);
  }

  // =========================================================================
  // 5. IDLE BREATHING AVATAR (Translucent silhouette with water level)
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

    // Internal Water Level
    const fillPercent = Math.min(1, this.stats.waterMl / this.stats.waterTarget);
    const bodyHeight = 90;
    const waterY = cy + 70 - (fillPercent * bodyHeight);

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(cx - 35, cy - 40 + breath);
    ctx.quadraticCurveTo(cx - 45, cy + 20, cx - 30, cy + 70);
    ctx.lineTo(cx + 30, cy + 70);
    ctx.quadraticCurveTo(cx + 45, cy + 20, cx + 35, cy - 40 + breath);
    ctx.closePath();
    ctx.clip();

    ctx.fillStyle = 'rgba(6, 182, 212, 0.35)';
    ctx.fillRect(cx - 50, waterY, 100, 100);
    ctx.restore();

    ctx.restore();

    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Tap any action below to trigger live simulation', cx, height - 15);
  }

  // Update floating particles
  updateParticles() {
    const { ctx } = this;
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx || 0;
      p.y += p.vy || 0;
      p.alpha -= 0.02;

      if (p.text) {
        ctx.fillStyle = `rgba(192, 132, 252, ${p.alpha})`;
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

  // =========================================================================
  // USER ACTION TRIGGERS (Invoked by UI buttons)
  // =========================================================================

  // 💧 Log Drinking Water
  triggerDrink(amountMl = 250) {
    this.stats.waterMl = Math.min(this.stats.waterTarget, this.stats.waterMl + amountMl);
    this.saveStats();
    this.currentMode = 'drinking';
    this.playSound('water');

    if (window.notifications) {
      window.notifications.showToast(`💧 Drank ${amountMl}ml water! (${this.stats.waterMl}/${this.stats.waterTarget}ml)`, 'success');
    }

    // Auto-revert back to idle after animation completes
    setTimeout(() => {
      if (this.currentMode === 'drinking') this.currentMode = 'idle';
    }, 4500);

    this.updateUIMetrics();
  }

  // 🚶 Log Walking
  triggerWalk(stepCount = 1000) {
    this.stats.steps = Math.min(this.stats.stepsTarget * 2, this.stats.steps + stepCount);
    this.saveStats();
    this.currentMode = 'walking';
    this.playSound('walk');

    if (window.notifications) {
      window.notifications.showToast(`🚶 Walked +${stepCount} steps! Total: ${this.stats.steps}`, 'success');
    }

    setTimeout(() => {
      if (this.currentMode === 'walking') this.currentMode = 'idle';
    }, 4500);

    this.updateUIMetrics();
  }

  // 🏋️ Log Workout
  triggerWorkout(reps = 10) {
    this.stats.workoutReps = Math.min(this.stats.workoutTarget * 2, this.stats.workoutReps + reps);
    this.saveStats();
    this.currentMode = 'workout';
    this.playSound('workout');

    if (window.notifications) {
      window.notifications.showToast(`🏋️ Completed +${reps} gym reps! Total: ${this.stats.workoutReps}`, 'success');
    }

    setTimeout(() => {
      if (this.currentMode === 'workout') this.currentMode = 'idle';
    }, 4500);

    this.updateUIMetrics();
  }

  // 🧠 Log Study
  triggerStudy(mins = 30) {
    this.stats.studyMins = Math.min(this.stats.studyTarget * 2, this.stats.studyMins + mins);
    this.saveStats();
    this.currentMode = 'studying';
    this.playSound('study');

    if (window.notifications) {
      window.notifications.showToast(`🧠 Focused +${mins}m on Study! Total: ${this.stats.studyMins}m`, 'success');
    }

    setTimeout(() => {
      if (this.currentMode === 'studying') this.currentMode = 'idle';
    }, 4500);

    this.updateUIMetrics();
  }

  // Web Audio Synthesizer for rewarding chimes
  playSound(type) {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'water') {
        osc.frequency.setValueAtTime(450, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(700, ctx.currentTime + 0.15);
      } else if (type === 'walk') {
        osc.frequency.setValueAtTime(220, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(160, ctx.currentTime + 0.1);
      } else if (type === 'workout') {
        osc.frequency.setValueAtTime(320, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(540, ctx.currentTime + 0.2);
      } else if (type === 'study') {
        osc.frequency.setValueAtTime(520, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.25);
      }

      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);

      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch (e) {}
  }

  // Update HTML DOM Progress Fill bars
  updateUIMetrics() {
    const waterFill = document.getElementById('sim-water-fill');
    const waterTxt = document.getElementById('sim-water-txt');
    if (waterFill && waterTxt) {
      const pct = Math.min(100, Math.round((this.stats.waterMl / this.stats.waterTarget) * 100));
      waterFill.style.width = `${pct}%`;
      waterTxt.textContent = `${this.stats.waterMl} / ${this.stats.waterTarget} ml (${pct}%)`;
    }

    const walkFill = document.getElementById('sim-walk-fill');
    const walkTxt = document.getElementById('sim-walk-txt');
    if (walkFill && walkTxt) {
      const pct = Math.min(100, Math.round((this.stats.steps / this.stats.stepsTarget) * 100));
      walkFill.style.width = `${pct}%`;
      walkTxt.textContent = `${this.stats.steps} / ${this.stats.stepsTarget} steps (${pct}%)`;
    }

    const workoutFill = document.getElementById('sim-workout-fill');
    const workoutTxt = document.getElementById('sim-workout-txt');
    if (workoutFill && workoutTxt) {
      const pct = Math.min(100, Math.round((this.stats.workoutReps / this.stats.workoutTarget) * 100));
      workoutFill.style.width = `${pct}%`;
      workoutTxt.textContent = `${this.stats.workoutReps} / ${this.stats.workoutTarget} reps (${pct}%)`;
    }

    const studyFill = document.getElementById('sim-study-fill');
    const studyTxt = document.getElementById('sim-study-txt');
    if (studyFill && studyTxt) {
      const pct = Math.min(100, Math.round((this.stats.studyMins / this.stats.studyTarget) * 100));
      studyFill.style.width = `${pct}%`;
      studyTxt.textContent = `${this.stats.studyMins} / ${this.stats.studyTarget} mins (${pct}%)`;
    }
  }
}

// Global Avatar Simulator Instance
window.avatarSim = new AvatarSimulator();

