# Moas Mobile-First Redesign

Restructure Moas into an app-like, mobile-first experience while preserving desktop and all existing flows (auth, tasks, profiles, messaging, admin, i18n, payments).

## Scope & Principles
- Mobile = primary. Desktop = preserved top nav (unchanged behavior).
- No breaking changes to routes, data, RLS, edge functions, or business logic.
- All work in frontend/presentation layer.
- Swedish default, language toggle preserved.

## 1. App Shell (`src/components/Layout.tsx`)
- Wrap content with `pb-20 md:pb-0` to clear bottom nav.
- Add `env(safe-area-inset-*)` padding via Tailwind utilities (extend in `index.css`).
- Render new `<MobileBottomNav />` (hidden `md:hidden`).
- Hide existing `<Footer />` on mobile (`hidden md:block`) — minimal footer on mobile = none, since bottom nav replaces it.
- Header: keep existing desktop top nav; on mobile, simplify to logo + language toggle + account icon (remove hamburger duplicating bottom nav).

## 2. New: `src/components/MobileBottomNav.tsx`
Fixed bottom nav, 5 tabs with icons + Swedish labels:
- Hem → `/`
- Uppdrag → `/browse`
- Skapa → `/post-task` (center, elevated primary circle/FAB style — accent color, larger, lifted)
- Meddelanden → `/messages`
- Profil → `/dashboard`

Active state via `useLocation`. Safe-area aware. Hidden on `/auth`, `/onboarding`, `/checkout/*` via prop or route check.

## 3. Mobile Homepage (`src/pages/Index.tsx`)
Add mobile-only block above existing sections (`md:hidden`), keep desktop hero (`hidden md:block`):
- Greeting ("Hej 👋" / "Välkommen till Moas")
- Tagline: "Få saker gjorda nära dig"
- Large search input → routes to `/browse?q=`
- "Använd min plats" button (uses existing city selector logic; no geolocation API needed yet, just opens city dropdown)
- Popular services (reuse `CategoryGrid`, compact variant)
- Live tasks near you (reuse `LiveTaskFeed`)
- Trust message strip

Desktop hero/sections untouched.

## 4. Task Browsing (`src/pages/BrowseTasks.tsx` + `TaskCard`)
- Add compact mobile card variant in `TaskCard` (prop `compact` or auto via `useIsMobile`): tighter padding, single-line title, price prominent right, meta row (city · category · time), small status chip.
- Filter bar: collapsible on mobile (sheet/drawer trigger).

## 5. Guided Post Task Flow (`src/pages/PostTask.tsx`)
Convert to 6-step wizard with progress indicator:
1. Vad behöver du hjälp med? (title + description)
2. Välj kategori
3. Var? (city)
4. När? (date)
5. Budget (SEK)
6. Granska och publicera

State held locally; submit calls same existing insert. Each step = full-screen on mobile, single-column on desktop. Back/Next buttons, progress dots at top.

## 6. Profile (`src/pages/PublicProfile.tsx`)
Mobile layout tweaks: avatar + name centered, rating row, badges grid, sticky bottom CTA bar on mobile with "Skicka förfrågan" / "Skapa liknande uppdrag".

## 7. Messages (`src/pages/Messages.tsx`)
Mobile: full-screen thread view (hide list when thread open), sticky composer with safe-area, sticky task context header. Desktop: keep split view.

## 8. Account Tab (`src/pages/Dashboard.tsx`)
Mobile list view with items: Mitt konto, Mina uppdrag, Mina förfrågningar, Betalningar, Recensioner, Inställningar, Logga ut. Desktop layout untouched.

## 9. PWA Manifest (manifest-only, no service worker)
- Create `public/manifest.webmanifest`: name "Moas", short_name "Moas", theme_color teal `#1f8a82`, background `#faf9f6`, display `standalone`, start_url `/`.
- Generate Moas "M" icon (192, 512) via imagegen → `public/icon-192.png`, `public/icon-512.png`, `public/apple-touch-icon.png`.
- Update `index.html`: manifest link, theme-color meta, apple-touch-icon, apple-mobile-web-app-capable.

## 10. Safe-area & Tap Targets
Extend `src/index.css`:
- `.pt-safe`, `.pb-safe`, `.pb-safe-nav` utilities using `env(safe-area-inset-*)`.
- Min 44px tap targets on bottom nav buttons.
- Prevent horizontal overflow: `body { overflow-x: hidden }`.

## 11. Branding Audit
Grep for "Taskly" → replace remaining with "Moas". Header already shows "Moas".

## 12. Files Changed
**New:**
- `src/components/MobileBottomNav.tsx`
- `public/manifest.webmanifest`
- `public/icon-192.png`, `public/icon-512.png`, `public/apple-touch-icon.png`

**Edited:**
- `src/components/Layout.tsx` (mobile padding, bottom nav, hide footer mobile)
- `src/components/Header.tsx` (simplify mobile)
- `src/pages/Index.tsx` (mobile home block)
- `src/pages/BrowseTasks.tsx` + `src/components/TaskCard.tsx` (compact mobile)
- `src/pages/PostTask.tsx` (wizard)
- `src/pages/Messages.tsx` (mobile full-screen chat)
- `src/pages/Dashboard.tsx` (mobile account list)
- `src/pages/PublicProfile.tsx` (sticky mobile CTA)
- `src/index.css` (safe-area utilities, overflow-x)
- `index.html` (PWA tags)
- Any stray "Taskly" strings

**Not touched:**
- Auth, RLS, migrations, edge functions, types, payment logic, i18n keys (only additions), admin, reviews, escrow, BankID stubs.

## Out of scope (explicit)
- Service worker / offline (manifest-only per request).
- Geolocation API (just city selector for now).
- Real BankID, real Swish API.
