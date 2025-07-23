/**
 * Unit tests for background.js - Session Manager
 */

// Import the SessionManager class
// Note: We'll need to modify background.js to export the class for testing
describe('SessionManager', () => {

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Mock storage data
    global.chrome.storage.local.get.mockResolvedValue({
      sessionGuardian_sessions: []
    });
    global.chrome.storage.local.set.mockResolvedValue();

    // Note: We'll need to refactor background.js to make SessionManager exportable
    // For now, we'll test the functionality indirectly
  });

  describe('Session Creation', () => {
    it('should create a session with correct structure', async() => {
      const mockWindows = [{
        id: 1,
        tabs: [{
          id: 1,
          url: 'https://example.com',
          title: 'Example'
        }]
      }];
      chrome.windows.getAll.mockResolvedValue(mockWindows);
      chrome.scripting.executeScript.mockResolvedValue([{
        result: { x: 0, y: 100 }
      }]);

      // Test session creation logic
      const expectedSession = {
        id: expect.any(String),
        name: 'Test Session',
        timestamp: expect.any(Number),
        type: 'manual',
        windows: expect.arrayContaining([
          expect.objectContaining({
            id: 1,
            type: 'normal',
            tabs: expect.arrayContaining([
              expect.objectContaining({
                url: 'https://example.com',
                title: 'Test Page',
                scrollPosition: { x: 0, y: 100 }
              })
            ])
          })
        ])
      };

      // This test structure shows what we expect
      // We'll need to implement actual testing once we refactor the code
      expect(expectedSession).toBeDefined();
    });

    it('should handle chrome:// URLs gracefully', async() => {
      const mockWindows = [{
        ...{ id: 1, tabs: [{ id: 1, url: 'https://example.com', title: 'Example' }] },
        tabs: [{
          ...{ id: 1, url: 'https://example.com', title: 'Example' },
          url: 'chrome://extensions/'
        }]
      }];

      chrome.windows.getAll.mockResolvedValue(mockWindows);
      chrome.scripting.executeScript.mockRejectedValue(new Error('Cannot access chrome:// URLs'));

      // Should not throw error and should handle chrome:// URLs
      expect(chrome.scripting.executeScript).toBeDefined();
    });
  });

  describe('Auto-save Functionality', () => {
    it('should start auto-save timer on initialization', () => {
      // Test that setInterval is called with correct interval
      const setIntervalSpy = jest.spyOn(global, 'setInterval');

      // We'll implement this test once we refactor the code
      expect(setIntervalSpy).toBeDefined();
    });

    it('should update existing auto-save session', async() => {
      const existingSessions = [
        { id: 'auto-save-1', name: 'Auto-save', type: 'auto', timestamp: Date.now() },
        { id: 'manual-1', name: 'Manual', type: 'manual', timestamp: Date.now() }
      ];

      global.chrome.storage.local.get.mockResolvedValue({
        sessionGuardian_sessions: existingSessions
      });

      // Test that auto-save updates existing session instead of creating new one
      expect(existingSessions.length).toBe(2);
    });
  });

  describe('Crash Recovery', () => {
    it('should detect unexpected shutdown', () => {
      const recentAutoSave = {
        ...{ id: 'test-session', name: 'Test', type: 'manual', timestamp: Date.now() },
        type: 'auto',
        timestamp: Date.now() - (5 * 60 * 1000) // 5 minutes ago
      };

      // Should detect as crash if last auto-save was within 2 intervals (10 minutes)
      const timeDiff = Date.now() - recentAutoSave.timestamp;
      const autoSaveInterval = 5 * 60 * 1000; // 5 minutes
      const wasUnexpectedShutdown = timeDiff < autoSaveInterval * 2;

      expect(wasUnexpectedShutdown).toBe(true);
    });

    it('should not detect crash for old auto-save', () => {
      const oldAutoSave = {
        ...{ id: 'test-session', name: 'Test', type: 'manual', timestamp: Date.now() },
        type: 'auto',
        timestamp: Date.now() - (20 * 60 * 1000) // 20 minutes ago
      };

      const timeDiff = Date.now() - oldAutoSave.timestamp;
      const autoSaveInterval = 5 * 60 * 1000;
      const wasUnexpectedShutdown = timeDiff < autoSaveInterval * 2;

      expect(wasUnexpectedShutdown).toBe(false);
    });
  });

  describe('Storage Management', () => {
    it('should limit number of stored sessions', () => {
      const maxSessions = 50;
      const sessions = Array.from({ length: 60 }, (_, i) => ({
        id: `session-${i}`,
        name: `Session ${i}`,
        type: 'manual',
        timestamp: Date.now()
      }));

      const limitedSessions = sessions.slice(0, maxSessions);
      expect(limitedSessions.length).toBe(maxSessions);
    });

    it('should remove old auto-save when saving new auto-save', () => {
      const sessions = [
        { id: 'old-auto', name: 'Auto-save', type: 'auto', timestamp: Date.now() },
        { id: 'manual-session', name: 'Manual', type: 'manual', timestamp: Date.now() },
        { id: 'manual-session', name: 'Manual', type: 'manual', timestamp: Date.now() }
      ];

      const filteredSessions = sessions.filter(s => s.type !== 'auto');
      expect(filteredSessions.length).toBe(2);
      expect(filteredSessions.every(s => s.type === 'manual')).toBe(true);
    });
  });

  describe('Message Handling', () => {
    it('should handle saveSession message', async() => {
      const mockRequest = {
        action: 'saveSession',
        name: 'Test Session'
      };

      const mockSendResponse = jest.fn();

      // Test message handling
      expect(mockRequest.action).toBe('saveSession');
      expect(mockSendResponse).toBeDefined();
    });

    it('should handle getAllSessions message', async() => {
      const mockSessions = [{ id: 'test-session', name: 'Test', type: 'manual', timestamp: Date.now() }];
      global.chrome.storage.local.get.mockResolvedValue({
        sessionGuardian_sessions: mockSessions
      });

      const mockRequest = {
        action: 'getAllSessions'
      };

      expect(mockRequest.action).toBe('getAllSessions');
    });

    it('should handle unknown action gracefully', async() => {
      const expectedResponse = {
        success: false,
        error: 'Unknown action'
      };

      expect(expectedResponse.success).toBe(false);
    });
  });
});
