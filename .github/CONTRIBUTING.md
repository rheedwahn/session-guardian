# Contributing to Session Guardian

Thank you for your interest in contributing to Session Guardian! This document provides guidelines and information for contributors.

## Community Guidelines

- **Be respectful and constructive** in all interactions
- **Focus on technical discussions** and objective feedback
- **Help others learn and contribute** - we welcome developers of all skill levels
- **Stay on topic** - keep discussions related to Session Guardian functionality
- **Use clear, descriptive language** in issues and pull requests
- **Test thoroughly** before submitting changes

## How to Contribute

### Reporting Bugs

Before creating bug reports, please check the existing issues to avoid duplicates. When creating a bug report, please include:

- Clear description of the issue
- Steps to reproduce
- Expected vs actual behavior
- Browser version and OS
- Extension version
- Console errors (if any)

### Suggesting Features

We welcome feature suggestions! Please:

- Check existing issues and discussions first
- Clearly describe the feature and its benefits
- Consider implementation complexity
- Provide mockups or examples if applicable

### Development Setup

1. **Fork the repository**
2. **Clone your fork:**
   ```bash
   git clone https://github.com/rheedwahn/session-guardian.git
   cd session-guardian
   npm install
   ```

3. **Run the test suite:**
   ```bash
   npm test                    # Unit tests (41 tests)
   npm run test:integration   # Integration tests (10 tests)
   npm run test:e2e           # End-to-end tests
   npm run test:all           # All tests
   npm run lint               # Code quality check
   ```

4. **Load the extension in Chrome:**
   - Use the VS Code task: "Load Extension in Chrome" (recommended)
   - Or manually: Open `chrome://extensions/` → Enable "Developer mode" → "Load unpacked"

5. **Make your changes**
6. **Test thoroughly** (see Testing Guidelines below)

### Automated Testing Infrastructure

We have comprehensive testing with **100% pass rate**:

- **51 Total Tests**: All automated with Jest and Playwright
- **Unit Tests (41)**: Component-level testing with mocking
- **Integration Tests (10)**: End-to-end workflow validation  
- **E2E Tests**: Cross-browser testing with Playwright
- **Quality Gates**: ESLint, automated CI/CD, coverage reporting

### Testing Guidelines

Before submitting a PR, ensure all automated tests pass:

```bash
npm run test:all    # Must pass 51/51 tests
npm run lint        # Must have 0 errors
```

**Manual Testing Checklist:**

- **Core Functionality:**
  - [ ] Manual session save/restore
  - [ ] Auto-save (wait 5+ minutes)
  - [ ] Session list display
  - [ ] Session deletion

- **Advanced Features:**
  - [ ] Scroll position tracking and restoration
  - [ ] Multiple windows handling
  - [ ] Crash recovery (kill Chrome process)
  - [ ] Form data preservation

- **Edge Cases:**
  - [ ] Chrome internal pages (`chrome://`)
  - [ ] Large numbers of tabs (50+)
  - [ ] Incognito windows
  - [ ] Pinned tabs
  - [ ] Various website types

- **Cross-Browser Testing:**
  - [ ] Different Chrome versions
  - [ ] Various operating systems

### Code Style

- Use modern ES6+ JavaScript
- Follow existing code patterns
- Add comments for complex logic
- Use descriptive variable names
- Handle errors gracefully
- Implement user feedback for actions

### Commit Guidelines

- Use clear, descriptive commit messages
- Reference issues when applicable: `fixes #123`
- Keep commits focused and atomic
- Use present tense: "Add feature" not "Added feature"

### Pull Request Process

1. **Create a feature branch** from `main`
2. **Make your changes** following the guidelines above
3. **Test thoroughly** using the testing checklist
4. **Update documentation** if needed
5. **Submit a pull request** using the PR template
6. **Address review feedback** promptly

## Architecture Overview

### Key Components

- **`background.js`**: Service worker for auto-save and session management
- **`popup.js/html`**: User interface for session operations
- **`content.js`**: Scroll tracking and page-level functionality
- **`manifest.json`**: Extension configuration and permissions

### Storage Structure

Sessions are stored in `chrome.storage.local` with this structure:
```javascript
{
  sessionGuardian_sessions: [
    {
      id: "unique_id",
      name: "Session Name", 
      timestamp: 1234567890,
      type: "manual|auto|crash_recovery",
      windows: [...]
    }
  ]
}
```

## Security Considerations

- Only store necessary data (URLs, titles, scroll positions)
- Never store sensitive form data
- Respect user privacy
- Handle permissions properly
- Validate all stored data before restoration

## Performance Guidelines

- Debounce scroll tracking updates
- Limit number of stored sessions
- Use efficient storage operations
- Minimize background script activity
- Handle large numbers of tabs gracefully

## Browser Compatibility

Currently targeting:
- Chrome 88+ (Manifest V3 support)
- Future: Firefox support planned

## Questions?

- Check existing [Issues](https://github.com/rheedwahn/session-guardian/issues)
- Start a [Discussion](https://github.com/rheedwahn/session-guardian/discussions)
- Review the [README](https://github.com/rheedwahn/session-guardian/blob/main/README.md) for basic information

Thank you for contributing to Session Guardian! 🎉
