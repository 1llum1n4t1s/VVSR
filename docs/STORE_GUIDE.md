# Chrome Web Store 申請ガイド — VideoSR Assist

## 1. パッケージ作成

```bash
# Windows
.\zip.ps1

# Linux / macOS
./zip.sh
```

出力物:
- `VideoSR-Assist-v*.zip` — アップロード用 ZIP
- `webstore-images/ja/*.png` — 日本語スクリーンショット
- `webstore-images/en/*.png` — 英語スクリーンショット

---

## 2. Developer Console での入力

[Developer Dashboard](https://chrome.google.com/webstore/devconsole/) → "Add new item" → ZIP アップロード後、以下を入力。

### ストア掲載情報の言語タブ

`_locales/ja/` と `_locales/en/` があるため、**2つの言語タブ**が表示される:

| タブ | 入力内容 |
|------|----------|
| **日本語（デフォルト）** | 日本語の詳細説明 + `webstore-images/ja/` のスクリーンショット |
| **English** | 英語の詳細説明 + `webstore-images/en/` のスクリーンショット |

> 拡張機能名・短い説明文は `_locales/*/messages.json` から自動取得されるため入力不要。

---

## 3. 日本語タブの入力内容

### 詳細な説明（コピペ用）

```
VideoSRアシストは、動画ストリーミングプラットフォームで高品位なアップスケーリングを実現します。特に高解像度ディスプレイにおいて標準的なアップスケールでは品質が十分でない場合に、NVIDIA RTX Video Super ResolutionのAI駆動技術により優れた動画品質を維持できます。

■主な機能
・すべてのHTTPSサイトで動画プレーヤーを自動検出
・最小限のパフォーマンス影響で軽量動作
・拡張機能アイコンでの簡単なON/OFF切り替え
・設定不要で即利用可能
・環境によってはフルスクリーン未使用時でもVSRが効くようになります
・データ収集や追跡なし

■必要環境
・NVIDIA RTXグラフィックスカード（RTXシリーズ）
・最新のNVIDIAドライバー（RTX Video Super Resolution有効）
・Microsoft Windows 10/11
・Google Chrome（ハードウェアアクセラレーション有効）

■プライバシー
完全にローカルで動作し、データ収集、外部通信、ユーザー追跡は一切行いません。

■免責事項
この拡張機能はNVIDIA Corporationとは提携していません。NVIDIA、GeForce、RTXはNVIDIA Corporationの商標です。
```

### スクリーンショット

`webstore-images/ja/` から以下をアップロード:

| ファイル | 用途 |
|----------|------|
| `01-feature-overview-1280x800.png` | スクリーンショット 1 |
| `02-how-it-works-1280x800.png` | スクリーンショット 2 |
| `03-hero-promo-1280x800.png` | スクリーンショット 3 |

---

## 4. English タブの入力内容

### Detailed Description（コピペ用）

```
VideoSR Assist enables high-quality upscaling on video streaming platforms. When standard upscaling falls short on high-resolution displays, NVIDIA RTX Video Super Resolution's AI-driven technology delivers superior video quality.

■ Key Features
・Automatically detects video players on all HTTPS sites
・Lightweight with minimal performance impact
・Easy ON/OFF toggle via the extension icon
・Zero configuration required
・May enable VSR even in windowed mode depending on your environment
・No data collection or tracking

■ Requirements
・NVIDIA RTX graphics card (RTX series)
・Latest NVIDIA driver (RTX Video Super Resolution enabled)
・Microsoft Windows 10/11
・Google Chrome (hardware acceleration enabled)

■ Privacy
Operates entirely locally with no data collection, external communication, or user tracking.

■ Disclaimer
This extension is not affiliated with NVIDIA Corporation. NVIDIA, GeForce, and RTX are trademarks of NVIDIA Corporation.
```

### Screenshots

`webstore-images/en/` から以下をアップロード:

| File | Purpose |
|------|---------|
| `01-feature-overview-1280x800.png` | Screenshot 1 |
| `02-how-it-works-1280x800.png` | Screenshot 2 |
| `03-hero-promo-1280x800.png` | Screenshot 3 |

---

## 5. プロモーション画像（言語共通）

どちらか一方の言語フォルダからアップロード（プロモ画像は言語タブに依存しない）:

| ファイル | サイズ | 用途 |
|----------|--------|------|
| `promo-small-440x280.png` | 440x280 | 検索結果・カテゴリページ |
| `promo-marquee-1400x560.png` | 1400x560 | ホームページ掲載時（任意） |

---

## 6. その他の設定項目

### カテゴリ・価格

| 項目 | 値 |
|------|-----|
| カテゴリ | Productivity |
| 価格 | 無料 |
| 公開地域 | すべての地域 |

### 単一目的の説明（Single Purpose Description）

```
This extension enables NVIDIA RTX Video Super Resolution on video streaming sites by adding a minimal overlay element to video players, allowing the GPU to apply AI-powered upscaling for improved video quality.
```

### 権限の正当性（Permission Justifications）

| 権限 | 説明 |
|------|------|
| Content scripts (`https://*/*`) | Detect `<video>` elements and add 1x1 overlay to trigger RTX VSR |
| Storage | Save the user's enable/disable preference locally |

### プライバシーポリシー

`docs/PRIVACY_POLICY.md` の内容を掲載、または GitHub Pages 等で公開した URL を入力。

---

## 7. レビュー

| フェーズ | 所要時間 |
|----------|----------|
| 自動レビュー | 数分 |
| 手動レビュー（新規開発者） | 1〜7 日 |

### よくあるリジェクト理由

| 理由 | 対策 |
|------|------|
| "can read and change your data" 警告 | `https://*/*` のコンテンツスクリプトのため。想定通り |
| 商標懸念 ("RTX") | 免責事項で NVIDIA 非提携を明記済み |
| レビュアーが機能検証できない | `docs/TESTING.md` のテスト手順を提出 |
| プライバシーポリシー不備 | `docs/PRIVACY_POLICY.md` を公開 URL で提供 |

---

## 8. 更新時

1. `manifest.json` の `version` を更新
2. `zip.ps1` / `zip.sh` で再パッケージ（バージョン同期 + スクリーンショット再生成）
3. Developer Dashboard → 該当アイテム → "Package" タブ → 新 ZIP アップロード
