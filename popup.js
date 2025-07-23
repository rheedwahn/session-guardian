// Popup script for Session Guardian
// Handles UI interactions and communication with background script

class PopupManager {
  constructor() {
    this.sessions = [];
    this.isLoading = false;
    this.refreshTimer = null;
    this.init();
  }

  init() {
    this.bindEvents();
    this.loadSessions();
    this.startAutoRefresh();
  }

  bindEvents() {
    // Save session button
    document.getElementById('save-session-btn').addEventListener('click', () => {
      this.showSaveForm();
    });

    // Refresh button
    document.getElementById('refresh-btn').addEventListener('click', () => {
      this.loadSessions();
    });

    // Save form events
    document.getElementById('save-confirm-btn').addEventListener('click', () => {
      this.saveSession();
    });

    document.getElementById('save-cancel-btn').addEventListener('click', () => {
      this.hideSaveForm();
    });

    // Enter key in session name input
    document.getElementById('session-name').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.saveSession();
      }
    });
  }

  showSaveForm() {
    document.getElementById('save-form').classList.remove('hidden');
    document.getElementById('session-name').focus();
    document.getElementById('session-name').value = `Session ${new Date().toLocaleString()}`;
    document.getElementById('session-name').select();
  }

  hideSaveForm() {
    document.getElementById('save-form').classList.add('hidden');
    document.getElementById('session-name').value = '';
  }

  async saveSession() {
    const sessionName = document.getElementById('session-name').value.trim();
    
    if (!sessionName) {
      this.showError('Please enter a session name');
      return;
    }

    try {
      this.setLoading(true);
      
      const response = await this.sendMessage({
        action: 'saveSession',
        name: sessionName
      });

      if (response.success) {
        this.showSuccess('Session saved successfully!');
        this.hideSaveForm();
        await this.loadSessions();
      } else {
        this.showError(`Failed to save session: ${response.error}`);
      }
    } catch (error) {
      this.showError(`Error saving session: ${error.message}`);
    } finally {
      this.setLoading(false);
    }
  }

  async loadSessions() {
    try {
      this.setLoading(true);
      this.hideMessages();
      
      const response = await this.sendMessage({
        action: 'getAllSessions'
      });

      if (response.success) {
        this.sessions = response.sessions;
        this.renderSessions();
      } else {
        this.showError(`Failed to load sessions: ${response.error}`);
      }
    } catch (error) {
      this.showError(`Error loading sessions: ${error.message}`);
    } finally {
      this.setLoading(false);
    }
  }

  renderSessions() {
    const container = document.getElementById('sessions-container');
    const emptyState = document.getElementById('empty-state');
    const sessionCount = document.getElementById('session-count');
    const lastUpdate = document.getElementById('last-update');
    
    // Update session count
    sessionCount.textContent = `(${this.sessions.length})`;
    
    // Show last update time for auto-save session
    const autoSaveSession = this.sessions.find(s => s.type === 'auto');
    if (autoSaveSession) {
      const updateTime = new Date(autoSaveSession.timestamp).toLocaleTimeString();
      lastUpdate.textContent = `Auto-save: ${updateTime}`;
      lastUpdate.style.color = '#34a853';
    } else {
      lastUpdate.textContent = 'No auto-save yet';
      lastUpdate.style.color = '#999';
    }
    
    if (this.sessions.length === 0) {
      container.classList.add('hidden');
      emptyState.classList.remove('hidden');
      return;
    }

    container.classList.remove('hidden');
    emptyState.classList.add('hidden');
    
    container.innerHTML = '';
    
    this.sessions.forEach(session => {
      const sessionElement = this.createSessionElement(session);
      container.appendChild(sessionElement);
    });
  }

  createSessionElement(session) {
    const div = document.createElement('div');
    div.className = 'session-item';
    
    const windowCount = session.windows.length;
    const tabCount = session.windows.reduce((total, window) => total + window.tabs.length, 0);
    const timeAgo = this.getTimeAgo(session.timestamp);
    
    div.innerHTML = `
      <div class="session-header">
        <h3 class="session-name">${this.escapeHtml(session.name)}</h3>
        <span class="session-type ${session.type}">${session.type}</span>
      </div>
      <div class="session-info">
        ${new Date(session.timestamp).toLocaleString()}
      </div>
      <div class="session-stats">
        <span>📱 ${windowCount} window${windowCount !== 1 ? 's' : ''}</span>
        <span>📄 ${tabCount} tab${tabCount !== 1 ? 's' : ''}</span>
        <span>⏰ ${timeAgo}</span>
      </div>
      <div class="session-actions">
        <button class="btn-small btn-restore" data-session-id="${session.id}">
          Restore
        </button>
        ${session.type !== 'auto' ? `
          <button class="btn-small btn-delete" data-session-id="${session.id}">
            Delete
          </button>
        ` : ''}
      </div>
    `;
    
    // Bind events
    const restoreBtn = div.querySelector('.btn-restore');
    const deleteBtn = div.querySelector('.btn-delete');
    
    restoreBtn.addEventListener('click', () => {
      this.restoreSession(session.id);
    });
    
    if (deleteBtn) {
      deleteBtn.addEventListener('click', () => {
        this.deleteSession(session.id);
      });
    }
    
    return div;
  }

  async restoreSession(sessionId) {
    if (!confirm('This will open new windows and tabs. Continue?')) {
      return;
    }

    try {
      this.setLoading(true);
      
      const response = await this.sendMessage({
        action: 'restoreSession',
        sessionId: sessionId
      });

      if (response.success) {
        this.showSuccess('Session restored successfully!');
        window.close(); // Close popup after successful restore
      } else {
        this.showError(`Failed to restore session: ${response.error}`);
      }
    } catch (error) {
      this.showError(`Error restoring session: ${error.message}`);
    } finally {
      this.setLoading(false);
    }
  }

  async deleteSession(sessionId) {
    if (!confirm('Are you sure you want to delete this session?')) {
      return;
    }

    try {
      this.setLoading(true);
      
      const response = await this.sendMessage({
        action: 'deleteSession',
        sessionId: sessionId
      });

      if (response.success) {
        this.showSuccess('Session deleted successfully!');
        await this.loadSessions();
      } else {
        this.showError(`Failed to delete session: ${response.error}`);
      }
    } catch (error) {
      this.showError(`Error deleting session: ${error.message}`);
    } finally {
      this.setLoading(false);
    }
  }

  setLoading(loading) {
    this.isLoading = loading;
    const loadingElement = document.getElementById('loading');
    const container = document.getElementById('sessions-container');
    
    if (loading) {
      loadingElement.classList.remove('hidden');
      container.classList.add('hidden');
    } else {
      loadingElement.classList.add('hidden');
      if (this.sessions.length > 0) {
        container.classList.remove('hidden');
      }
    }
  }

  showError(message) {
    this.hideMessages();
    const errorElement = document.getElementById('error-message');
    errorElement.textContent = message;
    errorElement.classList.remove('hidden');
    
    setTimeout(() => {
      this.hideMessages();
    }, 5000);
  }

  showSuccess(message) {
    this.hideMessages();
    const successElement = document.getElementById('success-message');
    successElement.textContent = message;
    successElement.classList.remove('hidden');
    
    setTimeout(() => {
      this.hideMessages();
    }, 3000);
  }

  hideMessages() {
    document.getElementById('error-message').classList.add('hidden');
    document.getElementById('success-message').classList.add('hidden');
  }

  getTimeAgo(timestamp) {
    const now = Date.now();
    const diff = now - timestamp;
    
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  startAutoRefresh() {
    // Refresh the display every 30 seconds to show current session state
    this.refreshTimer = setInterval(() => {
      if (!this.isLoading) {
        this.loadSessions();
      }
    }, 30000);
    
    // Clear timer when popup is closed
    window.addEventListener('beforeunload', () => {
      if (this.refreshTimer) {
        clearInterval(this.refreshTimer);
      }
    });
  }

  sendMessage(message) {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(message, (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(response);
        }
      });
    });
  }
}

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new PopupManager();
});
