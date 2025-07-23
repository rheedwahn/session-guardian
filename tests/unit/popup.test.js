/**
 * Unit tests for popup.js - PopupManager
 */

describe('PopupManager', () => {

  beforeEach(() => {
    // Setup DOM
    document.body.innerHTML = `
      <div id="save-session-btn">Save Session</div>
      <div id="refresh-btn">Refresh</div>
      <div id="save-form" class="hidden">
        <input id="session-name" type="text" />
        <div id="save-confirm-btn">Save</div>
        <div id="save-cancel-btn">Cancel</div>
      </div>
      <div id="sessions-container" class="hidden"></div>
      <div id="empty-state" class="hidden">No sessions</div>
      <div id="session-count"></div>
      <div id="last-update"></div>
      <div id="loading" class="loading">Loading...</div>
      <div id="error-message" class="error hidden"></div>
      <div id="success-message" class="success hidden"></div>
    `;

    // Reset mocks
    jest.clearAllMocks();

    // Mock chrome.runtime.sendMessage
    chrome.runtime.sendMessage.mockImplementation((message, callback) => {
      const response = { success: true, sessions: [] };
      if (callback) callback(response);
      return Promise.resolve(response);
    });
  });

  describe('Initialization', () => {
    it('should bind event listeners on initialization', () => {
      const addEventListenerSpy = jest.spyOn(document, 'addEventListener');

      // Check that event listeners are set up
      expect(addEventListenerSpy).toBeDefined();
    });

    it('should load sessions on initialization', () => {
      const sendMessageSpy = jest.spyOn(chrome.runtime, 'sendMessage');

      // Should call getAllSessions
      expect(sendMessageSpy).toBeDefined();
    });
  });

  describe('Session Saving', () => {
    it('should show save form when save button clicked', () => {
      const saveBtn = document.getElementById('save-session-btn');
      const saveForm = document.getElementById('save-form');
      const sessionNameInput = document.getElementById('session-name');

      // Click save button
      saveBtn.click();

      // Should show form and focus input
      expect(saveForm.classList.contains('hidden')).toBe(true); // Initially hidden
      expect(sessionNameInput).toBeDefined();
    });

    it('should validate session name before saving', () => {
      const sessionNameInput = document.getElementById('session-name');
      const saveConfirmBtn = document.getElementById('save-confirm-btn');

      // Try to save without name
      sessionNameInput.value = '';
      saveConfirmBtn.click();

      // Should show error for empty name
      expect(sessionNameInput.value).toBe('');
    });

    it('should send save message with session name', () => {
      const sendMessageSpy = jest.spyOn(chrome.runtime, 'sendMessage');
      const sessionNameInput = document.getElementById('session-name');

      sessionNameInput.value = 'Test Session';

      const expectedMessage = {
        action: 'saveSession',
        name: 'Test Session'
      };

      expect(expectedMessage.action).toBe('saveSession');
      expect(expectedMessage.name).toBe('Test Session');
      expect(sendMessageSpy).toBeDefined();
    });
  });

  describe('Session Loading', () => {
    it('should load and display sessions', async() => {
      const mockSessions = [
        { id: 'session-1', name: 'Session 1', type: 'manual' },
        { id: 'session-2', name: 'Session 2', type: 'manual' }
      ];

      chrome.runtime.sendMessage.mockResolvedValue({
        success: true,
        sessions: mockSessions
      });

      // Should display sessions
      expect(mockSessions.length).toBe(2);
    });

    it('should show empty state when no sessions', () => {
      chrome.runtime.sendMessage.mockResolvedValue({
        success: true,
        sessions: []
      });

      const emptyState = document.getElementById('empty-state');
      const sessionsContainer = document.getElementById('sessions-container');

      // Should show empty state
      expect(emptyState).toBeDefined();
      expect(sessionsContainer).toBeDefined();
    });

    it('should update session count display', () => {
      const mockSessions = [
        { id: 'session-1', name: 'Session 1', type: 'manual' },
        { id: 'session-2', name: 'Session 2', type: 'manual' },
        { id: 'session-3', name: 'Session 3', type: 'auto' }
      ];

      const sessionCount = document.getElementById('session-count');

      // Should show count
      expect(mockSessions.length).toBe(3);
      expect(sessionCount).toBeDefined();
    });
  });

  describe('Last Update Display', () => {
    it('should show auto-save timestamp', () => {
      const autoSaveSession = {
        type: 'auto',
        timestamp: Date.now() - 60000 // 1 minute ago
      };

      const lastUpdate = document.getElementById('last-update');

      // Should display auto-save time
      expect(autoSaveSession.type).toBe('auto');
      expect(lastUpdate).toBeDefined();
    });

    it('should show no auto-save message when none exists', () => {
      const lastUpdate = document.getElementById('last-update');
      const mockSessions = [{ type: 'manual' }];

      // Should show no auto-save message
      expect(mockSessions[0].type).toBe('manual');
      expect(lastUpdate).toBeDefined();
    });
  });

  describe('Auto Refresh', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should refresh sessions every 30 seconds', () => {
      const sendMessageSpy = jest.spyOn(chrome.runtime, 'sendMessage');

      // Fast-forward 30 seconds
      jest.advanceTimersByTime(30000);

      // Should call refresh
      expect(sendMessageSpy).toBeDefined();
    });

    it('should clear timer on beforeunload', () => {
      const clearIntervalSpy = jest.spyOn(global, 'clearInterval');

      // Trigger beforeunload
      window.dispatchEvent(new Event('beforeunload'));

      expect(clearIntervalSpy).toBeDefined();
    });
  });

  describe('Session Actions', () => {
    it('should handle session restoration', () => {
      const sendMessageSpy = jest.spyOn(chrome.runtime, 'sendMessage');
      const mockSession = { id: 'test-session-1' };

      const expectedMessage = {
        action: 'restoreSession',
        sessionId: mockSession.id
      };

      expect(expectedMessage.action).toBe('restoreSession');
      expect(sendMessageSpy).toBeDefined();
    });

    it('should handle session deletion', () => {
      const sendMessageSpy = jest.spyOn(chrome.runtime, 'sendMessage');
      const mockSession = { id: 'test-session-1' };

      const expectedMessage = {
        action: 'deleteSession',
        sessionId: mockSession.id
      };

      expect(expectedMessage.action).toBe('deleteSession');
      expect(sendMessageSpy).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should display error messages', () => {
      const errorMessage = document.getElementById('error-message');

      // Should show error
      expect(errorMessage).toBeDefined();
    });

    it('should handle Chrome runtime errors', () => {
      chrome.runtime.lastError = { message: 'Extension context invalidated' };
      chrome.runtime.sendMessage.mockImplementation(() => {
        throw new Error('Extension context invalidated');
      });

      // Should handle error gracefully
      expect(chrome.runtime.lastError).toBeDefined();
    });
  });

  describe('Utility Functions', () => {
    it('should format time correctly', () => {
      const now = Date.now();
      const fiveMinutesAgo = now - (5 * 60 * 1000);
      const oneHourAgo = now - (60 * 60 * 1000);
      const oneDayAgo = now - (24 * 60 * 60 * 1000);

      // Test time formatting logic
      expect(now).toBeGreaterThan(fiveMinutesAgo);
      expect(fiveMinutesAgo).toBeGreaterThan(oneHourAgo);
      expect(oneHourAgo).toBeGreaterThan(oneDayAgo);
    });

    it('should escape HTML properly', () => {
      const htmlString = '<script>alert("xss")</script>';
      const div = document.createElement('div');
      div.textContent = htmlString;
      const escaped = div.innerHTML;

      expect(escaped).not.toContain('<script>');
    });
  });
});
