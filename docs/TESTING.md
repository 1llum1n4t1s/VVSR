# Testing Instructions — VideoSR Assist

## Prerequisites

### Hardware

- NVIDIA RTX GPU (RTX 20/30/40 series)
- Windows 10/11
- Chrome (latest)

### Setup

1. **NVIDIA ドライバー更新** — https://www.nvidia.com/drivers/ (v526.98+)
2. **RTX Video Super Resolution 有効化** — NVIDIA コントロールパネル → 3D 設定の管理 → RTX Video Super Resolution → On
3. **Chrome ハードウェアアクセラレーション** — `chrome://settings/` → システム → 有効化 → Chrome 再起動

## Test Procedure

### 1. Install

- `chrome://extensions` → デベロッパーモード → 「パッケージ化されていない拡張機能を読み込む」→ リポジトリディレクトリ選択
- ツールバーに拡張機能アイコンが表示されることを確認

### 2. Basic Functionality

1. 対応ストリーミングサービスにアクセス（Netflix, Hulu, Twitch 等）
2. 動画を再生
3. **期待結果**: 1x1 ピクセルのオーバーレイ要素が追加され、RTX VSR がトリガーされる

### 3. Toggle

1. ツールバーの拡張機能アイコンをクリック
2. 無効時: "OFF" バッジ表示 → オーバーレイなし
3. 再度クリックで有効化 → バッジ消失

### 4. Multi-Service

以下のサービスで動作確認:

- Netflix (https://netflix.com)
- Amazon Prime Video (https://primevideo.com)
- Hulu (https://hulu.com)
- Twitch (https://twitch.tv)

## Alternative Testing (RTX 非搭載環境)

RTX ハードウェアがない場合でも、拡張機能の動作を検証できます。

### DevTools による検証

1. F12 で DevTools を開く
2. Console タブで以下のログを確認:
   ```
   [VideoSR] Found X video elements
   [VideoSR] Largest video changed, updating overlay
   [VideoSR] Initialized successfully
   ```
3. Elements タブで `[data-vsr-overlay="true"]` 属性を持つ `div` 要素を確認

### Code Review

| File | Check |
|---|---|
| `manifest.json` | 権限が activeTab, storage, ストリーミングドメインのみ |
| `src/content.js` | オーバーレイ追加と動画状態監視のみ |
| `src/service_worker.js` | 外部通信・データ収集なし |

## Expected Behavior

### Active

- オーバーレイ要素が動画プレーヤーに追加される
- Console に `[VideoSR]` プレフィクスのログ出力
- アイコンバッジなし
- RTX VSR による動画品質向上（対応ハードウェアのみ）

### Disabled

- オーバーレイなし
- "OFF" バッジ表示
- `[VideoSR]` ログなし

## Troubleshooting

| Symptom | Fix |
|---|---|
| 効果が見えない | Chrome のハードウェアアクセラレーションを確認 |
| オーバーレイが追加されない | ページリロード後に再確認 |
| Console にログがない | 拡張機能が有効か確認（アイコンバッジ） |

## Contact

GitHub: https://github.com/1llum1n4t1s/VVSR
