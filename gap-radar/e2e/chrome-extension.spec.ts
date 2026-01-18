import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

test.describe('Chrome Extension', () => {
  const extensionPath = path.join(__dirname, '..', 'chrome-extension');
  const manifestPath = path.join(extensionPath, 'manifest.json');

  test('should have valid manifest.json', () => {
    // Check if manifest exists
    expect(fs.existsSync(manifestPath)).toBeTruthy();

    // Read and parse manifest
    const manifestContent = fs.readFileSync(manifestPath, 'utf-8');
    const manifest = JSON.parse(manifestContent);

    // Verify it's Manifest V3
    expect(manifest.manifest_version).toBe(3);

    // Verify required fields
    expect(manifest.name).toBeDefined();
    expect(manifest.version).toBeDefined();
    expect(manifest.description).toBeDefined();

    // Verify permissions
    expect(manifest.permissions).toContain('storage');
    expect(manifest.permissions).toContain('activeTab');

    // Verify host permissions for API calls
    expect(manifest.host_permissions).toBeDefined();

    // Verify background service worker
    expect(manifest.background).toBeDefined();
    expect(manifest.background.service_worker).toBeDefined();

    // Verify action (popup)
    expect(manifest.action).toBeDefined();
    expect(manifest.action.default_popup).toBeDefined();
  });

  test('should have background service worker file', () => {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
    const serviceWorkerPath = path.join(extensionPath, manifest.background.service_worker);
    expect(fs.existsSync(serviceWorkerPath)).toBeTruthy();
  });

  test('should have popup HTML file', () => {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
    const popupPath = path.join(extensionPath, manifest.action.default_popup);
    expect(fs.existsSync(popupPath)).toBeTruthy();
  });

  test('should have content script file', () => {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
    expect(manifest.content_scripts).toBeDefined();
    expect(manifest.content_scripts.length).toBeGreaterThan(0);

    const contentScriptPath = path.join(extensionPath, manifest.content_scripts[0].js[0]);
    expect(fs.existsSync(contentScriptPath)).toBeTruthy();
  });

  test('should have icons', () => {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
    expect(manifest.icons).toBeDefined();

    // Check common icon sizes
    const iconSizes = ['16', '48', '128'];
    for (const size of iconSizes) {
      if (manifest.icons[size]) {
        const iconPath = path.join(extensionPath, manifest.icons[size]);
        expect(fs.existsSync(iconPath)).toBeTruthy();
      }
    }
  });
});

test.describe('Chrome Extension - Save Functionality', () => {
  const extensionPath = path.join(__dirname, '..', 'chrome-extension');

  test('background script should handle save messages', () => {
    const backgroundPath = path.join(extensionPath, 'background.js');
    const content = fs.readFileSync(backgroundPath, 'utf-8');

    // Verify message listener exists
    expect(content).toContain('chrome.runtime.onMessage.addListener');

    // Verify save action handler
    expect(content).toContain('save_gap');
  });

  test('content script should detect and extract gap data', () => {
    const contentScriptPath = path.join(extensionPath, 'content.js');
    const content = fs.readFileSync(contentScriptPath, 'utf-8');

    // Verify gap detection logic exists
    expect(content).toContain('extractGapData');
  });
});
