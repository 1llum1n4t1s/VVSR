// Chrome Web Store用のスクリーンショット画像を自動生成するスクリプト
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// 出力ディレクトリのパス
const OUTPUT_DIR = './webstore-images';

// 生成する画像の各設定項目（入力パス、出力名、サイズ）
const IMAGE_CONFIGS = [
  // スクリーンショット：1280x800
  {
    input: 'webstore-screenshots/01-feature-overview.html',
    output: '01-feature-overview-1280x800.png',
    width: 1280,
    height: 800
  },
  {
    input: 'webstore-screenshots/02-how-it-works.html',
    output: '02-how-it-works-1280x800.png',
    width: 1280,
    height: 800
  },
  {
    input: 'webstore-screenshots/03-hero-promo.html',
    output: '03-hero-promo-1280x800.png',
    width: 1280,
    height: 800
  },
  // プロモーション タイル（小）：440x280
  {
    input: 'webstore-screenshots/04-promo-small.html',
    output: 'promo-small-440x280.png',
    width: 440,
    height: 280
  },
  // マーキー プロモーション タイル：1400x560
  {
    input: 'webstore-screenshots/05-promo-marquee.html',
    output: 'promo-marquee-1400x560.png',
    width: 1400,
    height: 560
  }
];

/**
 * 共有ブラウザインスタンスを使用してHTMLファイルから画像を生成
 */
async function generateScreenshot(browser, htmlPath, outputPath, width, height) {
  const page = await browser.newPage();

  try {
    await page.setViewport({ width, height, deviceScaleFactor: 1 });

    const absolutePath = path.resolve(htmlPath);
    await page.goto(`file://${absolutePath}`, {
      waitUntil: 'networkidle0',
      timeout: 30000
    });

    // フォントの読み込みやレンダリングの完了を待機
    await new Promise(resolve => setTimeout(resolve, 2000));

    await page.screenshot({
      path: outputPath,
      type: 'png',
      omitBackground: false,
      clip: { x: 0, y: 0, width, height }
    });

    console.log(`  OK: ${outputPath} (${width}x${height})`);
  } catch (error) {
    console.error(`  NG: ${htmlPath} -> ${error.message}`);
  } finally {
    await page.close();
  }
}

async function main() {
  console.log('Screenshot generation...\n');

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    await Promise.all(IMAGE_CONFIGS.map(config => {
      if (!fs.existsSync(config.input)) {
        console.error(`  NG: ${config.input} not found`);
        return Promise.resolve();
      }
      const outputPath = path.join(OUTPUT_DIR, config.output);
      return generateScreenshot(browser, config.input, outputPath, config.width, config.height);
    }));
  } finally {
    await browser.close();
  }

  console.log('\nDone.\n');
  const files = fs.readdirSync(OUTPUT_DIR).filter(f => f.endsWith('.png'));
  files.forEach(file => {
    const size = (fs.statSync(path.join(OUTPUT_DIR, file)).size / 1024).toFixed(1);
    console.log(`  ${file} (${size} KB)`);
  });
}

main().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});
