# Session Guardian Browser Extension

A powerful browser extension that automatically tracks and restores your browsing sessions, including tabs, windows, and scroll positions, to protect against unexpected shutdowns and crashes.

## 🚀 Features

### Core Session Management
- **Auto-Save**: Automatically saves your browsing session every 5 minutes
- **Manual Save**: Save sessions with custom names at any time
- **Crash Recovery**: Detects unexpected shutdowns and offers automatic restoration
- **Session History**: Keep up to 50 saved sessions with timestamps

### Advanced Features
- **Scroll Position Tracking**: Remembers and restores exact scroll positions for each tab
- **Window Structure**: Preserves multiple windows, tab order, and pinned state
- **Form Data Preservation**: Saves and restores form inputs (session-level)
- **Smart Storage**: Uses Chrome's local storage for reliable offline access

### User Interface
- **Clean Popup**: Easy-to-use interface for managing sessions
- **Session Types**: Visual indicators for auto-save, manual, and crash recovery sessions
- **Detailed Stats**: See window count, tab count, and save timestamps
- **Quick Actions**: One-click restore and delete operations

## 🛠️ Installation

### Development Setup
1. Clone or download this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the extension directory
5. The Session Guardian icon should appear in your extensions toolbar

### Production Installation
*(Will be available on Chrome Web Store after testing)*

## 📖 Usage

### Saving Sessions
1. Click the Session Guardian icon in your toolbar
2. Click "Save Session" 
3. Enter a descriptive name for your session
4. Click "Save" to store the current state

### Restoring Sessions
1. Open the Session Guardian popup
2. Browse your saved sessions list
3. Click "Restore" on any session to open all tabs and windows
4. Scroll positions will be automatically restored

### Auto-Recovery
- Sessions are automatically saved every 5 minutes
- If Chrome crashes or shuts down unexpectedly, the extension will detect this on restart
- A crash recovery session will be automatically created and highlighted in red

## 🔧 Technical Details

### Architecture
- **Manifest V3**: Modern Chrome extension architecture
- **Service Worker**: Background script for auto-save and crash detection
- **Content Scripts**: Injected into all pages for scroll tracking
- **Local Storage**: Offline-first data persistence

### Permissions Required
- `tabs`: Read tab information (URLs, titles, etc.)
- `windows`: Access window structure and state
- `storage`: Save session data locally
- `sessions`: Enhanced session management
- `activeTab`: Access current tab for scroll tracking
- `scripting`: Inject scripts for scroll restoration

### File Structure
```
session-guardian/
├── manifest.json          # Extension configuration
├── background.js          # Auto-save and session management
├── popup.html            # User interface
├── popup.js              # UI logic and interactions
├── content.js            # Scroll tracking and restoration
├── icons/                # Extension icons
└── README.md             # This file
```

## 🔒 Privacy & Security

- **Local Storage Only**: All data is stored locally on your device
- **No External Servers**: No data is sent to external servers
- **No Personal Data**: Only URLs, titles, and scroll positions are stored
- **User Control**: You can delete any saved session at any time

## 🐛 Troubleshooting

### Common Issues

**Sessions not saving automatically:**
- Check that the extension has all required permissions
- Verify the extension is enabled in Chrome settings

**Scroll positions not restoring:**
- Some websites prevent scroll restoration due to security policies
- Single-page applications may override scroll behavior

**Extension not working on certain pages:**
- Chrome extensions cannot access `chrome://` pages or the Chrome Web Store
- Some secure sites may block extension functionality

### Debug Mode
Open Chrome DevTools on the extension popup to see console logs and debug information.

## 🚧 Development

### Building from Source
No build process required - this is a vanilla JavaScript extension.

### Testing
1. Load the extension in developer mode
2. Test auto-save by waiting 5+ minutes
3. Test crash recovery by killing Chrome process
4. Verify scroll restoration on various websites

### Contributing
1. Fork the repository
2. Create a feature branch
3. Test thoroughly across different websites
4. Submit a pull request

## 📋 Roadmap

### Planned Features
- [ ] Firefox support
- [ ] Cloud sync across devices
- [ ] Session export/import
- [ ] Advanced filtering options
- [ ] Custom auto-save intervals
- [ ] Session scheduling
- [ ] Tab grouping support

### Advanced Features (Future)
- [ ] Session sharing between users
- [ ] Machine learning for smart session suggestions
- [ ] Integration with bookmark management
- [ ] Performance analytics

## 📄 License

MIT License - see LICENSE file for details

## 🤝 Support

- Report bugs via GitHub Issues
- Feature requests welcome
- Email: [your-email] (update this)

## 🙏 Acknowledgments

- Chrome Extensions API documentation
- Community feedback and testing
- Open source contributors

---

**⚠️ Important**: This extension is in active development. Please backup important browsing sessions manually until stable release.
