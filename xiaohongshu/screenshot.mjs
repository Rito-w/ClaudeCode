import puppeteer from 'puppeteer-core';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const files = [
  'cover.html',
  'p1-buddy.html',
  'p2-kairos.html',
  'p3-ultraplan.html',
  'p4-coordinator.html',
  'p5-commands.html',
  'p6-bridge.html',
  'p7-flags.html',
];

async function main() {
  const browser = await puppeteer.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true,
    args: ['--no-sandbox'],
  });

  for (const file of files) {
    const page = await browser.newPage();
    await page.setViewport({ width: 1080, height: 1440, deviceScaleFactor: 2 });
    const filePath = path.join(__dirname, file);
    await page.goto(`file://${filePath}`, { waitUntil: 'networkidle0', timeout: 15000 });
    await new Promise(r => setTimeout(r, 1000));
    const outName = file.replace('.html', '.png');
    await page.screenshot({
      path: path.join(__dirname, outName),
      type: 'png',
    });
    console.log(`Done: ${outName}`);
    await page.close();
  }

  await browser.close();
  console.log('All done!');
}

main().catch(e => { console.error(e); process.exit(1); });
