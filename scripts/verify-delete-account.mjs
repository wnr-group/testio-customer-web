// scripts/verify-delete-account.mjs
// Evidence gate for the public /delete-account page. Groups: Functional,
// Responsive, Accessibility, Regression. Writes console/network reports (and,
// with SCREENSHOTS=1, screenshots) to artifacts/account-deletion/.
// Usage: node scripts/verify-delete-account.mjs   (BASE_URL defaults to http://localhost:3001)
import { chromium } from 'playwright'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const BASE = (process.env.BASE_URL ?? 'http://localhost:3001').replace(/\/$/, '')
const PATH = '/delete-account'
const OUT = join(process.cwd(), 'artifacts', 'account-deletion')
mkdirSync(OUT, { recursive: true })

const TITLE = 'Account Deletion | Testio Hospitality Services'
const CANONICAL = 'https://www.testiofood.com/delete-account'
const EMAIL = 'testio24x7india@gmail.com'
const SUBJECT = 'Testio Customer – Account Deletion Request'
const H1 = 'Testio Customer – Account Deletion Request'
const H2S = [
  'Your Privacy Matters to Us',
  'How to Request Account Deletion',
  'What Information Will Be Deleted?',
  'Data Retention',
  'Contact Us',
]
const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'mobile', width: 390, height: 844 },
  { name: 'small-mobile', width: 360, height: 800 },
]
const FORBIDDEN = ['[your', 'TODO', 'lorem', '30 days', 'credentials']

const groups = { Functional: [0, 0], Responsive: [0, 0], Accessibility: [0, 0], Regression: [0, 0] }
let current = 'Functional'
let failures = 0
function report(name, ok, detail = '') {
  groups[current][ok ? 0 : 1]++
  if (!ok) failures++
  console.log(`${ok ? 'PASS' : 'FAIL'}  [${current}] ${name}${!ok && detail ? ` — ${detail}` : ''}`)
}
const normalize = (s) => s.replace(/\s+/g, ' ').trim()

const consoleLog = []
const networkLog = []
function attach(page, label) {
  page.on('console', (m) => {
    if (m.type() === 'error' || m.type() === 'warning') consoleLog.push({ label, type: m.type(), text: m.text() })
  })
  page.on('pageerror', (e) => consoleLog.push({ label, type: 'pageerror', text: String(e) }))
  page.on('requestfailed', (r) => networkLog.push({ label, kind: 'failed', url: r.url(), error: r.failure()?.errorText }))
  page.on('response', (r) => {
    if (r.status() >= 400) networkLog.push({ label, kind: 'http', url: r.url(), status: r.status() })
  })
}

async function functional(browser) {
  current = 'Functional'
  const res = await fetch(BASE + PATH, { redirect: 'manual' })
  report('raw GET /delete-account returns 200', res.status === 200, `status ${res.status}`)
  report('raw GET has no redirect to /login', !(res.status >= 300 && res.status < 400) && !(res.headers.get('location') ?? '').includes('/login'))
  const html = await res.text()
  const rawText = normalize(html.replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&#x27;|&#39;/g, "'").replace(/&quot;|&ldquo;|&rdquo;/g, '"'))
  report('server HTML contains page content (no JS)', rawText.includes('What Information Will Be Deleted?') && rawText.includes(EMAIL))

  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
  attach(page, 'functional')
  const response = await page.goto(BASE + PATH, { waitUntil: 'networkidle' })
  report('browser status 200', response?.status() === 200, `status ${response?.status()}`)
  report('final URL is /delete-account (no redirect to /login)', new URL(page.url()).pathname === PATH, page.url())
  report('title exact', (await page.title()) === TITLE, `got "${await page.title()}"`)
  const canonical = await page.locator('link[rel="canonical"]').getAttribute('href')
  report('canonical link', canonical === CANONICAL, `got ${canonical}`)
  const robots = (await page.locator('meta[name="robots"]').evaluateAll((els) => els.map((e) => e.getAttribute('content') ?? ''))).join(',').toLowerCase()
  report('no noindex robots meta', !robots.includes('noindex'), `robots "${robots}"`)
  report('html lang is set', ((await page.locator('html').getAttribute('lang')) ?? '').length > 0)

  report('exactly one h1', (await page.locator('h1').count()) === 1)
  report('h1 text exact', normalize(await page.locator('h1').innerText()) === H1)
  const h2 = (await page.locator('h2').allTextContents()).map(normalize)
  report('h2 headings exact and in order', JSON.stringify(h2) === JSON.stringify(H2S), `got ${JSON.stringify(h2)}`)

  const main = page.locator('main')
  const body = normalize(await main.innerText())
  report('all 3 numbered steps present', await page.locator('main ol > li').count() === 3)
  report('step 1 shows email and subject', body.includes(`${EMAIL} with the subject “${SUBJECT}”`))
  report('step 2 mentions mobile number or email', /registered mobile number or email/i.test(body))
  report('step 3 mentions verifying identity', /verify your identity/i.test(body))
  report('states request is by email / not instant', /not instant/i.test(body))
  report('warns never to send password, OTP or payment details', /never send your password, OTP or payment details/i.test(body))
  report('deletion list has exactly 5 items', (await page.locator('main section:has(h2:text-is("What Information Will Be Deleted?")) li').count()) === 5)
  report('Data Retention section mentions orders, payments and refunds', /orders, payments and refunds/.test(body))
  report('contact details present', body.includes('Application: Testio Customer') && body.includes('Business: TESTIO HOSPITALITY SERVICES') && body.includes('https://www.testiofood.com'))
  report('email displayed', body.includes(EMAIL))

  const cta = page.locator('main a[href^="mailto:"]', { hasText: 'Email us to request deletion' })
  report('prominent mailto button present', (await cta.count()) === 1)
  const href = await cta.getAttribute('href')
  const u = new URL(href)
  report('mailto recipient exact', u.protocol === 'mailto:' && decodeURIComponent(u.pathname) === EMAIL, `got ${u.pathname}`)
  report('mailto subject decodes exactly', u.searchParams.get('subject') === SUBJECT, `got ${u.searchParams.get('subject')}`)
  const mbody = u.searchParams.get('body') ?? ''
  report('mailto body non-empty, asks for mobile/email', mbody.length > 0 && /mobile number/i.test(mbody) && /email/i.test(mbody))
  report('mailto body does not request password/OTP', !/password|otp/i.test(mbody))

  const content = await page.content()
  for (const bad of FORBIDDEN) report(`no "${bad}" string`, !content.toLowerCase().includes(bad.toLowerCase()))
  report('no "Swiggy"', !/swiggy/i.test(content))

  // Internal links resolve.
  const hrefs = await page.evaluate(() =>
    [...document.querySelectorAll('a[href]')].map((a) => a.getAttribute('href')).filter((h) => h && (h.startsWith('/') || h.startsWith(location.origin))),
  )
  const uniq = [...new Set(hrefs.map((h) => (h.startsWith('/') ? BASE + h : h)))].filter((h) => !h.includes('#'))
  let badLinks = []
  for (const l of uniq) {
    const r = await fetch(l)
    if (r.status >= 400) badLinks.push(`${l} -> ${r.status}`)
  }
  report(`all ${uniq.length} internal links return <400`, badLinks.length === 0, badLinks.join(', '))

  // Privacy link navigates.
  const priv = page.locator('main a[href="/privacy-policy"]').first()
  await Promise.all([page.waitForURL('**/privacy-policy', { timeout: 15000 }), priv.click()])
  report('privacy link navigates to /privacy-policy', new URL(page.url()).pathname === '/privacy-policy', page.url())
  report('privacy page links back to /delete-account', (await page.locator('main a[href="/delete-account"]').count()) > 0)
  await page.close()

  // Footer link from the homepage.
  const home = await browser.newPage({ viewport: { width: 1280, height: 900 } })
  attach(home, 'homepage')
  await home.goto(BASE, { waitUntil: 'networkidle' })
  const fl = home.locator('footer a[href="/delete-account"]', { hasText: 'Account Deletion' }).first()
  report('homepage footer has Account Deletion link', (await fl.count()) > 0)
  if ((await fl.count()) > 0) {
    await fl.scrollIntoViewIfNeeded()
    await Promise.all([home.waitForURL('**/delete-account', { timeout: 15000 }), fl.click()])
    report('footer link navigates to /delete-account', new URL(home.url()).pathname === PATH, home.url())
  }
  await home.close()
}

async function responsive(browser) {
  current = 'Responsive'
  for (const vp of VIEWPORTS) {
    const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } })
    attach(page, `responsive-${vp.name}`)
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto(BASE + PATH, { waitUntil: 'networkidle' })
    const m = await page.evaluate(() => {
      const vw = document.documentElement.clientWidth
      const wide = [...document.querySelectorAll('body *')]
        .filter((e) => e.getBoundingClientRect().width > vw + 1)
        .map((e) => e.tagName + '.' + String(e.className).slice(0, 40))
      return { sw: document.documentElement.scrollWidth, vw, wide }
    })
    report(`${vp.width}x${vp.height}: no horizontal overflow`, m.sw <= m.vw + 1, `scrollWidth ${m.sw} > ${m.vw}`)
    report(`${vp.width}x${vp.height}: no element wider than viewport`, m.wide.length === 0, m.wide.slice(0, 3).join(', '))
    const cta = page.locator('main a[href^="mailto:"]', { hasText: 'Email us to request deletion' })
    await cta.scrollIntoViewIfNeeded()
    const box = await cta.boundingBox()
    report(`${vp.width}x${vp.height}: mailto control visible`, (await cta.isVisible()) && !!box && box.x >= 0 && box.x + box.width <= vp.width + 1)
    report(`${vp.width}x${vp.height}: mailto control tappable (>=44px)`, !!box && box.height >= 44 && box.width >= 44, JSON.stringify(box))

    if (process.env.SCREENSHOTS === '1') {
      await page.evaluate(() => window.scrollTo(0, 0))
      if (['desktop', 'tablet', 'mobile'].includes(vp.name)) {
        await page.screenshot({ path: join(OUT, `delete-account-${vp.name}.png`), fullPage: true })
      }
      if (vp.name === 'desktop') {
        const ctaTop = await cta.evaluate((el) => el.getBoundingClientRect().top + window.scrollY)
        await page.evaluate((y) => window.scrollTo(0, y - 90), ctaTop)
        await page.screenshot({ path: join(OUT, 'delete-account-email-action.png') })
        const fl = page.locator('footer a[href="/delete-account"]').first()
        await fl.scrollIntoViewIfNeeded()
        await page.screenshot({ path: join(OUT, 'delete-account-footer-link.png') })
        await page.locator('main a[href="/privacy-policy"]').first().scrollIntoViewIfNeeded()
        await Promise.all([page.waitForURL('**/privacy-policy'), page.locator('main a[href="/privacy-policy"]').first().click()])
        await page.screenshot({ path: join(OUT, 'delete-account-privacy-link.png') })
      }
    }
    await page.close()
  }
}

async function accessibility(browser) {
  current = 'Accessibility'
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
  attach(page, 'a11y')
  await page.goto(BASE + PATH, { waitUntil: 'networkidle' })

  const levels = await page.evaluate(() => [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')].filter((h) => h.closest('main')).map((h) => +h.tagName[1]))
  let ordered = levels.length > 0 && levels[0] === 1
  for (let i = 1; i < levels.length; i++) if (levels[i] - levels[i - 1] > 1) ordered = false
  report('heading order has no skipped levels', ordered, JSON.stringify(levels))

  const emptyLinks = await page.evaluate(() =>
    [...document.querySelectorAll('a[href]')]
      .filter((a) => !(a.textContent || '').trim() && !a.getAttribute('aria-label') && !a.querySelector('img[alt]:not([alt=""])'))
      .map((a) => a.getAttribute('href')),
  )
  report('every link has a non-empty accessible name', emptyLinks.length === 0, emptyLinks.join(', '))

  // Keyboard: Tab reaches the mailto CTA and it shows a visible focus indicator.
  let reached = false
  for (let i = 0; i < 40 && !reached; i++) {
    await page.keyboard.press('Tab')
    reached = await page.evaluate(() => document.activeElement?.getAttribute('href')?.startsWith('mailto:') && document.activeElement.textContent.includes('Email us to request deletion'))
  }
  report('keyboard Tab reaches the mailto button', reached)
  if (reached) {
    const f = await page.evaluate(() => {
      const cs = getComputedStyle(document.activeElement)
      return { outline: cs.outlineStyle, ow: parseFloat(cs.outlineWidth), shadow: cs.boxShadow, focusVisible: document.activeElement.matches(':focus-visible') }
    })
    report('mailto button shows visible focus indicator', f.focusVisible && ((f.outline !== 'none' && f.ow > 0) || f.shadow !== 'none'), JSON.stringify(f))
  }

  // Contrast of all text in <main>.
  const low = await page.evaluate(() => {
    const lum = ([r, g, b]) => {
      const c = [r, g, b].map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 })
      return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]
    }
    const parse = (s) => (s.match(/[\d.]+/g) || []).map(Number)
    const bgOf = (el) => {
      for (let e = el; e; e = e.parentElement) {
        const p = parse(getComputedStyle(e).backgroundColor)
        if (p.length >= 3 && (p.length === 3 || p[3] > 0.99)) return p.slice(0, 3)
      }
      return [255, 255, 255]
    }
    const out = []
    const seen = new Set()
    for (const el of document.querySelectorAll('main h1, main h2, main p, main li, main span, main a')) {
      const own = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())
      if (!own) continue
      const fg = parse(getComputedStyle(el).color).slice(0, 3)
      const bg = bgOf(el)
      const a = lum(fg), b = lum(bg)
      const ratio = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)
      const key = `${fg}|${bg}`
      if (ratio < 4.5 && !seen.has(key)) { seen.add(key); out.push(`${el.tagName} "${el.textContent.trim().slice(0, 30)}" ${ratio.toFixed(2)}`) }
    }
    return out
  })
  report('text contrast >= 4.5:1 for all text in main', low.length === 0, low.join('; '))
  const btn = await page.evaluate(() => {
    const el = document.querySelector('main a[href^="mailto:"]')
    return { c: getComputedStyle(el).color, b: getComputedStyle(el).backgroundColor }
  })
  const [fr, fg2, fb] = btn.c.match(/[\d.]+/g).map(Number)
  const [br, bg2, bb] = btn.b.match(/[\d.]+/g).map(Number)
  const L = (r, g, b) => [r, g, b].map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 }).reduce((s, c, i) => s + c * [0.2126, 0.7152, 0.0722][i], 0)
  const l1 = L(fr, fg2, fb), l2 = L(br, bg2, bb)
  const cr = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05)
  report('mailto button text/background contrast >= 4.5:1', cr >= 4.5, cr.toFixed(2))
  await page.close()
}

async function regression(browser) {
  current = 'Regression'
  const h = await fetch(BASE, { redirect: 'manual' })
  report('homepage returns 200', h.status === 200, `status ${h.status}`)
  const hp = await browser.newPage({ viewport: { width: 1280, height: 900 } })
  attach(hp, 'regression-home')
  await hp.goto(BASE, { waitUntil: 'networkidle' })
  for (const [label, href] of [['Terms & agreement', '/agreement'], ['Privacy Policy', '/privacy-policy'], ['Account Deletion', '/delete-account']]) {
    report(`homepage footer keeps "${label}" link`, (await hp.locator(`footer a[href="${href}"]`, { hasText: label }).count()) > 0)
  }
  await hp.close()
  for (const p of ['/privacy-policy', '/agreement']) {
    const r = await fetch(BASE + p, { redirect: 'manual' })
    report(`${p} returns 200`, r.status === 200, `status ${r.status}`)
  }
  const pp = await browser.newPage({ viewport: { width: 1280, height: 900 } })
  await pp.goto(BASE + '/privacy-policy', { waitUntil: 'networkidle' })
  report('/privacy-policy footer link intact', (await pp.locator('footer a[href="/privacy-policy"]').count()) > 0)
  report('/privacy-policy still has 12 h2', (await pp.locator('h2').count()) === 12)
  await pp.close()
}

const browser = await chromium.launch()
try {
  await functional(browser)
  await responsive(browser)
  await accessibility(browser)
  await regression(browser)
} catch (err) {
  failures++
  console.log(`FAIL  unexpected error — ${err instanceof Error ? err.stack : err}`)
} finally {
  await browser.close()
}

writeFileSync(join(OUT, 'console-report.json'), JSON.stringify(consoleLog, null, 2))
writeFileSync(join(OUT, 'network-report.json'), JSON.stringify(networkLog, null, 2))
console.log(`\nConsole errors/warnings captured: ${consoleLog.length}; failed/4xx+ requests captured: ${networkLog.length} (see ${OUT})`)
console.log('\nTotals per group:')
for (const [g, [p, f]] of Object.entries(groups)) console.log(`  ${g}: ${p} passed, ${f} failed`)
console.log(failures === 0 ? '\nAll delete-account checks passed.' : `\n${failures} check(s) failed.`)
process.exit(failures === 0 ? 0 : 1)
