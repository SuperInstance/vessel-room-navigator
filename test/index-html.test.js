const fs = require('fs');
const path = require('path');
const assert = require('assert');
const { test, describe } = require('node:test');

const htmlPath = path.join(__dirname, '..', 'index.html');
const html = fs.readFileSync(htmlPath, 'utf-8');

describe('Vessel Room Navigator — index.html structure', () => {
  describe('HTML structure', () => {
    test('has DOCTYPE', () => {
      assert.ok(html.includes('<!DOCTYPE html>'), 'Missing DOCTYPE');
    });

    test('has canvas element or creates one dynamically', () => {
      const hasCanvasTag = html.includes('<canvas');
      const hasCreateCanvas = /createElement.*canvas|getElementById.*['"]c['"]/.test(html);
      assert.ok(hasCanvasTag || hasCreateCanvas,
        'Expected <canvas> tag or dynamic canvas creation');
    });

    test('has title with vessel or navigator', () => {
      assert.ok(/<title>.*vessel|navigator|cocapn/i.test(html),
        'Title should mention vessel, navigator, or cocapn');
    });

    test('has viewport meta tag', () => {
      assert.ok(html.includes('viewport'), 'Missing viewport meta');
    });
  });

  describe('JavaScript functions', () => {
    const expectedFunctions = [
      'init', 'loadTex', 'buildRoom', 'trans', 'warpTo',
      'lookDir', 'addObj', 'renderViz', 'updateList',
      'clearObjs', 'parsePrompt', 'updateUI', 'addChat',
      'animate', 'updateDashboards'
    ];

    for (const fn of expectedFunctions) {
      test(`defines function ${fn}()`, () => {
        assert.ok(
          new RegExp(`function\\s+${fn}\\s*\\(`).test(html),
          `Function "${fn}" not found in index.html`
        );
      });
    }
  });

  describe('Three.js integration', () => {
    test('imports Three.js or has WebGL context', () => {
      const hasThree = html.includes('three') || html.includes('THREE');
      const hasWebGL = html.includes('webgl') || html.includes('WebGL');
      assert.ok(hasThree || hasWebGL,
        'Expected Three.js or WebGL reference');
    });
  });

  describe('Room system', () => {
    test('references rooms-config.json or has embedded room data', () => {
      const hasDirectRef = html.includes('rooms-config.json');
      const hasEmbedded = /const\s+R\s*=/.test(html);
      assert.ok(hasDirectRef || hasEmbedded,
        'Should reference rooms-config.json or have embedded room data');
    });

    test('has warp functionality', () => {
      assert.ok(/warp/i.test(html), 'Should mention warp');
    });

    test('has camera/direction system', () => {
      assert.ok(/direction|camera/i.test(html),
        'Should reference direction or camera');
    });
  });

  describe('UI elements', () => {
    test('has navigation UI', () => {
      assert.ok(/button|btn|nav|control/i.test(html),
        'Should have navigational UI elements');
    });

    test('has loading splash element', () => {
      assert.ok(html.includes('splash') || html.includes('loading'),
        'Should have a loading/splash element');
    });

    test('has transition overlay', () => {
      assert.ok(html.includes('trans') || html.includes('overlay'),
        'Should have a transition overlay');
    });
  });
});
