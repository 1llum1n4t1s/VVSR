/**
 * VideoSR Assist - Service Worker
 *
 * 拡張機能の有効/無効状態を管理し、アイコンバッジを更新する。
 */

/** @type {string} コンソール出力プレフィクス */
const LOG_PREFIX = '[VideoSR]';

/** アイコンバッジの表示を更新する */
function updateIconBadge(enabled) {
  if (enabled) {
    chrome.action.setBadgeText({ text: '' });
  } else {
    chrome.action.setBadgeText({ text: chrome.i18n.getMessage('badgeOff') });
    chrome.action.setBadgeBackgroundColor({ color: '#FF0000' });
  }
}

// ── インストール / アップデート ─────────────────────
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    chrome.storage.local.set({ enabled: true });
    console.log(`${LOG_PREFIX} Installed successfully`);
  } else if (details.reason === 'update') {
    console.log(`${LOG_PREFIX} Updated to v${chrome.runtime.getManifest().version}`);
  }
});

// ── アイコンクリックで有効/無効トグル ────────────────
// storage.local に書き込むだけで content script 側の
// storage.onChanged リスナーが自動的に状態を反映する。
chrome.action.onClicked.addListener(() => {
  chrome.storage.local.get(['enabled'], (result) => {
    const newState = !(result.enabled !== false);
    chrome.storage.local.set({ enabled: newState });
    updateIconBadge(newState);
  });
});

// ── 起動時のバッジ同期 ──────────────────────────────
chrome.storage.local.get(['enabled'], (result) => {
  updateIconBadge(result.enabled !== false);
});
