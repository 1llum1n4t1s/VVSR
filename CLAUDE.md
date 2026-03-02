# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

VideoSR Assist (VideoSRアシスト) — Chrome extension (Manifest V3) that triggers NVIDIA RTX Video Super Resolution on any HTTPS site with video. Vanilla JS, no build step. Japanese comments.

## Commands

**Package (ZIP + store images):**
```
.\zip.ps1          # Windows
./zip.sh           # Linux / macOS
```

Pipeline: version sync → `npm install` → Puppeteer screenshot generation → ZIP packaging.

**Manual install:** `chrome://extensions` → Load unpacked → select repo root.

No linter, no tests.

## Architecture

```
src/content.js          IIFE, injected on every HTTPS page
  ├─ Phase 1 (lightweight): MutationObserver only (video node filter)
  ├─ Phase 2 (on video found): + scroll/resize/fullscreen listeners
  └─ processVideos()  → find largest <video> by area → 1x1 overlay

src/service_worker.js   Extension toggle + badge
  └─ action.onClicked → storage.local.set({ enabled }) → badge update
```

### State sync (no messaging)

SW writes `enabled` to `chrome.storage.local`. Content script listens via `chrome.storage.onChanged` — no `chrome.tabs.sendMessage` or `chrome.runtime.onMessage`.

### Overlay positioning

- `position: fixed` + `getBoundingClientRect()` tracking viewport coords
- `z-index: 2147483647` for compositor layer priority
- Scroll listener (`capture: true`, rAF-throttled) keeps overlay aligned
- Forces NVIDIA driver to recognize VSR layer in both fullscreen and windowed modes

### Lazy listener initialization

All pages get only a MutationObserver (filters for `<video>` node add/remove). Full listeners (scroll, resize, fullscreenchange, visibilitychange) are registered only when a `<video>` is found and removed when all videos disappear. This minimizes overhead on non-video pages.

### i18n

`_locales/ja/` (default) and `_locales/en/`. Manifest uses `__MSG_*__` placeholders.

Screenshot HTML templates support `?lang=en` query parameter for English text. Default (no param or `?lang=ja`) renders Japanese.

## Conventions

- `data-vsr-overlay` attribute for DOM targeting
- `[VideoSR]` prefix on console output (suppressed when video count is 0)
- `_` prefix on private functions
- `_safeChromeCall()` wrapper silences `Extension context invalidated` errors
- `window.__vsr_initialized` guard prevents duplicate IIFE execution
- Constants at top of IIFE scope (`DEBOUNCE_MS`, `SETTLE_DELAY_MS`, etc.)

## Site Coverage

`content_scripts[0].matches` is `"https://*/*"` — runs on all HTTPS sites.
No `host_permissions` needed (declarative content scripts + storage API only).

## Build Pipeline

`zip.ps1` / `zip.sh` performs:
1. Read version from `manifest.json`
2. Sync version string into README.md and webstore-screenshots HTML files
3. `npm install` (puppeteer devDependency)
4. `node scripts/generate-screenshots.js` → `webstore-images/{ja,en}/*.png`
5. ZIP: `manifest.json`, `src/`, `icons/`, `_locales/`, `LICENSE.md`

`package.json` exists solely for the puppeteer devDependency used by the screenshot generator.

## Constraints

- Overlay uses fixed positioning to trigger VSR in both fullscreen and windowed modes
- Requires NVIDIA RTX GPU + driver with RTX SR enabled
- Chrome hardware acceleration must be enabled
- `docs/` contains Chrome Web Store submission materials (STORE_GUIDE, PRIVACY_POLICY, TESTING)
