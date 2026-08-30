/**
 * TrackMate - Cozy Pomodoro Focus Room & Web Audio Ambient Soundscapes
 * Native browser audio synthesis (Zero external audio files required!)
 */

class TrackMateFocusRoom {
  constructor() {
    this.timer = null;
    this.totalSeconds = 25 * 60;
    this.remainingSeconds = 25 * 60;
    this.isRunning = false;
    this.mode = 'focus'; // 'focus' | 'short_break' | 'long_break'

    // Web Audio Context & Active Sound Generators
    this.audioCtx = null;
    this.activeSoundNode = null;
    this.currentSound = null; // 'rain' | 'fire' | 'waves' | 'cafe'
    this.gainNode = null;
  }

  initAudioContext() {
    if (!this.audioCtx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.audioCtx = new AudioCtx();
      this.gainNode = this.audioCtx.createGain();
      this.gainNode.gain.setValueAtTime(0.12, this.audioCtx.currentTime);
      this.gainNode.connect(this.audioCtx.destination);
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  openFocusRoom() {
    let overlay = document.getElementById('focus-room-modal');
    if (!overlay) {
      this.createFocusRoomDOM();
      overlay = document.getElementById('focus-room-modal');
    }
    overlay.classList.add('active');
    this.updateDisplay();
  }

  closeFocusRoom() {
    const overlay = document.getElementById('focus-room-modal');
    if (overlay) overlay.classList.remove('active');
    this.stopSound();
  }

  createFocusRoomDOM() {
    const overlay = document.createElement('div');
    overlay.id = 'focus-room-modal';
    overlay.className = 'focus-room-overlay';

    overlay.innerHTML = `
      <div class="focus-room-header">
        <div class="focus-room-title">
          <span>🎧</span> Cozy Pomodoro Focus Room
        </div>
        <button class="btn btn-icon" onclick="window.focusRoom.closeFocusRoom()" style="font-size: 20px;">✕</button>
      </div>

      <div class="focus-room-center">
        <!-- Circular Pomodoro Clock -->
        <div class="pomodoro-timer-circle">
          <svg width="260" height="260" class="pomodoro-svg-ring">
            <circle stroke="rgba(255, 255, 255, 0.1)" stroke-width="8" fill="transparent" r="110" cx="130" cy="130" />
            <circle id="pomodoro-ring-circle" stroke="#818cf8" stroke-width="8" stroke-linecap="round" fill="transparent"
              r="110" cx="130" cy="130" style="stroke-dasharray: 691; stroke-dashoffset: 0; transition: stroke-dashoffset 0.5s ease;" />
          </svg>
          <div id="pomodoro-time-txt" class="pomodoro-time-display">25:00</div>
          <div id="pomodoro-mode-txt" class="pomodoro-mode-badge">⚡ Deep Focus</div>
        </div>

        <!-- Controls -->
        <div class="pomodoro-controls">
          <button id="pomodoro-play-btn" class="btn-pomodoro-main" onclick="window.focusRoom.toggleTimer()">
            ▶ Start Focus
          </button>
          <button class="btn btn-outline" onclick="window.focusRoom.resetTimer()">
            🔄 Reset
          </button>
        </div>

        <!-- Mode Buttons -->
        <div style="display: flex; gap: 8px; margin-top: 10px;">
          <button class="btn btn-sm btn-secondary" onclick="window.focusRoom.setDuration(25, 'focus')">25m Focus</button>
          <button class="btn btn-sm btn-secondary" onclick="window.focusRoom.setDuration(5, 'short_break')">5m Short Break</button>
          <button class="btn btn-sm btn-secondary" onclick="window.focusRoom.setDuration(15, 'long_break')">15m Long Break</button>
        </div>
      </div>

      <!-- Ambient Soundscapes Bar -->
      <div class="soundscape-selector-bar">
        <div style="font-size: 11px; font-weight: 700; color: #a5b4fc; text-transform: uppercase;">Soundscapes:</div>
        <button class="sound-toggle-btn" id="btn-sound-rain" onclick="window.focusRoom.toggleSound('rain')">🌧️ Rain</button>
        <button class="sound-toggle-btn" id="btn-sound-fire" onclick="window.focusRoom.toggleSound('fire')">🔥 Fireplace</button>
        <button class="sound-toggle-btn" id="btn-sound-waves" onclick="window.focusRoom.toggleSound('waves')">🌊 Ocean</button>
        <button class="sound-toggle-btn" id="btn-sound-cafe" onclick="window.focusRoom.toggleSound('cafe')">☕ Cafe Noise</button>
        <button class="sound-toggle-btn" onclick="window.focusRoom.stopSound()">🔇 Off</button>
      </div>
    `;

    document.body.appendChild(overlay);
  }

  setDuration(mins, mode) {
    this.pauseTimer();
    this.totalSeconds = mins * 60;
    this.remainingSeconds = this.totalSeconds;
    this.mode = mode;

    const modeTxt = document.getElementById('pomodoro-mode-txt');
    if (modeTxt) {
      modeTxt.textContent = mode === 'focus' ? '⚡ Deep Focus' : (mode === 'short_break' ? '☕ Short Break' : '🌴 Long Break');
    }
    this.updateDisplay();
  }

  toggleTimer() {
    if (this.isRunning) {
      this.pauseTimer();
    } else {
      this.startTimer();
    }
  }

  startTimer() {
    this.isRunning = true;
    this.initAudioContext();

    const playBtn = document.getElementById('pomodoro-play-btn');
    if (playBtn) playBtn.textContent = '⏸ Pause';

    if (this.timer) clearInterval(this.timer);
    this.timer = setInterval(() => {
      this.remainingSeconds--;
      this.updateDisplay();

      if (this.remainingSeconds <= 0) {
        this.onTimerComplete();
      }
    }, 1000);
  }

  pauseTimer() {
    this.isRunning = false;
    if (this.timer) clearInterval(this.timer);
    const playBtn = document.getElementById('pomodoro-play-btn');
    if (playBtn) playBtn.textContent = '▶ Start Focus';
  }

  resetTimer() {
    this.pauseTimer();
    this.remainingSeconds = this.totalSeconds;
    this.updateDisplay();
  }

  updateDisplay() {
    const mins = Math.floor(this.remainingSeconds / 60);
    const secs = this.remainingSeconds % 60;
    const timeStr = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

    const txt = document.getElementById('pomodoro-time-txt');
    if (txt) txt.textContent = timeStr;

    // SVG Ring stroke offset
    const ring = document.getElementById('pomodoro-ring-circle');
    if (ring) {
      const circumference = 2 * Math.PI * 110; // 691.15
      const progress = (this.totalSeconds - this.remainingSeconds) / this.totalSeconds;
      ring.style.strokeDashoffset = (circumference * (1 - progress)).toString();
    }
  }

  onTimerComplete() {
    this.pauseTimer();
    this.stopSound();

    if (window.gamification) {
      window.gamification.addXP(30, 'Pomodoro Session');
      window.gamification.triggerConfetti();
    }

    if (window.notifications) {
      window.notifications.showToast('🎉 Focus Block Completed! Earned +30 XP! 🏆', 'success');
      window.notifications.sendBrowserNotification('Pomodoro Done!', { body: 'Great work! Take a break or start another block.' });
    }
  }

  // =========================================================================
  // Web Audio Native Ambient Sound Generators
  // =========================================================================
  toggleSound(soundType) {
    this.initAudioContext();

    if (this.currentSound === soundType) {
      this.stopSound();
      return;
    }

    this.stopSound();
    this.currentSound = soundType;

    // Highlight button
    document.querySelectorAll('.sound-toggle-btn').forEach((b) => b.classList.remove('active'));
    const btn = document.getElementById(`btn-sound-${soundType}`);
    if (btn) btn.classList.add('active');

    if (soundType === 'rain') {
      this.playRainSound();
    } else if (soundType === 'fire') {
      this.playFireplaceSound();
    } else if (soundType === 'waves') {
      this.playOceanWaves();
    } else if (soundType === 'cafe') {
      this.playWhiteNoise();
    }
  }

  stopSound() {
    if (this.activeSoundNode) {
      try {
        this.activeSoundNode.stop();
        this.activeSoundNode.disconnect();
      } catch (e) {}
      this.activeSoundNode = null;
    }
    this.currentSound = null;
    document.querySelectorAll('.sound-toggle-btn').forEach((b) => b.classList.remove('active'));
  }

  // Synthesize Rain Sound (Filtered pink noise with gentle drops)
  playRainSound() {
    const bufferSize = this.audioCtx.sampleRate * 2;
    const buffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
    const output = buffer.getChannelData(0);

    let b0 = 0, b1 = 0, b2 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      output[i] = (b0 + b1 + b2) * 0.12;
    }

    const whiteNoise = this.audioCtx.createBufferSource();
    whiteNoise.buffer = buffer;
    whiteNoise.loop = true;

    const filter = this.audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1000, this.audioCtx.currentTime);

    whiteNoise.connect(filter);
    filter.connect(this.gainNode);
    whiteNoise.start();
    this.activeSoundNode = whiteNoise;
  }

  // Synthesize Fireplace Crackle
  playFireplaceSound() {
    const bufferSize = this.audioCtx.sampleRate * 2;
    const buffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
    const output = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      const crackle = Math.random() < 0.003 ? (Math.random() * 2 - 1) * 0.8 : 0;
      output[i] = (Math.random() * 0.06 - 0.03) + crackle;
    }

    const fireSource = this.audioCtx.createBufferSource();
    fireSource.buffer = buffer;
    fireSource.loop = true;

    const filter = this.audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(650, this.audioCtx.currentTime);

    fireSource.connect(filter);
    filter.connect(this.gainNode);
    fireSource.start();
    this.activeSoundNode = fireSource;
  }

  // Synthesize Ocean Waves
  playOceanWaves() {
    const bufferSize = this.audioCtx.sampleRate * 4;
    const buffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
    const output = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      output[i] = (Math.random() * 2 - 1) * 0.15;
    }

    const waveSource = this.audioCtx.createBufferSource();
    waveSource.buffer = buffer;
    waveSource.loop = true;

    const filter = this.audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(300, this.audioCtx.currentTime);

    // Modulate filter for wave oscillation
    const osc = this.audioCtx.createOscillator();
    osc.frequency.setValueAtTime(0.12, this.audioCtx.currentTime); // 8-second wave period
    const oscGain = this.audioCtx.createGain();
    oscGain.gain.setValueAtTime(250, this.audioCtx.currentTime);

    osc.connect(oscGain);
    oscGain.connect(filter.frequency);
    osc.start();

    waveSource.connect(filter);
    filter.connect(this.gainNode);
    waveSource.start();
    this.activeSoundNode = waveSource;
  }

  // Synthesize White / Cafe Noise
  playWhiteNoise() {
    const bufferSize = this.audioCtx.sampleRate * 2;
    const buffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
    const output = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      output[i] = (Math.random() * 2 - 1) * 0.08;
    }

    const source = this.audioCtx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const filter = this.audioCtx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(500, this.audioCtx.currentTime);

    source.connect(filter);
    filter.connect(this.gainNode);
    source.start();
    this.activeSoundNode = source;
  }
}

// Global Focus Room Instance
window.focusRoom = new TrackMateFocusRoom();

