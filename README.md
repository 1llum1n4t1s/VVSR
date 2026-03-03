# VideoSRアシスト

NVIDIA RTX Video Super Resolution を任意の HTTPS サイトで自動的に有効化する Chrome 拡張機能（Manifest V3）

## 特徴

- **全サイト対応** — すべての HTTPS サイトで `<video>` を自動検出、サイト個別の設定不要
- **ワンクリック ON/OFF** — 拡張機能アイコンをクリックするだけで切り替え
- **軽量設計** — 動画のないページでは MutationObserver のみ動作、リスナー登録なし
- **プライバシー重視** — データ収集・外部通信・ユーザー追跡なし、完全ローカル動作

## 仕組み

ページ上で最も大きい `<video>` 要素を検出し、その位置に 1×1px のオーバーレイを `position: fixed` で配置します。このオーバーレイが NVIDIA ドライバの RTX Video Super Resolution をトリガーし、AI 超解像でストリーミング映像をアップスケールします。

## 必要環境

| 項目 | 要件 |
|------|------|
| GPU | NVIDIA RTX シリーズ（RTX 20/30/40/50） |
| ドライバー | RTX Video Super Resolution 対応の最新版 |
| OS | Windows 10 / 11 |
| ブラウザ | Chrome または Chromium 系（ハードウェアアクセラレーション有効） |

## インストール

### Chrome ウェブストア

[VideoSRアシスト](https://chromewebstore.google.com/detail/odgkllkpohmcplibemdjhgblambiphhc)

### 手動インストール

1. このリポジトリをクローン
2. Chrome で `chrome://extensions/` を開く
3. 「デベロッパーモード」を有効化
4. 「パッケージ化されていない拡張機能を読み込む」→ リポジトリのルートを選択

## 使い方

1. インストール後、拡張機能は自動で有効（バッジ表示なし）
2. 動画のあるサイトを開くと自動的に VSR が適用される
3. 無効にしたい場合はアイコンをクリック（バッジに `OFF` 表示）
4. 再度クリックで有効に戻る

## 開発

```bash
# パッケージ作成（ZIP + ストア用スクリーンショット）
.\zip.ps1          # Windows
./zip.sh           # Linux / macOS
```

ビルドツールやバンドラーは不要。Vanilla JS で直接動作します。

## ライセンス

MIT License — [LICENSE.md](LICENSE.md)

## 免責事項

この拡張機能は NVIDIA Corporation とは提携していません。NVIDIA、GeForce、RTX は NVIDIA Corporation の商標です。
