# VideoSRアシスト

動画ストリーミングサービスで NVIDIA RTX Video Super Resolution を有効化する Chrome 拡張機能

## 機能

- すべての HTTPS サイトで動画再生を自動検出・強化（サイト制限なし）
- 拡張機能アイコンのクリックで ON/OFF 切り替え

## 必要環境

- NVIDIA RTX グラフィックスカード（RTX 20/30/40 シリーズ）
- RTX Video Super Resolution 対応の最新 NVIDIA ドライバー
- Chrome または Chromium ベースのブラウザ
- Windows 10/11

## インストール

### Chrome ウェブストアから

https://chromewebstore.google.com/detail/odgkllkpohmcplibemdjhgblambiphhc

### 手動インストール

1. このリポジトリをクローンまたはダウンロード
2. Chrome で `chrome://extensions/` を開く
3. 「デベロッパーモード」を有効化
4. 「パッケージ化されていない拡張機能を読み込む」→ リポジトリのディレクトリを選択

## 動作原理

動画プレーヤーに小さなオーバーレイ要素を追加し、NVIDIA の RTX Video Super Resolution をトリガーします。

## ライセンス

MIT License — [LICENSE.md](LICENSE.md)

## サポート

問題や機能リクエストは [GitHub リポジトリ](https://github.com/1llum1n4t1s/VVSR) へお願いします。
