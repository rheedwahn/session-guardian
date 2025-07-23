// Content script for Session Guardian
// Tracks scroll positions and handles page-level session data

class ScrollTracker {
  constructor() {
    this.lastScrollPosition = { x: 0, y: 0 };
    this.scrollUpdateTimer = null;
    this.init();
  }

  init() {
    // Track scroll position changes
    window.addEventListener('scroll', () => {
      this.onScroll();
    }, { passive: true });

    // Track page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        this.saveScrollPosition();
      }
    });

    // Track beforeunload (page navigation/close)
    window.addEventListener('beforeunload', () => {
      this.saveScrollPosition();
    });

    // Initial scroll position
    this.updateScrollPosition();
  }

  onScroll() {
    // Debounce scroll updates to avoid excessive saves
    if (this.scrollUpdateTimer) {
      clearTimeout(this.scrollUpdateTimer);
    }

    this.scrollUpdateTimer = setTimeout(() => {
      this.updateScrollPosition();
    }, 500); // Update every 500ms after scroll stops
  }

  updateScrollPosition() {
    const currentPosition = {
      x: window.scrollX,
      y: window.scrollY
    };

    // Only update if position changed significantly
    const threshold = 50; // pixels
    if (Math.abs(currentPosition.x - this.lastScrollPosition.x) > threshold ||
        Math.abs(currentPosition.y - this.lastScrollPosition.y) > threshold) {

      this.lastScrollPosition = currentPosition;
      this.saveScrollPosition();
    }
  }

  async saveScrollPosition() {
    try {
      const scrollData = {
        url: window.location.href,
        scrollX: window.scrollX,
        scrollY: window.scrollY,
        timestamp: Date.now()
      };

      // Store in session storage for quick access
      sessionStorage.setItem('sessionGuardian_scroll', JSON.stringify(scrollData));

      // Also send to background script for persistence
      chrome.runtime.sendMessage({
        action: 'updateScrollPosition',
        data: scrollData
      }).catch(() => {
        // Ignore errors when extension context is invalid
      });

    } catch (error) {
      // Ignore storage errors
    }
  }

  async restoreScrollPosition() {
    try {
      // Check if we have a saved scroll position for this URL
      const savedScroll = sessionStorage.getItem('sessionGuardian_scroll');
      if (savedScroll) {
        const scrollData = JSON.parse(savedScroll);
        if (scrollData.url === window.location.href) {
          // Restore scroll position after a short delay to ensure page is loaded
          setTimeout(() => {
            window.scrollTo(scrollData.scrollX, scrollData.scrollY);
          }, 100);
        }
      }
    } catch (error) {
      // Ignore errors
    }
  }

  // Get current page data for session saving
  getPageData() {
    return {
      url: window.location.href,
      title: document.title,
      scrollPosition: {
        x: window.scrollX,
        y: window.scrollY
      },
      // Additional metadata
      meta: {
        description: this.getMetaContent('description'),
        keywords: this.getMetaContent('keywords'),
        author: this.getMetaContent('author')
      },
      // Basic page stats
      stats: {
        links: document.querySelectorAll('a').length,
        images: document.querySelectorAll('img').length,
        forms: document.querySelectorAll('form').length
      }
    };
  }

  getMetaContent(name) {
    const meta = document.querySelector(`meta[name="${name}"]`);
    return meta ? meta.getAttribute('content') : '';
  }
}

// Enhanced scroll restoration for session recovery
class SessionRestorer {
  constructor() {
    this.init();
  }

  init() {
    // Listen for messages from background script
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      this.handleMessage(request, sender, sendResponse);
    });

    // Try to restore scroll position on page load
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        this.restoreScrollFromSession();
      });
    } else {
      this.restoreScrollFromSession();
    }
  }

  handleMessage(request, sender, sendResponse) {
    switch (request.action) {
    case 'getPageData':
      sendResponse(window.scrollTracker.getPageData());
      break;

    case 'restoreScrollPosition':
      this.restoreScrollPosition(request.position);
      sendResponse({ success: true });
      break;

    case 'highlightPage':
      this.highlightPageForSession();
      sendResponse({ success: true });
      break;
    }
  }

  restoreScrollPosition(position) {
    if (position && (position.x > 0 || position.y > 0)) {
      // Use requestAnimationFrame for smooth scrolling
      requestAnimationFrame(() => {
        window.scrollTo({
          left: position.x,
          top: position.y,
          behavior: 'smooth'
        });
      });
    }
  }

  restoreScrollFromSession() {
    // Check URL parameters for session restoration
    const urlParams = new URLSearchParams(window.location.search);
    const sessionRestore = urlParams.get('sessionGuardian');

    if (sessionRestore) {
      try {
        const restoreData = JSON.parse(decodeURIComponent(sessionRestore));
        this.restoreScrollPosition(restoreData.scrollPosition);

        // Remove the parameter from URL
        urlParams.delete('sessionGuardian');
        const newUrl = window.location.pathname +
          (urlParams.toString() ? `?${urlParams.toString()}` : '') +
          window.location.hash;
        history.replaceState(null, '', newUrl);

      } catch (error) {
        console.warn('Session Guardian: Failed to restore scroll position:', error);
      }
    }
  }

  highlightPageForSession() {
    // Add visual feedback when page is being saved to session
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(66, 133, 244, 0.1);
      border: 3px solid #4285f4;
      z-index: 999999;
      pointer-events: none;
      animation: sessionSaveFlash 0.5s ease-out;
    `;

    // Add CSS animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes sessionSaveFlash {
        0% { opacity: 0; transform: scale(1.05); }
        50% { opacity: 1; transform: scale(1); }
        100% { opacity: 0; transform: scale(0.95); }
      }
    `;

    document.head.appendChild(style);
    document.body.appendChild(overlay);

    setTimeout(() => {
      overlay.remove();
      style.remove();
    }, 500);
  }
}

// Form data preservation (additional feature)
class FormDataTracker {
  constructor() {
    this.formData = new Map();
    this.init();
  }

  init() {
    // Track form inputs
    document.addEventListener('input', (e) => {
      if (e.target.matches('input, textarea, select')) {
        this.saveFormData(e.target);
      }
    });

    // Restore form data on page load
    this.restoreFormData();
  }

  saveFormData(element) {
    const form = element.closest('form');
    const formId = this.getFormId(form);
    const fieldId = this.getFieldId(element);

    if (!this.formData.has(formId)) {
      this.formData.set(formId, new Map());
    }

    this.formData.get(formId).set(fieldId, element.value);

    // Save to sessionStorage
    try {
      const formDataObj = {};
      this.formData.forEach((fields, fId) => {
        formDataObj[fId] = {};
        fields.forEach((value, fieldId) => {
          formDataObj[fId][fieldId] = value;
        });
      });

      sessionStorage.setItem('sessionGuardian_forms', JSON.stringify(formDataObj));
    } catch (error) {
      // Ignore storage errors
    }
  }

  restoreFormData() {
    try {
      const savedData = sessionStorage.getItem('sessionGuardian_forms');
      if (savedData) {
        const formDataObj = JSON.parse(savedData);

        Object.keys(formDataObj).forEach(formId => {
          Object.keys(formDataObj[formId]).forEach(fieldId => {
            const element = document.querySelector(`[data-sg-field="${fieldId}"]`) ||
                           document.querySelector(`#${fieldId}`) ||
                           document.querySelector(`[name="${fieldId}"]`);

            if (element && !element.value) {
              element.value = formDataObj[formId][fieldId];
            }
          });
        });
      }
    } catch (error) {
      // Ignore errors
    }
  }

  getFormId(form) {
    if (!form) return 'global';
    return form.id || form.action || `form_${Array.from(document.forms).indexOf(form)}`;
  }

  getFieldId(element) {
    return element.id || element.name || `field_${element.type}_${Array.from(element.form?.elements || [element]).indexOf(element)}`;
  }
}

// Initialize all trackers
window.scrollTracker = new ScrollTracker();
window.sessionRestorer = new SessionRestorer();
window.formDataTracker = new FormDataTracker();

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ScrollTracker, SessionRestorer, FormDataTracker };
}
