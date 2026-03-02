#!/bin/bash

# VideoSR Assist - パッケージ生成スクリプト

cd "$(dirname "$0")" || exit 1

# manifest.json からバージョンを取得
VERSION=$(grep '"version"' manifest.json | head -1 | sed 's/.*"version": "\([^"]*\)".*/\1/')
echo "VideoSR Assist v$VERSION"
echo ""

# バージョン同期: manifest.json から関連ファイルに反映
FILES_TO_UPDATE=("README.md" "webstore-screenshots/01-feature-overview.html" "webstore-screenshots/03-hero-promo.html" "webstore-screenshots/04-promo-small.html" "webstore-screenshots/05-promo-marquee.html")
for file in "${FILES_TO_UPDATE[@]}"; do
    if [ -f "$file" ]; then
        if [[ "$OSTYPE" == "darwin"* ]]; then
            sed -i '' "s/v[0-9]\+\.[0-9]\+\.[0-9]\+/v$VERSION/g" "$file"
        else
            sed -i "s/v[0-9]\+\.[0-9]\+\.[0-9]\+/v$VERSION/g" "$file"
        fi
    fi
done
echo "Version synced: v$VERSION"
echo ""

# 依存関係のインストール
echo "📦 依存関係をインストール中..."
npm install
if [ $? -ne 0 ]; then
    echo "❌ npm install に失敗しました"
    exit 1
fi
echo ""

# スクリーンショット生成
echo "📸 スクリーンショットを生成中..."
node scripts/generate-screenshots.js
if [ $? -ne 0 ]; then
    echo "❌ スクリーンショット生成に失敗しました"
    exit 1
fi
echo ""

# ZIP 生成
echo "📦 ZIPファイルを作成中..."

if ! command -v zip &> /dev/null; then
    echo "❌ zip をインストールしてください"
    echo "   Linux: sudo apt install zip"
    echo "   macOS: brew install zip"
    exit 1
fi

rm -f ./videosr-assist.zip

zip -r ./videosr-assist.zip \
    manifest.json \
    src/ \
    icons/ \
    _locales/ \
    LICENSE.md \
    -x "*.DS_Store" "*.swp" "*~"

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ videosr-assist.zip"
    ls -lh ./videosr-assist.zip
    echo "   https://chrome.google.com/webstore/devconsole"
else
    echo "❌ ZIPファイルの作成に失敗しました"
    exit 1
fi
