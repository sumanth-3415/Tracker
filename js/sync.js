/**
 * TrackMate - Local Storage & Offline Engine
 * 100% Local-First IndexedDB architecture without external server dependencies
 */

class TrackMateSyncEngine {
  constructor() {
    this.status = 'local_ready';
    this.listeners = [];
  }

  init() {
    this.updateUIBadge('local_ready');

    window.addEventListener('online', () => {
      this.updateUIBadge('local_ready');
    });

    window.addEventListener('offline', () => {
      this.updateUIBadge('offline');
    });
  }

  onStatusChange(callback) {
    this.listeners.push(callback);
  }

  setStatus(status, message = '') {
    this.status = status;
    this.listeners.forEach((cb) => cb({ status, message, timestamp: new Date() }));
    this.updateUIBadge(status);
  }

  updateUIBadge(status) {
    const dot = document.getElementById('sync-status-dot');
    const text = document.getElementById('sync-status-text');
    if (!dot || !text) return;

    dot.className = 'sync-dot ' + (status === 'offline' ? 'offline' : '');
    if (status === 'offline') {
      text.textContent = 'Offline (Local)';
    } else {
      text.textContent = 'Local Ready';
    }
  }

  // Queue local mutation placeholder for compatibility
  async queueMutation(collection, action, record) {
    // Stored natively in IndexedDB
    return true;
  }

  async syncNow() {
    this.setStatus('local_ready');
    if (window.state) window.state.emit('data:synced');
  }
}

// Instantiate global sync engine
window.syncEngine = new TrackMateSyncEngine();
