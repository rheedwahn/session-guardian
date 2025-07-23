// Background script for Session Guardian
// Handles auto-save, crash detection, and session management

const SESSION_STORAGE_KEY = 'sessionGuardian_sessions';
const AUTO_SAVE_INTERVAL = 5 * 60 * 1000; // 5 minutes
const MAX_SESSIONS = 50; // Maximum number of sessions to keep

class SessionManager {
  constructor() {
    this.autoSaveTimer = null;
    this.updateTimer = null;
    this.init();
  }

  async init() {
    // Start auto-save timer
    this.startAutoSave();

    // Listen for extension startup (potential crash recovery)
    chrome.runtime.onStartup.addListener(() => this.handleStartup());
    chrome.runtime.onInstalled.addListener(() => this.handleInstall());

    // Listen for window/tab changes
    chrome.tabs.onCreated.addListener(() => this.onTabChange());
    chrome.tabs.onRemoved.addListener(() => this.onTabChange());
    chrome.tabs.onUpdated.addListener((tabId, changeInfo, _tab) => {
      // Only update on significant changes
      if (changeInfo.url || changeInfo.title || changeInfo.status === 'complete') {
        this.onTabChange();
      }
    });
    chrome.windows.onCreated.addListener(() => this.onWindowChange());
    chrome.windows.onRemoved.addListener(() => this.onWindowChange());
  }

  async handleStartup() {
    // Check if this was an unexpected shutdown
    const lastSession = await this.getLastAutoSave();
    if (lastSession && this.wasUnexpectedShutdown(lastSession)) {
      // Store crash recovery session
      await this.saveCrashRecoverySession(lastSession);
    }
  }

  async handleInstall() {
    // Create initial session
    await this.saveCurrentSession('Initial Session', true);
  }

  wasUnexpectedShutdown(lastSession) {
    // If last auto-save was recent and browser is starting, likely a crash
    const timeDiff = Date.now() - lastSession.timestamp;
    return timeDiff < AUTO_SAVE_INTERVAL * 2; // Within 2 auto-save intervals
  }

  async saveCrashRecoverySession(session) {
    session.name = `Crash Recovery - ${new Date().toLocaleString()}`;
    session.type = 'crash_recovery';
    await this.saveSession(session);
  }

  startAutoSave() {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
    }

    this.autoSaveTimer = setInterval(async() => {
      await this.autoSaveCurrentSession();
    }, AUTO_SAVE_INTERVAL);
  }

  async autoSaveCurrentSession() {
    try {
      await this.saveCurrentSession('Auto-save', true);
    } catch (error) {
      console.error('Session Guardian: Auto-save failed:', error);
    }
  }

  async saveCurrentSession(name = null, isAutoSave = false) {
    try {
      const windows = await chrome.windows.getAll({ populate: true });
      const session = await this.createSessionData(windows, name, isAutoSave);
      await this.saveSession(session);
      return session;
    } catch (error) {
      console.error('Session Guardian: Failed to save session:', error);
      throw error;
    }
  }

  async createSessionData(windows, name, isAutoSave) {
    const session = {
      id: this.generateSessionId(),
      name: name || `Session ${new Date().toLocaleString()}`,
      timestamp: Date.now(),
      type: isAutoSave ? 'auto' : 'manual',
      windows: []
    };

    for (const window of windows) {
      const windowData = {
        id: window.id,
        type: window.type,
        state: window.state,
        focused: window.focused,
        incognito: window.incognito,
        tabs: []
      };

      for (const tab of window.tabs) {
        // Get scroll position from content script
        let scrollPosition = { x: 0, y: 0 };
        try {
          if (tab.url && !tab.url.startsWith('chrome://') && !tab.url.startsWith('chrome-extension://')) {
            const results = await chrome.scripting.executeScript({
              target: { tabId: tab.id },
              func: () => ({ x: window.scrollX, y: window.scrollY })
            });
            if (results && results[0]) {
              scrollPosition = results[0].result;
            }
          }
        } catch (error) {
          // Ignore errors for tabs we can't access
        }

        const tabData = {
          url: tab.url,
          title: tab.title,
          pinned: tab.pinned,
          active: tab.active,
          index: tab.index,
          favIconUrl: tab.favIconUrl,
          scrollPosition
        };

        windowData.tabs.push(tabData);
      }

      session.windows.push(windowData);
    }

    return session;
  }

  async saveSession(session) {
    const sessions = await this.getAllSessions();

    // Remove old auto-save if this is a new auto-save
    if (session.type === 'auto') {
      const filteredSessions = sessions.filter(s => s.type !== 'auto');
      filteredSessions.unshift(session);
      await this.saveSessions(filteredSessions.slice(0, MAX_SESSIONS));
    } else {
      sessions.unshift(session);
      await this.saveSessions(sessions.slice(0, MAX_SESSIONS));
    }
  }

  async getAllSessions() {
    try {
      const result = await chrome.storage.local.get(SESSION_STORAGE_KEY);
      return result[SESSION_STORAGE_KEY] || [];
    } catch (error) {
      console.error('Session Guardian: Failed to get sessions:', error);
      return [];
    }
  }

  async getLastAutoSave() {
    const sessions = await this.getAllSessions();
    return sessions.find(s => s.type === 'auto');
  }

  async saveSessions(sessions) {
    try {
      await chrome.storage.local.set({ [SESSION_STORAGE_KEY]: sessions });
    } catch (error) {
      console.error('Session Guardian: Failed to save sessions:', error);
    }
  }

  async restoreSession(sessionId) {
    try {
      const sessions = await this.getAllSessions();
      const session = sessions.find(s => s.id === sessionId);

      if (!session) {
        throw new Error('Session not found');
      }

      // Close current windows (optional - ask user)
      // const currentWindows = await chrome.windows.getAll();

      // Restore windows and tabs
      for (const windowData of session.windows) {
        const windowOptions = {
          type: windowData.type,
          state: windowData.state,
          focused: windowData.focused,
          incognito: windowData.incognito
        };

        // Create window with first tab
        const firstTab = windowData.tabs[0];
        if (firstTab) {
          const newWindow = await chrome.windows.create({
            ...windowOptions,
            url: firstTab.url
          });

          // Update first tab properties
          if (firstTab.pinned) {
            await chrome.tabs.update(newWindow.tabs[0].id, { pinned: true });
          }

          // Restore scroll position for first tab
          this.restoreScrollPosition(newWindow.tabs[0].id, firstTab.scrollPosition);

          // Create remaining tabs
          for (let i = 1; i < windowData.tabs.length; i++) {
            const tabData = windowData.tabs[i];
            const tab = await chrome.tabs.create({
              windowId: newWindow.id,
              url: tabData.url,
              pinned: tabData.pinned,
              active: tabData.active,
              index: tabData.index
            });

            // Restore scroll position
            this.restoreScrollPosition(tab.id, tabData.scrollPosition);
          }
        }
      }

      return true;
    } catch (error) {
      console.error('Session Guardian: Failed to restore session:', error);
      throw error;
    }
  }

  async restoreScrollPosition(tabId, scrollPosition) {
    if (!scrollPosition || (scrollPosition.x === 0 && scrollPosition.y === 0)) {
      return;
    }

    try {
      // Wait a bit for the page to load
      setTimeout(async() => {
        try {
          await chrome.scripting.executeScript({
            target: { tabId },
            func: (pos) => window.scrollTo(pos.x, pos.y),
            args: [scrollPosition]
          });
        } catch (error) {
          // Ignore errors for tabs we can't access
        }
      }, 1000);
    } catch (error) {
      // Ignore errors
    }
  }

  async deleteSession(sessionId) {
    try {
      const sessions = await this.getAllSessions();
      const filteredSessions = sessions.filter(s => s.id !== sessionId);
      await this.saveSessions(filteredSessions);
      return true;
    } catch (error) {
      console.error('Session Guardian: Failed to delete session:', error);
      throw error;
    }
  }

  generateSessionId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  onTabChange() {
    // Debounced update to auto-save session when tabs change
    this.debouncedUpdateAutoSave();
  }

  onWindowChange() {
    // Debounced update to auto-save session when windows change
    this.debouncedUpdateAutoSave();
  }

  debouncedUpdateAutoSave() {
    // Clear existing timer
    if (this.updateTimer) {
      clearTimeout(this.updateTimer);
    }

    // Set new timer to update auto-save after 2 seconds of inactivity
    this.updateTimer = setTimeout(async() => {
      try {
        await this.updateAutoSaveSession();
      } catch (error) {
        console.error('Session Guardian: Failed to update auto-save:', error);
      }
    }, 2000);
  }

  async updateAutoSaveSession() {
    // Update the auto-save session with current state
    const sessions = await this.getAllSessions();
    const autoSaveIndex = sessions.findIndex(s => s.type === 'auto');

    if (autoSaveIndex !== -1) {
      // Update existing auto-save session
      const windows = await chrome.windows.getAll({ populate: true });
      const updatedSession = await this.createSessionData(windows, 'Auto-save', true);
      updatedSession.id = sessions[autoSaveIndex].id; // Keep same ID

      sessions[autoSaveIndex] = updatedSession;
      await this.saveSessions(sessions);
    }
  }

  async handleScrollUpdate(_scrollData) {
    // Store scroll position for later use in session updates
    // This could be enhanced to immediately update the auto-save session
    // For now, we rely on the debounced update mechanism
    this.debouncedUpdateAutoSave();
  }
}

// Initialize the session manager
const sessionManager = new SessionManager();

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  (async() => {
    try {
      switch (request.action) {
      case 'saveSession': {
        const session = await sessionManager.saveCurrentSession(request.name);
        sendResponse({ success: true, session });
        break;
      }
      case 'getAllSessions': {
        const sessions = await sessionManager.getAllSessions();
        sendResponse({ success: true, sessions });
        break;
      }
      case 'restoreSession': {
        await sessionManager.restoreSession(request.sessionId);
        sendResponse({ success: true });
        break;
      }
      case 'deleteSession': {
        await sessionManager.deleteSession(request.sessionId);
        sendResponse({ success: true });
        break;
      }
      case 'updateScrollPosition': {
        // Handle scroll position updates from content script
        await sessionManager.handleScrollUpdate(request.data);
        sendResponse({ success: true });
        break;
      }
      default:
        sendResponse({ success: false, error: 'Unknown action' });
      }
    } catch (error) {
      sendResponse({ success: false, error: error.message });
    }
  })();

  return true; // Keep message channel open for async response
});
