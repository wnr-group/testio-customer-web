// Captures the screenshot evidence the plan's visual gates depend on.
// Usage: node scripts/visual-capture.mjs <outDir> [engine]
//   engine: chromium | chrome | msedge | firefox | webkit  (default: all installed)
import { chromium, firefox, webkit } from 'playwright'
import { mkdir } from 'node:fs/promises'

const BASE = process.env.BASE_URL ?? 'http://localhost:3001'
const outDir = process.argv[2] ?? 'artifacts/visual/current'
const only = process.argv[3]

const VIEWPORTS = [
  { name: '320', width: 320, height: 720 },
  { name: '360', width: 360, height: 780 },
  { name: '375', width: 375, height: 812 },
  { name: '390', width: 390, height: 844 },
  { name: '414', width: 414, height: 896 },
  { name: '430', width: 430, height: 932 },
  { name: '768', width: 768, height: 1024 },
  { name: '1024', width: 1024, height: 768 },
  { name: '1280', width: 1280, height: 800 },
  { name: '1440', width: 1440, height: 900 },
  { name: '1728', width: 1728, height: 1080 },
  { name: '1920', width: 1920, height: 1080 },
]

const SECTIONS = [
  { name: 'hero', selector: '[data-hero-section]' },
  { name: 'packaging', selector: '#packaging' },
  { name: 'ambassador', selector: '[data-ambassador-section]' },
]

const ENGINES = {
  chromium: { launcher: chromium, options: {} },
  chrome: { launcher: chromium, options: { channel: 'chrome' } },
  msedge: { launcher: chromium, options: { channel: 'msedge' } },
  firefox: { launcher: firefox, options: {} },
  webkit: { launcher: webkit, options: {} },
}

for (const [name, { launcher, options }] of Object.entries(ENGINES)) {
  if (only && only !== name) continue
  let browser
  try {
    browser = await launcher.launch(options)
  } catch (err) {
    console.warn(`skip ${name}: ${err.message.split('\n')[0]}`)
    if (only) process.exit(1)
    continue
  }
  const dir = `${outDir}/${name}`
  await mkdir(dir, { recursive: true })

  for (const vp of VIEWPORTS) {
    const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } })
    // Freeze motion so screenshots are deterministic and show final state.
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto(BASE, { waitUntil: 'networkidle' })

    // Above-the-fold: exactly what a visitor sees before scrolling.
    await page.screenshot({ path: `${dir}/fold-${vp.name}.png` })
    await page.screenshot({ path: `${dir}/full-${vp.name}.png`, fullPage: true })

    for (const s of SECTIONS) {
      const el = page.locator(s.selector).first()
      if ((await el.count()) === 0) continue
      await el.scrollIntoViewIfNeeded()
      await page.waitForTimeout(250)
      await el.screenshot({ path: `${dir}/${s.name}-${vp.name}.png` })
    }
    await page.close()
  }
  await browser.close()
  console.log(`captured: ${name} -> ${dir}`)
}
