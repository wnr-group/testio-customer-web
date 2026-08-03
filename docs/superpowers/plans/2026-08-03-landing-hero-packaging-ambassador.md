# Landing Page Hero / Packaging / Ambassador Refinement — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the landing Hero visually dense and food-dominant, add a trust ribbon and an eco-packaging showcase, and rebuild the Brand Ambassador section as a balanced premium composition — verified by measured gates, not opinion.

**Architecture:** A design-token layer is added first so no component introduces one-off colours, radii, shadows, or spacing. The trust ribbon renders *inside* the Hero section as its bottom strip, which is what lets the whole hero — headline through ribbon — fit above the fold while keeping the existing GSAP pin. A Playwright harness captures before/after screenshots and runs two scripted gates (hero density, ambassador proportion) so "no empty space" is a number, not a judgement call.

**Tech Stack:** Next.js 16.2.4 (App Router), React 19.2.4, Tailwind CSS v4 (`@theme inline` in `app/globals.css`), GSAP 3.15 + ScrollTrigger via `lib/gsap.ts`, `lucide-react` v1.11, `next/image`, Playwright (dev-only, added in Task 3).

## Global Constraints

- **No production dependency may be added.** Playwright is added to `devDependencies` only (Task 3) and never imported by application code. Verify with `node -e "console.log(Object.keys(require('./package.json').dependencies))"` — the list must be unchanged from the start of this plan.
- **No test runner exists.** `package.json` scripts are `dev`, `build`, `start`, `lint`. There is no vitest/jest. The per-task cycle is `npx tsc --noEmit` → `npm run lint` → `npm run build` → scripted/browser verification. Every task states exact commands and exact expected output.
- **Do not modify** these files at all: `proxy.ts`, `lib/supabase/*`, `hooks/*`, `lib/utils.ts`, `components/CookCard.tsx`, `components/marketing/KitchensTeaser.tsx`, `components/marketing/LocationSearchBox.tsx`, `components/marketing/HowItWorks.tsx`, `components/marketing/Marquee.tsx`, `components/marketing/BecomeCook.tsx`, `components/marketing/MarketingFooter.tsx`, `components/marketing/PublicNavbar.tsx`, `components/brand/Logo.tsx`, `app/layout.tsx`.
- **Do not delete the `heroDishes` export** from `lib/marketing-content.ts`. `Hero.tsx` stops importing it, but `app/(browse)/explore/page.tsx:21` still consumes it.
- **Design-system rule (hard):** no raw hex, no arbitrary radius, no arbitrary shadow, no arbitrary spacing in any new or modified component. Every such value must be a token defined in Task 1 and used via its generated utility (`bg-paper`, `rounded-panel`, `shadow-float`, `py-section`). The only permitted arbitrary values are layout percentages/positions (`left-[8%]`, `w-[74%]`) and one-off `svh`/`clamp` sizing, which are geometry, not style.
- **Breakpoints that must show no horizontal overflow, no clipping, no overlap, no cropped text:** 320, 375, 390, 414, 768, 1024, 1280, 1440, 1728, 1920.
- **Hero gate (measured, Task 5):** hero section height ≤ viewport height at 1440×900; grid coverage ≥ 78%; largest empty square ≤ 180px; every quadrant ≥ 35% covered.
  - *On the 78% floor vs the brief's "approximately 80–90% viewport utilisation":* the gate measures the fraction of a 20px grid over the hero covered by `[data-ink]` bounding boxes. That count deliberately **excludes** the page gutters (`px-4`) and the inter-column gap, which are intentional breathing room and must not be filled. 78% of the section including those gutters corresponds to roughly 85% of the usable content area. Record the actual number; treat 78% as the failure threshold and 80–90% as the target to aim for with the levers listed in Task 5 Step 7.
- **Ambassador gate (measured, Task 9):** athlete image height 70–80% of section height; content column 40–45% and image column 55–60% of section width at ≥1024px; athlete bottom within 24px of section bottom; no empty region (right of the stage, or between copy and stage) wider than 15% of section width.
- **Lighthouse gate (Task 11), production build only:** Performance ≥ 90, Accessibility ≥ 95, Best Practices ≥ 95, SEO ≥ 95.
- **Accessibility floor:** every interactive element keyboard-reachable with a visible focus ring; decorative icons `aria-hidden`; body text ≥ 14px; contrast ≥ 4.5:1 for text under 18.66px bold.
- **Performance floor:** hero LCP image keeps `priority`; every other image lazy-loads (next/image default) inside an explicit aspect-ratio box or with `width`/`height`, so CLS does not increase.
- **All copy lives in `lib/marketing-content.ts`.** No string literals in new JSX except `aria-label`s and static element ids.

---

# PHASE 0 — Visual Design Analysis

Mandatory analysis of the three client references, and the mapping from each observed idea to its TESTIO implementation. **No code is written until this section has been read.**

## Image 1 — Hero inspiration

### Extracted properties

| Property | Observation |
|---|---|
| Layout structure | Two columns, roughly 46% copy / 54% art, inside a centred max-width container. A full-bleed green ribbon closes the block at the bottom. Navbar sits transparent on the same cream field. |
| Visual hierarchy | Headline (dominant) → sub → CTA pair → "Featured in your area" label → card row. On the right the art panel is a single dominant mass, not scattered elements. |
| Spacing | Tight vertical rhythm on the left: roughly 20–28px between blocks, then a larger ~36px gap before the featured strip. The art panel is flush to the container's right edge. |
| Alignment | Everything on the left is flush-left on one axis. Featured cards align to that same left edge and to each other on a shared baseline. |
| Typography scale | Headline ~56–64px, weight 800, leading ≈1.05. Sub ~15–16px regular grey. CTA labels ~14px bold. Card dish name ~12px bold, cook name ~11px grey. Ribbon title ~14px bold, subtitle ~12px. Roughly a 4:1 headline-to-body ratio. |
| Image composition | One large circular bowl centred in a warm panel, with two smaller satellites (a taped note card, a second bowl) breaking the panel's edge. Depth comes from overlap, not from scatter. |
| Card positioning | Featured cards: 4-up, equal width, small gap, image on top and two text lines below. The "Today's Special" card overlaps the panel's right edge and is rotated a few degrees. |
| CTA placement | Immediately under the sub, side by side, left-aligned. Filled red primary, outlined secondary. |
| Colour balance | Cream field dominant; one large warm amber mass anchors the right; red used sparingly for the underline and primary CTA; green reserved entirely for the trust ribbon. Roughly 60% neutral / 25% amber / 10% red / 5% green. |
| Shadow style | Soft, large-radius, low-opacity ambient shadows. Nothing hard-edged. The panel casts the deepest shadow; cards are lighter. |
| Border radius | Large on the art panel (~28–32px), medium on featured card images (~10–12px), the note card is square-cornered like paper stock, CTAs are full pills. |
| Decorative elements | Tape strips at the panel corners and on the note card, large green leaves behind the bowl, a hand-drawn red scribble under the first headline word, small icons on the note card. |
| Negative space | Deliberately minimal. The left column's lower third is filled by the featured strip; the right is fully occupied. No quadrant reads as empty. |

### Mapping — Image 1 → TESTIO implementation

| Inspiration idea | TESTIO implementation | Branding adaptation |
|---|---|---|
| Two-column ~46/54 split | `md:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]` inside the existing `max-w-6xl` | Keeps the container width already used by every other TESTIO section, so the hero aligns with `HowItWorks` and `KitchensTeaser` below it |
| Warm amber art panel | `rounded-panel bg-gradient-to-br from-brand-secondary via-amber-mid to-amber-deep` | Uses TESTIO's existing brand amber `#F5A623` as the gradient start rather than the reference's ochre, so the panel reads as TESTIO yellow |
| Hand-drawn underline | **Already exists** — the rooster-comb SVG that draws itself under "Homemade." | Kept untouched; TESTIO's comb mark is more on-brand than the reference's generic scribble |
| Large centred bowl | `heroSpecial.image` at 74% panel width, `rounded-full`, `ring-8 ring-paper/70` | Reuses existing `dish-1.jpg` — real TESTIO food photography, no stock imagery |
| Taped "Today's Special" note | `figure` in `bg-paper` with a tape strip pseudo-element, rotated 3° | Paper stock token `--color-paper` matches the existing ambassador polaroid, tying the two sections together |
| Satellite bowl breaking the edge | Garnish bowl absolutely positioned at `-bottom-5 right-4` | Reuses `dish-4.jpg`; carries `data-dish` so the **existing** parallax tween drives it |
| Green trust ribbon | `TrustRibbon` rendered inside the hero section via `mt-auto` | `--color-green-deep #2F6B33` — a new token, deliberately distinct from TESTIO's `--color-brand-success #2DB34A` which is reserved for order-status UI |
| Leaves behind the bowl | Inline `<Leaf>` SVG, `text-green-deep` at reduced opacity | Hand-drawn inline so no image request is added above the fold, protecting LCP |
| Minimal negative space | Enforced by the Task 5 density gate (≥78% coverage, ≤180px empty square) | Measured, not eyeballed |

**Deliberately not copied:** the reference's four-line headline (TESTIO's headline is fixed copy and wraps naturally), its exact ochre palette, its icon set, and its cook names.

## Image 2 — Eco packaging poster

### Extracted properties

| Property | Observation |
|---|---|
| Layout structure | Dense promotional poster: centred logo lockup, product cluster spanning the full width, a right-hand benefit rail, and stacked promotional bars at the bottom. |
| Visual hierarchy | Logo → slogan → product mass → benefit list → app/CTA bars. Everything competes; there is no single resting point. |
| Spacing | Very tight. Almost no gutters. Elements touch or overlap. |
| Typography scale | Many sizes and three or four weights, plus outlined and shadowed display type. Mixed casing throughout. |
| Image composition | Eight-plus containers photographed on wood with leaves scattered between them, arranged as a pile rather than a composition. |
| CTA placement | Multiple competing CTAs — store badges, "COMING SOON", "DOWNLOAD NOW" — none dominant. |
| Colour balance | High-saturation red, green, orange and yellow all at full strength simultaneously. |
| Shadow style | Hard drop shadows and outer glows on type. |
| Border radius | Inconsistent — pill bars, sharp banners, rounded badges mixed. |
| Decorative elements | Starbursts, ribbons, flags, comic-style callouts. |
| Negative space | Effectively zero. |

### Mapping — Image 2 → TESTIO implementation

The client's instruction is explicit: **communicate the same message, do not replicate the poster.** The poster's *content* is the input; its *form* is the anti-pattern.

| Poster element | Kept / dropped | TESTIO implementation |
|---|---|---|
| "We don't use plastic" | **Kept as the problem statement** | Section eyebrow — small green pill, sets up the "why" before the "what" |
| "100% Eco-friendly packaging" | **Kept as the solution** | `h2` "Eco-friendly packaging", the section's only display-size type |
| Four benefit callouts (Natural / Eco-friendly / Safe / Sustainable) | **Kept, expanded to seven** | Uniform feature-grid cards, one icon + one label each, all identical weight — no visual ranking between them |
| Product cluster photograph | **Kept as the visual anchor** | `EcoPackCollage` — layered CSS/SVG containers on a calm cream field, the section's hero element |
| Areca-leaf / paaku mattai material story | **Kept** | Body copy names the material explicitly; leaf motif carried by icons and the collage's leaf marks |
| Starbursts, flags, "COMING SOON", store badges, founder portraits | **Dropped entirely** | Out of scope, and they are what makes the reference read as an advertisement |
| Multiple competing CTAs | **Dropped** | Exactly one CTA, `packaging.cta` |
| Full-saturation four-colour palette | **Dropped** | Green + cream + ink only; TESTIO red does not appear in this section, so it stays distinct from the hero and ambassador blocks |
| Hard drop shadows, outlined type | **Dropped** | `shadow-card` / `shadow-float` tokens; a single type weight ramp |
| Zero negative space | **Inverted** | Generous section padding (`py-section`/`py-section-lg`) with the empty-canvas problem solved by making the collage large, not by cramming |

Reading order is forced to **Problem → Solution → Benefits → Visual → Feature grid → CTA** by the DOM order in Task 7, which is also the mobile stacking order.

## Image 3 — Current ambassador section (what the client rejected)

### Extracted properties and diagnosis

| Property | Observation | Diagnosis |
|---|---|---|
| Layout structure | Two columns, but the right column is a 620×620px circle centred vertically with the athlete floating in front of it | The circle is decorative only and carries no content, so the right half reads as empty |
| Negative space | The lower-right quadrant and the entire strip right of the red circle are empty; the gap between the polaroid and the section bottom is dead | This is the client's "large empty canvas" |
| Image composition | Athlete is vertically centred, feet ending mid-air with no ground plane | This is the "floating / isolated" complaint |
| Cutout quality | Visible white fringe on hair, hands and shoes against `#191210` | This is the "white edges after background removal" complaint |
| Visual hierarchy | Eyebrow → heading → title → body → polaroid, then nothing. No stats, no CTA, no closing element | The column ends abruptly while the athlete continues, unbalancing the row |
| Colour balance | One flat `#191210` field plus one flat `#E8202A` circle. Two flat masses, no depth | Reads cheap rather than premium |
| Shadow style | A single `drop-shadow-2xl` on the cutout, with no contact shadow | Reinforces the floating look |

### Mapping — diagnosis → TESTIO fix

| Rejected property | Fix | Where |
|---|---|---|
| Flat dark canvas | Layered background: radial warm gradient + blurred red glow + subtle dot texture | Task 9 |
| Decorative empty circle | Replaced by a **stage** — a bottom-anchored rounded panel the athlete stands on, sized to the image column | Task 9 |
| Floating, centred athlete | `items-end` + bottom-anchored image + an elliptical contact shadow at her feet | Task 9 |
| Column ends early | Stats row and CTA added, giving the order Body → Stats → Polaroid → CTA | Tasks 2, 9 |
| Right column too narrow for its content | Grid becomes 43% content / 57% image | Task 9 |
| Athlete too small relative to the section | `h-[clamp(20rem,66svh,42rem)]`, gated at 70–80% of section height | Task 9 |
| White halo | Asset regenerated with a production alpha matte — **blocking gate** | Task 8 |

---

## File Structure

| File | Action | Responsibility |
|---|---|---|
| `app/globals.css` | Modify | Design-token layer: marketing colours, radii, elevation, section rhythm. |
| `lib/marketing-content.ts` | Modify | All new copy: `heroFeatured`, `heroSpecial`, `trustRibbon`, `packaging`; extends `ambassador`. |
| `package.json` | Modify | Playwright devDependency + three verification scripts. |
| `scripts/visual-capture.mjs` | Create | Screenshot evidence across engines and breakpoints. |
| `scripts/measure-density.mjs` | Create | Scripted hero-density and ambassador-proportion gates. |
| `components/marketing/TrustRibbon.tsx` | Create | The green trust strip. Presentational, no state. |
| `components/marketing/Hero.tsx` | Modify | Two-column hero; renders `TrustRibbon` as its bottom strip. |
| `components/marketing/EcoPackCollage.tsx` | Create | The packaging visual. Illustrated by default; swaps to a photo via one prop. |
| `components/marketing/PackagingShowcase.tsx` | Create | Problem → Solution → Benefits → Visual → Grid → CTA. |
| `components/marketing/AmbassadorSection.tsx` | Modify | Rebalanced dark composition with stage, stats and CTA. |
| `app/page.tsx` | Modify | Inserts `<PackagingShowcase />` between `<Hero />` and `<Marquee />`. |
| `artifacts/visual/**` | Generated | Screenshot evidence. Git-ignored. |

Final section order: `PublicNavbar → Hero (incl. TrustRibbon) → PackagingShowcase → Marquee → HowItWorks → KitchensTeaser → AmbassadorSection → BecomeCook → MarketingFooter`

**Why the ribbon lives inside `Hero`:** the requirements demand the ribbon be above the fold without scrolling *and* that existing GSAP animations stay intact. The existing hero is `min-h-screen` and pinned. A sibling ribbon would necessarily start one full viewport down. Nesting it inside the pinned section satisfies both at once, and matches Image 1, where the ribbon is visibly part of the hero block.

---

## Task 1: Design token layer

**Files:**
- Modify: `app/globals.css:12-16` (inside `@theme inline`)

**Interfaces:**
- Consumes: nothing.
- Produces these Tailwind utilities for every later task:
  - Colours: `green-deep`, `green-forest`, `amber-mid`, `amber-deep`, `paper`, `ink-warm`, `red-deep`, `red-shadow`, `fibre-light`, `fibre-mid`, `fibre-dark` (usable as `bg-*`, `text-*`, `border-*`, `from-*`, `via-*`, `to-*`)
  - Radii: `rounded-pack`, `rounded-frame`, `rounded-panel`
  - Shadows: `shadow-card`, `shadow-float`, `shadow-panel`, `shadow-cutout`
  - Spacing: `py-section`, `py-section-lg` (and every other spacing utility for those names)

**Naming rule:** none of these override a Tailwind default. `rounded-xl`/`rounded-2xl`, `shadow-lg`/`shadow-xl` and the numeric spacing scale keep their stock values, so no existing component changes appearance.

- [ ] **Step 1: Add the tokens**

In `app/globals.css`, find this block (lines 12–16):

```css
  /* Marketing site surfaces */
  --color-cream:      #FFF9F2;
  --color-cream-deep: #FBEFE2;
  --color-ink-deep:   #191210;
```

Replace it with:

```css
  /* Marketing site surfaces */
  --color-cream:      #FFF9F2;
  --color-cream-deep: #FBEFE2;
  --color-ink-deep:   #191210;
  --color-ink-warm:   #2A1D19; /* ambassador gradient, warm end */
  --color-paper:      #FFFDF8; /* taped cards + polaroid stock */

  /* Eco / trust green. Deliberately NOT --color-brand-success (#2DB34A),
     which is reserved for order-status UI. */
  --color-green-deep:   #2F6B33;
  --color-green-forest: #25562A;

  /* Warm gradient stops for the hero art panel */
  --color-amber-mid:  #EFA23A;
  --color-amber-deep: #DE8A1B;

  /* Ambassador stage gradient */
  --color-red-deep:   #C51A23;
  --color-red-shadow: #8E1119;

  /* Moulded-fibre packaging illustration */
  --color-fibre-light: #E4CBA4;
  --color-fibre-mid:   #D8B98C;
  --color-fibre-dark:  #C2A071;

  /* Marketing radii — additive, they do not shadow Tailwind's defaults */
  --radius-pack:  1.25rem; /* 20px — packaging containers */
  --radius-frame: 1.75rem; /* 28px — collage frame */
  --radius-panel: 2rem;    /* 32px — hero art panel */

  /* Elevation scale */
  --shadow-card:  0 2px 8px rgb(26 26 26 / 0.06);
  --shadow-float: 0 12px 32px rgb(26 26 26 / 0.12);
  --shadow-panel: 0 24px 48px rgb(222 138 27 / 0.20);

  /* The ambassador cut-out needs a filter shadow, not a box shadow:
     box-shadow draws the element's rectangle, drop-shadow follows the
     PNG's alpha silhouette. */
  --drop-shadow-cutout: 0 24px 40px rgb(0 0 0 / 0.55);

  /* Section rhythm */
  --spacing-section:    4rem; /* 64px — mobile */
  --spacing-section-lg: 6rem; /* 96px — desktop */
```

- [ ] **Step 2: Prove the tokens actually generate utilities**

Tailwind v4 only emits a utility if it is used. Create a temporary probe at `app/token-probe/page.tsx`:

```tsx
export default function TokenProbe() {
  return (
    <div className="bg-green-deep bg-green-forest bg-amber-mid bg-amber-deep bg-paper bg-ink-warm bg-red-deep bg-red-shadow bg-fibre-light bg-fibre-mid bg-fibre-dark rounded-pack rounded-frame rounded-panel shadow-card shadow-float shadow-panel drop-shadow-cutout py-section py-section-lg">
      probe
    </div>
  )
}
```

Build and grep the emitted CSS:

```bash
npm run build && node -e "
const fs=require('fs'),p=require('path');
const dir='.next/static/css';
const css=fs.readdirSync(dir).filter(f=>f.endsWith('.css')).map(f=>fs.readFileSync(p.join(dir,f),'utf8')).join('');
const names=['bg-green-deep','bg-green-forest','bg-amber-mid','bg-amber-deep','bg-paper','bg-ink-warm','bg-red-deep','bg-red-shadow','bg-fibre-light','bg-fibre-mid','bg-fibre-dark','rounded-pack','rounded-frame','rounded-panel','shadow-card','shadow-float','shadow-panel','drop-shadow-cutout','py-section','py-section-lg'];
let bad=0;
for(const n of names){const ok=css.includes('.'+n.replace(/([:.\\\\[\\\\]\\\\/])/g,'\\\\\$1'))||css.includes(n);if(!ok){console.error('MISSING',n);bad++}}
console.log(bad?('FAIL '+bad+' missing'):'ALL '+names.length+' UTILITIES EMITTED');
process.exit(bad?1:0)"
```

Expected: `ALL 20 UTILITIES EMITTED`, exit code 0.

If `py-section` / `py-section-lg` are reported missing, Tailwind v4 in this version does not expose named `--spacing-*` entries as utilities. In that case **delete those two tokens** and use the numeric scale instead — `py-16` (64px) and `lg:py-24` (96px) — everywhere this plan writes `py-section` / `lg:py-section-lg`. Record which path was taken; later tasks depend on it.

- [ ] **Step 3: Delete the probe**

```bash
rm -rf app/token-probe && ls app/token-probe 2>&1
```

Expected: a "No such file or directory" error.

- [ ] **Step 4: Confirm nothing existing changed**

```bash
npx tsc --noEmit && npm run lint && npm run build
```

Expected: `tsc` silent, ESLint exits 0, build succeeds.

- [ ] **Step 5: Commit**

```bash
git add app/globals.css
git commit -m "feat(design): add marketing colour, radius, elevation and rhythm tokens"
```

---

## Task 2: Content model

**Files:**
- Modify: `lib/marketing-content.ts:18` (insert after `heroDishes`) and `lib/marketing-content.ts:49-61` (the `ambassador` object)

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `heroFeatured: { src: string; alt: string; dish: string; cook: string }[]` — 4 entries
  - `heroSpecial: { eyebrow: string; dish: string; cook: string; image: { src: string; alt: string }; garnish: { src: string; alt: string } }`
  - `trustRibbon: { title: string; sub: string; icon: 'home' | 'shield' | 'truck' | 'sprout' }[]` — 4 entries
  - `type PackagingIconName = 'leaf' | 'recycle' | 'flask' | 'utensils' | 'sprout' | 'globe' | 'refresh'`
  - `packaging: { problem: string; heading: string; sub: string; benefits: string; features: { label: string; icon: PackagingIconName }[]; cta: { label: string; href: string } }`
  - `ambassador.eyebrow: string`, `ambassador.stats: { value: string; label: string }[]` (3 entries), `ambassador.quote: string | null`, `ambassador.cta: { label: string; href: string }`

- [ ] **Step 1: Insert the new exports**

Insert immediately after the `heroDishes` array (which ends at line 18, before the `marquee` export):

```ts
// Hero showcase cards. TODO: replace `dish` and `cook` with real approved
// cooks before public launch — these four are illustrative placeholders.
export const heroFeatured = [
  { src: '/marketing/dish-3.jpg', alt: '', dish: 'Curd Rice', cook: 'Lakshmi' },
  { src: '/marketing/dish-1.jpg', alt: '', dish: 'Chicken Biryani', cook: 'Farida' },
  { src: '/marketing/dish-2.jpg', alt: '', dish: 'Sambar & Rice', cook: 'Revathi' },
  { src: '/marketing/dish-4.jpg', alt: '', dish: 'Chapati & Curry', cook: 'Meena' },
]

// `alt` is intentionally empty on the cards above and on `garnish` below:
// the dish and cook names sit directly beneath each image, so a filled alt
// would make screen readers announce the same thing twice.

// TODO: same placeholder caveat as heroFeatured.
export const heroSpecial = {
  eyebrow: "Today's Special",
  dish: 'Prawn Biryani',
  cook: 'Shanti',
  image: { src: '/marketing/dish-1.jpg', alt: 'A bowl of freshly cooked prawn biryani' },
  garnish: { src: '/marketing/dish-4.jpg', alt: '' },
}

export const trustRibbon = [
  { title: 'No Restaurants', sub: 'Just homes', icon: 'home' as const },
  { title: 'Safe & Hygienic', sub: 'Prepared with care', icon: 'shield' as const },
  { title: 'On-time Delivery', sub: 'Right to your door', icon: 'truck' as const },
  { title: 'Fresh Daily', sub: 'Cooked the day you order', icon: 'sprout' as const },
]

export type PackagingIconName =
  | 'leaf'
  | 'recycle'
  | 'flask'
  | 'utensils'
  | 'sprout'
  | 'globe'
  | 'refresh'

// Ordered to read problem → solution → benefits, which is also the DOM and
// mobile stacking order in PackagingShowcase.
export const packaging = {
  problem: 'Most food travels in plastic',
  heading: 'Eco-friendly packaging',
  sub: 'Designed for freshness. Better for nature.',
  benefits:
    'Every TESTIO order travels in areca-leaf and moulded-fibre containers — sturdy enough for gravy, warm enough to arrive fresh, and gentle enough to return to the soil they came from.',
  features: [
    { label: '100% Natural', icon: 'leaf' as const },
    { label: 'Biodegradable', icon: 'recycle' as const },
    { label: 'Chemical Free', icon: 'flask' as const },
    { label: 'Food Safe', icon: 'utensils' as const },
    { label: 'Leaf Based', icon: 'sprout' as const },
    { label: 'Sustainable', icon: 'globe' as const },
    { label: 'Reusable', icon: 'refresh' as const },
  ],
  cta: { label: 'Order in eco packaging', href: '/explore' },
}
```

- [ ] **Step 2: Replace the `ambassador` export**

Replace the whole `ambassador` object (currently lines 49–61) with:

```ts
export const ambassador = {
  // Set to the ambassador's name once confirmed — the section renders
  // gracefully without it.
  name: null as string | null,
  eyebrow: 'Our brand ambassador',
  heading: 'Strength you can taste.',
  title: 'International gold medalist in powerlifting',
  body: "Champions don't leave their fuel to chance. Our ambassador — an international gold medalist proudly lifting for India — backs food that's honest: home-cooked, fresh, made with care.",
  // Derived ONLY from `title` and `body` above. Do not add achievement
  // claims here that aren't already confirmed copy.
  stats: [
    { value: 'Gold', label: 'International medalist' },
    { value: 'India', label: 'Proudly represents' },
    { value: '100%', label: 'Home-cooked fuel' },
  ],
  // Null until a real, attributable quote is confirmed. Attributing an
  // invented quote to a real athlete is not acceptable. The section omits
  // the blockquote entirely while this is null.
  quote: null as string | null,
  medalsCaption: 'Medals earned on real, home-cooked food.',
  cta: { label: 'Eat like a champion', href: '/explore' },
  images: {
    cutout: '/marketing/ambassador-cutout.png',
    medals: '/marketing/ambassador-medals.jpg',
  },
}
```

- [ ] **Step 3: Verify every lucide icon this plan uses exists**

```bash
node -e "const l=require('lucide-react');const n=['House','ShieldCheck','Truck','Sprout','Leaf','Recycle','FlaskConical','UtensilsCrossed','Globe','RefreshCw','ArrowRight'];let bad=0;n.forEach(k=>{const ok=typeof l[k]==='function';if(!ok){console.error('MISSING',k);bad++}});console.log(bad?'FAIL':'ALL '+n.length+' ICONS OK');process.exit(bad?1:0)"
```

Expected: `ALL 11 ICONS OK`, exit code 0.

If any is missing, list the available names with `node -e "console.log(Object.keys(require('lucide-react')).join('\n'))"`, pick the nearest equivalent, and record the substitution — Tasks 4, 7 and 9 reference these names.

- [ ] **Step 4: Type-check and lint**

```bash
npx tsc --noEmit && npm run lint
```

Expected: `tsc` silent, ESLint exits 0.

- [ ] **Step 5: Commit**

```bash
git add lib/marketing-content.ts
git commit -m "feat(marketing): add hero showcase, trust ribbon and packaging copy"
```

---

## Task 3: Visual QA harness + baseline capture

**Files:**
- Modify: `package.json` (devDependencies + scripts)
- Modify: `.gitignore`
- Create: `scripts/visual-capture.mjs`
- Create: `scripts/measure-density.mjs`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `npm run visual:capture -- <outDir> [engine]` — screenshots
  - `npm run visual:measure -- [width] [height]` — density/proportion gates, exit 1 on failure
  - Baseline screenshots at `artifacts/visual/baseline/` for the before/after comparison
- Requires these DOM hooks from later tasks: `[data-hero-section]` and `[data-ink]` on hero content blocks (Task 5), `#packaging` (Task 7), and `[data-ambassador-section]` + `[data-amb-stage]` (Task 9). `[data-amb-copy]` and `[data-amb-cutout]` already exist in the current file.

**Cost note:** `npx playwright install` downloads browser binaries (~1GB for all three engines). Chromium alone is enough for the density gates and desktop screenshots; firefox and webkit are needed only for the Task 11 cross-browser gate. Install chromium first, and the other two only when reaching Task 11.

**This task runs before any UI change** so the "current implementation" baseline the client comparison needs is captured from the unmodified page.

- [ ] **Step 1: Add Playwright as a dev-only dependency**

```bash
npm install --save-dev playwright@^1.50.0
```

Then confirm the production dependency list is untouched:

```bash
node -e "const p=require('./package.json');console.log('deps:',Object.keys(p.dependencies).length);console.log('playwright in deps?',Boolean(p.dependencies.playwright))"
```

Expected: `playwright in deps? false`.

- [ ] **Step 2: Install the Chromium binary**

```bash
npx playwright install chromium
```

Expected: ends with a downloaded-and-installed message, exit 0.

- [ ] **Step 3: Ignore the artifacts directory**

Append to `.gitignore`:

```
# visual QA evidence
/artifacts
```

- [ ] **Step 4: Create `scripts/visual-capture.mjs`**

```js
// Captures the screenshot evidence the plan's visual gates depend on.
// Usage: node scripts/visual-capture.mjs <outDir> [engine]
//   engine: chromium | chrome | msedge | firefox | webkit  (default: all installed)
import { chromium, firefox, webkit } from 'playwright'
import { mkdir } from 'node:fs/promises'

const BASE = process.env.BASE_URL ?? 'http://localhost:3000'
const outDir = process.argv[2] ?? 'artifacts/visual/current'
const only = process.argv[3]

const VIEWPORTS = [
  { name: '320', width: 320, height: 720 },
  { name: '375', width: 375, height: 812 },
  { name: '390', width: 390, height: 844 },
  { name: '414', width: 414, height: 896 },
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
```

- [ ] **Step 5: Create `scripts/measure-density.mjs`**

```js
// Enforces the plan's measured layout gates.
// Usage: node scripts/measure-density.mjs [width] [height]
// Exits 1 with a reason list if any gate fails.
import { chromium } from 'playwright'

const BASE = process.env.BASE_URL ?? 'http://localhost:3000'
const width = Number(process.argv[2] ?? 1440)
const height = Number(process.argv[3] ?? 900)

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width, height } })
await page.emulateMedia({ reducedMotion: 'reduce' })
await page.goto(BASE, { waitUntil: 'networkidle' })

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

await browser.close()
if (fails.length) {
  console.error('\nGATE FAILED:')
  for (const f of fails) console.error(' -', f)
  process.exit(1)
}
console.log('\nGATE PASSED')
```

- [ ] **Step 6: Add the npm scripts**

In `package.json`, replace the `"scripts"` block with:

```json
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint",
    "visual:capture": "node scripts/visual-capture.mjs",
    "visual:measure": "node scripts/measure-density.mjs"
  },
```

- [ ] **Step 7: Capture the BASELINE from the unmodified page**

Build and serve production, then capture. In one terminal:

```bash
npm run build && npm run start
```

In a second terminal:

```bash
npm run visual:capture -- artifacts/visual/baseline chromium
```

Expected: `captured: chromium -> artifacts/visual/baseline/chromium`.

Confirm the files exist:

```bash
node -e "const fs=require('fs');const d='artifacts/visual/baseline/chromium';const f=fs.readdirSync(d);console.log(f.length+' files');console.log(f.filter(x=>x.startsWith('fold-')).join(' '))"
```

Expected: 30 files (10 `fold-*`, 10 `full-*`, 10 `ambassador-*`); `hero-*` and `packaging-*` are absent because `[data-hero-section]` and `#packaging` do not exist yet. That absence is itself baseline evidence.

- [ ] **Step 8: Record the baseline density numbers**

```bash
npm run visual:measure -- 1440 900
```

Expected: it **exits 1** with `hero not measurable — [data-hero-section] missing`. Record the `AMBASSADOR` block it prints — those are the "before" proportions the redesign is measured against.

- [ ] **Step 9: Commit**

```bash
git add package.json package-lock.json .gitignore scripts/visual-capture.mjs scripts/measure-density.mjs
git commit -m "chore(qa): add playwright visual capture and layout density gates"
```

---

## Task 4: Trust ribbon component

**Files:**
- Create: `components/marketing/TrustRibbon.tsx`

**Interfaces:**
- Consumes: `trustRibbon` from Task 2; `green-deep` token from Task 1.
- Produces: `export function TrustRibbon(): JSX.Element` — no props. Its root element carries `data-ink` so the Task 3 density gate counts it as content.

- [ ] **Step 1: Create the file**

```tsx
import { House, ShieldCheck, Sprout, Truck } from 'lucide-react'
import { trustRibbon } from '@/lib/marketing-content'

const ICONS = {
  home: House,
  shield: ShieldCheck,
  truck: Truck,
  sprout: Sprout,
} as const

// The hero's closing strip. Rendered inside <Hero> rather than as a sibling
// so it lands above the fold and travels with the pinned section.
export function TrustRibbon() {
  return (
    <div data-ink aria-label="Why TESTIO" className="w-full bg-green-deep">
      <ul className="mx-auto grid max-w-6xl grid-cols-2 gap-x-4 gap-y-5 px-4 py-5 md:grid-cols-4 md:gap-x-6 md:py-6">
        {trustRibbon.map((item) => {
          const Icon = ICONS[item.icon]
          return (
            <li key={item.title} className="flex items-center gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-paper/10 ring-1 ring-paper/20">
                <Icon aria-hidden className="size-5 text-brand-secondary" strokeWidth={2} />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-bold text-paper">{item.title}</span>
                <span className="block truncate text-xs text-paper/70">{item.sub}</span>
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
```

- [ ] **Step 2: Type-check and lint**

```bash
npx tsc --noEmit && npm run lint
```

Expected: `tsc` silent, ESLint exits 0.

(The component is not rendered anywhere yet — Task 5 mounts it. Nothing visual to verify at this step.)

- [ ] **Step 3: Commit**

```bash
git add components/marketing/TrustRibbon.tsx
git commit -m "feat(marketing): add trust ribbon strip"
```

---

## Task 5: Hero redesign

**Files:**
- Modify: `components/marketing/Hero.tsx` (constants deleted, imports changed, GSAP block edited, JSX replaced)

**Interfaces:**
- Consumes: `hero`, `heroFeatured`, `heroSpecial` from Task 2; `TrustRibbon` from Task 4; tokens from Task 1.
- Produces: `export function Hero(): JSX.Element` (signature unchanged — `app/page.tsx` needs no edit for this task). Emits the DOM hooks `[data-hero-section]` and `[data-ink]` that Task 3's gate requires.

**Two deliberate structural changes, both required by the brief:**
1. **The ribbon moves inside the section.** "Trust ribbon above the fold without scrolling" is impossible with a `min-h-screen` pinned hero and a sibling ribbon. Nesting satisfies it and matches Image 1.
2. **The pin gains a viewport guard.** A pinned section taller than the viewport clips its own bottom — which would hide the ribbon on short screens. The guard `(min-width: 768px) and (min-height: 720px)` keeps the exact pinned parallax where the composition fits and degrades to the same parallax without pinning elsewhere. No tween is removed.

- [ ] **Step 1: Delete the old layout constant**

Delete `DISH_LAYOUT` (lines 13–18) entirely. It positioned the four floating circles that the composition replaces.

- [ ] **Step 2: Update imports**

Replace line 11:

```tsx
import { hero, heroDishes } from '@/lib/marketing-content'
```

with:

```tsx
import { hero, heroFeatured, heroSpecial } from '@/lib/marketing-content'
import { TrustRibbon } from '@/components/marketing/TrustRibbon'
```

- [ ] **Step 3: Add the decorative leaf below the imports**

```tsx
// Decorative only, drawn inline so the hero adds no extra image request
// above the fold (protects LCP).
function Leaf({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 60" aria-hidden className={className} fill="none">
      <path d="M2 44C18 8 62 0 98 6c-6 34-42 52-72 46-10-2-18-6-24-8Z" fill="currentColor" />
      <path d="M8 44C34 30 66 16 96 8" stroke="rgb(0 0 0 / 0.18)" strokeWidth="2" />
    </svg>
  )
}
```

- [ ] **Step 4: Replace the GSAP block**

Replace the whole `useGSAP(...)` call (lines 23–79) with:

```tsx
  useGSAP(
    () => {
      const mm = gsap.matchMedia()

      mm.add('(prefers-reduced-motion: no-preference)', () => {
        // Comb underline draws on after the headline rises in.
        const path = ref.current!.querySelector<SVGPathElement>('[data-comb] path')
        if (path) {
          const len = path.getTotalLength()
          gsap.set(path, { strokeDasharray: len, strokeDashoffset: len })
          gsap.to(path, { strokeDashoffset: 0, duration: 0.9, ease: 'power2.out', delay: 0.7 })
        }
        gsap.from('[data-hero-line]', {
          yPercent: 110,
          duration: 0.8,
          stagger: 0.12,
          ease: 'power3.out',
        })
        gsap.from('[data-hero-sub], [data-hero-cta], [data-hero-featured]', {
          y: 24,
          opacity: 0,
          duration: 0.6,
          stagger: 0.1,
          delay: 0.5,
          ease: 'power2.out',
        })
        gsap.from('[data-hero-art]', {
          y: 40,
          opacity: 0,
          duration: 0.8,
          delay: 0.2,
          ease: 'power3.out',
        })
        gsap.from('[data-dish]', {
          scale: 0.7,
          opacity: 0,
          duration: 0.7,
          stagger: 0.1,
          delay: 0.55,
          ease: 'back.out(1.6)',
        })
      })

      // Pin only where the whole composition fits the viewport. A pinned
      // section taller than the viewport clips its own bottom, which would
      // hide the trust ribbon.
      mm.add(
        '(prefers-reduced-motion: no-preference) and (min-width: 768px) and (min-height: 720px)',
        () => {
          const tl = gsap.timeline({
            scrollTrigger: {
              trigger: ref.current,
              start: 'top top',
              end: '+=70%',
              scrub: true,
              pin: true,
            },
          })
          gsap.utils.toArray<HTMLElement>('[data-dish]').forEach((el) => {
            tl.to(el, { y: -Number(el.dataset.speed) * 120, ease: 'none' }, 0)
          })
          tl.to('[data-hero-copy]', { y: -60, ease: 'none' }, 0)
        }
      )

      mm.add('(prefers-reduced-motion: reduce)', () => {
        gsap.from(ref.current, { opacity: 0, duration: 0.4 })
      })
    },
    { scope: ref }
  )
```

- [ ] **Step 5: Replace the returned JSX**

Replace everything from `return (` to the component's closing `)` (lines 81–158) with:

```tsx
  return (
    <section
      ref={ref}
      data-hero-section
      className="relative flex min-h-[100svh] flex-col overflow-hidden bg-cream"
    >
      <div className="mx-auto grid w-full max-w-6xl flex-1 items-center gap-8 px-4 pb-8 pt-20 md:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] md:gap-8 md:pt-24 lg:gap-12">
        {/* ---------------- left: copy, CTAs, featured cards ---------------- */}
        <div data-hero-copy className="relative z-10">
          <h1
            data-ink
            className="text-[2.5rem] font-extrabold leading-[1.05] tracking-tight text-text-primary sm:text-5xl lg:text-6xl"
          >
            {hero.headline.map((line) => (
              <span key={line} className="block overflow-hidden pb-1">
                <span data-hero-line className="block">
                  {line === hero.underlineWord ? (
                    <span className="relative inline-block">
                      {line}
                      <svg
                        data-comb
                        viewBox="0 0 220 30"
                        preserveAspectRatio="none"
                        aria-hidden
                        fill="none"
                        className="absolute -bottom-[0.22em] left-0 h-[0.28em] w-full"
                      >
                        <path
                          d="M4 24 C30 10 44 10 58 22 C70 8 84 8 96 20 C110 6 126 6 138 18 C160 8 190 10 216 22"
                          stroke="#E8202A"
                          strokeWidth="16"
                          strokeLinecap="round"
                        />
                      </svg>
                    </span>
                  ) : (
                    line
                  )}
                </span>
              </span>
            ))}
          </h1>

          <p
            data-hero-sub
            data-ink
            className="mt-5 max-w-md text-base text-text-secondary md:text-lg"
          >
            {hero.sub}
          </p>

          <div
            data-hero-cta
            data-ink
            className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center"
          >
            <Link
              href={hero.ctaPrimary.href}
              className="rounded-full bg-brand-primary px-7 py-3.5 text-center text-sm font-bold text-paper shadow-float transition-transform hover:scale-[1.03] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary active:scale-95"
            >
              {hero.ctaPrimary.label}
            </Link>
            <Link
              href={hero.ctaSecondary.href}
              className="rounded-full border-2 border-text-primary/15 px-7 py-3.5 text-center text-sm font-bold text-text-primary transition-colors hover:border-brand-primary hover:text-brand-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary"
            >
              {hero.ctaSecondary.label}
            </Link>
          </div>

          <div data-hero-featured data-ink className="mt-7">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-text-primary/45">
              Featured in your area
            </p>
            {/* Snap strip on phones, 4-up grid from sm. */}
            <ul className="-mx-4 mt-3 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-4 sm:overflow-visible sm:px-0 sm:pb-0">
              {heroFeatured.map((item) => (
                <li key={item.dish} className="w-[8.5rem] shrink-0 snap-start sm:w-auto">
                  <Image
                    src={item.src}
                    alt={item.alt}
                    width={240}
                    height={180}
                    sizes="(min-width: 768px) 140px, 136px"
                    className="aspect-[4/3] w-full rounded-xl object-cover shadow-card ring-1 ring-text-primary/5"
                  />
                  <p className="mt-2 truncate text-xs font-bold text-text-primary">{item.dish}</p>
                  <p className="truncate text-[11px] text-text-secondary">By {item.cook}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* ---------------- right: layered food composition ---------------- */}
        <div
          data-hero-art
          data-ink
          className="relative mx-auto w-full max-w-[22rem] sm:max-w-[26rem] md:mx-0 md:max-w-none"
        >
          <div className="relative aspect-square overflow-hidden rounded-panel bg-gradient-to-br from-brand-secondary via-amber-mid to-amber-deep shadow-panel">
            <div
              aria-hidden
              className="absolute inset-0 opacity-[0.16] [background-image:radial-gradient(#fff_1px,transparent_1px)] [background-size:14px_14px]"
            />
            <Leaf className="absolute -left-8 top-[18%] w-32 -rotate-[24deg] text-green-deep/70 sm:w-40" />
            <Leaf className="absolute -right-6 bottom-[14%] w-28 rotate-[150deg] text-green-deep/60 sm:w-36" />
            <Image
              src={heroSpecial.image.src}
              alt={heroSpecial.image.alt}
              width={720}
              height={720}
              sizes="(min-width: 1280px) 520px, (min-width: 768px) 44vw, 88vw"
              priority
              className="absolute left-1/2 top-1/2 w-[74%] -translate-x-1/2 -translate-y-1/2 rounded-full object-cover shadow-float ring-8 ring-paper/70"
            />
          </div>

          {/* taped "Today's Special" note */}
          <figure
            data-dish
            data-speed="0.5"
            className="absolute right-0 top-[8%] w-[9.5rem] rotate-3 bg-paper p-3 shadow-float ring-1 ring-text-primary/5 sm:w-44 sm:p-4 md:-right-6 lg:-right-10"
          >
            <span
              aria-hidden
              className="absolute -top-3 left-1/2 h-6 w-16 -translate-x-1/2 -rotate-2 bg-brand-secondary/35"
            />
            <figcaption>
              <span className="block text-lg font-extrabold leading-tight tracking-tight text-text-primary sm:text-xl">
                {heroSpecial.eyebrow}
              </span>
              <span className="mt-1 block text-sm font-bold text-brand-primary">
                {heroSpecial.dish}
              </span>
              <span className="block text-[11px] text-text-secondary">By {heroSpecial.cook}</span>
            </figcaption>
          </figure>

          {/* garnish bowl breaking the panel edge */}
          <div
            data-dish
            data-speed="0.9"
            className="absolute -bottom-5 right-4 w-24 sm:w-32 md:-right-4 lg:w-36"
          >
            <Image
              src={heroSpecial.garnish.src}
              alt={heroSpecial.garnish.alt}
              width={320}
              height={320}
              sizes="(min-width: 1024px) 144px, 96px"
              className="aspect-square w-full rounded-full object-cover shadow-float ring-4 ring-paper"
            />
          </div>
        </div>
      </div>

      {/* bottom strip — inside the section so it lands above the fold */}
      <TrustRibbon />
    </section>
  )
```

- [ ] **Step 6: Type-check, lint, build**

```bash
npx tsc --noEmit && npm run lint && npm run build
```

Expected: `tsc` silent, ESLint exits 0, build succeeds.

- [ ] **Step 7: Run the density gate — this is the hero's acceptance test**

Serve production in one terminal:

```bash
npm run start
```

In another:

```bash
npm run visual:measure -- 1440 900
```

Expected: `GATE PASSED`, exit 0, with `HERO` reporting `fitsAboveFold: true`, `coveragePct` ≥ 78, `largestEmptySquarePx` ≤ 180, and all four quadrants ≥ 35.

The `AMBASSADOR` block will still fail its gates at this point — that is expected and is fixed in Task 9. Confirm the only failures listed are ambassador ones.

**If a hero gate fails, apply these levers in order and re-measure:**
- `fitsAboveFold: false` → reduce `pt-20`/`md:pt-24`, then `mt-7` on the featured block, then the headline step (`lg:text-6xl` → `lg:text-5xl`).
- `coveragePct` low → widen the art column (`1.05fr` → `1.15fr`) and/or raise `max-w-[22rem]` on mobile.
- `largestEmptySquarePx` > 180 → check which quadrant is low; the usual cause is the gap under the CTA row on the left, fixed by reducing `mt-7` on `[data-hero-featured]`.
- A low `br` quadrant → enlarge the garnish bowl (`lg:w-36` → `lg:w-44`).

- [ ] **Step 8: Verify the animations still run**

Run `npm run dev`, hard-reload `http://localhost:3000/`, and watch:
- Headline lines rise in, staggered.
- The red comb underline draws itself under "Homemade."
- Sub, CTAs and the featured strip fade up after the headline.
- The amber panel rises; the note card and garnish bowl pop in with the back-ease.
- Scrolling down at 1440×900: the section pins and both `data-dish` elements drift up at different rates while the copy eases back.

- [ ] **Step 9: Verify the short-viewport pin guard**

In DevTools responsive mode set **1024 × 600** and scroll through the hero.

Expected: the section does **not** pin, and the trust ribbon is fully visible with nothing clipped.

Set **1440 × 900**. Expected: the section **does** pin.

- [ ] **Step 10: Verify overflow at every required width**

```bash
npm run visual:capture -- artifacts/visual/after-hero chromium
```

Then check each captured `fold-*.png` opens without a horizontal scrollbar artifact, and confirm programmatically:

```bash
node -e "
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const ws=[320,375,390,414,768,1024,1280,1440,1728,1920];let bad=0;
for(const w of ws){const p=await b.newPage({viewport:{width:w,height:900}});await p.goto('http://localhost:3000/',{waitUntil:'networkidle'});
const ok=await p.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth);
console.log(w, ok?'OK':'OVERFLOW'); if(!ok)bad++; await p.close();}
await b.close(); process.exit(bad?1:0)})()"
```

Expected: `OK` on all ten widths, exit 0.

- [ ] **Step 11: Verify reduced motion**

DevTools → Rendering → `prefers-reduced-motion: reduce`. Reload.

Expected: the hero fades in once; nothing pins or parallaxes; all content including the ribbon is visible and readable.

- [ ] **Step 12: Commit**

```bash
git add components/marketing/Hero.tsx
git commit -m "feat(marketing): dense two-column hero with featured cards and trust ribbon"
```

---

## Task 6: Eco packaging collage

**Files:**
- Create: `components/marketing/EcoPackCollage.tsx`

**Interfaces:**
- Consumes: `fibre-*`, `paper`, `green-deep`, `cream-deep`, `rounded-pack`, `rounded-frame`, `shadow-card`, `shadow-float` tokens from Task 1.
- Produces: `export function EcoPackCollage(props: { photo?: { src: string; alt: string }; className?: string }): JSX.Element`

**Why the `photo` prop:** the illustration and a future photograph occupy the *identical* outer box — same `aspect-[4/3]`, same `rounded-frame`, same ring. Swapping to real photography is one line at the call site with zero layout change anywhere.

- [ ] **Step 1: Create the file**

```tsx
import Image from 'next/image'
import { cn } from '@/lib/utils'

// The packaging visual. Renders an illustrated collage of moulded-fibre
// containers from CSS + inline SVG so the section ships without waiting on
// product photography. Pass `photo` to swap in a real shot — it fills the
// identical box, so nothing else moves.

function LeafMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className} fill="none">
      <path
        d="M20 4C10 4 4 9 4 16c0 2 .6 3.4 1.4 4.4C8 16 12 13 17 11.6 12.6 14 9 17.4 7.4 21.4c1 .4 2 .6 3.1.6 6 0 9.5-5 9.5-12 0-2.4-.3-4.4 0-6Z"
        fill="currentColor"
      />
    </svg>
  )
}

// One container: a rounded fibre shell with a paper band across it.
function Container({ className, band = true }: { className?: string; band?: boolean }) {
  return (
    <div
      className={cn(
        'relative rounded-pack bg-gradient-to-br from-fibre-light via-fibre-mid to-fibre-dark shadow-float ring-1 ring-fibre-dark/30',
        className
      )}
    >
      <span
        aria-hidden
        className="absolute inset-0 rounded-pack opacity-25 [background-image:repeating-linear-gradient(115deg,rgb(255_255_255_/_0.55)_0_2px,transparent_2px_7px)]"
      />
      <span aria-hidden className="absolute inset-x-2 top-1.5 h-1.5 rounded-full bg-paper/45" />
      {band && (
        <span
          aria-hidden
          className="absolute inset-x-0 top-1/2 flex h-9 -translate-y-1/2 items-center justify-center bg-paper shadow-card"
        >
          <LeafMark className="size-4 text-green-deep" />
        </span>
      )}
    </div>
  )
}

export function EcoPackCollage({
  photo,
  className,
}: {
  photo?: { src: string; alt: string }
  className?: string
}) {
  return (
    <div
      className={cn(
        'relative aspect-[4/3] w-full overflow-hidden rounded-frame bg-gradient-to-br from-cream-deep via-cream to-cream-deep ring-1 ring-text-primary/5',
        className
      )}
    >
      {photo ? (
        <Image
          src={photo.src}
          alt={photo.alt}
          fill
          sizes="(min-width: 1024px) 46vw, 92vw"
          className="object-cover"
        />
      ) : (
        <>
          <span
            aria-hidden
            className="absolute -left-10 -top-10 size-48 rounded-full bg-green-deep/10 blur-2xl"
          />
          <span
            aria-hidden
            className="absolute -bottom-12 -right-8 size-56 rounded-full bg-brand-secondary/20 blur-2xl"
          />

          <LeafMark className="absolute left-[6%] top-[10%] size-10 -rotate-12 text-green-deep/35" />
          <LeafMark className="absolute right-[8%] top-[16%] size-8 rotate-[25deg] text-green-deep/25" />
          <LeafMark className="absolute bottom-[10%] left-[16%] size-9 rotate-[160deg] text-green-deep/30" />

          {/* the cluster — percentage-positioned so it scales with the box */}
          <Container className="absolute left-[8%] top-[26%] h-[26%] w-[34%]" />
          <Container className="absolute right-[9%] top-[20%] h-[30%] w-[32%]" />
          <Container className="absolute left-[30%] top-[44%] h-[34%] w-[42%]" />
          <Container className="absolute bottom-[9%] left-[6%] h-[22%] w-[28%]" band={false} />
          <Container className="absolute bottom-[11%] right-[7%] h-[24%] w-[30%]" band={false} />

          <span
            aria-hidden
            className="absolute inset-x-[10%] bottom-[5%] h-4 rounded-full bg-fibre-dark/25 blur-md"
          />
        </>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Type-check and lint**

```bash
npx tsc --noEmit && npm run lint
```

Expected: `tsc` silent, ESLint exits 0.

- [ ] **Step 3: Commit**

```bash
git add components/marketing/EcoPackCollage.tsx
git commit -m "feat(marketing): add swappable eco packaging collage"
```

---

## Task 7: Packaging showcase section

**Files:**
- Create: `components/marketing/PackagingShowcase.tsx`
- Modify: `app/page.tsx`

**Interfaces:**
- Consumes: `packaging`, `PackagingIconName` from Task 2; `EcoPackCollage` from Task 6; tokens from Task 1.
- Produces: `export function PackagingShowcase(): JSX.Element` — server component. Its root carries `id="packaging"`, which Task 3's capture script targets.

**DOM order is the information hierarchy:** problem eyebrow → solution heading → benefits copy → collage → feature grid → CTA. That is also the mobile stacking order, so the argument reads the same on every screen.

**Known deviation:** the brief's suggested CTA labels ("Learn More" / "Why Packaging Matters") imply a `/packaging` route that does not exist, and this plan must not add routing. `packaging.cta` therefore reads "Order in eco packaging" → `/explore`. If a `/packaging` page is built later, only `lib/marketing-content.ts` changes.

- [ ] **Step 1: Create the file**

```tsx
import Link from 'next/link'
import {
  ArrowRight,
  FlaskConical,
  Globe,
  Leaf,
  Recycle,
  RefreshCw,
  Sprout,
  UtensilsCrossed,
} from 'lucide-react'
import { EcoPackCollage } from '@/components/marketing/EcoPackCollage'
import { packaging, type PackagingIconName } from '@/lib/marketing-content'

const ICONS: Record<PackagingIconName, typeof Leaf> = {
  leaf: Leaf,
  recycle: Recycle,
  flask: FlaskConical,
  utensils: UtensilsCrossed,
  sprout: Sprout,
  globe: Globe,
  refresh: RefreshCw,
}

// Sustainability section, directly under the hero. Server component — fully
// static, and the collage is CSS, so it adds no image request.
export function PackagingShowcase() {
  return (
    <section
      id="packaging"
      aria-labelledby="packaging-heading"
      className="bg-surface px-4 py-section lg:py-section-lg"
    >
      <div className="mx-auto max-w-6xl">
        {/* problem → solution → benefits */}
        <div className="max-w-2xl">
          <p className="inline-flex items-center gap-2 rounded-full bg-green-deep/10 px-3.5 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-green-deep">
            <Leaf aria-hidden className="size-3.5" />
            {packaging.problem}
          </p>
          <h2
            id="packaging-heading"
            className="mt-4 text-3xl font-extrabold tracking-tight text-text-primary md:text-4xl"
          >
            {packaging.heading}
          </h2>
          <p className="mt-3 text-base font-semibold text-text-primary/70 md:text-lg">
            {packaging.sub}
          </p>
        </div>

        <div className="mt-10 grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
          {/* the visual is the section's hero element */}
          <EcoPackCollage />

          <div>
            <p className="max-w-lg text-sm leading-relaxed text-text-secondary">
              {packaging.benefits}
            </p>

            <ul className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {packaging.features.map((feature) => {
                const Icon = ICONS[feature.icon]
                return (
                  <li
                    key={feature.label}
                    className="flex items-center gap-2.5 rounded-xl border border-text-primary/10 bg-cream px-3 py-3 shadow-card"
                  >
                    <Icon
                      aria-hidden
                      className="size-4 shrink-0 text-green-deep"
                      strokeWidth={2.25}
                    />
                    <span className="min-w-0 truncate text-xs font-bold text-text-primary">
                      {feature.label}
                    </span>
                  </li>
                )
              })}
            </ul>

            <Link
              href={packaging.cta.href}
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-green-deep px-7 py-3.5 text-sm font-bold text-paper shadow-float transition-colors hover:bg-green-forest focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-deep"
            >
              {packaging.cta.label}
              <ArrowRight aria-hidden className="size-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Render it in `app/page.tsx`**

Add the import after the `Hero` import (line 4):

```tsx
import { PackagingShowcase } from '@/components/marketing/PackagingShowcase'
```

Change:

```tsx
        <Hero />
        <Marquee />
```

to:

```tsx
        <Hero />
        <PackagingShowcase />
        <Marquee />
```

- [ ] **Step 3: Type-check, lint, build**

```bash
npx tsc --noEmit && npm run lint && npm run build
```

Expected: `tsc` silent, ESLint exits 0, build succeeds.

- [ ] **Step 4: Verify layout and reading order**

Run `npm run start`, open `http://localhost:3000/`.

Verify:
- **1440px**: the section sits between the hero's green ribbon and the red marquee. Header block (eyebrow/heading/sub) spans the top; below it the collage is left, benefits + grid + CTA right. Feature cards form 3+3+1.
- **1024px**: still two columns (the `lg:` breakpoint is 1024).
- **768px**: single column — header, collage, benefits, grid, CTA, in that order top to bottom.
- **375px and 320px**: feature cards 2-up, labels truncate rather than wrap or clip; CTA fully visible.

Confirm the DOM order matches the required hierarchy:

```bash
node -e "
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:390,height:844}});
await p.goto('http://localhost:3000/',{waitUntil:'networkidle'});
const order=await p.evaluate(()=>{const s=document.querySelector('#packaging');
const pick=sel=>{const e=s.querySelector(sel);return e?Math.round(e.getBoundingClientRect().top):null};
return {problem:pick('p'),heading:pick('h2'),collage:pick('.aspect-\\\\[4\\\\/3\\\\]'),grid:pick('ul'),cta:pick('a')}});
console.log(order);
const vals=Object.values(order);
const sorted=vals.every((v,i)=>i===0||v>=vals[i-1]);
console.log(sorted?'ORDER OK':'ORDER WRONG'); await b.close(); process.exit(sorted?0:1)})()"
```

Expected: `ORDER OK`, exit 0 — each element starts at or below the previous one.

- [ ] **Step 5: Verify no overflow at every width**

```bash
node -e "
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const ws=[320,375,390,414,768,1024,1280,1440,1728,1920];let bad=0;
for(const w of ws){const p=await b.newPage({viewport:{width:w,height:900}});await p.goto('http://localhost:3000/',{waitUntil:'networkidle'});
const ok=await p.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth);
console.log(w, ok?'OK':'OVERFLOW'); if(!ok)bad++; await p.close();}
await b.close(); process.exit(bad?1:0)})()"
```

Expected: `OK` on all ten widths, exit 0.

- [ ] **Step 6: Verify keyboard access**

Tab from the hero CTAs through to the packaging CTA.

Expected: a visible green focus ring on the packaging CTA; Enter navigates to `/explore`.

- [ ] **Step 7: Commit**

```bash
git add components/marketing/PackagingShowcase.tsx app/page.tsx
git commit -m "feat(marketing): add eco-friendly packaging showcase section"
```

---

## Task 8: Regenerate the ambassador cut-out (BLOCKING GATE)

**Files:**
- Replace: `public/marketing/ambassador-cutout.png`

**Interfaces:**
- Consumes: nothing.
- Produces: a production-quality transparent PNG at the same path — no code change needed anywhere.

**This task blocks Task 9.** The client's objection is the white halo. No CSS filter reliably removes a baked-in white fringe; the asset itself must be replaced. Do not start Task 9 until Step 4 passes.

- [ ] **Step 1: Run this prompt in ChatGPT image editing with the original athlete photo**

```
Remove the background from this athlete photograph and output a
production-ready transparent PNG.

Masking requirements:
- Preserve every strand of hair, including flyaway strands and the
  hairline against the background — no clumping, no blocked-in silhouette.
- Preserve the fingers individually, including the gaps between them and
  the pointing hand gesture.
- Preserve the shoes completely, including laces, soles and the contact
  edge at the ground.
- Preserve clothing detail: jacket zip, drawstrings, the emblem on the
  chest, cuffs, and the fabric edges at the shoulders and hem.

Edge quality requirements:
- Smooth, anti-aliased alpha edges with natural feathering — roughly a
  one-pixel transition, not a hard binary cut.
- Zero white halo, zero white outline, zero light fringe anywhere on the
  silhouette. Decontaminate any edge pixels that picked up colour from the
  original background.
- No dark outline or over-eroded edge either — do not shrink the subject
  to hide fringing.
- The result must sit convincingly on BOTH a dark background (#191210)
  and a light background (#FFF9F2) with no visible seam on either.

Do not change:
- The pose, the framing, or the proportions.
- Facial features or expression.
- Colours, white balance, contrast, or the direction and softness of the
  original lighting.
- Clothing colour or texture.

Output: a single transparent PNG, subject only, no added shadow, no added
background, no cropping of the head or feet.
```

- [ ] **Step 2: Save it over the existing asset**

Save to `public/marketing/ambassador-cutout.png`, overwriting. Keep the filename so no code changes.

- [ ] **Step 3: Confirm it is a PNG with a real alpha channel**

```bash
node -e "const b=require('fs').readFileSync('public/marketing/ambassador-cutout.png');const ct=b[25];console.log('png:',b.subarray(1,4).toString()==='PNG','colorType:',ct,'bytes:',b.length);process.exit([4,6].includes(ct)?0:1)"
```

Expected: `png: true`, `colorType: 6` (RGBA) or `4` (grey+alpha), exit 0.

A `colorType` of `0` or `2` means **no alpha channel** — the background was flattened. Regenerate.

- [ ] **Step 4: Inspect the edges on both backgrounds — THE GATE**

Create a temporary page at `app/halo-check/page.tsx`:

```tsx
import Image from 'next/image'

export default function HaloCheck() {
  return (
    <div className="grid min-h-screen grid-cols-2">
      <div className="flex items-center justify-center bg-ink-deep">
        <Image src="/marketing/ambassador-cutout.png" alt="" width={640} height={800} />
      </div>
      <div className="flex items-center justify-center bg-cream">
        <Image src="/marketing/ambassador-cutout.png" alt="" width={640} height={800} />
      </div>
    </div>
  )
}
```

Run `npm run dev`, open `http://localhost:3000/halo-check`, zoom to 200%.

On the **dark** half:
- No light outline on hair, shoulders, hands or shoes.
- Hair reads as individual strands, not a solid blob.
- Gaps between fingers are transparent, not filled.
- Shoe soles have a clean edge with no white rim.

On the **light** half:
- No dark halo, no over-eroded edge.
- The silhouette matches the dark half exactly — nothing was shrunk.

**If any check fails, return to Step 1 and regenerate. Do not proceed.**

- [ ] **Step 5: Delete the temporary page**

```bash
rm -rf app/halo-check && ls app/halo-check 2>&1
```

Expected: a "No such file or directory" error.

- [ ] **Step 6: Commit**

```bash
git add public/marketing/ambassador-cutout.png
git commit -m "chore(marketing): replace ambassador cut-out with clean alpha matte"
```

---

## Task 9: Ambassador section redesign

**Files:**
- Modify: `components/marketing/AmbassadorSection.tsx` (imports extended, JSX replaced; the GSAP block is left alone)

**Interfaces:**
- Consumes: `ambassador` (with `eyebrow`, `stats`, `quote`, `cta`) from Task 2; the regenerated PNG from Task 8; tokens from Task 1.
- Produces: `export function AmbassadorSection(): JSX.Element` (signature unchanged). Emits `[data-ambassador-section]` and `[data-amb-stage]` for Task 3's gate, and keeps `[data-amb-copy]`, `[data-amb-polaroid]`, `[data-amb-cutout]` for the existing GSAP tweens.

**Preserve two hard-won animation fixes.** The comments in the current file explain both; both must survive:
1. The copy tween keeps its `:not([data-amb-polaroid])` exclusion, or two tweens fight over the polaroid's opacity.
2. The polaroid tween stays `scrub`-driven, not a one-shot trigger, or it vanishes when the user scrolls back up slightly.

- [ ] **Step 1: Confirm the GSAP block needs no change**

Read the tween at lines 31–38. Its selector is `'[data-amb-copy] > :not([data-amb-polaroid])'`, which automatically covers every new direct child. The new markup in Step 3 keeps the stats row, the blockquote and the CTA as **direct children** of `[data-amb-copy]`, so they animate in with the rest of the copy and **no selector edit is required**.

Make no change to `useGSAP(...)` in this task.

- [ ] **Step 2: Extend the imports**

Add these two lines after the `Image` import (line 8):

```tsx
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
```

- [ ] **Step 3: Replace the returned JSX**

Replace everything from `return (` to the component's closing `)` (lines 57–101) with:

```tsx
  return (
    <section
      ref={ref}
      data-ambassador-section
      className="relative flex min-h-[min(90svh,54rem)] items-stretch overflow-hidden bg-ink-deep px-4 pt-section text-paper lg:pt-section-lg"
    >
      {/* layered backdrop — gradient + glow + texture, never a flat canvas */}
      <div
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(120%_80%_at_15%_0%,var(--color-ink-warm)_0%,var(--color-ink-deep)_55%,#120C0B_100%)]"
      />
      <div
        aria-hidden
        className="absolute right-[-18%] top-1/2 hidden h-[70%] w-[60%] -translate-y-1/2 rounded-full bg-brand-primary/25 blur-3xl md:block"
      />
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.05] [background-image:radial-gradient(#fff_1px,transparent_1px)] [background-size:22px_22px]"
      />

      <div className="relative mx-auto grid w-full max-w-6xl gap-10 md:items-end md:gap-8 lg:grid-cols-[minmax(0,43fr)_minmax(0,57fr)]">
        {/* -------- left: copy → stats → polaroid → CTA -------- */}
        <div data-amb-copy className="pb-12 lg:pb-16">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-brand-secondary">
            {ambassador.eyebrow}
          </p>
          <h2 className="mt-4 text-4xl font-extrabold tracking-tight md:text-5xl">
            {ambassador.heading}
          </h2>
          {ambassador.name && (
            <p className="mt-3 text-lg font-bold text-brand-secondary">{ambassador.name}</p>
          )}
          <p className="mt-2 text-sm font-semibold text-paper/80">{ambassador.title}</p>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-paper/75">{ambassador.body}</p>

          <dl className="mt-7 flex flex-wrap gap-x-8 gap-y-5 border-y border-paper/10 py-5">
            {ambassador.stats.map((stat) => (
              <div key={stat.label}>
                <dt className="sr-only">{stat.label}</dt>
                <dd>
                  <span className="block text-2xl font-extrabold text-brand-secondary">
                    {stat.value}
                  </span>
                  <span className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-paper/70">
                    {stat.label}
                  </span>
                </dd>
              </div>
            ))}
          </dl>

          {ambassador.quote && (
            <blockquote className="mt-6 border-l-2 border-brand-primary pl-4 text-sm italic leading-relaxed text-paper/75">
              {ambassador.quote}
            </blockquote>
          )}

          <figure
            data-amb-polaroid
            className="mt-7 w-40 -rotate-3 bg-paper p-2.5 pb-3 shadow-float sm:w-48 sm:p-3 sm:pb-4"
          >
            <Image
              src={ambassador.images.medals}
              alt="Medals and trophies won by the TESTIO brand ambassador"
              width={448}
              height={560}
              sizes="(min-width: 640px) 192px, 160px"
              className="aspect-[4/5] w-full object-cover object-top"
            />
            <figcaption className="mt-2 text-center text-[11px] font-semibold text-text-primary/70">
              {ambassador.medalsCaption}
            </figcaption>
          </figure>

          <Link
            href={ambassador.cta.href}
            className="mt-7 inline-flex items-center gap-2 rounded-full bg-brand-primary px-7 py-3.5 text-sm font-bold text-paper shadow-float transition-colors hover:bg-red-deep focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-secondary"
          >
            {ambassador.cta.label}
            <ArrowRight aria-hidden className="size-4" />
          </Link>
        </div>

        {/* -------- right: athlete, planted on a stage -------- */}
        <div data-amb-cutout className="relative flex items-end justify-center lg:justify-end">
          {/* stage: a bottom-anchored panel she stands on, not a floating circle */}
          <div
            data-amb-stage
            aria-hidden
            className="absolute bottom-0 left-1/2 h-[86%] w-[88%] -translate-x-1/2 rounded-t-full bg-gradient-to-b from-brand-primary via-red-deep to-red-shadow lg:left-auto lg:right-0 lg:w-[92%] lg:translate-x-0"
          />
          {/* contact shadow so she is planted, not hovering */}
          <div
            aria-hidden
            className="absolute bottom-1 left-1/2 h-6 w-[62%] -translate-x-1/2 rounded-full bg-black/45 blur-xl lg:left-auto lg:right-[12%] lg:translate-x-0"
          />
          <Image
            src={ambassador.images.cutout}
            alt={ambassador.name ?? 'TESTIO brand ambassador'}
            width={640}
            height={800}
            sizes="(min-width: 1280px) 460px, (min-width: 768px) 40vw, 78vw"
            className="relative z-10 h-[clamp(20rem,66svh,42rem)] w-auto object-contain object-bottom drop-shadow-cutout"
          />
        </div>
      </div>
    </section>
  )
```

- [ ] **Step 4: Type-check, lint, build**

```bash
npx tsc --noEmit && npm run lint && npm run build
```

Expected: `tsc` silent, ESLint exits 0, build succeeds.

- [ ] **Step 5: Run the proportion gate — this is the ambassador's acceptance test**

Serve production, then:

```bash
npm run visual:measure -- 1440 900
```

Expected: **`GATE PASSED`, exit 0** — both hero and ambassador gates now satisfied. The `AMBASSADOR` block must report `athleteHeightPct` 70–80, `contentColPct` 40–45, `imageColPct` 55–60, `bottomGapPx` ≤ 24, `rightGapPct` ≤ 15, `midGapPct` ≤ 15.

**If a gate fails, apply these levers and re-measure:**
- `athleteHeightPct` low → raise the `66svh` middle value in the image's `clamp()`.
- `athleteHeightPct` high → lower it, or raise the section's `min-h` from `90svh`.
- `bottomGapPx` > 24 → the left column's `pb-12`/`lg:pb-16` is taller than the image column; reduce it.
- `contentColPct` / `imageColPct` out of band → adjust the `43fr` / `57fr` grid ratio.
- `rightGapPct` > 15 → widen the stage (`lg:w-[92%]` → `lg:w-full`); the strip right of the stage is the exact "empty canvas" the client rejected.
- `midGapPct` > 15 → widen the stage leftward or reduce the grid `gap-8`. A negative value here is good: it means the stage tucks behind the copy column, which is the layered look the brief asks for.

Also run it at 1920×1080:

```bash
npm run visual:measure -- 1920 1080
```

Expected: `GATE PASSED`.

- [ ] **Step 6: Verify the composition by eye**

Open the page and scroll to the section.

At **1440px**: the athlete stands on the red stage with her feet at the section's bottom edge; the stage overlaps the copy column's right edge naturally; no isolated circle; no empty region right of her.

At **768px**: single column — copy above, athlete below on a centred stage; nothing overlaps the copy.

At **375px**: everything stacks; the athlete is at least `20rem` tall (the `clamp` floor) and remains fully visible.

- [ ] **Step 7: Verify the two animation fixes survived**

Scroll the section into view, then up ~100px, then down. Repeat three times.

Expected: the medals polaroid stays visible throughout — it must not blink out. This is the exact regression the `scrub` and `:not()` comments were written to prevent.

- [ ] **Step 8: Verify contrast**

Inspect the body copy (`text-paper/75`) and the stat labels (`text-paper/70` at 11px) against the section background in DevTools.

Expected: computed contrast ≥ 4.5:1 for both. If either falls short, raise the opacity step (`/75` → `/85`, `/70` → `/80`) and re-check. Do not go below 4.5:1 — 11px is small text and gets no large-text exemption.

- [ ] **Step 9: Verify no overflow at every width**

```bash
node -e "
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const ws=[320,375,390,414,768,1024,1280,1440,1728,1920];let bad=0;
for(const w of ws){const p=await b.newPage({viewport:{width:w,height:900}});await p.goto('http://localhost:3000/',{waitUntil:'networkidle'});
const ok=await p.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth);
console.log(w, ok?'OK':'OVERFLOW'); if(!ok)bad++; await p.close();}
await b.close(); process.exit(bad?1:0)})()"
```

Expected: `OK` on all ten widths, exit 0.

- [ ] **Step 10: Commit**

```bash
git add components/marketing/AmbassadorSection.tsx
git commit -m "feat(marketing): rebalance brand ambassador composition"
```

---

## Task 10: Motion and layout-stability QA

**Files:** none modified — verification only.

**Interfaces:**
- Consumes: the completed UI from Tasks 5, 7, 9.
- Produces: frame-rate and CLS evidence for the final report.

- [ ] **Step 1: Measure scroll frame rate**

With production served, run:

```bash
node -e "
const {chromium}=require('playwright');
(async()=>{
const b=await chromium.launch();
const p=await b.newPage({viewport:{width:1440,height:900}});
await p.goto('http://localhost:3000/',{waitUntil:'networkidle'});
const fps=await p.evaluate(()=>new Promise(res=>{
  const frames=[]; let last=performance.now(); let n=0;
  const step=()=>{const t=performance.now();frames.push(t-last);last=t;n++;
    window.scrollBy(0,24);
    if(n<180) requestAnimationFrame(step); else {
      frames.sort((a,b)=>a-b);
      const p50=frames[Math.floor(frames.length*0.5)];
      const p95=frames[Math.floor(frames.length*0.95)];
      res({medianMs:+p50.toFixed(2),p95Ms:+p95.toFixed(2),
           medianFps:Math.round(1000/p50),longFrames:frames.filter(f=>f>20).length});
    }};
  requestAnimationFrame(step);
}));
console.log(fps);
await b.close();
process.exit(fps.medianFps>=55?0:1)})()"
```

Expected: `medianFps` ≥ 55 (i.e. essentially 60 with sampling noise), `longFrames` low. Record the numbers.

If `medianFps` is below 55, profile in DevTools Performance and look for non-composited properties. Every GSAP tween in this plan animates `y`, `scale` and `opacity` only, all compositor-friendly — a low score points at image decode or the `blur-3xl` backdrop, in which case reduce the blur radius.

- [ ] **Step 2: Measure cumulative layout shift**

```bash
node -e "
const {chromium}=require('playwright');
(async()=>{
const b=await chromium.launch();
const p=await b.newPage({viewport:{width:1440,height:900}});
await p.goto('http://localhost:3000/',{waitUntil:'load'});
const cls=await p.evaluate(()=>new Promise(res=>{
  let total=0;
  new PerformanceObserver(l=>{for(const e of l.getEntries()) if(!e.hadRecentInput) total+=e.value;})
    .observe({type:'layout-shift',buffered:true});
  setTimeout(()=>res(+total.toFixed(4)),4000);
}));
console.log('CLS',cls);
await b.close();
process.exit(cls<=0.1?0:1)})()"
```

Expected: `CLS` ≤ 0.1 (Google's "good" threshold), exit 0. Record the value.

- [ ] **Step 3: Check for flicker on the three new/changed sections**

Reload with DevTools open and watch each section enter:
- Hero: content must not flash at full opacity before the entrance tween starts.
- Packaging: no animation is attached; it must simply be present with no flash.
- Ambassador: cutout and polaroid fade in smoothly and stay put when scrolling back up.

- [ ] **Step 4: Check for animation conflicts**

Scroll the whole page top → bottom → top twice, slowly, then quickly.

Expected: no element ends up stuck invisible, at the wrong offset, or fighting between two tweens. Particular attention to the hero pin releasing into the packaging section and to the polaroid.

- [ ] **Step 5: Record the results**

Write the FPS and CLS numbers into the final report (Task 12). No commit — nothing changed.

---

## Task 11: Cross-browser and Lighthouse gates

**Files:** none modified unless a gate fails.

**Interfaces:**
- Consumes: the completed UI.
- Produces: cross-engine screenshots and four Lighthouse scores.

**Safari limitation — read this first.** This machine runs Windows 11. **Real Safari cannot be installed or run on Windows** (Apple discontinued Safari for Windows in 2012). Playwright's `webkit` engine is the closest available proxy — it is the same WebKit rendering core, but it is not Safari: it differs in JavaScriptCore build, default fonts, media stack and some CSS behaviours. Therefore Safari is verified **by proxy only**, and this must be stated as an open item, not ticked off. A genuine Safari pass requires a macOS or iOS device.

- [ ] **Step 1: Install the remaining engines**

```bash
npx playwright install firefox webkit
```

Expected: both download and install, exit 0.

- [ ] **Step 2: Capture the final evidence set across all engines**

With production served:

```bash
npm run visual:capture -- artifacts/visual/final
```

Expected: `captured:` lines for `chromium`, `chrome`, `msedge`, `firefox`, `webkit`. Any engine that cannot launch prints a `skip` line — record which, if any.

- [ ] **Step 3: Verify no overflow in Firefox and WebKit**

```bash
node -e "
const {firefox,webkit}=require('playwright');
(async()=>{let bad=0;
for(const [n,e] of [['firefox',firefox],['webkit',webkit]]){
  const b=await e.launch();
  for(const w of [375,768,1024,1440,1920]){
    const p=await b.newPage({viewport:{width:w,height:900}});
    await p.goto('http://localhost:3000/',{waitUntil:'networkidle'});
    const ok=await p.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth);
    console.log(n,w,ok?'OK':'OVERFLOW'); if(!ok)bad++;
    await p.close();}
  await b.close();}
process.exit(bad?1:0)})()"
```

Expected: `OK` on every line, exit 0.

- [ ] **Step 4: Compare engines for visual regressions**

Open `artifacts/visual/final/chromium/fold-1440.png`, `.../firefox/fold-1440.png` and `.../webkit/fold-1440.png` side by side.

Expected: identical layout. Acceptable differences are font rasterisation and gradient banding only. Any difference in element position, size, wrap point or visibility is a regression and must be fixed.

Repeat for `ambassador-1440.png` and `packaging-1440.png`.

- [ ] **Step 5: Run Lighthouse against the production build**

```bash
npx lighthouse http://localhost:3000/ --only-categories=performance,accessibility,best-practices,seo --preset=desktop --output=json --output-path=artifacts/lighthouse-desktop.json --chrome-flags="--headless" --quiet
```

Then print the scores:

```bash
node -e "const r=require('./artifacts/lighthouse-desktop.json');const c=r.categories;const s=k=>Math.round(c[k].score*100);const out={performance:s('performance'),accessibility:s('accessibility'),bestPractices:s('best-practices'),seo:s('seo')};console.log(out);const fail=out.performance<90||out.accessibility<95||out.bestPractices<95||out.seo<95;console.log(fail?'LIGHTHOUSE GATE FAILED':'LIGHTHOUSE GATE PASSED');process.exit(fail?1:0)"
```

Expected: `LIGHTHOUSE GATE PASSED` — Performance ≥ 90, Accessibility ≥ 95, Best Practices ≥ 95, SEO ≥ 95.

**If a category fails, read `artifacts/lighthouse-desktop.json` for the failing audits and fix before continuing.** Likely causes and fixes, given what this plan changed:
- *Performance* — the hero LCP image. Confirm `priority` is still set on `heroSpecial.image` and that `sizes` matches its rendered width; oversized `sizes` makes Next serve a needlessly large source.
- *Accessibility* — contrast on `text-paper/70` in the ambassador stats, or on `text-text-primary/45` on the "Featured in your area" label. Raise the opacity step.
- *Best Practices* — any console error; check Task 12 Step 2.
- *SEO* — `app/layout.tsx` has `title` and `description` but no `metadataBase`. If Lighthouse flags it, that file is on the do-not-modify list, so record it as a pre-existing issue outside this plan's scope rather than editing it.

- [ ] **Step 6: Run Lighthouse on mobile**

```bash
npx lighthouse http://localhost:3000/ --only-categories=performance,accessibility,best-practices,seo --output=json --output-path=artifacts/lighthouse-mobile.json --chrome-flags="--headless" --quiet
```

```bash
node -e "const r=require('./artifacts/lighthouse-mobile.json');const c=r.categories;const s=k=>Math.round(c[k].score*100);console.log({performance:s('performance'),accessibility:s('accessibility'),bestPractices:s('best-practices'),seo:s('seo')})"
```

Record the mobile scores. The stated gate is for desktop; report mobile as supplementary evidence and flag any category below the desktop thresholds.

---

## Task 12: Final evidence pack and acceptance

**Files:** none modified — verification and reporting only.

- [ ] **Step 1: Clean production build**

```bash
rm -rf .next && npm run build
```

Expected: `✓ Compiled successfully`, no TypeScript errors, no ESLint errors, `/` still listed in the route table.

- [ ] **Step 2: Console must be clean**

Serve production, open with DevTools, hard-reload, scroll top to bottom.

Expected: zero errors and zero React warnings. Verify programmatically too:

```bash
node -e "
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1440,height:900}});
const errs=[];p.on('console',m=>{if(m.type()==='error'||m.type()==='warning')errs.push(m.type()+': '+m.text())});
p.on('pageerror',e=>errs.push('pageerror: '+e.message));
await p.goto('http://localhost:3000/',{waitUntil:'networkidle'});
await p.evaluate(async()=>{for(let y=0;y<document.body.scrollHeight;y+=400){window.scrollTo(0,y);await new Promise(r=>setTimeout(r,80))}});
console.log(errs.length?errs.join('\n'):'CONSOLE CLEAN');
await b.close();process.exit(errs.length?1:0)})()"
```

Expected: `CONSOLE CLEAN`, exit 0.

- [ ] **Step 3: Re-run both measured gates at two sizes**

```bash
npm run visual:measure -- 1440 900 && npm run visual:measure -- 1920 1080
```

Expected: `GATE PASSED` both times.

- [ ] **Step 4: Regression-walk everything the brief said not to break**

Click through and confirm each still works:
- Navbar **Explore** → `/explore`; **Become a Cook** → jumps to `#become-a-cook`; **Login** → `/login`.
- Navbar goes solid on scroll, transparent at the top.
- Hero **Explore kitchens near you** → `/explore`; **Order now** → `/login`.
- Packaging **Order in eco packaging** → `/explore`.
- Marquee scrolls continuously and speeds up on fast scroll.
- How It Works pins and crossfades the three phone screenshots.
- Kitchens teaser: **Use my location** prompts for geolocation; the location search box returns results; cook cards render; **See all kitchens** → `/explore`.
- Ambassador **Eat like a champion** → `/explore`.
- Become a Cook renders with its three bullets.
- Footer links resolve.

- [ ] **Step 5: Full keyboard pass**

Tab from the top of the page to the bottom without the mouse.

Expected: visible focus on every interactive element in a sensible order; nothing focusable but invisible (in particular nothing hidden behind the pinned hero).

- [ ] **Step 6: Reduced-motion pass**

DevTools → Rendering → `prefers-reduced-motion: reduce`. Reload, scroll the whole page.

Expected: no pinning, no parallax, no marquee acceleration; every section fully visible and readable.

- [ ] **Step 7: Assemble the before/after comparison**

Place these side by side and write one factual sentence per pair — what changed, measured:

| Pair | Baseline | Final |
|---|---|---|
| Hero desktop | `artifacts/visual/baseline/chromium/fold-1440.png` | `artifacts/visual/final/chromium/fold-1440.png` |
| Hero mobile | `artifacts/visual/baseline/chromium/fold-390.png` | `artifacts/visual/final/chromium/fold-390.png` |
| Packaging | *(absent — section did not exist)* | `artifacts/visual/final/chromium/packaging-1440.png` |
| Ambassador desktop | `artifacts/visual/baseline/chromium/ambassador-1440.png` | `artifacts/visual/final/chromium/ambassador-1440.png` |
| Ambassador tablet | `artifacts/visual/baseline/chromium/ambassador-768.png` | `artifacts/visual/final/chromium/ambassador-768.png` |
| Full page | `artifacts/visual/baseline/chromium/full-1440.png` | `artifacts/visual/final/chromium/full-1440.png` |

Each statement must cite a number from `visual:measure`, Lighthouse, or the FPS/CLS runs — not an adjective. Example of an acceptable claim: "hero coverage rose from *(unmeasurable — no section hook)* to 81%, largest empty block 140px, section 838px inside a 900px viewport so the ribbon is above the fold." Example of an unacceptable claim: "the hero now looks much richer."

- [ ] **Step 8: Compare the final hero against Image 1 on the eight named axes**

Open `artifacts/visual/final/chromium/fold-1440.png` beside Image 1 and judge each axis as match / partial / miss: spacing, typography, whitespace, CTA placement, featured cards, image composition, trust strip, visual density.

Any axis marked *miss* means the hero is not complete — return to Task 5 Step 7's lever list, fix, and re-measure.

- [ ] **Step 9: Fill in the acceptance checklist**

Complete the table below from the evidence gathered. Every row needs a command output, a measured number, or a named screenshot. **Any row that cannot be evidenced makes the whole task NOT COMPLETE.**

- [ ] **Step 10: Confirm the tree is clean**

```bash
git status --short
```

Expected: only untracked `artifacts/` (which `.gitignore` covers, so nothing should appear). If `app/halo-check` or `app/token-probe` reappear, delete them.

---

## Acceptance Checklist

Fill from evidence. Do not tick anything not personally observed.

### Client acceptance — Hero
| Item | Evidence |
|---|---|
| Empty space eliminated | `visual:measure` coverage ≥78%, largest empty square ≤180px (Task 5 Step 7) |
| Food imagery dominates | `fold-1440.png`; art column is 1.05fr of the grid (Task 5 Step 5) |
| Hero visually richer | Baseline vs final `fold-1440.png` (Task 12 Step 7) |
| Premium first impression | Image 1 axis comparison (Task 12 Step 8) |
| Above the fold incl. ribbon | `fitsAboveFold: true` (Task 5 Step 7) |

### Client acceptance — Packaging
| Item | Evidence |
|---|---|
| Eco packaging clearly showcased | `packaging-1440.png` (Task 11 Step 2) |
| Sustainability communicated | 7-feature grid + benefits copy (Task 7 Step 4) |
| Premium composition, not a poster | Image 2 mapping table (Phase 0); one CTA, single-hue palette |
| Reading order Problem→…→CTA | `ORDER OK` (Task 7 Step 4) |
| Responsive | Overflow check all 10 widths (Task 7 Step 5) |

### Client acceptance — Ambassador
| Item | Evidence |
|---|---|
| Background removal clean | Task 8 Step 4 dual-background inspection |
| No white halo | Task 8 Step 4 |
| Smooth transparent edges | Task 8 Steps 3–4 (`colorType` 6 + visual) |
| Athlete emphasised | `athleteHeightPct` 70–80 (Task 9 Step 5) |
| Less empty canvas | `bottomGapPx` ≤24, `rightGapPct` ≤15, `midGapPct` ≤15, columns 43/57 (Task 9 Step 5) |
| Premium composition | `ambassador-1440.png` (Task 11 Step 2) |

### Overall
| Item | Evidence |
|---|---|
| No TypeScript errors | Task 12 Step 1 |
| No ESLint issues | Task 12 Step 1 |
| Production build passes | Task 12 Step 1 |
| No console errors | `CONSOLE CLEAN` (Task 12 Step 2) |
| Responsive at all 10 breakpoints | Tasks 5/7/9 overflow checks |
| 60 FPS, no jank | `medianFps` (Task 10 Step 1) |
| No layout shift | `CLS` ≤0.1 (Task 10 Step 2) |
| No animation conflicts | Task 10 Steps 3–4 |
| Existing animations preserved | Task 5 Step 8, Task 9 Step 7 |
| Existing functionality / routing / navigation | Task 12 Step 4 |
| Keyboard + reduced motion | Task 12 Steps 5–6 |
| Lighthouse ≥90/95/95/95 | `LIGHTHOUSE GATE PASSED` (Task 11 Step 5) |
| Cross-browser Chrome/Edge/Firefox | Task 11 Steps 2–4 |
| Cross-browser **Safari** | **Cannot be verified on Windows — see limitation 1** |

---

## Known Limitations

1. **Safari cannot be verified on this machine.** Windows 11 cannot run Safari; Apple discontinued the Windows build in 2012. Task 11 uses Playwright's WebKit, which shares the rendering core but differs in JS engine build, default fonts and media stack. **Safari must be signed off separately on a macOS or iOS device.** Do not tick the Safari row.
2. **No automated tests.** The repo has no test runner and this plan adds none. Verification is type-check, lint, build, scripted Playwright gates, and manual walkthrough. Regressions in untouched sections are caught only by the Task 12 Step 4 walkthrough.
3. **Playwright is a new devDependency** (~1GB of browser binaries across three engines). It is dev-only and never imported by application code, so the production bundle is unaffected — but it is a real addition to the repo, made because screenshot evidence and cross-browser validation are impossible without it. Chromium alone is sufficient through Task 10.
4. **Hero featured cards use placeholder cook names.** `heroFeatured` is illustrative and marked TODO. Wiring it to `get_nearby_cooks` was rejected because a fetch above the fold adds a loading state and hurts LCP. Real approved cooks must be substituted before public launch.
5. **`heroSpecial` dish and cook are placeholders** for the same reason, with the same TODO.
6. **Packaging visual is illustrated, not photographic.** Real photography drops in via `EcoPackCollage`'s `photo` prop with no layout change, but until then the section shows a stylised representation.
7. **Packaging CTA points to `/explore`.** The brief's suggested labels imply a page that does not exist, and routing is out of scope. `packaging.cta` is the single place to change it.
8. **Ambassador CTA also points to `/explore`** for the same reason.
9. **Hero pin is viewport-guarded.** Below 768px wide or 720px tall the hero parallaxes without pinning, so the pinned effect is not seen on phones or short landscape windows. This is required to keep the trust ribbon above the fold and unclipped.
10. **Ambassador quote is omitted.** `ambassador.quote` is `null` because attributing an invented quote to a real athlete is a fabrication. The blockquote renders as soon as a real, approved quote is supplied.
11. **Ambassador stats derive only from existing approved copy** (`title` and `body`). No new achievement claims were introduced.
12. **Task 8 depends on an external tool.** The cut-out must be regenerated by a human in ChatGPT image editing; this plan cannot produce the asset. Task 9 is blocked until Task 8 Step 4 passes.
13. **The "≤10% visual deviation from Image 1" criterion is not numerically measurable.** No pixel-diff against a third-party reference image is meaningful when the content, copy, palette and photography all legitimately differ. It is replaced by the eight-axis structured comparison in Task 12 Step 8 plus the numeric density gate — which is stricter in the ways that matter and honest about what it does not measure.

---

## Final Completion Status

**STATUS: NOT COMPLETE — this document is a plan, not an implementation.**

- No code has been written. No checklist row has been evidenced.
- Task 8 additionally requires a human to regenerate the ambassador cut-out in an external tool before Task 9 can begin.
- The Safari row of the acceptance checklist **cannot be satisfied on this machine** and will remain open after implementation finishes (limitation 1).
