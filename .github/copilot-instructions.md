<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# Session Guardian Browser Extension - Copilot Instructions

## Project Overview
This is a Chrome browser extension built for session tracking and recovery. The extension helps users save and restore their browsing sessions, including tabs, windows, and scroll positions, to protect against unexpected shutdowns and crashes.

## Architecture & Technology Stack
- **Platform**: Chrome Extension (Manifest V3)
- **Languages**: Vanilla JavaScript, HTML, CSS
- **Storage**: Chrome's local storage API
- **Permissions**: tabs, windows, storage, sessions, activeTab, scripting

## Code Style & Patterns
- Use modern ES6+ JavaScript features
- Follow Chrome Extension best practices for Manifest V3
- Implement proper error handling and user feedback
- Use async/await for asynchronous operations
- Follow semantic HTML and accessible CSS patterns

## Key Components
1. **background.js**: Service worker handling auto-save, crash detection, and session management
2. **popup.html/js**: User interface for saving/restoring sessions
3. **content.js**: Content script for scroll position tracking
4. **injected.js**: Enhanced scroll restoration utilities

## Development Guidelines
- Test on multiple websites with different scroll behaviors
- Handle edge cases like Chrome internal pages and extension pages
- Implement proper permission checks before accessing tab data
- Use Chrome extension APIs correctly with proper error handling
- Maintain backwards compatibility for saved session data

## Security Considerations
- Only store necessary data (URLs, titles, scroll positions)
- Respect user privacy - no external data transmission
- Handle sensitive pages appropriately (don't save form data on secure sites)
- Validate all stored data before restoration

## Testing Focus Areas
- Auto-save functionality every 5 minutes
- Crash recovery detection and restoration
- Scroll position accuracy across different page types
- Multi-window session handling
- Storage quota management and cleanup
