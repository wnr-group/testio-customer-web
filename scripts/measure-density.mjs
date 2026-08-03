// Enforces the plan's measured layout gates.
// Usage: node scripts/measure-density.mjs [width] [height]
// Exits 1 with a reason list if any gate fails.
import { chromium } from 'playwright'

const BASE = process.env.BASE_URL ?? 'http://localhost:3001'
const widthStr = process.argv[2] ?? '1440'
const heightStr = process.argv[3] ?? '900'
const width = Number(widthStr)
const height = Number(heightStr)

if (isNaN(width) || isNaN(height)) {
  console.error('Usage: node scripts/measure-density.mjs [width] [height]\nWidth and height must be numeric values.')
  process.exit(1)
}

const browser = await chromium.launch()
try {
  const page = await browser.newPage({ viewport: { width, height } })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto(BASE)
  await page.waitForSelector('[data-hero-section]')

const hero = await page.evaluate(() => {
  const section = document.querySelector('[data-hero-section]')
  if (!section) return null
  const r = section.getBoundingClientRect()
  const CELL = 20
  const cols = Math.floor(r.width / CELL)
  const rows = Math.floor(r.height / CELL)
  if (cols < 2 || rows < 2) return null
  const grid = Array.from({ length: rows }, () => new Array(cols).fill(0))

  // [data-ink] marks every element that counts as visible content.
  for (const el of section.querySelectorAll('[data-ink]')) {
    const b = el.getBoundingClientRect()
    if (b.width === 0 || b.height === 0) continue
    const x0 = Math.max(0, Math.floor((b.left - r.left) / CELL))
    const x1 = Math.min(cols - 1, Math.floor((b.right - r.left) / CELL))
    const y0 = Math.max(0, Math.floor((b.top - r.top) / CELL))
    const y1 = Math.min(rows - 1, Math.floor((b.bottom - r.top) / CELL))
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) grid[y][x] = 1
  }

  let covered = 0
  for (const row of grid) for (const c of row) covered += c

  // Largest all-empty square, classic DP.
  const dp = Array.from({ length: rows }, () => new Array(cols).fill(0))
  let best = 0
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      if (grid[y][x]) continue
      dp[y][x] = y === 0 || x === 0 ? 1 : Math.min(dp[y - 1][x], dp[y][x - 1], dp[y - 1][x - 1]) + 1
      if (dp[y][x] > best) best = dp[y][x]
    }
  }

  const quad = (y0, y1, x0, x1) => {
    let c = 0
    let t = 0
    for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) { t++; c += grid[y][x] }
    return Math.round((100 * c) / t)
  }
  const hy = Math.floor(rows / 2)
  const hx = Math.floor(cols / 2)

  return {
    sectionHeight: Math.round(r.height),
    viewportHeight: window.innerHeight,
    fitsAboveFold: r.height <= window.innerHeight + 1,
    coveragePct: Math.round((100 * covered) / (rows * cols)),
    largestEmptySquarePx: best * CELL,
    quadrants: {
      tl: quad(0, hy, 0, hx),
      tr: quad(0, hy, hx, cols),
      bl: quad(hy, rows, 0, hx),
      br: quad(hy, rows, hx, cols),
    },
  }
})

const amb = await page.evaluate(() => {
  const section = document.querySelector('[data-ambassador-section]')
  const copy = document.querySelector('[data-amb-copy]')
  const col = document.querySelector('[data-amb-cutout]')
  const stage = document.querySelector('[data-amb-stage]')
  const img = col?.querySelector('img')
  if (!section || !copy || !col || !stage || !img) return null
  const s = section.getBoundingClientRect()
  const i = img.getBoundingClientRect()
  const c = copy.getBoundingClientRect()
  const g = stage.getBoundingClientRect()
  return {
    sectionHeight: Math.round(s.height),
    athleteHeight: Math.round(i.height),
    athleteHeightPct: Math.round((100 * i.height) / s.height),
    contentColPct: Math.round((100 * c.width) / s.width),
    imageColPct: Math.round((100 * col.getBoundingClientRect().width) / s.width),
    bottomGapPx: Math.round(s.bottom - i.bottom),
    // "No empty visual region larger than ~15% of section width." The two
    // regions that can go empty are the strip right of the stage and the
    // gutter between the copy column and the stage. A negative gutter means
    // the stage overlaps the copy, which is the desired layered look.
    rightGapPct: Math.round((100 * (s.right - g.right)) / s.width),
    midGapPct: Math.round((100 * (g.left - c.right)) / s.width),
  }
})

console.log(`viewport ${width}x${height}`)
console.log('HERO      ', JSON.stringify(hero, null, 2))
console.log('AMBASSADOR', JSON.stringify(amb, null, 2))

  const fails = []
  if (!hero) {
    fails.push('hero not measurable — [data-hero-section] missing')
  } else {
    if (!hero.fitsAboveFold)
      fails.push(`hero ${hero.sectionHeight}px > viewport ${hero.viewportHeight}px — trust ribbon is below the fold`)
    if (hero.coveragePct < 78) fails.push(`hero coverage ${hero.coveragePct}% < 78%`)
    if (hero.largestEmptySquarePx > 180)
      fails.push(`largest empty block ${hero.largestEmptySquarePx}px > 180px`)
    for (const [k, v] of Object.entries(hero.quadrants))
      if (v < 35) fails.push(`quadrant ${k} only ${v}% covered (min 35%)`)
  }
  if (!amb) {
    fails.push('ambassador not measurable — [data-ambassador-section] missing')
  } else {
    if (amb.athleteHeightPct < 70 || amb.athleteHeightPct > 80)
      fails.push(`athlete height ${amb.athleteHeightPct}% outside 70-80%`)
    if (amb.bottomGapPx > 24) fails.push(`athlete floats ${amb.bottomGapPx}px above section bottom (max 24px)`)
    if (width >= 1024) {
      if (amb.contentColPct < 40 || amb.contentColPct > 45)
        fails.push(`content column ${amb.contentColPct}% outside 40-45%`)
      if (amb.imageColPct < 55 || amb.imageColPct > 60)
        fails.push(`image column ${amb.imageColPct}% outside 55-60%`)
      if (amb.rightGapPct > 15)
        fails.push(`empty strip right of the stage is ${amb.rightGapPct}% of section width (max 15%)`)
      if (amb.midGapPct > 15)
        fails.push(`empty gutter between copy and stage is ${amb.midGapPct}% of section width (max 15%)`)
    }
  }

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
