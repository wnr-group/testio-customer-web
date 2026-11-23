// scripts/verify-privacy-policy.mjs
// Evidence gate for the public /privacy-policy page: reachable without auth,
// correct SEO metadata, exactly the 12 required sections, required business
// facts, footer link from the homepage, server-rendered text, and no
// horizontal overflow at the mandated widths.
// Usage: node scripts/verify-privacy-policy.mjs   (BASE_URL defaults to http://localhost:3001)
import { chromium } from 'playwright'

const BASE = (process.env.BASE_URL ?? 'http://localhost:3001').replace(/\/$/, '')
const PATH = '/privacy-policy'

const TITLE = 'Privacy Policy | Testio Hospitality Services'
const CANONICAL = 'https://www.testiofood.com/privacy-policy'
const BUSINESS = 'TESTIO HOSPITALITY SERVICES'
const ADDRESS = 'No:334-11-4, Thennampalayam Extension, Nallur Village, Tiruppur – 641604'
const EMAIL = 'testio24x7india@gmail.com'
const LAST_UPDATED = 'Last Updated: 23 November 2026'
const HEADINGS = [
  '1. Introduction',
  '2. Information We Collect',
  '3. How We Use Your Information',
  '4. Cookies and Similar Technologies',
  '5. Sharing of Information',
  '6. Data Storage and Security',
  '7. Data Retention',
  '8. User Rights and Data Deletion',
  '9. Third-Party Services',
  "10. Children's Privacy",
  '11. Changes to This Privacy Policy',
  '12. Contact Us',
]
const WIDTHS = [320, 375, 390, 768, 1024, 1440]

let failures = 0
function report(name, ok, detail = '') {
  if (!ok) failures++
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${!ok && detail ? ` — ${detail}` : ''}`)
}

const normalize = (s) => s.replace(/\s+/g, ' ').trim()

async function checkRawHtml() {
  // Fetch without JS and without following redirects: a 3xx would mean the
  // page is being bounced (e.g. to /login) rather than served directly.
  const res = await fetch(BASE + PATH, { redirect: 'manual' })
  report('GET /privacy-policy returns 200', res.status === 200, `status ${res.status}`)
  report(
    'no redirect to /login',
    !(res.status >= 300 && res.status < 400) && !(res.headers.get('location') ?? '').includes('/login'),
    `location ${res.headers.get('location')}`,
  )
  const html = await res.text()
  const text = normalize(html.replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&#x27;|&#39;/g, "'"))
  report('raw HTML (no JS) contains policy text', text.includes('Information We Collect') && text.includes(ADDRESS) && text.includes(LAST_UPDATED), 'expected strings missing from server HTML')
  report('raw HTML contains all 12 headings', HEADINGS.every((h) => text.includes(h)), 'a heading is missing from server HTML')
}

async function checkDom(browser) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
  const response = await page.goto(BASE + PATH, { waitUntil: 'networkidle' })
  report('browser navigation status 200', response?.status() === 200, `status ${response?.status()}`)
  report('final URL is /privacy-policy (no redirect)', new URL(page.url()).pathname === PATH, page.url())

  const title = await page.title()
  report('title exact', title === TITLE, `got "${title}"`)

  const canonical = await page.locator('link[rel="canonical"]').getAttribute('href')
  report('canonical link', canonical === CANONICAL, `got ${canonical}`)

  const robots = (await page.locator('meta[name="robots"]').evaluateAll((els) => els.map((e) => e.getAttribute('content') ?? ''))).join(',').toLowerCase()
  report('no noindex robots meta', !robots.includes('noindex'), `robots "${robots}"`)

  const h1 = await page.locator('h1').allTextContents()
  report('exactly one h1', h1.length === 1, `found ${h1.length}`)
  const h2 = (await page.locator('h2').allTextContents()).map(normalize)
  report('exactly 12 h2', h2.length === 12, `found ${h2.length}`)
  report('h2 headings exact and in order', JSON.stringify(h2) === JSON.stringify(HEADINGS), `got ${JSON.stringify(h2)}`)

  const body = normalize(await page.locator('main').innerText())
  report('contains business name', body.toUpperCase().includes(BUSINESS))
  report('contains exact address', body.includes(ADDRESS))
  report('contains Last Updated date', body.includes(LAST_UPDATED))
  report('no "Swiggy"', !/swiggy/i.test(await page.content()))
  const mailto = await page.locator(`a[href="mailto:${EMAIL}"]`).count()
  report('mailto link present', mailto > 0)

  const footerLink = page.locator('footer a[href="/privacy-policy"]', { hasText: 'Privacy Policy' })
  report('footer on page links to /privacy-policy', (await footerLink.count()) > 0)
  await page.close()
}

async function checkHomepageFooter(browser) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
  await page.goto(BASE, { waitUntil: 'networkidle' })
  const link = page.locator('footer a[href="/privacy-policy"]', { hasText: 'Privacy Policy' }).first()
  const present = (await link.count()) > 0
  report('homepage footer has Privacy Policy link', present)
  if (present) {
    await link.scrollIntoViewIfNeeded()
    await Promise.all([page.waitForURL('**/privacy-policy', { timeout: 15000 }), link.click()])
    report('homepage footer link navigates to /privacy-policy', new URL(page.url()).pathname === PATH, page.url())
    report('Terms link still in footer', await (async () => {
      await page.goto(BASE, { waitUntil: 'networkidle' })
      return (await page.locator('footer a[href="/agreement"]').count()) > 0
    })())
  }
  await page.close()
}

async function checkOverflow(browser) {
  for (const width of WIDTHS) {
    const page = await browser.newPage({ viewport: { width, height: 900 } })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto(BASE + PATH, { waitUntil: 'networkidle' })
    const { scrollWidth, clientWidth } = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }))
    await page.close()
    report(`no horizontal overflow at ${width}px`, scrollWidth <= clientWidth + 1, `scrollWidth ${scrollWidth} > ${clientWidth}`)
  }
}

const browser = await chromium.launch()
try {
  await checkRawHtml()
  await checkDom(browser)
  await checkHomepageFooter(browser)
  await checkOverflow(browser)
} catch (err) {
  failures++
  console.log(`FAIL  unexpected error — ${err instanceof Error ? err.message : err}`)
} finally {
  await browser.close()
}

console.log(failures === 0 ? '\nAll privacy-policy checks passed.' : `\n${failures} check(s) failed.`)
process.exit(failures === 0 ? 0 : 1)
