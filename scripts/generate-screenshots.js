// Chrome Web Store 用スクリーンショット画像の自動生成スクリプト（多言語対応）
// 依存: npx puppeteer（グローバルインストール不要）
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = './webstore-images';
const LANGUAGES = ['ja', 'en'];

const IMAGE_CONFIGS = [
  // スクリーンショット: 1280x800
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
  // プロモーションタイル（小）: 440x280
  {
    input: 'webstore-screenshots/04-promo-small.html',
    output: 'promo-small-440x280.png',
    width: 440,
    height: 280
  },
  // マーキープロモーションタイル: 1400x560
  {
    input: 'webstore-screenshots/05-promo-marquee.html',
    output: 'promo-marquee-1400x560.png',
    width: 1400,
    height: 560
  }
];

async function generateScreenshot(browser, htmlPath, outputPath, width, height, lang) {
  const page = await browser.newPage();
  try {
    await page.setViewport({ width, height, deviceScaleFactor: 1 });

    const absolutePath = path.resolve(htmlPath);
    await page.goto(`file://${absolutePath}?lang=${lang}`, {
      waitUntil: 'networkidle0',
      timeout: 30000
    });

    // フォント読み込み・レンダリング・i18nスクリプト完了待ち
    await new Promise(r => setTimeout(r, 2000));

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
  console.log('Screenshot generation (multilingual)...\n');

  // 言語別ディレクトリ作成
  for (const lang of LANGUAGES) {
    const langDir = path.join(OUTPUT_DIR, lang);
    if (!fs.existsSync(langDir)) {
      fs.mkdirSync(langDir, { recursive: true });
    }
  }

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    // 全言語×全画像を並列生成
    const tasks = LANGUAGES.flatMap(lang =>
      IMAGE_CONFIGS.map(config => {
        if (!fs.existsSync(config.input)) {
          console.error(`  NG: ${config.input} not found`);
          return Promise.resolve();
        }
        const outputPath = path.join(OUTPUT_DIR, lang, config.output);
        return generateScreenshot(
          browser, config.input, outputPath,
          config.width, config.height, lang
        );
      })
    );
    await Promise.all(tasks);
  } finally {
    await browser.close();
  }

  console.log('\nDone.\n');
  for (const lang of LANGUAGES) {
    const langDir = path.join(OUTPUT_DIR, lang);
    const files = fs.readdirSync(langDir).filter(f => f.endsWith('.png'));
    console.log(`  [${lang}]`);
    files.forEach(file => {
      const size = (fs.statSync(path.join(langDir, file)).size / 1024).toFixed(1);
      console.log(`    ${file} (${size} KB)`);
    });
  }
}

main().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});
