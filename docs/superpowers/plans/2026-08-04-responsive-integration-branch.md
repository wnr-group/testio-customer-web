# Unified Responsive Integration Branch (Desktop + Mobile) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Produce a new `feat/responsive-final` branch that renders the client-approved desktop homepage from `feat/redesginhomepage` pixel-for-pixel at `>=1024px`, and the client-approved mobile homepage from `feat/mobileversion` at `<1024px`, without ever committing to either source branch.

**Architecture:** `feat/mobileversion` is **not** an independently-diverged branch — it is `feat/redesginhomepage` (their tip commits are identical: `1bf6f02`) plus one squashed commit, `4131201 "testio web mobile version"`. That means there is no git merge conflict to resolve anywhere; the two branches are fast-forward compatible. The real risk this plan addresses is that the squashed commit, while mostly a careful and correctly-gated mobile-optimization pass, contains two concrete defects and some out-of-scope reach that a naive merge would silently carry into production:

1. **`Hero.tsx` and `AmbassadorSection.tsx`** were restructured into two DOM subtrees gated by `gsap.matchMedia('(min-width: 1024px)')` / `(max-width: 1023px)` — a good, correct pattern — but the `>=1024px` ("desktop") subtree in both files was **not** copied from `feat/redesginhomepage`. Its code comments claim "EXACT MAIN BRANCH," but `origin/main`'s `Hero.tsx` is byte-identical to `feat/redesginhomepage`'s (verified: `git diff feat/redesginhomepage..origin/main -- components/marketing/Hero.tsx` is empty), and neither file matches what's actually inside the "desktop" blocks. The desktop blocks render a different layout with hardcoded hex colors instead of this codebase's design tokens. This plan replaces those two blocks with the verbatim `feat/redesginhomepage` markup and GSAP animation, adapted only to be scoped to their new container (`desktopContainer.querySelectorAll(...)` instead of the original single-tree `container.querySelectorAll(...)`).
2. **`lib/gsap.ts` and `components/providers.tsx`** both globally monkey-patch `Node.prototype.removeChild`/`insertBefore` app-wide — a duplicated workaround for a DOM-reconciliation error, not a fix. Per user decision, this plan root-causes and removes it rather than carrying it forward.
3. Five unrelated `app/(auth|browse|public)/**/page.tsx` copy-only edits are out of scope per user decision and are reverted to their `feat/redesginhomepage` content in the integration branch. The `components/ui/sheet.tsx` / `components/layout/Navbar.tsx` `nativeButton` compat fix is kept (user decision — it is plausibly load-bearing for the new `Sheet`-based mobile nav drawer).

Everything else in the squashed commit (`PublicNavbar.tsx`, `KitchensTeaser.tsx`, `HowItWorks.tsx`, `BecomeCook.tsx`, `LocationSearchBox.tsx`, `LoginPromptSheet.tsx`, `MarketingFooter.tsx`, `PackagingShowcase.tsx`, `TrustRibbon.tsx`, `lib/marketing-content.ts`, `app/globals.css`, `package.json`, `scripts/verify-responsive.mjs`, `scripts/visual-capture.mjs`) is additive, correctly gated with Tailwind `sm:`/`md:` classes that revert to the exact original value at breakpoint, and already reviewed against the real diffs during planning — those tasks are verification-only, with one small exception in `HowItWorks.tsx`.

**Tech Stack:** Next.js 16 (App Router), React 19, Tailwind CSS v4 (`@theme inline`, no `tailwind.config.*`), GSAP 3 + `@gsap/react`'s `useGSAP`/`gsap.matchMedia`, `@base-ui/react` (shadcn `sheet.tsx`), Playwright (devDependency only, used as a scripting library — no test runner in this repo).

## Global Constraints

- **Never commit to, rebase, force-push, or squash `feat/redesginhomepage` or `feat/mobileversion`.** All work happens only on a new branch, `feat/responsive-final`.
- **No new production dependency.** Verify with `node -e "console.log(Object.keys(require('./package.json').dependencies).length)"` — must print `17` throughout this plan (confirmed count on both source branches).
- **No test runner exists.** Verification commands are `npx tsc --noEmit`, `npm run lint`, `npm run build`, `node scripts/verify-responsive.mjs` (requires the dev server running on `http://localhost:3001` and Playwright's Chromium browser installed locally — confirmed not yet installed in this environment).
- **Desktop (`>=1024px`) must render byte-identical JSX/classes to `feat/redesginhomepage`.** Mobile (`<1024px`, or each component's own pre-existing breakpoint convention) must retain `feat/mobileversion`'s mobile UX unchanged.
- **The DOM monkey-patch is removed, not carried forward** (user decision: root-cause and replace).
- **The 5 unrelated page-copy edits are dropped; the `sheet.tsx`/`Navbar.tsx` compat fix is kept** (user decision).
- Every task's diff must be checked against `git diff feat/redesginhomepage..feat/mobileversion -- <file>` — that is the ground truth of what changed and why.

---

## File Structure

| File | Action | Responsibility |
|---|---|---|
| `feat/responsive-final` (branch) | Create | Only place any of this work happens |
| `components/marketing/Hero.tsx` | Fix | Replace the fabricated `>=1024px` block with verbatim `feat/redesginhomepage` markup + GSAP; keep the `<1024px` mobile block from `feat/mobileversion` untouched |
| `components/marketing/AmbassadorSection.tsx` | Fix | Same fix pattern |
| `components/marketing/HowItWorks.tsx` | Fix | Restore two GSAP values (`0.5` opacity, `y:24`, breathing-room tween) the squashed commit altered inside the same block that still runs at `>=1024px` |
| `lib/gsap.ts` | Fix | Remove the global `removeChild`/`insertBefore` monkey-patch; root-cause the actual DOM error it was masking |
| `components/providers.tsx` | Fix | Remove the duplicated copy of the same monkey-patch |
| `app/(auth)/addresses/page.tsx`, `app/(auth)/home/page.tsx`, `app/(browse)/explore/page.tsx`, `app/(public)/agreement/page.tsx`, `app/(public)/login/page.tsx` | Revert | Restore to `feat/redesginhomepage` content — drop the out-of-scope copy edits |
| `components/marketing/PublicNavbar.tsx`, `KitchensTeaser.tsx`, `BecomeCook.tsx`, `LocationSearchBox.tsx`, `LoginPromptSheet.tsx`, `MarketingFooter.tsx`, `PackagingShowcase.tsx`, `TrustRibbon.tsx` | Verify only | Confirm each additive `sm:`/`md:` diff reverts correctly at breakpoint — no code change expected |
| `components/ui/sheet.tsx`, `components/layout/Navbar.tsx` | Keep | `nativeButton` compat fix, kept per user decision |
| `lib/marketing-content.ts` | Verify only | Em-dash/copy fixes and `ambassador.stats` reorder — confirm intentional, no code change expected |
| `scripts/verify-responsive.mjs`, `scripts/visual-capture.mjs`, `package.json` | Keep | Already-built, already-committed verification tooling |

---

# Task 1: Create the integration branch

**Files:**
- None modified — git operations only

**Interfaces:**
- Produces: local branch `feat/responsive-final`, containing every commit from `feat/mobileversion` on top of `feat/redesginhomepage`, ready for Task 2 onward.

- [ ] **Step 1: Confirm both source branches are untouched and in sync with origin**

```bash
git fetch origin
git status -sb
git rev-parse feat/redesginhomepage origin/feat/redesginhomepage
git rev-parse feat/mobileversion origin/feat/mobileversion
```

Expected: `git status -sb` shows a clean working tree. Both `rev-parse` pairs print two identical hashes each (local == origin, no unpushed local work on either backup branch). If any pair differs, stop and investigate before proceeding — do not touch either branch.

- [ ] **Step 2: Confirm the fast-forward relationship (no merge conflicts possible)**

```bash
git merge-base feat/redesginhomepage feat/mobileversion
git rev-parse feat/redesginhomepage
```

Expected: both commands print the same hash (`1bf6f02f1c0903ef4c21280c06dcd5bbddb6f93d` at time of writing). This confirms `feat/redesginhomepage` is the exact merge-base of `feat/mobileversion` — merging will fast-forward cleanly with zero conflicts.

- [ ] **Step 3: Create the integration branch and merge**

```bash
git checkout feat/redesginhomepage
git pull origin feat/redesginhomepage
git checkout -b feat/responsive-final
git merge --no-ff feat/mobileversion -m "Merge feat/mobileversion into feat/responsive-final integration branch"
```

`--no-ff` is used deliberately (even though the merge would fast-forward by default) so the integration branch keeps an explicit commit marking where `feat/mobileversion` was pulled in, before Tasks 2–8 layer corrective commits on top.

- [ ] **Step 4: Verify the source branches are still untouched**

```bash
git rev-parse feat/redesginhomepage feat/mobileversion
```

Expected: identical hashes to Step 1 — neither backup branch moved.

- [ ] **Step 5: Commit**

The merge commit from Step 3 is the commit for this task; there is nothing further to stage.

---

# Task 2: Revert the 5 out-of-scope page-copy edits

**Files:**
- Modify: `app/(auth)/addresses/page.tsx`
- Modify: `app/(auth)/home/page.tsx`
- Modify: `app/(browse)/explore/page.tsx`
- Modify: `app/(public)/agreement/page.tsx`
- Modify: `app/(public)/login/page.tsx`

**Interfaces:**
- Consumes: the merge commit from Task 1.
- Produces: these 5 files byte-identical to `feat/redesginhomepage`; every other file introduced by the merge is untouched.

- [ ] **Step 1: Confirm what's currently different from `feat/redesginhomepage`**

```bash
git diff feat/redesginhomepage..HEAD -- "app/(auth)/addresses/page.tsx" "app/(auth)/home/page.tsx" "app/(browse)/explore/page.tsx" "app/(public)/agreement/page.tsx" "app/(public)/login/page.tsx"
```

Expected: 5 small diffs, each replacing an em dash (`—`) with a comma, colon, or parentheses (cosmetic copy edits, e.g. `"...you — tap a pin..."` → `"...you. Tap a pin..."`). These are the only differences; confirm no other content changed.

- [ ] **Step 2: Restore the 5 files to `feat/redesginhomepage`'s content**

```bash
git checkout feat/redesginhomepage -- "app/(auth)/addresses/page.tsx" "app/(auth)/home/page.tsx" "app/(browse)/explore/page.tsx" "app/(public)/agreement/page.tsx" "app/(public)/login/page.tsx"
```

- [ ] **Step 3: Verify the revert**

```bash
git diff feat/redesginhomepage..HEAD -- "app/(auth)/addresses/page.tsx" "app/(auth)/home/page.tsx" "app/(browse)/explore/page.tsx" "app/(public)/agreement/page.tsx" "app/(public)/login/page.tsx"
```

Expected: empty output — these 5 files are now byte-identical to `feat/redesginhomepage`.

- [ ] **Step 4: Commit**

```bash
git add "app/(auth)/addresses/page.tsx" "app/(auth)/home/page.tsx" "app/(browse)/explore/page.tsx" "app/(public)/agreement/page.tsx" "app/(public)/login/page.tsx"
git commit -m "Revert out-of-scope copy edits outside the marketing homepage"
```

---

# Task 3: Root-cause and remove the global DOM monkey-patch

**Files:**
- Modify: `lib/gsap.ts`
- Modify: `components/providers.tsx`
- Create (temporary, deleted in Step 5): `scripts/repro-dom-error.mjs`

**Interfaces:**
- Consumes: a running dev server at `http://localhost:3001`.
- Produces: `lib/gsap.ts` and `components/providers.tsx` with no `Node.prototype` overrides; a documented root cause for whatever error the patch was masking.

This is a genuine investigation, not a scripted fix — use the **superpowers:systematic-debugging** skill for the diagnosis loop in Steps 2–4. The steps below give the concrete repro tooling and the most-likely hypothesis to test first; if the captured stack trace points somewhere else, follow it there instead.

- [ ] **Step 1: Confirm the patch exists in two places and is otherwise identical**

```bash
git diff feat/redesginhomepage..HEAD -- lib/gsap.ts components/providers.tsx
```

Expected: both files show the identical ~24-line block inserted near the top:

```ts
if (typeof window !== 'undefined') {
  const originalRemoveChild = Node.prototype.removeChild
  Node.prototype.removeChild = function <T extends Node>(child: T): T {
    if (child && child.parentNode !== this) {
      if (child.parentNode) {
        return child.parentNode.removeChild(child) as T
      }
      return child
    }
    return originalRemoveChild.call(this, child) as T
  }

  const originalInsertBefore = Node.prototype.insertBefore
  Node.prototype.insertBefore = function <T extends Node>(newNode: T, referenceNode: Node | null): T {
    if (referenceNode && referenceNode.parentNode !== this) {
      if (referenceNode.parentNode) {
        return referenceNode.parentNode.insertBefore(newNode, referenceNode) as T
      }
      return this.appendChild(newNode) as T
    }
    return originalInsertBefore.call(this, newNode, referenceNode) as T
  }
}
```

- [ ] **Step 2: Temporarily disable both copies to expose the real error**

In `lib/gsap.ts` and `components/providers.tsx`, comment out the block from Step 1 (don't delete yet — Step 5 removes it for good once the real fix is in). This lets the underlying `removeChild`/`insertBefore` error throw normally instead of being silently redirected.

- [ ] **Step 3: Write the reproduction script**

Create `scripts/repro-dom-error.mjs`:

```js
// scripts/repro-dom-error.mjs
// One-off diagnostic for the removeChild/insertBefore error that
// lib/gsap.ts and components/providers.tsx were patching around.
// Repeatedly crosses the Hero/AmbassadorSection 1024px matchMedia
// boundary (which tears down and re-creates GSAP ScrollTrigger pins
// on both sides) while also opening/closing the mobile nav Sheet, and
// captures any uncaught page error. Delete this file once Task 3 is
// resolved — it is not part of the permanent verification suite.
// Usage: node scripts/repro-dom-error.mjs
import { chromium } from 'playwright'

const BASE = process.env.BASE_URL ?? 'http://localhost:3001'

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1100, height: 900 } })

const errors = []
page.on('pageerror', (err) => errors.push(err.stack ?? String(err)))
page.on('console', (msg) => {
  if (msg.type() === 'error') errors.push(msg.text())
})

await page.goto(BASE, { waitUntil: 'networkidle' })

// Cross the 1024px boundary repeatedly, scrolling in between so any
// pinned ScrollTrigger actually mounts/unmounts its pin-spacer.
for (let i = 0; i < 15; i++) {
  await page.setViewportSize({ width: i % 2 === 0 ? 900 : 1100, height: 900 })
  await page.mouse.wheel(0, 400)
  await page.waitForTimeout(150)
  await page.mouse.wheel(0, -400)
  await page.waitForTimeout(150)
}

// Also stress the mobile Sheet open/close if present at the current width.
await page.setViewportSize({ width: 375, height: 900 })
const trigger = page.locator('[data-touch-target="nav-hamburger"]')
if ((await trigger.count()) > 0) {
  for (let i = 0; i < 5; i++) {
    await trigger.click()
    await page.waitForTimeout(200)
    const close = page.locator('[data-touch-target="nav-drawer-login"]').first()
    if ((await close.count()) > 0) await page.keyboard.press('Escape')
    await page.waitForTimeout(200)
  }
}

await browser.close()

if (errors.length) {
  console.error(`REPRO CAPTURED ${errors.length} ERROR(S):\n`)
  for (const e of errors) console.error(e, '\n---')
  process.exitCode = 1
} else {
  console.log('No errors captured — could not reproduce with this protocol. Widen the repro (try scrolling further, or triggering a route change) before concluding the patch is unnecessary.')
}
```

- [ ] **Step 4: Run it against the dev server and capture the real stack trace**

```bash
npm run dev
# in a second terminal, once the server is up on :3001:
node scripts/repro-dom-error.mjs
```

Read the captured stack trace. The most likely source, given this codebase's structure: `Hero.tsx` and `AmbassadorSection.tsx` each keep **both** their desktop and mobile subtrees permanently mounted (toggled with `hidden`/`block` CSS, not conditional rendering), while `gsap.matchMedia` tears down and rebuilds a `ScrollTrigger` pin (which inserts its own `.pin-spacer` wrapper directly into the DOM) on the *desktop* subtree every time the viewport crosses 1024px. If the stack trace confirms this (look for `pin-spacer` in the trace, or the error firing at/near a viewport-size change), apply the fix in Step 5's first option. If the trace instead points at the `Sheet`/dialog primitive or something else entirely, apply the equivalent scoped fix at that real call site instead — do not reintroduce the global patch.

- [ ] **Step 5: Apply the scoped fix and permanently remove the monkey-patch**

If Step 4 confirms the ScrollTrigger pin-spacer hypothesis, add an explicit teardown before each `matchMedia` context is torn down, instead of relying on GSAP's default revert timing. In both `Hero.tsx` and `AmbassadorSection.tsx`'s `useGSAP` setup, the fix is to call `ScrollTrigger.getAll().forEach((t) => t.kill())` scoped to the container losing its match, immediately before that container's content becomes `hidden`. Since Tasks 4–5 rewrite the animation setup in both files anyway, apply this alongside those rewrites and re-run `node scripts/repro-dom-error.mjs` (Step 2's patch still commented out) until it reports no captured errors. Once confirmed clean:

Delete the block from Step 1 in both files entirely (not just commented out) in `lib/gsap.ts` and `components/providers.tsx`, and delete the diagnostic script:

```bash
rm scripts/repro-dom-error.mjs
```

- [ ] **Step 6: Verify no other reference to the removed script or patch remains**

```bash
git status -sb
grep -rn "removeChild\|insertBefore" lib/gsap.ts components/providers.tsx
```

Expected: `grep` finds no matches (only whatever unrelated code may legitimately reference DOM APIs elsewhere is fine — there should be zero references to a patched `Node.prototype` in these two files).

- [ ] **Step 7: Commit**

```bash
git add lib/gsap.ts components/providers.tsx
git commit -m "Remove global DOM monkey-patch; root-cause and fix at the source"
```

(If Step 5's fix required edits inside `Hero.tsx`/`AmbassadorSection.tsx`, those are committed as part of Tasks 4 and 5 instead, once those tasks land — note that dependency here and merge appropriately.)

---

# Task 4: Fix Hero.tsx's desktop block

**Files:**
- Modify: `components/marketing/Hero.tsx`

**Interfaces:**
- Consumes: `hero`, `heroFeatured`, `heroSpecial` from `lib/marketing-content.ts` (unchanged); `TrustRibbon` from `components/marketing/TrustRibbon.tsx` (unchanged); `Leaf` from `components/marketing/icons`.
- Produces: a `Hero` component whose `[data-hero-desktop]` subtree (active at `>=1024px`) is byte-identical in JSX/classes to `feat/redesginhomepage`'s `Hero.tsx`, and whose `[data-hero-mobile]` subtree (active at `<1024px`) is unchanged from the current integration branch.

- [ ] **Step 1: Capture the current (defective) desktop rendering as evidence**

```bash
npm run dev
# in a second terminal:
node scripts/visual-capture.mjs 1440
```

Note the output path (e.g. `visual-captures/1440/...png`). Open it — you'll see a full-viewport centered hero with floating dish photos on a `#FFF9F2` background and "Scroll to taste" — not the two-column layout with the "Featured in your area" cards, taped note, and garnish bowl. This is the defect this task fixes.

- [ ] **Step 2: Confirm the defect against source**

```bash
git diff feat/redesginhomepage..HEAD -- components/marketing/Hero.tsx | head -40
```

Expected: the diff shows the `data-hero-desktop` block using hardcoded hex classes (`bg-[#FFF9F2]`, `text-[#1A1A1A]`, `bg-[#E8202A]`) instead of this codebase's design tokens (`bg-cream`, `text-text-primary`, `bg-brand-primary`) that `feat/redesginhomepage` uses.

- [ ] **Step 3: Replace the file with the corrected implementation**

Replace the full contents of `components/marketing/Hero.tsx` with:

```tsx
'use client'

// Dual-viewport hero component:
// Desktop (>=1024px): verbatim feat/redesginhomepage two-column hero —
// headline rises in, the rooster-comb underline draws itself under
// "Homemade.", and the taped note and garnish bowl parallax at different
// speeds while the section is pinned (only where it fits the viewport).
// Mobile (<1024px): feat/mobileversion's mobile-optimized stacked hero art
// with touch-friendly featured cards and trust ribbon.

import { useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { gsap, useGSAP, ScrollTrigger } from '@/lib/gsap'
import { hero, heroFeatured, heroSpecial } from '@/lib/marketing-content'
import { TrustRibbon } from '@/components/marketing/TrustRibbon'
import { Leaf } from '@/components/marketing/icons'

export function Hero() {
  const ref = useRef<HTMLElement>(null)
  const desktopPinRef = useRef<HTMLDivElement>(null)
  const mobilePinRef = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      if (!ref.current) return
      const container = ref.current
      const mm = gsap.matchMedia()
      const desktopContainer = container.querySelector<HTMLElement>('[data-hero-desktop]')
      const mobileContainer = container.querySelector<HTMLElement>('[data-hero-mobile]')

      // ---------------- DESKTOP (>=1024px) — verbatim feat/redesginhomepage ----------------
      mm.add('(min-width: 1024px) and (prefers-reduced-motion: no-preference)', () => {
        if (!desktopContainer) return

        const path = desktopContainer.querySelector<SVGPathElement>('[data-comb] path')
        if (path) {
          const len = path.getTotalLength()
          gsap.set(path, { strokeDasharray: len, strokeDashoffset: len })
          gsap.to(path, { strokeDashoffset: 0, duration: 0.9, ease: 'power2.out', delay: 0.7 })
        }

        const lines = desktopContainer.querySelectorAll('[data-hero-line]')
        if (lines.length > 0) {
          gsap.from(lines, { yPercent: 110, duration: 0.8, stagger: 0.12, ease: 'power3.out' })
        }

        const subCtaFeatured = desktopContainer.querySelectorAll('[data-hero-sub], [data-hero-cta], [data-hero-featured]')
        if (subCtaFeatured.length > 0) {
          gsap.from(subCtaFeatured, { y: 24, opacity: 0, duration: 0.6, stagger: 0.1, delay: 0.5, ease: 'power2.out' })
        }

        const heroArt = desktopContainer.querySelectorAll('[data-hero-art]')
        if (heroArt.length > 0) {
          gsap.from(heroArt, { y: 40, opacity: 0, duration: 0.8, delay: 0.2, ease: 'power3.out' })
        }

        const dishes = desktopContainer.querySelectorAll('[data-dish]')
        if (dishes.length > 0) {
          gsap.from(dishes, { scale: 0.7, opacity: 0, duration: 0.7, stagger: 0.1, delay: 0.55, ease: 'back.out(1.6)' })
        }
      })

      // Pin only where the whole composition fits the viewport (verbatim original gate).
      mm.add(
        '(prefers-reduced-motion: no-preference) and (min-width: 1024px) and (min-height: 720px)',
        () => {
          if (!desktopContainer || !desktopPinRef.current) return
          const tl = gsap.timeline({
            scrollTrigger: {
              trigger: desktopContainer,
              start: 'top top',
              end: '+=70%',
              scrub: true,
              pin: desktopPinRef.current,
            },
          })
          const pinDishes = desktopContainer.querySelectorAll<HTMLElement>('[data-dish]')
          pinDishes.forEach((el) => {
            tl.to(el, { y: -Number(el.dataset.speed || 0) * 120, ease: 'none' }, 0)
          })
          const heroCopy = desktopContainer.querySelector('[data-hero-copy]')
          if (heroCopy) {
            tl.to(heroCopy, { y: -60, ease: 'none' }, 0)
          }

          return () => {
            ScrollTrigger.getAll()
              .filter((t) => t.trigger === desktopContainer)
              .forEach((t) => t.kill())
          }
        }
      )

      // ---------------- MOBILE (<1024px) — feat/mobileversion, unchanged ----------------
      mm.add('(max-width: 1023px) and (prefers-reduced-motion: no-preference)', () => {
        if (!mobileContainer) return

        const path = mobileContainer.querySelector<SVGPathElement>('[data-comb] path')
        if (path) {
          const len = path.getTotalLength()
          gsap.set(path, { strokeDasharray: len, strokeDashoffset: len })
          gsap.to(path, { strokeDashoffset: 0, duration: 0.9, ease: 'power2.out', delay: 0.7 })
        }

        const lines = mobileContainer.querySelectorAll('[data-hero-line]')
        if (lines.length > 0) {
          gsap.from(lines, { yPercent: 110, duration: 0.8, stagger: 0.12, ease: 'power3.out' })
        }

        const subCtaFeatured = mobileContainer.querySelectorAll('[data-hero-sub], [data-hero-cta], [data-hero-featured]')
        if (subCtaFeatured.length > 0) {
          gsap.from(subCtaFeatured, { y: 24, opacity: 0, duration: 0.6, stagger: 0.1, delay: 0.5, ease: 'power2.out' })
        }

        const heroArt = mobileContainer.querySelectorAll('[data-hero-art]')
        if (heroArt.length > 0) {
          gsap.from(heroArt, { y: 40, opacity: 0, duration: 0.8, delay: 0.2, ease: 'power3.out' })
        }

        const dishes = mobileContainer.querySelectorAll('[data-dish]')
        if (dishes.length > 0) {
          gsap.from(dishes, { scale: 0.7, opacity: 0, duration: 0.7, stagger: 0.1, delay: 0.55, ease: 'back.out(1.6)' })
        }
      })

      mm.add('(prefers-reduced-motion: reduce)', () => {
        gsap.from(container, { opacity: 0, duration: 0.4 })
      })
    },
    { scope: ref }
  )

  return (
    <section ref={ref}>
      {/* ================= DESKTOP HERO (>=1024px) — verbatim feat/redesginhomepage ================= */}
      <div data-hero-desktop className="hidden lg:block">
        <div
          ref={desktopPinRef}
          data-hero-section
          className="relative flex min-h-[100svh] flex-col overflow-hidden bg-cream pt-24 sm:pt-28 lg:pt-32"
        >
          <div className="mx-auto grid w-full max-w-6xl flex-1 items-center gap-6 px-3 md:grid-cols-[48%_52%] lg:gap-12">
            {/* ---------------- left: copy, CTAs, featured cards ---------------- */}
            <div data-hero-copy className="relative z-10">
              <h1
                data-ink
                className="max-w-[12em] text-4xl font-extrabold leading-[0.95] tracking-tight text-text-primary sm:text-5xl lg:text-[clamp(50px,4.5vw,72px)]"
              >
                {hero.headline.map((line) => (
                  <span key={line} className="block overflow-hidden pb-[0.5em] -mb-[0.5em]">
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
                className="mt-6 max-w-md text-xs text-text-secondary md:text-base"
              >
                {hero.sub}
              </p>

              <div
                data-hero-cta
                data-ink
                className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center"
              >
                <Link
                  href={hero.ctaPrimary.href}
                  className="rounded-full bg-brand-primary px-7 py-3 text-center text-sm font-bold text-paper shadow-float transition-transform hover:scale-[1.03] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary active:scale-95"
                >
                  {hero.ctaPrimary.label}
                </Link>
                <Link
                  href={hero.ctaSecondary.href}
                  className="rounded-full border-2 border-text-primary/15 px-7 py-3 text-center text-sm font-bold text-text-primary transition-colors hover:border-brand-primary hover:text-brand-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary"
                >
                  {hero.ctaSecondary.label}
                </Link>
              </div>

              <div data-hero-featured data-ink className="mt-4">
                <p className="text-sm font-bold uppercase tracking-[0.18em] text-text-primary/45">
                  Featured in your area
                </p>
                {/* Snap strip on phones, 4-up grid from sm. */}
                <ul className="-mx-4 mt-4 flex snap-x snap-mandatory gap-6 overflow-x-auto px-4 pb-4 sm:mx-0 sm:grid sm:grid-cols-4 sm:gap-6 sm:overflow-visible sm:px-0 sm:pb-0">
                  {heroFeatured.map((item, index) => (
                    <li key={item.dish} className="group w-[9rem] shrink-0 snap-start sm:w-auto">
                      <div className="overflow-hidden rounded-xl shadow-card ring-1 ring-text-primary/5 transition-shadow duration-300 group-hover:shadow-float">
                        <Image
                          src={item.src}
                          alt={item.alt}
                          width={240}
                          height={180}
                          sizes="(min-width: 768px) 150px, 144px"
                          priority={index < 2}
                          className="aspect-[4/3] w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      </div>
                      <p className="mt-3 text-[15px] font-bold leading-tight text-text-primary line-clamp-2">{item.dish}</p>
                      <p className="mt-0.5 text-sm font-medium text-text-secondary line-clamp-2">By {item.cook}</p>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* ---------------- right: layered food composition ---------------- */}
            <div
              data-hero-art
              data-ink
              className="relative mx-auto w-full sm:mx-0 md:mx-0"
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
                  className="absolute left-1/2 top-1/2 w-[68%] -translate-x-1/2 -translate-y-1/2 rounded-full object-cover shadow-float ring-8 ring-paper/70"
                />
              </div>

              {/* taped "Today's Special" note */}
              <figure
                data-dish
                data-speed="0.5"
                className="absolute right-0 top-[6%] w-[8.5rem] rotate-2 bg-paper p-3 shadow-float ring-1 ring-text-primary/5 sm:w-36 sm:p-4 md:-right-4 lg:-right-8 lg:w-40"
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
                className="absolute -bottom-4 right-4 w-20 sm:w-28 md:-right-2 lg:w-32"
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
        </div>
      </div>

      {/* ================= MOBILE HERO (<1024px) — feat/mobileversion, unchanged ================= */}
      <div data-hero-mobile className="block lg:hidden">
        <div
          ref={mobilePinRef}
          data-hero-section
          className="relative flex min-h-[100svh] flex-col overflow-hidden bg-cream pt-14 sm:pt-16"
        >
          <div data-ink className="mx-auto grid w-full max-w-6xl flex-1 items-start md:items-center gap-6 px-4 sm:px-3 md:grid-cols-[48%_52%] pb-6 md:pb-0">
            <div data-hero-copy data-ink className="relative z-10 min-w-0 w-full max-w-full md:-mt-12">
              <h1
                data-ink
                className="max-w-[12em] text-4xl font-extrabold leading-[0.95] tracking-tight text-text-primary sm:text-5xl"
              >
                {hero.headline.map((line) => (
                  <span key={line} className="block overflow-hidden pb-[0.5em] -mb-[0.5em]">
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
                className="mt-6 w-full max-w-full pr-4 text-base text-text-secondary break-words [overflow-wrap:break-word] md:max-w-md md:pr-0"
              >
                {hero.sub}
              </p>

              <div
                data-hero-cta
                data-ink
                className="mt-2 flex flex-col gap-2 w-full max-w-full sm:flex-row sm:items-center sm:w-auto"
              >
                <Link
                  href={hero.ctaPrimary.href}
                  data-touch-target="hero-cta-primary"
                  className="flex min-h-[48px] w-full items-center justify-center rounded-full bg-brand-primary px-6 py-3.5 text-center text-sm font-bold text-paper shadow-float transition-transform hover:scale-[1.03] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary active:scale-95 sm:w-auto sm:py-3"
                >
                  {hero.ctaPrimary.label}
                </Link>
                <Link
                  href={hero.ctaSecondary.href}
                  data-touch-target="hero-cta-secondary"
                  className="flex min-h-[48px] w-full items-center justify-center rounded-full border-2 border-text-primary/15 px-6 py-3.5 text-center text-sm font-bold text-text-primary transition-colors hover:border-brand-primary hover:text-brand-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary sm:w-auto sm:py-3"
                >
                  {hero.ctaSecondary.label}
                </Link>
              </div>

              <div data-hero-featured data-ink className="relative mt-4">
                <p className="text-sm font-bold uppercase tracking-[0.18em] text-text-primary/45">
                  Featured in your area
                </p>

                {/* Mobile Auto-Scroll Motion Track */}
                <div className="relative mt-4 overflow-hidden -mx-4 px-4 sm:hidden">
                  <div className="flex w-max gap-6 animate-hero-featured-scroll">
                    {[...heroFeatured, ...heroFeatured].map((item, index) => (
                      <div key={`${item.dish}-${index}`} className="group w-[9rem] min-w-[9rem] shrink-0">
                        <div className="overflow-hidden rounded-xl shadow-card ring-1 ring-text-primary/5 transition-shadow duration-300 group-hover:shadow-float">
                          <Image
                            src={item.src}
                            alt={item.alt}
                            width={240}
                            height={180}
                            sizes="144px"
                            priority={index < 2}
                            className="aspect-[4/3] w-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        </div>
                        <p className="mt-3 text-[15px] font-bold leading-tight text-text-primary truncate">{item.dish}</p>
                        <p className="mt-0.5 text-sm font-medium text-text-secondary truncate">By {item.cook}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tablet 4-up Grid */}
                <ul className="hidden mt-4 sm:grid sm:grid-cols-4 sm:gap-6">
                  {heroFeatured.map((item, index) => (
                    <li key={item.dish} className="group sm:w-auto sm:min-w-0">
                      <div className="overflow-hidden rounded-xl shadow-card ring-1 ring-text-primary/5 transition-shadow duration-300 group-hover:shadow-float">
                        <Image
                          src={item.src}
                          alt={item.alt}
                          width={240}
                          height={180}
                          sizes="(min-width: 768px) 150px, 144px"
                          priority={index < 2}
                          className="aspect-[4/3] w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      </div>
                      <p className="mt-3 text-[15px] font-bold leading-tight text-text-primary truncate">{item.dish}</p>
                      <p className="mt-0.5 text-sm font-medium text-text-secondary truncate">By {item.cook}</p>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div
              data-hero-art
              data-ink
              className="relative mx-auto w-full mb-6 sm:mx-0 sm:mb-0 md:mx-0 md:-mt-12"
            >
              <div className="relative aspect-square overflow-hidden rounded-panel bg-gradient-to-br from-brand-secondary via-amber-mid to-amber-deep shadow-panel">
                <div
                  aria-hidden
                  className="absolute inset-0 opacity-[0.16] [background-image:radial-gradient(#fff_1px,transparent_1px)] [background-size:14px_14px]"
                />
                <Leaf className="absolute -left-2 top-[18%] w-32 -rotate-[24deg] text-green-deep/70 sm:-left-8 sm:w-40" />
                <Leaf className="absolute right-0 bottom-[14%] w-28 rotate-[150deg] text-green-deep/60 sm:-right-6 sm:w-36" />
                <Image
                  src={heroSpecial.image.src}
                  alt={heroSpecial.image.alt}
                  width={720}
                  height={720}
                  sizes="(min-width: 768px) 44vw, 88vw"
                  priority
                  className="absolute left-1/2 top-1/2 w-[68%] -translate-x-1/2 -translate-y-1/2 rounded-full object-cover shadow-float ring-8 ring-paper"
                />
              </div>

              <figure
                data-dish
                data-ink
                data-speed="0.5"
                className="absolute right-2 top-[6%] w-[8.5rem] rotate-2 bg-paper p-3 shadow-float ring-1 ring-text-primary/5 sm:right-0 sm:w-36 sm:p-4 md:-right-4"
              >
                <span
                  aria-hidden
                  className="absolute -top-3 left-1/2 h-6 w-16 -translate-x-1/2 -rotate-2 bg-brand-secondary/35"
                />
                <figcaption>
                  <span className="block text-lg font-extrabold leading-tight tracking-tight text-text-primary sm:text-xl">
                    {heroSpecial.eyebrow}
                  </span>
                  <span className="mt-1 block text-xs font-semibold text-text-secondary">
                    {heroSpecial.dish} &bull; {heroSpecial.cook}
                  </span>
                </figcaption>
              </figure>

              <div
                data-dish
                data-ink
                data-speed="0.9"
                className="absolute bottom-2 right-4 w-20 sm:-bottom-4 sm:w-28 md:-right-2"
              >
                <Image
                  src={heroSpecial.garnish.src}
                  alt={heroSpecial.garnish.alt}
                  width={320}
                  height={320}
                  sizes="96px"
                  className="aspect-square w-full rounded-full object-cover shadow-float ring-4 ring-paper"
                />
              </div>
            </div>
          </div>

          <TrustRibbon />
        </div>
      </div>
    </section>
  )
}
```

Note what changed from the fabricated version: the `DISH_LAYOUT` constant and `heroDishes` import are removed entirely (they only existed to feed the fabricated design — `heroDishes` is pre-existing, unused-elsewhere content in `lib/marketing-content.ts` and does not need to be touched or removed from that file). `ScrollTrigger` is re-imported from `@/lib/gsap` (needed for the explicit pin cleanup added in Task 3 Step 5).

- [ ] **Step 4: Type-check and lint**

```bash
npx tsc --noEmit
npm run lint
```

Expected: no errors. If `tsc` reports `heroDishes`/`DISH_LAYOUT` as unused, confirm they were fully removed from this file (they should be — this file no longer imports or references them).

- [ ] **Step 5: Confirm the fix visually**

```bash
node scripts/visual-capture.mjs 1440
```

Compare against `feat/redesginhomepage`'s own capture — the two-column layout, "Featured in your area" cards, taped note, and garnish bowl should now be present at 1440px, matching the client-approved design instead of the fabricated one from Step 1.

- [ ] **Step 6: Commit**

```bash
git add components/marketing/Hero.tsx
git commit -m "Fix Hero.tsx desktop block to render feat/redesginhomepage verbatim"
```

---

# Task 5: Fix AmbassadorSection.tsx's desktop block

**Files:**
- Modify: `components/marketing/AmbassadorSection.tsx`

**Interfaces:**
- Consumes: `ambassador` from `lib/marketing-content.ts` (unchanged).
- Produces: an `AmbassadorSection` component whose `[data-amb-desktop]` subtree (`>=1024px`) is byte-identical in JSX/classes to `feat/redesginhomepage`'s `AmbassadorSection.tsx`, and whose `[data-amb-mobile]` subtree (`<1024px`) is unchanged from the current integration branch.

- [ ] **Step 1: Capture the current (defective) desktop rendering as evidence**

```bash
node scripts/visual-capture.mjs 1440
```

Compare against `feat/redesginhomepage`'s own capture of the same section. The current integration branch renders a dark `#191210` background with a large red circular arc — `feat/redesginhomepage`'s approved design uses a light background with soft circular rings, a noise texture overlay, and a "Desktop Achievement Gallery" of three rotated polaroid-style cards.

- [ ] **Step 2: Replace the file with the corrected implementation**

Replace the full contents of `components/marketing/AmbassadorSection.tsx` with:

```tsx
'use client'

// Dual-viewport ambassador component:
// Desktop (>=1024px): verbatim feat/redesginhomepage — light background,
// soft circular rings, noise texture overlay, premium stats cards, and a
// rotated three-card achievement gallery around the cutout figure.
// Mobile (<1024px): feat/mobileversion's mobile-optimized achievement
// carousel and testimonial card.

import { useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, Quote } from 'lucide-react'
import { gsap, useGSAP, ScrollTrigger } from '@/lib/gsap'
import { ambassador } from '@/lib/marketing-content'

export function AmbassadorSection() {
  const ref = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      if (!ref.current) return
      const container = ref.current
      const mm = gsap.matchMedia()
      const desktopContainer = container.querySelector<HTMLElement>('[data-amb-desktop]')
      const mobileContainer = container.querySelector<HTMLElement>('[data-amb-mobile]')

      // ---------------- DESKTOP (>=1024px) — verbatim feat/redesginhomepage ----------------
      mm.add('(min-width: 1024px) and (prefers-reduced-motion: no-preference)', () => {
        if (!desktopContainer) return

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: desktopContainer,
            start: 'top 75%',
          },
        })

        const staggers = desktopContainer.querySelectorAll('[data-amb-stagger]')
        if (staggers.length > 0) {
          tl.fromTo(
            staggers,
            { y: 30, opacity: 0 },
            { y: 0, opacity: 1, stagger: 0.1, duration: 0.8, ease: 'power3.out' }
          )
        }

        const quoteTargets = desktopContainer.querySelectorAll('[data-amb-quote]')
        if (quoteTargets.length > 0) {
          tl.fromTo(
            quoteTargets,
            { x: -30, opacity: 0 },
            { x: 0, opacity: 1, duration: 0.8, ease: 'power3.out' },
            '-=0.4'
          )
        }

        const glow = desktopContainer.querySelectorAll('[data-amb-glow]')
        if (glow.length > 0) {
          gsap.to(glow, {
            scale: 1.05,
            opacity: 0.8,
            duration: 4,
            repeat: -1,
            yoyo: true,
            ease: 'sine.inOut',
          })
        }

        const ring = desktopContainer.querySelectorAll('[data-amb-ring]')
        if (ring.length > 0) {
          gsap.to(ring, {
            y: -50,
            rotation: 5,
            ease: 'none',
            scrollTrigger: {
              trigger: desktopContainer,
              start: 'top bottom',
              end: 'bottom top',
              scrub: true,
            },
          })
        }

        const ambHero = desktopContainer.querySelectorAll('[data-amb-hero]')
        if (ambHero.length > 0) {
          gsap.fromTo(
            ambHero,
            { y: 60, opacity: 0, scale: 0.98 },
            {
              y: 0, opacity: 1, scale: 1, duration: 1.2, ease: 'power3.out',
              scrollTrigger: { trigger: desktopContainer, start: 'top 75%' },
            }
          )
        }

        const ambHeroImg = desktopContainer.querySelectorAll('[data-amb-hero] img')
        if (ambHeroImg.length > 0) {
          gsap.to(ambHeroImg, {
            y: -3,
            duration: 3,
            repeat: -1,
            yoyo: true,
            ease: 'sine.inOut',
          })
        }

        const cards = desktopContainer.querySelectorAll('[data-amb-card]')
        if (cards.length > 0) {
          gsap.fromTo(
            cards,
            { y: 40, opacity: 0 },
            {
              y: 0, opacity: 1, stagger: 0.15, duration: 1, ease: 'power3.out',
              scrollTrigger: { trigger: desktopContainer, start: 'top 60%' },
            }
          )
        }

        return () => {
          ScrollTrigger.getAll()
            .filter((t) => t.trigger === desktopContainer)
            .forEach((t) => t.kill())
        }
      })

      // ---------------- MOBILE (<1024px) — feat/mobileversion, unchanged ----------------
      mm.add('(max-width: 1023px) and (prefers-reduced-motion: no-preference)', () => {
        if (!mobileContainer) return

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: mobileContainer,
            start: 'top 75%',
          },
        })

        const staggers = mobileContainer.querySelectorAll('[data-amb-stagger]')
        if (staggers.length > 0) {
          tl.fromTo(
            staggers,
            { y: 30, opacity: 0 },
            { y: 0, opacity: 1, stagger: 0.1, duration: 0.8, ease: 'power3.out' }
          )
        }

        const ambHero = mobileContainer.querySelectorAll('[data-amb-hero]')
        if (ambHero.length > 0) {
          gsap.fromTo(
            ambHero,
            { y: 60, opacity: 0, scale: 0.98 },
            {
              y: 0, opacity: 1, scale: 1, duration: 1.2, ease: 'power3.out',
              scrollTrigger: { trigger: mobileContainer, start: 'top 75%' },
            }
          )
        }
      })
    },
    { scope: ref }
  )

  return (
    <section ref={ref}>
      {/* ================= DESKTOP AMBASSADOR (>=1024px) — verbatim feat/redesginhomepage ================= */}
      <div
        data-amb-desktop
        data-ambassador-section
        className="relative hidden lg:flex min-h-[min(100svh,65rem)] w-full items-center overflow-hidden bg-[--color-bg-base] px-4 py-24 md:py-32"
      >
        {/* Background Layers */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,var(--color-brand-primary)_0%,var(--color-bg-base)_100%)] opacity-[0.03]" />

        {/* Soft circular rings behind everything */}
        <div
          data-amb-ring
          className="absolute right-[5%] top-[10%] h-[800px] w-[800px] rounded-full border border-black/[0.03] lg:right-[15%] lg:top-[20%]"
        />
        <div
          data-amb-ring
          className="absolute right-[10%] top-[15%] h-[600px] w-[600px] rounded-full border border-black/[0.04] lg:right-[20%] lg:top-[25%]"
        />

        <div
          data-amb-glow
          className="absolute bottom-0 right-[10%] h-[70vh] w-[70vh] bg-[radial-gradient(circle_at_center,rgba(232,32,42,0.08)_0%,transparent_60%)] mix-blend-multiply blur-[80px]"
        />

        {/* Tiny particles / noise pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.03] mix-blend-overlay"
          style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")' }}
        />

        <div className="relative mx-auto grid w-full max-w-[90rem] gap-16 lg:grid-cols-12 lg:items-center">
          {/* Left Side: Content */}
          <div className="relative z-20 flex flex-col justify-center lg:col-span-5 lg:pl-8 xl:pl-16">
            <p data-amb-stagger className="text-xs font-black uppercase tracking-[0.25em] text-[--color-brand-secondary]">
              {ambassador.eyebrow}
            </p>

            <h2 data-amb-stagger className="mt-4 text-5xl font-black leading-[1.05] tracking-tight text-text-primary md:text-6xl xl:text-7xl">
              {ambassador.heading}
            </h2>

            <div data-amb-stagger data-amb-copy className="mt-8 flex flex-col gap-1 border-l-[3px] border-[--color-brand-primary]/50 pl-5">
              {ambassador.name && (
                <p className="text-xl font-bold tracking-tight text-text-primary">{ambassador.name}</p>
              )}
              <p className="text-sm font-semibold text-text-secondary">{ambassador.title}</p>
            </div>

            <p data-amb-stagger className="mt-8 max-w-lg text-lg leading-relaxed text-text-secondary">
              {ambassador.body}
            </p>

            {/* Premium Stats Cards */}
            <div data-amb-stagger className="mt-10 grid gap-4 sm:grid-cols-3">
              {ambassador.stats.map((stat) => {
                const labelParts = stat.label.split(' ')
                const firstWord = labelParts[0]
                const restWords = labelParts.slice(1).join(' ')
                return (
                  <div
                    key={stat.label}
                    className="group relative flex h-full flex-col items-center justify-center gap-3 overflow-hidden rounded-2xl border border-black/5 bg-white p-5 text-center shadow-[0_2px_10px_rgba(0,0,0,0.03)] transition-all duration-300 hover:-translate-y-1 hover:border-black/10 hover:shadow-md"
                  >
                    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-black/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                    <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-black/[0.03] text-2xl transition-transform duration-300 group-hover:scale-110">
                      {stat.value === '🇮🇳' ? (
                        <img
                          src="https://flagcdn.com/w160/in.png"
                          alt="India Flag"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        stat.value
                      )}
                    </div>
                    <div>
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-text-secondary/70">
                        {firstWord}
                      </span>
                      <span className="block text-sm font-bold text-text-primary">
                        {restWords}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Premium Testimonial Card */}
            {ambassador.quote && (
              <div data-amb-quote className="relative mt-12 overflow-hidden rounded-2xl border border-[--color-brand-secondary]/20 bg-surface/80 p-8 shadow-card backdrop-blur-xl">
                <div className="absolute left-0 top-0 h-full w-[2px] bg-[--color-brand-primary]/70" />
                <Quote className="absolute right-6 top-6 h-20 w-20 text-black/[0.03]" />
                <p className="relative z-10 text-lg italic leading-relaxed text-text-secondary">
                  &quot;{ambassador.quote}&quot;
                </p>
              </div>
            )}

            <div data-amb-stagger className="mt-12">
              <Link
                href={ambassador.cta.href}
                className="group relative inline-flex items-center justify-center gap-3 overflow-hidden rounded-full bg-brand-primary px-8 py-4 text-sm font-bold text-cream shadow-card transition-all duration-300 hover:scale-[1.02] hover:shadow-float focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-secondary"
              >
                <span className="absolute inset-0 -translate-x-[100%] bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 ease-in-out group-hover:translate-x-[100%]" />
                <span className="relative">{ambassador.cta.label}</span>
                <ArrowRight aria-hidden className="relative size-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </div>

          {/* Right Side: Visual */}
          <div data-amb-stage className="relative z-10 mt-16 flex h-[500px] w-full items-end justify-center lg:col-span-7 lg:mt-0 lg:h-[800px] xl:h-[900px] lg:justify-center">
            <div data-amb-cutout className="relative flex h-[95%] w-full max-w-[450px] xl:max-w-[500px] items-end justify-center">
              {/* Grounding floor shadow */}
              <div className="absolute bottom-0 left-1/2 h-8 w-[130%] -translate-x-1/2 rounded-[100%] bg-black/90 blur-2xl" />

              {/* Hero Image */}
              <div data-amb-hero className="relative z-20 h-full w-full pt-8">
                <Image
                  src={ambassador.images.cutout}
                  alt={ambassador.name ?? 'TESTIO brand ambassador'}
                  fill
                  sizes="(min-width: 1024px) 40vw, 100vw"
                  className="object-contain object-bottom drop-shadow-[0_20px_40px_rgba(0,0,0,0.7)] p-4 pt-12 contrast-[1.03] saturate-[0.97]"
                />
              </div>

              {/* Desktop Achievement Gallery */}
              <div className="absolute inset-0 z-30 pointer-events-none [&>*]:pointer-events-auto">
                <div
                  data-amb-card
                  className="absolute -left-[25%] top-[12%] xl:-left-[30%] xl:top-[12%] -rotate-[3deg]"
                >
                  <AchievementCard
                    src={ambassador.images.portrait1}
                    alt="Competition Portrait"
                    title="Competition"
                  />
                </div>

                <div
                  data-amb-card
                  className="absolute -right-[25%] top-[40%] xl:-right-[30%] xl:top-[40%] rotate-[4deg]"
                >
                  <AchievementCard
                    src={ambassador.images.medals}
                    alt="Medal Ceremony"
                    title="Honors"
                  />
                </div>

                <div
                  data-amb-card
                  className="absolute -left-[10%] bottom-[12%] xl:-left-[15%] xl:bottom-[12%] rotate-[2deg]"
                >
                  <AchievementCard
                    src={ambassador.images.portrait2}
                    alt="Trophy Collection"
                    title="Triumphs"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ================= MOBILE AMBASSADOR (<1024px) — feat/mobileversion, unchanged ================= */}
      <div
        data-amb-mobile
        className="block lg:hidden relative flex min-h-[min(100svh,65rem)] w-full items-end overflow-hidden bg-[--color-bg-base] px-4 py-10 sm:py-12"
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,var(--color-brand-primary)_0%,var(--color-bg-base)_100%)] opacity-[0.03]" />

        <div
          data-amb-glow
          className="absolute bottom-0 right-[10%] h-[70vh] w-[70vh] bg-[radial-gradient(circle_at_center,rgba(232,32,42,0.08)_0%,transparent_60%)] mix-blend-multiply blur-[80px]"
        />

        <div className="relative mx-auto grid w-full min-w-0 max-w-[90rem] grid-cols-1 gap-8">
          {/* Left Side: Content */}
          <div data-amb-copy className="relative z-20 flex w-full min-w-0 flex-col justify-center">
            <p data-amb-stagger className="text-xs font-black uppercase tracking-[0.25em] text-[--color-brand-secondary]">
              {ambassador.eyebrow}
            </p>

            <h2 data-amb-stagger className="mt-3 text-3xl font-black leading-[1.1] tracking-tight text-text-primary sm:text-4xl break-words">
              {ambassador.heading}
            </h2>

            <div data-amb-stagger className="mt-6 flex flex-col gap-1 border-l-[3px] border-[--color-brand-primary]/50 pl-4 sm:pl-5">
              {ambassador.name && (
                <p className="text-lg font-bold tracking-tight text-text-primary sm:text-xl">{ambassador.name}</p>
              )}
              <p className="text-xs font-semibold text-text-secondary sm:text-sm">{ambassador.title}</p>
            </div>

            <p data-amb-stagger className="mt-6 w-full min-w-0 max-w-full text-base leading-relaxed text-text-secondary break-words [overflow-wrap:break-word] sm:max-w-lg">
              {ambassador.body}
            </p>

            {/* Premium Stats Cards */}
            <div data-amb-stagger className="mt-6 flex w-full min-w-0 flex-col gap-2.5 sm:grid sm:grid-cols-3 sm:gap-4">
              {ambassador.stats.map((stat) => {
                const labelParts = stat.label.split(' ')
                const firstWord = labelParts[0]
                const restWords = labelParts.slice(1).join(' ')
                return (
                  <div
                    key={stat.label}
                    className="group relative flex w-full min-w-0 flex-row items-center gap-3.5 overflow-hidden rounded-2xl border border-black/5 bg-white p-3.5 shadow-[0_2px_10px_rgba(0,0,0,0.03)] transition-all duration-300 hover:-translate-y-1 hover:border-black/10 hover:shadow-md sm:flex-col sm:justify-center sm:text-center sm:p-5"
                  >
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-black/[0.03] text-xl transition-transform duration-300 group-hover:scale-110 sm:h-12 sm:w-12 sm:text-2xl">
                      {stat.value === '🇮🇳' ? (
                        <img
                          src="https://flagcdn.com/w160/in.png"
                          alt="India Flag"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        stat.value
                      )}
                    </div>
                    <div className="min-w-0 flex-1 text-left sm:text-center">
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-text-secondary/70">
                        {firstWord}
                      </span>
                      <span className="block text-xs font-bold text-text-primary break-words sm:text-sm">
                        {restWords}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Testimonial Card */}
            {ambassador.quote && (
              <div data-amb-quote className="relative mt-6 overflow-hidden rounded-2xl border border-[--color-brand-secondary]/20 bg-surface/80 p-5 shadow-card backdrop-blur-xl sm:p-8">
                <div className="absolute left-0 top-0 h-full w-[2px] bg-[--color-brand-primary]/70" />
                <Quote className="absolute right-6 top-6 h-16 w-16 text-black/[0.03] sm:h-20 sm:w-20" />
                <p className="relative z-10 text-base italic leading-relaxed text-text-secondary sm:text-lg">
                  &quot;{ambassador.quote}&quot;
                </p>
              </div>
            )}

            <div data-amb-stagger className="mt-6 flex w-full min-w-0 justify-start">
              <Link
                href={ambassador.cta.href}
                className="group relative inline-flex min-h-[48px] w-full items-center justify-center gap-3 overflow-hidden rounded-full bg-brand-primary px-8 py-3.5 text-sm font-bold text-cream shadow-card transition-all duration-300 hover:scale-[1.02] hover:shadow-float sm:w-auto"
              >
                <span className="relative">{ambassador.cta.label}</span>
                <ArrowRight aria-hidden="true" className="relative size-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </div>

          {/* Right Side Cutout & Carousel */}
          <div data-amb-stage className="relative z-10 mt-6 flex w-full min-w-0 flex-col items-center justify-center h-auto">
            <div data-amb-cutout className="relative flex h-[350px] sm:h-[450px] w-full max-w-[320px] sm:max-w-[450px] items-end justify-center">
              <div className="absolute bottom-0 left-1/2 h-8 w-full sm:w-[130%] -translate-x-1/2 rounded-[100%] bg-black/90 blur-2xl" />

              <div data-amb-hero className="relative z-20 h-full w-full">
                <Image
                  src={ambassador.images.cutout}
                  alt={ambassador.name ?? 'TESTIO brand ambassador'}
                  fill
                  sizes="100vw"
                  className="object-contain object-bottom drop-shadow-[0_20px_40px_rgba(0,0,0,0.7)] contrast-[1.03] saturate-[0.97]"
                />
              </div>
            </div>

            {/* Mobile Achievement Carousel */}
            <div className="relative mt-4 z-30 flex w-full min-w-0 max-w-full overflow-hidden px-1 pt-3 pb-3">
              <div className="flex w-max gap-3.5 animate-amb-scroll">
                <AchievementCard src={ambassador.images.portrait1} alt="Competition Portrait" title="Competition" />
                <AchievementCard src={ambassador.images.medals} alt="Medal Ceremony" title="Honors" />
                <AchievementCard src={ambassador.images.portrait2} alt="Trophy Collection" title="Triumphs" />
                <AchievementCard src={ambassador.images.portrait1} alt="Competition Portrait" title="Competition" />
                <AchievementCard src={ambassador.images.medals} alt="Medal Ceremony" title="Honors" />
                <AchievementCard src={ambassador.images.portrait2} alt="Trophy Collection" title="Triumphs" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function AchievementCard({ src, alt, title }: { src: string; alt: string; title: string }) {
  return (
    <figure
      className="group relative w-48 shrink-0 overflow-hidden rounded-2xl border border-border-color bg-surface p-2 shadow-sm transition-all duration-300 hover:-translate-y-2 hover:scale-[1.02] hover:border-black/10 hover:shadow-md xl:w-56"
    >
      {/* Subtle top highlight */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[--color-brand-secondary]/30 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-xl bg-zinc-300 shadow-inner">
        <Image
          src={src}
          alt={alt}
          fill
          sizes="(min-width: 1280px) 224px, 192px"
          className="object-cover object-top transition-transform duration-700 ease-out group-hover:scale-[1.05]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-90" />
        <figcaption className="absolute bottom-4 left-4 right-4 text-center text-xs font-bold uppercase tracking-widest text-white drop-shadow-md">
          {title}
        </figcaption>
      </div>
    </figure>
  )
}
```

Two deliberate adaptations from the literal original, both because `AmbassadorSection` now has two permanently-mounted subtrees instead of one shared responsive one:
1. The "Desktop Achievement Gallery" wrapper's own `hidden lg:block` class is dropped (simplified to just `absolute inset-0 z-30 pointer-events-none [&>*]:pointer-events-auto`) because the *outer* `data-amb-desktop` container is already `hidden lg:flex`-gated — inside it, the viewport is always `>=1024px` by construction, so the inner class was redundant.
2. The original's own "Mobile Achievement Carousel" (the `lg:hidden` bottom overlay inside the same component) is **not** ported into the desktop block — `feat/mobileversion`'s dedicated `data-amb-mobile` block already has its own purpose-built mobile achievement carousel (using `animate-amb-scroll`), so duplicating the original's carousel here would render two different carousels depending on breakpoint math edge cases. `AchievementCard` itself keeps its original `xl:w-56` / responsive `sizes` — this is shared by both the desktop gallery and the mobile carousel's calls to it, and since `xl:` never applies below 1280px, restoring it is safe for the mobile carousel and required for desktop pixel parity at `xl:` widths.

- [ ] **Step 3: Type-check and lint**

```bash
npx tsc --noEmit
npm run lint
```

Expected: no errors.

- [ ] **Step 4: Confirm the fix visually**

```bash
node scripts/visual-capture.mjs 1440
```

Compare against `feat/redesginhomepage`'s capture — the light background, circular rings, noise texture, and rotated achievement gallery should now match.

- [ ] **Step 5: Commit**

```bash
git add components/marketing/AmbassadorSection.tsx
git commit -m "Fix AmbassadorSection.tsx desktop block to render feat/redesginhomepage verbatim"
```

---

# Task 6: Restore HowItWorks.tsx's two desktop-affecting values

**Files:**
- Modify: `components/marketing/HowItWorks.tsx`

**Interfaces:**
- Consumes: `howItWorks` from `lib/marketing-content.ts` (unchanged).
- Produces: the same `min-width: 768px` gate `feat/mobileversion` correctly added (this is a legitimate, in-scope fix — the phone-frame mockup this animation targets is itself `hidden md:block`, so gating the whole timeline to the same breakpoint is correct), but with the inactive-step opacity and inter-step offset restored to `feat/redesginhomepage`'s original values, since this timeline still runs at real desktop widths (`>=1024px`), not just the 768–1023px tablet range.

- [ ] **Step 1: Confirm the two value differences**

```bash
git diff feat/redesginhomepage..HEAD -- components/marketing/HowItWorks.tsx
```

Expected: confirms three changes inside the same `mm.add(...)` block that now also runs at `>=1024px`:
- `gsap.set(steps.slice(1), { opacity: 0.5 })` → became `{ opacity: 0.25 }` (and the matching `tl.to(steps[i - 1], { opacity: 0.5, ... })` → `{ opacity: 0.25, ... }`)
- `.fromTo(screens[i], { autoAlpha: 0, y: 24 }, ...)` → became `{ autoAlpha: 0, y: 16 }`
- the trailing `tl.to({}, { duration: 0.5 }) // breathing room after the last step` line was removed

The `min-width: 768px` addition to the `mm.add(...)` selector itself and the `data-howitworks-pin` attribute addition are correct, in-scope fixes (from the mobile-optimization pass) and are **not** reverted by this task.

- [ ] **Step 2: Restore the three original values**

In `components/marketing/HowItWorks.tsx`, inside the `mm.add('(prefers-reduced-motion: no-preference) and (min-width: 768px)', () => { ... })` block:

```tsx
gsap.set(steps.slice(1), { opacity: 0.5 })
gsap.set(screens.slice(1), { autoAlpha: 0 })

const tl = gsap.timeline({
  scrollTrigger: {
    trigger: pinRef.current,
    start: 'top top',
    end: '+=200%',
    scrub: true,
    pin: true,
  },
})
steps.forEach((_, i) => {
  if (i === 0) return
  tl.to(steps[i - 1], { opacity: 0.5, duration: 0.3 }, i)
    .to(steps[i], { opacity: 1, duration: 0.3 }, i)
    .to(screens[i - 1], { autoAlpha: 0, y: -16, duration: 0.3 }, i)
    .fromTo(
      screens[i],
      { autoAlpha: 0, y: 24 },
      { autoAlpha: 1, y: 0, duration: 0.3 },
      i
    )
})
tl.to({}, { duration: 0.5 }) // breathing room after the last step
```

(Keep the surrounding `scrollTrigger` config — `trigger`, `start`, `end` — exactly as it already is in the current integration branch; only the three values called out in Step 1 change.)

- [ ] **Step 3: Type-check and lint**

```bash
npx tsc --noEmit
npm run lint
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add components/marketing/HowItWorks.tsx
git commit -m "Restore feat/redesginhomepage's HowItWorks desktop animation values"
```

---

# Task 7: Verify the remaining additive-diff components

**Files:**
- Verify only: `components/marketing/PublicNavbar.tsx`, `KitchensTeaser.tsx`, `BecomeCook.tsx`, `LocationSearchBox.tsx`, `LoginPromptSheet.tsx`, `MarketingFooter.tsx`, `PackagingShowcase.tsx`, `TrustRibbon.tsx`, `components/ui/sheet.tsx`, `components/layout/Navbar.tsx`, `lib/marketing-content.ts`, `app/globals.css`

**Interfaces:**
- Consumes: nothing new.
- Produces: written confirmation (in this task's own checklist) that each file's diff reverts correctly at its stated breakpoint and introduces no unbounded (non-gated) desktop change. No code changes are expected from this task — if any check fails, open a new task before proceeding.

- [ ] **Step 1: `PublicNavbar.tsx` — mobile nav drawer, `nav-login` touch target**

```bash
git diff feat/redesginhomepage..HEAD -- components/marketing/PublicNavbar.tsx
```

Verify: the `Login` link's padding change (`py-2` → `py-3.5 sm:py-2`) reverts to the original `py-2` at `sm:` (640px) and up — confirm no `lg:`/`1024px` regression since this is a below-640px-only change. Verify the new `Sheet`-based hamburger drawer (`sm:hidden` on its trigger) is fully absent from layout at `>=640px` (the `SheetTrigger` has `sm:hidden`, so it contributes nothing to desktop DOM flow — Tailwind `hidden` sets `display:none`, meaning it's inert at desktop widths).

- [ ] **Step 2: `KitchensTeaser.tsx` — touch targets, body text**

```bash
git diff feat/redesginhomepage..HEAD -- components/marketing/KitchensTeaser.tsx
```

Verify: `py-12 md:py-20` (was `py-20`) only affects `<768px`; `text-base sm:text-sm` and `py-3.5 sm:py-2` / `py-3.5 sm:py-2.5` patterns all revert to the original value at `sm:` (640px). None of these touch anything `>=1024px`.

- [ ] **Step 3: `BecomeCook.tsx` — body text**

```bash
git diff feat/redesginhomepage..HEAD -- components/marketing/BecomeCook.tsx
```

Verify: `text-base sm:text-sm` on the first list point reverts at `sm:` (640px); the added `data-body-text` attribute is inert (no styling effect).

- [ ] **Step 4: `LocationSearchBox.tsx` — input touch target**

```bash
git diff feat/redesginhomepage..HEAD -- components/marketing/LocationSearchBox.tsx
```

Verify: `py-3.5 sm:py-2.5` / `text-base sm:text-sm` on the input, and `py-3.5 sm:py-2.5` on the results list items, all revert at `sm:` (640px).

- [ ] **Step 5: `LoginPromptSheet.tsx` — close button touch target**

```bash
git diff feat/redesginhomepage..HEAD -- components/marketing/LoginPromptSheet.tsx
```

Verify: `p-3.5 sm:p-1` reverts at `sm:` (640px). Verify the em-dash copy change (`"Quick OTP login — this dish..."` → `"Quick OTP login. This dish..."`) is an intentional encoding fix, not a meaning change.

- [ ] **Step 6: `MarketingFooter.tsx` — partial touch-target improvement**

```bash
git diff feat/redesginhomepage..HEAD -- components/marketing/MarketingFooter.tsx
```

Verify: `pt-24 md:pt-16` / `pb-[...] md:pb-8` / `gap-12 md:gap-10` revert at `md:` (768px); the footer-link `py-2 sm:py-0` reverts at `sm:` (640px). This is a documented **partial** touch-target improvement (36px, not the full 48px per `scripts/verify-responsive.mjs`'s `minSize: 36` override for `footer-link`) — confirm that's an accepted, intentional trade-off, not an oversight.

- [ ] **Step 7: `PackagingShowcase.tsx` — body text**

```bash
git diff feat/redesginhomepage..HEAD -- components/marketing/PackagingShowcase.tsx
```

Verify: `text-base sm:text-sm` reverts at `sm:` (640px).

- [ ] **Step 8: `TrustRibbon.tsx` — text wrapping**

```bash
git diff feat/redesginhomepage..HEAD -- components/marketing/TrustRibbon.tsx
```

Verify: `truncate` → `leading-snug` (removes single-line truncation, allows wrapping) applies at **every** breakpoint including `>=1024px` — this is the one item in this task that is not breakpoint-gated. Confirm with the client-approved design whether trust-ribbon items were ever expected to wrap on desktop; if the desktop trust ribbon is always short enough to never wrap in practice (check actual copy length in `lib/marketing-content.ts`'s `trustRibbon` export against the ribbon's fixed-width desktop layout), this is a no-visible-difference safety improvement and can be kept. If any real desktop copy would now wrap where it didn't before, revert to `truncate` and add `sm:truncate lg:truncate` framing instead, or handle case-by-case.

- [ ] **Step 9: `sheet.tsx` / `Navbar.tsx` — compat fix (kept per user decision)**

```bash
git diff feat/redesginhomepage..HEAD -- components/ui/sheet.tsx components/layout/Navbar.tsx
```

Verify: `SheetClose`'s new `nativeButton` prop defaults to `undefined` when no `render` prop is passed (preserving existing callers), and only resolves to `false` when `render` is provided — confirm every existing call site of `SheetClose` in the codebase (`components/layout/Navbar.tsx`'s 3 call sites, plus `PublicNavbar.tsx`'s 3 new call sites from Task-adjacent work) that use `render` gets `nativeButton={false}` explicitly, avoiding a nested-`<button>`-in-`<button>` hydration warning.

- [ ] **Step 10: `lib/marketing-content.ts` — copy fixes and stats reorder**

```bash
git diff feat/redesginhomepage..HEAD -- lib/marketing-content.ts
```

Verify: all changes are em-dash → comma/colon/parenthesis copy fixes, consumed directly by the marketing components above (in scope, unlike the 5 files reverted in Task 2). Separately confirm: `ambassador.stats` reordered from `[Gold Medalist, India, Homemade Food]` to `[India, Gold Medalist, Homemade Food]` — this is a real display-order change for the stats cards; confirm this reorder is intentional (it affects `AmbassadorSection.tsx`'s output at every breakpoint) before accepting it as-is.

- [ ] **Step 11: `app/globals.css` — new marquee-scroll utilities**

```bash
git diff feat/redesginhomepage..HEAD -- app/globals.css
```

Verify: `.animate-amb-scroll` and `.animate-hero-featured-scroll` are new, additive utility classes (not modifications to existing rules), each with a `prefers-reduced-motion: reduce` override, consumed only by the mobile carousels in the fixed `Hero.tsx`/`AmbassadorSection.tsx` from Tasks 4–5. No existing CSS rule is altered.

- [ ] **Step 12: Record the outcome**

No commit is expected from this task unless Step 8 or Step 10 surfaces something that needs a code change — if so, make that fix, verify with `npx tsc --noEmit && npm run lint`, and commit it with a message describing exactly what was corrected and why.

---

# Task 8: Full automated verification suite

**Files:**
- None modified.

**Interfaces:**
- Consumes: `scripts/verify-responsive.mjs`, `scripts/visual-capture.mjs`, `npm run build`, `npx tsc --noEmit`, `npm run lint` — all pre-existing in the integration branch after Task 1.
- Produces: a PASS/FAIL result set covering every breakpoint and touch target named in the original brief, plus a successful production build.

- [ ] **Step 1: Install Playwright's Chromium browser (not yet present in this environment)**

```bash
npx playwright install chromium
```

- [ ] **Step 2: Type-check, lint, and build**

```bash
npx tsc --noEmit
npm run lint
npm run build
```

Expected: all three exit 0. `npm run build` is the authoritative production-readiness check — any component error, hydration mismatch caught at build time, or type error surfaces here.

- [ ] **Step 3: Start the dev server and run the automated responsive gate**

```bash
npm run dev
# in a second terminal, once the server is up on :3001:
node scripts/verify-responsive.mjs
```

Expected: `GATE PASSED` — no horizontal overflow at any of the 10 mandated breakpoints (320, 360, 375, 390, 414, 430, 768, 1024, 1280, 1440), all touch targets at their required minimum size, all body-text checks `>=16px`, and the `HowItWorks` scroll-pin gated correctly (absent below `md:`/768px, present at `md:`/768px and up — this task's Task 6 fix does not change this gating, only the values inside it).

- [ ] **Step 4: Capture full visual evidence at every required viewport**

```bash
node scripts/visual-capture.mjs
```

This captures all viewports already in `VIEWPORTS` (320, 360, 375, 390, 414, 430, 768, 1024, 1280, 1440, 1728, 1920 — a superset of the desktop set 1024/1280/1440/1920 and mobile set 320/360/375/390/414 named in the original brief, plus tablet 768). Confirm screenshots exist for each.

- [ ] **Step 5: Confirm zero new production dependencies were introduced across the whole plan**

```bash
node -e "console.log(Object.keys(require('./package.json').dependencies).length)"
```

Expected: `17` (unchanged from both source branches).

- [ ] **Step 6: Confirm the source branches are still untouched**

```bash
git rev-parse feat/redesginhomepage feat/mobileversion origin/feat/redesginhomepage origin/feat/mobileversion
```

Expected: local feat/redesginhomepage matches origin/feat/redesginhomepage and local feat/mobileversion matches origin/feat/mobileversion, while feat/mobileversion and feat/redesginhomepage remain distinct — neither backup branch moved at any point during this plan.

- [ ] **Step 7: Record the verification report**

No commit needed for this task (nothing is modified) — capture the terminal output from Steps 2–4 as the evidence referenced in Task 9's final report.

---

# Task 9: Final report and branch hand-off

**Files:**
- None modified.

**Interfaces:**
- Consumes: the full commit history on `feat/responsive-final` from Tasks 1–8.
- Produces: the deliverables the original brief asked for, and a decision point for pushing/opening a PR.

- [ ] **Step 1: Produce the files-changed / components-merged summary**

```bash
git log --oneline feat/redesginhomepage..feat/responsive-final
git diff feat/redesginhomepage..feat/responsive-final --stat
```

- [ ] **Step 2: Produce the conflict/defect resolution summary**

Document, using the findings already established during planning and Tasks 3–6:
- `lib/gsap.ts` / `providers.tsx`: global DOM monkey-patch removed; root cause and scoped fix documented per Task 3's Step 4 findings.
- `Hero.tsx`: desktop block was a fabricated design, not `feat/redesginhomepage`'s — replaced verbatim (Task 4).
- `AmbassadorSection.tsx`: same defect, same fix (Task 5).
- `HowItWorks.tsx`: two animation values restored to desktop-original while keeping the correct `md:` gating fix (Task 6).
- 5 out-of-scope page files reverted (Task 2); `sheet.tsx`/`Navbar.tsx` compat fix kept (Task 7 Step 9).

- [ ] **Step 3: Attach the verification report from Task 8**

Include the `GATE PASSED` output, the build success output, and the screenshot evidence paths.

- [ ] **Step 4: List remaining manual-review items**

From Task 7: confirm `TrustRibbon.tsx`'s ungated `truncate`-removal (Step 8) and the `ambassador.stats` reorder (Step 10) against the actual client-approved copy/design — these are the only two items in the whole plan that could not be resolved from the diff alone and need a human visual/content sign-off.

- [ ] **Step 5: Decide how to integrate `feat/responsive-final`**

Do not push or open a PR automatically. Once every task above is checked off and Task 8's gate passes, use the **superpowers:finishing-a-development-branch** skill to decide between pushing for review, opening a PR, or further local iteration — this is a decision for whoever is running this plan, not something to script here.
