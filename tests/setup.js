// Test setup for Session Guardian extension
require('jest-webextension-mock');

// Mock Chrome APIs for testing
global.chrome = {
  runtime: {
    onMessage: {
      addListener: jest.fn(),
      removeListener: jest.fn()
    },
    onStartup: {
      addListener: jest.fn()
    },
    onInstalled: {
      addListener: jest.fn()
    },
    sendMessage: jest.fn(),
    lastError: null
  },
  tabs: {
    onCreated: {
      addListener: jest.fn()
    },
    onRemoved: {
      addListener: jest.fn()
    },
    onUpdated: {
      addListener: jest.fn()
    },
    query: jest.fn(),
    create: jest.fn(),
    remove: jest.fn(),
    update: jest.fn()
  },
  windows: {
    onCreated: {
      addListener: jest.fn()
    },
    onRemoved: {
      addListener: jest.fn()
    },
    getAll: jest.fn(),
    create: jest.fn(),
    remove: jest.fn(),
    update: jest.fn()
  },
  storage: {
    local: {
      get: jest.fn(),
      set: jest.fn(),
      remove: jest.fn(),
      clear: jest.fn()
    },
    sync: {
      get: jest.fn(),
      set: jest.fn(),
      remove: jest.fn(),
      clear: jest.fn()
    }
  },
  scripting: {
    executeScript: jest.fn()
  }
};

// Mock DOM APIs
Object.defineProperty(window, 'sessionStorage', {
  value: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn()
  },
  writable: true
});

Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn()
  },
  writable: true
});

// Mock scroll properties
Object.defineProperty(window, 'scrollX', {
  value: 0,
  writable: true
});

Object.defineProperty(window, 'scrollY', {
  value: 0,
  writable: true
});

// Reset all mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
  chrome.runtime.lastError = null;
});

// Global test utilities
global.testUtils = {
  createMockTab: (overrides = {}) => ({
    id: 1,
    url: 'https://example.com',
    title: 'Test Page',
    pinned: false,
    active: true,
    index: 0,
    favIconUrl: 'https://example.com/favicon.ico',
    ...overrides
  }),

  createMockWindow: (overrides = {}) => ({
    id: 1,
    type: 'normal',
    state: 'normal',
    focused: true,
    incognito: false,
    ...overrides
  }),

  createMockSession: (overrides = {}) => ({
    id: 'test-session-1',
    name: 'Test Session',
    timestamp: Date.now(),
    type: 'manual',
    ...overrides
  }),

  mockChromeStorageGet: (data) => {
    chrome.storage.local.get.mockImplementation((keys, callback) => {
      if (typeof keys === 'function') {
        keys(data);
      } else if (callback) {
        callback(data);
      }
      return Promise.resolve(data);
    });
  },

  mockChromeStorageSet: () => {
    chrome.storage.local.set.mockImplementation((data, callback) => {
      if (callback) callback();
      return Promise.resolve();
    });
  }
};
