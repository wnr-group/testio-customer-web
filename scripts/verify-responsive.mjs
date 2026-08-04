// scripts/verify-responsive.mjs
// Evidence gate for the marketing-site mobile-optimization pass: no
// horizontal overflow at any mandated breakpoint, touch targets reach
// 48x48px below the sm breakpoint (640px) where each control's fix applies,
// body copy renders at >=16px on phones, and the HowItWorks scroll-pin only
// runs where its visual payload (the phone mockup) is shown (md and up,
// 768px). Selectors not present yet are reported as "pending" — later plan
// tasks add the matching data attribute in the same diff as their fix.
// Usage: node scripts/verify-responsive.mjs
import { chromium } from 'playwright'

const BASE = process.env.BASE_URL ?? 'http://localhost:3001'

// Union of every width named in the client's mobile-optimization brief.
const BREAKPOINTS = [320, 360, 375, 390, 414, 430, 768, 1024, 1280, 1440]

const TOUCH_TARGETS = [
  { name: 'hero-cta-primary', selector: '[data-touch-target="hero-cta-primary"]' },
  { name: 'hero-cta-secondary', selector: '[data-touch-target="hero-cta-secondary"]' },
  { name: 'nav-login', selector: '[data-touch-target="nav-login"]' },
  { name: 'nav-hamburger', selector: '[data-touch-target="nav-hamburger"]' },
  { name: 'nav-drawer-explore', selector: '[data-touch-target="nav-drawer-explore"]' },
  { name: 'nav-drawer-become-cook', selector: '[data-touch-target="nav-drawer-become-cook"]' },
  { name: 'nav-drawer-login', selector: '[data-touch-target="nav-drawer-login"]' },
  { name: 'kitchens-use-location', selector: '[data-touch-target="kitchens-use-location"]' },
  { name: 'kitchens-see-all', selector: '[data-touch-target="kitchens-see-all"]' },
  { name: 'location-search-input', selector: '[data-touch-target="location-search-input"]' },
  // Documented partial improvement, not the full 48px — see Task 7's rationale.
  { name: 'footer-link', selector: '[data-touch-target="footer-link"]', minSize: 36 },
]

const BODY_TEXT = [
  { name: 'hero-sub', selector: '[data-hero-sub]' },
  { name: 'packaging-benefits', selector: '[data-body-text="packaging-benefits"]' },
  { name: 'kitchens-sub', selector: '[data-body-text="kitchens-sub"]' },
  { name: 'becomecook-point', selector: '[data-body-text="becomecook-point"]' },
  { name: 'howitworks-step-body', selector: '[data-body-text="howitworks-step-body"]' },
]

async function checkOverflow(browser) {
  const fails = []
  for (const width of BREAKPOINTS) {
    const page = await browser.newPage({ viewport: { width, height: 900 } })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto(BASE, { waitUntil: 'networkidle' })
    const { scrollWidth, clientWidth } = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }))
    await page.close()
    if (scrollWidth > clientWidth + 1) {
      fails.push(`${width}px: horizontal overflow — scrollWidth ${scrollWidth}px > viewport ${clientWidth}px`)
    }
  }
  return fails
}

const PHONE_WIDTHS = BREAKPOINTS.filter((w) => w < 640)
const ALLOW_PENDING = process.argv.includes('--allow-pending')

async function checkTouchTargets(browser) {
  const results = []
  for (const width of PHONE_WIDTHS) {
    const page = await browser.newPage({ viewport: { width, height: 900 } })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto(BASE, { waitUntil: 'networkidle' })

    const trigger = page.locator('[data-touch-target="nav-hamburger"]')
    if ((await trigger.count()) > 0 && (await trigger.isVisible())) {
      await trigger.click()
      await page.waitForTimeout(250)
    }

    for (const target of TOUCH_TARGETS) {
      const el = page.locator(`${target.selector}:visible`).first()
      if ((await el.count()) === 0) {
        if (ALLOW_PENDING) {
          results.push({ ...target, width, status: 'pending' })
        } else {
          results.push({ ...target, width, status: 'fail', reason: 'selector not found' })
        }
        continue
      }
      const box = await el.boundingBox()
      const min = target.minSize ?? 48
      const pass = box && box.width >= min && box.height >= min
      results.push({ ...target, width, status: pass ? 'pass' : 'fail', box, min })
    }
    await page.close()
  }
  return results
}

async function checkBodyText(browser) {
  const results = []
  for (const width of PHONE_WIDTHS) {
    const page = await browser.newPage({ viewport: { width, height: 900 } })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto(BASE, { waitUntil: 'networkidle' })

    for (const target of BODY_TEXT) {
      const el = page.locator(`${target.selector}:visible`).first()
      if ((await el.count()) === 0) {
        if (ALLOW_PENDING) {
          results.push({ ...target, width, status: 'pending' })
        } else {
          results.push({ ...target, width, status: 'fail', reason: 'selector not found' })
        }
        continue
      }
      await el.scrollIntoViewIfNeeded()
      const fontSize = await el.evaluate((n) => parseFloat(getComputedStyle(n).fontSize))
      results.push({ ...target, width, status: fontSize >= 16 ? 'pass' : 'fail', fontSize })
    }
    await page.close()
  }
  return results
}

async function checkPinGating(browser) {
  const fails = []
  for (const width of [375, 768]) {
    const page = await browser.newPage({ viewport: { width, height: 900 } })
    await page.emulateMedia({ reducedMotion: 'no-preference' })
    await page.goto(BASE, { waitUntil: 'networkidle' })
    const el = page.locator('[data-howitworks-pin]')
    if ((await el.count()) === 0) {
      fails.push(`${width}px: [data-howitworks-pin] not found — pending HowItWorks task`)
      await page.close()
      continue
    }
    const pinned = await el.evaluate((node) => !!node.closest('.pin-spacer'))
    await page.close()
    if (width < 768 && pinned) {
      fails.push(`${width}px: HowItWorks is still scroll-pinned below md — mobile perf gate failed`)
    }
    if (width >= 768 && !pinned) {
      fails.push(`${width}px: HowItWorks lost its scroll-pin at md+ — desktop animation regressed`)
    }
  }
  return fails
}

const browser = await chromium.launch()
try {
  const overflowFails = await checkOverflow(browser)
  const touchResults = await checkTouchTargets(browser)
  const bodyResults = await checkBodyText(browser)
  const pinFails = await checkPinGating(browser)

  const fmtTouch = (r) =>
    `${r.name}@${r.width}px@${r.status}${r.box ? ` (${Math.round(r.box.width)}x${Math.round(r.box.height)}, needs ${r.min})` : r.reason ? ` (${r.reason})` : ''}`
  const fmtBody = (r) =>
    `${r.name}@${r.width}px@${r.status}${r.fontSize ? ` (${r.fontSize}px)` : r.reason ? ` (${r.reason})` : ''}`

  console.log('OVERFLOW', overflowFails.length ? overflowFails : 'PASS (no horizontal scroll at any of the 10 breakpoints)')
  console.log('TOUCH TARGETS', touchResults.map(fmtTouch))
  console.log('BODY TEXT >= 16px', bodyResults.map(fmtBody))
  console.log('PIN GATING', pinFails.length ? pinFails : 'PASS')

  const pending = [...touchResults, ...bodyResults].filter((r) => r.status === 'pending')
  if (pending.length) {
    console.log(`\n${pending.length} check(s) pending implementation:`, pending.map((r) => r.name))
  }

  const fails = [
    ...overflowFails,
    ...touchResults
      .filter((r) => r.status === 'fail')
      .map((r) =>
        r.box
          ? `${r.width}px ${r.name}: ${Math.round(r.box.width)}x${Math.round(r.box.height)}px < ${r.min}x${r.min}px`
          : `${r.width}px ${r.name}: ${r.reason ?? 'failed'}`
      ),
    ...bodyResults
      .filter((r) => r.status === 'fail')
      .map((r) =>
        r.fontSize
          ? `${r.width}px ${r.name}: ${r.fontSize}px < 16px`
          : `${r.width}px ${r.name}: ${r.reason ?? 'failed'}`
      ),
    ...pinFails,
  ]
  if (fails.length) {
    console.error('\nGATE FAILED:')
    for (const f of fails) console.error(' -', f)
    process.exitCode = 1
  } else {
    console.log('\nGATE PASSED')
  }
} finally {
  await browser.close()
}
