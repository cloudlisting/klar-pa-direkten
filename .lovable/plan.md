# Plan: Budgivning, tvist, aktiv chatt & nav

## 1. Databas (en migration)

**Ny tabell `bids`**
- `task_id`, `bidder_id`, `price_sek`, `proposed_time` (timestamptz, nullable), `proposed_time_text` (t.ex. "kan komma idag"), `message`, `status` enum (`pending`/`accepted`/`rejected`/`withdrawn`)
- RLS:
  - Utförare: läs/skapa/uppdatera egna bud
  - Beställare: läs alla bud på sina egna uppdrag, uppdatera status (acceptera)
  - Admin: full access
- GRANTs: authenticated + service_role

**Ny tabell `disputes`**
- `task_id`, `thread_id` (chat_threads), `raised_by`, `reason` (kort), `details` (fritext), `status` enum (`open`/`under_review`/`resolved`)
- RLS: parterna i uppdraget + admin

**Ändringar i `tasks`**
- Lägg till `pricing_model` enum (`fixed`/`open_for_bids`), default `fixed`
- Lägg till `budget_hint_sek` (riktbudget vid öppet för bud)
- Lägg till nya statusvärden i `status`: `assigned`, `active`, `disputed` (om de inte redan finns)
- Default `pricing_model='fixed'` för befintliga rader

**Trigger / RPC `accept_bid(bid_id)`** (security definer):
- Verifierar att anroparen äger uppdraget
- Sätter valt bud till `accepted`, övriga `rejected`
- Uppdaterar `tasks.assigned_tasker_id`, `tasks.price_sek` = bid.price, status = `assigned`
- Skapar (eller hämtar) `chat_threads`-rad för uppdraget mellan parterna

## 2. Bud-UI

**PostTask.tsx**
- Toggle "Fast pris" / "Öppet för bud"
- Vid "Öppet för bud": fält "Riktbudget (valfri)"; gömmer fast pris-input

**TaskDetail.tsx**
- Visa antal bud ("3 bud") nära pris
- Om uppdraget är öppet för bud och användaren är inloggad tasker (inte ägaren): formulär "Lägg bud" (pris, föreslagen tid, meddelande)
- För ägaren: lista över bud med profilbild, namn, betyg, antal slutförda, avstånd (om finns), pris, tid, meddelande, "Acceptera"-knapp
- Acceptera → kallar `accept_bid` RPC → navigera till meddelanden för det uppdraget

**Ny komponent `BidCard.tsx`** och `BidForm.tsx`

## 3. Aktiv uppdrag-chatt & tvist

**Messages.tsx (befintlig)**
- När man öppnar tråd kopplad till task: visa statusbanner högst upp:
  - `assigned`/`active`: "Aktivt uppdrag pågår" + titel + pris
  - `disputed`: "Tvist pågår, kundtjänst är kontaktad"
  - `completed`/`paid`: "Uppdraget är klart"
- Knapp "Markera tvist" → dialog `DisputeDialog.tsx` med dropdown anledning + fritext
- Submit: insert i `disputes`, uppdaterar `tasks.status='disputed'`

**Ny komponent `ActiveTaskBanner.tsx` + `DisputeDialog.tsx`**

## 4. Navigering (mobil)

**MobileBottomNav.tsx** — exakt 5 objekt:
1. Hem (`/`)
2. Uppdrag (`/browse`)
3. Skapa (centrerad plus-knapp, `/post-task`)
4. Meddelanden (`/messages`) — bytt namn från "Chatt"
5. Profil (`/dashboard`)

- Ta bort "Mina"-fliken
- `grid-cols-5` i stället för 6
- Lägg `pb-[max(env(safe-area-inset-bottom),1rem)]` så plus-etiketten inte kapas

**Profil-sidan (`Dashboard.tsx`)**
- Lägg sektion "Mina uppdrag" som återanvänder logik från `MyTasks.tsx` (importera komponent eller flytta listan in i en sub-komponent `MyTasksSection.tsx`)
- Behåll route `/my-tasks` för bakåtkompatibilitet men nås primärt via profilen

## Tekniska detaljer

- Ny i18n behövs ej (allt svenskt i copy)
- Befintlig design (Teal/Coral, DM Sans/Inter) bibehålls
- Status-enum: lägg till värden via `ALTER TYPE … ADD VALUE` om enum, annars textfält
- Realtime: subscribe på `bids` på TaskDetail för att uppdatera antal i realtid

## Filer som skapas/ändras

**Migration:** `supabase/migrations/<ts>_bids_disputes_bidding.sql`

**Nya komponenter:**
- `src/components/BidCard.tsx`
- `src/components/BidForm.tsx`
- `src/components/ActiveTaskBanner.tsx`
- `src/components/DisputeDialog.tsx`
- `src/components/MyTasksSection.tsx`

**Ändrade:**
- `src/pages/PostTask.tsx` (prismodell-toggle)
- `src/pages/TaskDetail.tsx` (bud-UI + lista + acceptera)
- `src/pages/Messages.tsx` (banner + tvist-knapp)
- `src/pages/Dashboard.tsx` (Mina uppdrag-sektion)
- `src/components/MobileBottomNav.tsx` (5 objekt, byt "Chatt"→"Meddelanden", ta bort "Mina", safe-area)

## Ordning

1. Migration (kräver godkännande)
2. Efter att typer regenererats: implementera frontend i en svep

## Utanför scope

- Mobil-push-notiser (in-app via befintlig mekanism räcker)
- Admin-UI för att lösa tvister (banner + status räcker nu; admin ser disputes via befintlig admin-tabellvy om sådan finns)
