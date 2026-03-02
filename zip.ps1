# VideoSR Assist - パッケージ生成スクリプト (Windows PowerShell版)

# スクリプトのディレクトリをカレントディレクトリに設定
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptDir

# manifest.json からバージョンを取得
$manifest = Get-Content -Path "./manifest.json" -Raw -Encoding UTF8 | ConvertFrom-Json
$version = $manifest.version
Write-Host "VideoSR Assist v$version" -ForegroundColor Cyan
Write-Host ""

# バージョン同期: manifest.json から関連ファイルに反映
$filesToUpdate = @(
    "README.md",
    "webstore-screenshots/01-feature-overview.html",
    "webstore-screenshots/03-hero-promo.html",
    "webstore-screenshots/04-promo-small.html",
    "webstore-screenshots/05-promo-marquee.html"
)
foreach ($filePath in $filesToUpdate) {
    if (Test-Path $filePath) {
        $content = Get-Content -Path $filePath -Raw -Encoding UTF8
        $content = [regex]::Replace($content, 'v[0-9]+\.[0-9]+\.[0-9]+', "v$version")
        $content | Out-File -FilePath $filePath -Encoding UTF8 -NoNewline
    }
}
Write-Host "Version synced: v$version" -ForegroundColor Green
Write-Host ""

# 依存関係のインストール
Write-Host "📦 依存関係をインストール中..." -ForegroundColor Cyan
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ npm install に失敗しました" -ForegroundColor Red
    exit 1
}
Write-Host ""

# スクリーンショット生成
Write-Host "📸 スクリーンショットを生成中..." -ForegroundColor Cyan
node scripts/generate-screenshots.js
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ スクリーンショット生成に失敗しました" -ForegroundColor Red
    exit 1
}
Write-Host ""

# ZIP 生成
Write-Host "📦 ZIPファイルを作成中..." -ForegroundColor Cyan

# 古いZIPファイルを削除
if (Test-Path "videosr-assist.zip") {
    Remove-Item "videosr-assist.zip" -Force
}

# 一時ディレクトリを作成
$tempDir = "temp-build"
if (Test-Path $tempDir) {
    Remove-Item $tempDir -Recurse -Force
}
New-Item -ItemType Directory -Path $tempDir | Out-Null

# 必要なファイルをコピー
Copy-Item "manifest.json" -Destination $tempDir
Copy-Item "src" -Destination $tempDir -Recurse
Copy-Item "icons" -Destination $tempDir -Recurse
Copy-Item "_locales" -Destination $tempDir -Recurse
Copy-Item "LICENSE.md" -Destination $tempDir

# 不要なファイルを除外
Get-ChildItem -Path $tempDir -Recurse -Include "*.DS_Store", "*.swp", "*~" | Remove-Item -Force

# ZIPファイルを作成
Compress-Archive -Path "$tempDir/*" -DestinationPath "videosr-assist.zip" -Force

# 一時ディレクトリを削除
Remove-Item $tempDir -Recurse -Force

if (Test-Path "videosr-assist.zip") {
    $fileSize = (Get-Item "videosr-assist.zip").Length
    $fileSizeKB = [math]::Round($fileSize / 1KB, 2)
    Write-Host ""
    Write-Host "✅ videosr-assist.zip ($fileSizeKB KB)" -ForegroundColor Green
    Write-Host "   https://chrome.google.com/webstore/devconsole" -ForegroundColor Blue
} else {
    Write-Host "❌ ZIPファイルの作成に失敗しました" -ForegroundColor Red
    exit 1
}
