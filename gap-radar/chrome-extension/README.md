# GapRadar Chrome Extension

Save market gaps and opportunities while browsing. Quickly analyze any webpage for market opportunities.

## Features

- **Authentication Integration**: Sign in with your GapRadar account
- **Quick Analysis**: Analyze any webpage for market opportunities
- **Save Gaps**: Highlight text and save it as a market gap
- **Context Menu**: Right-click to quickly analyze or save content
- **Seamless Integration**: Works with your GapRadar dashboard

## Installation (Development)

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the `chrome-extension` directory from this project
5. The GapRadar extension should now appear in your browser

## Installation (Production)

The extension will be published to the Chrome Web Store. Stay tuned!

## Usage

### 1. Sign In

Click the GapRadar extension icon in your toolbar and sign in with your GapRadar account.

### 2. Analyze a Page

- Click the extension icon
- Click "Analyze Current Page"
- The page will be analyzed and insights sent to your dashboard

### 3. Save a Gap

- Highlight text on any webpage
- Right-click and select "Save as Market Gap"
- The gap will be saved to your GapRadar account

### 4. Context Menu

Right-click anywhere on a page to:
- **Analyze with GapRadar**: Quick analysis of the current page
- **Save as Market Gap**: Save selected text as an opportunity

## Files

- `manifest.json` - Chrome extension configuration (Manifest v3)
- `background.js` - Background service worker (handles API calls, auth, context menu)
- `popup.html` - Extension popup UI
- `popup.js` - Popup logic (authentication, actions)
- `content.js` - Content script (runs on all pages, extracts data)
- `icons/` - Extension icons (16x16, 48x48, 128x128)

## Permissions

- `storage` - Store authentication tokens locally
- `activeTab` - Access current tab for analysis
- `contextMenus` - Add right-click context menu options
- `host_permissions` - Connect to GapRadar API

## API Endpoints Used

- `POST /api/auth/login` - Authentication
- `POST /api/gaps` - Save new gap
- `POST /api/niches/extract` - Quick page analysis

## Development

To modify the extension:

1. Make your changes to the files
2. Go to `chrome://extensions/`
3. Click the reload icon on the GapRadar extension card
4. Test your changes

## Security

- Authentication tokens are stored securely in Chrome's local storage
- All API calls use HTTPS in production
- No sensitive data is stored in the extension code
- Tokens are only sent to GapRadar API endpoints

## Support

For issues or feature requests, please visit: https://github.com/your-org/gap-radar/issues

## License

MIT License - See project root for details
