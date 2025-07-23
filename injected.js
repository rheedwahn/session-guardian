// Injected script for enhanced scroll restoration
// This script is injected into pages for advanced scroll management

(function() {
  'use strict';

  // Enhanced scroll restoration with smooth animation
  window.sessionGuardianRestore = function(scrollData) {
    if (!scrollData) return;

    const { x = 0, y = 0, smooth = true } = scrollData;

    if (smooth) {
      // Smooth scroll restoration
      window.scrollTo({
        left: x,
        top: y,
        behavior: 'smooth'
      });
    } else {
      // Instant scroll restoration
      window.scrollTo(x, y);
    }

    // Dispatch custom event for tracking
    window.dispatchEvent(new CustomEvent('sessionGuardianScrollRestored', {
      detail: { x, y, timestamp: Date.now() }
    }));
  };

  // Advanced page readiness detection
  window.sessionGuardianWaitForReady = function(callback, maxWait = 5000) {
    const startTime = Date.now();

    function checkReady() {
      const isReady = document.readyState === 'complete' &&
                     window.scrollY !== undefined &&
                     document.body &&
                     document.body.scrollHeight > 0;

      if (isReady) {
        callback();
      } else if (Date.now() - startTime < maxWait) {
        setTimeout(checkReady, 100);
      } else {
        // Timeout - proceed anyway
        callback();
      }
    }

    checkReady();
  };

  // Smart scroll position calculation
  window.sessionGuardianGetOptimalScroll = function() {
    return {
      x: window.scrollX,
      y: window.scrollY,
      // Additional context for better restoration
      viewportHeight: window.innerHeight,
      documentHeight: document.body.scrollHeight,
      percentage: window.scrollY / (document.body.scrollHeight - window.innerHeight) * 100
    };
  };

})();
