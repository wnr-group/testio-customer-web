@../CLAUDE.md

# testio-customer-web

Web customer app for TESTIO. Next.js 16 App Router.

## Key patterns

- Auth guard is in `proxy.ts` (Next.js 16 renamed middleware → proxy). Export must be named `proxy`, not `middleware`.
- Supabase browser client: `lib/supabase/client.ts` → `createClient()`
- Supabase server client: `lib/supabase/server.ts` → `await createClient()`
- Mapbox GL JS MUST be loaded client-side only: `dynamic(() => import('@/components/map/MapView'), { ssr: false })`
- Razorpay: load via `next/script` strategy `lazyOnload` in checkout page
- Realtime order status: `useRealtimeOrder(orderId)` hook in `hooks/useRealtimeOrder.ts`
- Cart state: `useCartStore` from `stores/cartStore.ts`
- Route groups: `(public)` = no auth, `(auth)` = protected (proxy enforces)
- Dynamic params are `Promise<{ id: string }>` in Next.js 16 — always `await params`

## Design references

- **Stitch designs:** https://stitch.withgoogle.com/edit/15268811396840656535 (8 desktop screens)
- **Full design spec:** `docs/superpowers/specs/2026-07-14-web-customer-app-design.md`

## TODO stubs

Every `page.tsx` has a `// TODO (TES-xxx)` comment with the Jira story reference.
Implement each screen per the design spec above.
