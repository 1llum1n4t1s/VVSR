/**
 * VideoSR Assist - Content Script
 *
 * 動画ストリーミングページ上の最大 video 要素を検出し、
 * RTX Video Super Resolution をトリガーする 1x1 オーバーレイを配置する。
 */
(() => {
  'use strict';

  // 多重実行防止（動的注入で IIFE が再実行されるケース対策）
  if (window.__vsr_initialized) return;
  window.__vsr_initialized = true;

  /** @type {string} コンソール出力プレフィクス */
  const LOG_PREFIX = '[VideoSR]';

  /** MutationObserver のデバウンス間隔 (ms) */
  const DEBOUNCE_MS = 400;
  /** 初期化遅延 (ms) — ページ読み込み安定待ち */
  const INIT_DELAY_MS = 1000;
  /** フルスクリーン・DOM 変更後の反映遅延 (ms) */
  const SETTLE_DELAY_MS = 100;

  /** @type {HTMLVideoElement|null} 現在オーバーレイが適用されている video 要素 */
  let _currentVideo = null;
  /** @type {HTMLDivElement|null} オーバーレイ要素（1 つだけ） */
  let _overlay = null;
  /** @type {MutationObserver|null} */
  let _observer = null;
  /** @type {ResizeObserver|null} */
  let _resizeObserver = null;
  /** 前回検出した video 数 */
  let _lastVideoCount = -1;
  /** @type {HTMLVideoElement|null} 前回の最大 video 要素 */
  let _lastLargestVideo = null;
  /** @type {number|null} デバウンスタイマー */
  let _debounceTimer = null;
  /** rAF スロットル用 ID */
  let _rafId = 0;
  /** video に登録したリスナーの参照（解除用） */
  let _videoListeners = null;
  /** scroll/resize 等のフルリスナーが有効か */
  let _fullListenersActive = false;

  /* ── video 検出・オーバーレイ管理 ────────────────── */

  /**
   * ページ上の video 要素を走査し、最大サイズの video にオーバーレイを配置する
   */
  function processVideos() {
    const videos = document.querySelectorAll('video');

    // video 数が変化した場合のみログ出力（0 → 0 はスキップ）
    if (videos.length !== _lastVideoCount) {
      if (videos.length > 0) {
        console.log(`${LOG_PREFIX} Found ${videos.length} video elements`);
      }
      _lastVideoCount = videos.length;
    }

    if (videos.length === 0) {
      if (_overlay) removeOverlay();
      _lastLargestVideo = null;
      _removeFullListeners();
      return;
    }

    // video 発見時にフルリスナーを遅延登録
    _addFullListeners();

    const largestVideo = _findLargestVideo(videos);

    // 最大 video が変化した場合のみ処理
    if (largestVideo !== _lastLargestVideo) {
      if (largestVideo) {
        console.log(`${LOG_PREFIX} Largest video changed, updating overlay`);
        removeOverlay();
        _addOverlayToVideo(largestVideo);
        _lastLargestVideo = largestVideo;
      } else if (_overlay) {
        console.log(`${LOG_PREFIX} No valid video found, removing overlay`);
        removeOverlay();
        _lastLargestVideo = null;
      }
    } else if (largestVideo === _currentVideo) {
      // 同じ video 要素の場合は位置だけ更新
      _updateOverlayPosition();
    }
  }

  /**
   * 最もサイズの大きい video 要素を返す
   * @param {NodeListOf<HTMLVideoElement>} videos
   * @returns {HTMLVideoElement|null}
   */
  function _findLargestVideo(videos) {
    let largestVideo = null;
    let maxSize = 0;

    for (let i = 0; i < videos.length; i++) {
      try {
        const rect = videos[i].getBoundingClientRect();
        const size = rect.width * rect.height;
        if (size > 0 && size > maxSize) {
          maxSize = size;
          largestVideo = videos[i];
        }
      } catch (_) {
        // getBoundingClientRect が失敗する場合はスキップ
      }
    }

    return largestVideo;
  }

  /* ── オーバーレイ操作 ────────────────────────────── */

  /**
   * video 要素にオーバーレイを追加する
   * @param {HTMLVideoElement} video
   */
  function _addOverlayToVideo(video) {
    if (_currentVideo === video && _overlay) return;

    removeOverlay();

    _overlay = document.createElement('div');
    _overlay.style.cssText =
      'position:fixed;width:1px;height:1px;background:#000;' +
      'opacity:0.01;pointer-events:none;z-index:2147483647;top:0;left:0;margin:0;padding:0';
    _overlay.setAttribute('data-vsr-overlay', 'true');

    _insertOverlayAfterVideo(video);
    _currentVideo = video;
    _updateOverlayPosition();
    _setupVideoListeners(video);
  }

  /**
   * video 要素の直後にオーバーレイを挿入する
   * @param {HTMLVideoElement} video
   */
  function _insertOverlayAfterVideo(video) {
    try {
      const parent = video.parentNode;
      if (parent) {
        parent.insertBefore(_overlay, video.nextSibling);
      } else {
        document.body.appendChild(_overlay);
        console.warn(`${LOG_PREFIX} Video has no parent, appending to body`);
      }
    } catch (_) {
      document.body.appendChild(_overlay);
    }
  }

  /**
   * オーバーレイの位置を更新する
   * 常に position:fixed + ビューポート座標で配置し、
   * NVIDIA ドライバにフルスクリーンと同じレイヤ構成を認識させる。
   * position / zIndex は初期スタイルで設定済みのため top / left のみ更新。
   */
  function _updateOverlayPosition() {
    if (!_currentVideo || !_overlay) return;

    try {
      const rect = _currentVideo.getBoundingClientRect();
      _overlay.style.top = rect.top + 'px';
      _overlay.style.left = rect.left + 'px';
    } catch (_) {
      // 位置計算エラーは無視
    }
  }

  /**
   * scroll / resize 時に rAF でスロットルしてオーバーレイ位置を更新する
   */
  function _schedulePositionUpdate() {
    if (_rafId) return;
    _rafId = requestAnimationFrame(() => {
      _rafId = 0;
      _updateOverlayPosition();
    });
  }

  /**
   * オーバーレイの親が変わっていないか確認し、必要なら再挿入する
   */
  function _repositionOverlay() {
    if (!_currentVideo || !_overlay) return;
    try {
      const parent = _currentVideo.parentNode;
      if (parent && _overlay.parentNode !== parent) {
        _overlay.remove();
        _insertOverlayAfterVideo(_currentVideo);
      } else if (!parent) {
        removeOverlay();
        processVideos();
      }
    } catch (_) {
      // 無視
    }
  }

  /**
   * オーバーレイと関連リソースを破棄する
   */
  function removeOverlay() {
    if (_overlay) {
      _overlay.remove();
      _overlay = null;
    }
    if (_resizeObserver) {
      _resizeObserver.disconnect();
      _resizeObserver = null;
    }
    _removeVideoListeners();
    _currentVideo = null;
  }

  /* ── Observer 設定 ───────────────────────────────── */

  /**
   * video 要素を含むノードかどうか判定する
   * @param {Node} node
   * @returns {boolean}
   */
  function _isVideoRelatedNode(node) {
    if (node.nodeType !== Node.ELEMENT_NODE) return false;
    const el = /** @type {Element} */ (node);
    return el.tagName === 'VIDEO' || (el.getElementsByTagName && el.getElementsByTagName('video').length > 0);
  }

  /**
   * MutationObserver を開始する（デバウンス付き）
   * 自身のオーバーレイ挿入による DOM 変更は無視する。
   */
  function _startObserver() {
    if (_observer) {
      _observer.disconnect();
      _observer = null;
    }

    _observer = new MutationObserver((mutations) => {
      let hasRelevantChange = false;

      outer:
      for (let i = 0; i < mutations.length; i++) {
        const m = mutations[i];

        for (let j = 0; j < m.addedNodes.length; j++) {
          if (_isVideoRelatedNode(m.addedNodes[j])) {
            hasRelevantChange = true;
            break outer;
          }
        }
        for (let k = 0; k < m.removedNodes.length; k++) {
          if (_isVideoRelatedNode(m.removedNodes[k])) {
            hasRelevantChange = true;
            break outer;
          }
        }
      }

      if (!hasRelevantChange) return;

      // デバウンス — DOM が安定してから processVideos を実行
      if (_debounceTimer) clearTimeout(_debounceTimer);
      _debounceTimer = setTimeout(() => {
        _debounceTimer = null;
        processVideos();
      }, DEBOUNCE_MS);
    });

    if (!document.body) return;
    _observer.observe(document.body, { childList: true, subtree: true });
  }

  /**
   * video 要素のサイズ変更・メタデータ読み込みを監視する
   * @param {HTMLVideoElement} video
   */
  function _setupVideoListeners(video) {
    const updatePosition = () => {
      if (_currentVideo === video) {
        _repositionOverlay();
        _updateOverlayPosition();
      }
    };
    const reevaluateVideos = () => {
      setTimeout(() => {
        if (_currentVideo === video) processVideos();
      }, SETTLE_DELAY_MS);
    };

    video.addEventListener('loadedmetadata', updatePosition);
    video.addEventListener('resize', reevaluateVideos);

    // 解除用に参照を保存
    _videoListeners = { video, updatePosition, reevaluateVideos };

    if (_resizeObserver) _resizeObserver.disconnect();
    _resizeObserver = new ResizeObserver(() => {
      if (_currentVideo === video) reevaluateVideos();
    });
    _resizeObserver.observe(video);
  }

  /**
   * video 要素に登録したリスナーを解除する
   */
  function _removeVideoListeners() {
    if (!_videoListeners) return;
    const { video, updatePosition, reevaluateVideos } = _videoListeners;
    video.removeEventListener('loadedmetadata', updatePosition);
    video.removeEventListener('resize', reevaluateVideos);
    _videoListeners = null;
  }

  /* ── 全体クリーンアップ ──────────────────────────── */

  /**
   * 全リソースを破棄する
   */
  function destroy() {
    if (_observer) {
      _observer.disconnect();
      _observer = null;
    }
    if (_debounceTimer) {
      clearTimeout(_debounceTimer);
      _debounceTimer = null;
    }
    if (_rafId) {
      cancelAnimationFrame(_rafId);
      _rafId = 0;
    }
    removeOverlay();
    _lastVideoCount = -1;
    _lastLargestVideo = null;
  }

  /* ── 拡張機能 有効/無効 管理 ─────────────────────── */

  let _enabled = true;
  let _initialized = false;

  // イベントリスナー参照（解除用に名前付き関数化）
  function _onFullscreenChange() {
    setTimeout(() => {
      _repositionOverlay();
      _updateOverlayPosition();
    }, SETTLE_DELAY_MS);
  }
  function _onVisibilityChange() {
    _repositionOverlay();
    _updateOverlayPosition();
  }
  function _onWindowResize() {
    _repositionOverlay();
    processVideos();
  }

  /**
   * video 検出時にフルリスナー（scroll/resize/fullscreen 等）を登録する。
   * 全ページで動作するため、video がないページではこれらを登録しない。
   */
  function _addFullListeners() {
    if (_fullListenersActive) return;
    _fullListenersActive = true;
    document.addEventListener('fullscreenchange', _onFullscreenChange);
    document.addEventListener('visibilitychange', _onVisibilityChange);
    window.addEventListener('resize', _onWindowResize);
    window.addEventListener('scroll', _schedulePositionUpdate, true);
  }

  /** video が全て消えたときにフルリスナーを解除する */
  function _removeFullListeners() {
    if (!_fullListenersActive) return;
    _fullListenersActive = false;
    document.removeEventListener('fullscreenchange', _onFullscreenChange);
    document.removeEventListener('visibilitychange', _onVisibilityChange);
    window.removeEventListener('resize', _onWindowResize);
    window.removeEventListener('scroll', _schedulePositionUpdate, true);
  }

  function _start() {
    if (_initialized) return;
    _initialized = true;

    // MutationObserver + 初回チェックのみ（軽量）
    // video 発見時に processVideos 内でフルリスナーを遅延登録する
    _startObserver();
    window.addEventListener('beforeunload', destroy);
    setTimeout(processVideos, INIT_DELAY_MS);

    console.log(`${LOG_PREFIX} Initialized`);
  }

  function _stop() {
    _removeFullListeners();
    window.removeEventListener('beforeunload', destroy);

    destroy();
    _initialized = false;
    console.log(`${LOG_PREFIX} Disabled`);
  }

  /** 有効/無効を切り替える */
  function _setEnabled(newState) {
    if (newState === _enabled) return;
    _enabled = newState;
    if (_enabled) {
      _start();
    } else {
      _stop();
    }
  }

  /* ── Chrome メッセージング ───────────────────────── */

  // 拡張コンテキスト無効化時のエラーを安全に無視するヘルパー
  function _safeChromeCall(fn) {
    try { fn(); } catch (e) {
      if (!e?.message?.includes('Extension context invalidated')) {
        console.warn(`${LOG_PREFIX}`, e);
      }
    }
  }

  // 初期状態取得 → 有効なら開始
  _safeChromeCall(() => {
    chrome.storage.local.get(['enabled'], (result) => {
      _enabled = result.enabled !== false;
      if (_enabled) _start();
      else console.log(`${LOG_PREFIX} Extension is disabled`);
    });
  });

  // storage 変更を監視（SW からのトグル・他タブとの同期を一括処理）
  _safeChromeCall(() => {
    chrome.storage.onChanged.addListener((changes, namespace) => {
      if (namespace === 'local' && changes.enabled) {
        _setEnabled(changes.enabled.newValue);
      }
    });
  });
})();
