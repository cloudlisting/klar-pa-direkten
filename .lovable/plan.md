## Mål
Två nya funktioner på Moas:
1. **Tjänsteerbjudanden** – taskers kan publicera "Jag erbjuder"-annonser (inte bara kunder som söker hjälp).
2. **Profil-tjänster** – tasker listar vad de brukar hjälpa till med på sin profil. Kunder kan klicka "Beställ" → öppnar förifyllt uppdrag riktat till den taskern.

## Databas (en migration)

**Ny tabell `tasker_services`** (på profil):
- `user_id` (FK profiles), `category`, `title`, `description`, `price_sek`, `price_type` ('fixed'|'from'), `is_active`, timestamps.
- RLS: ägaren CRUD; alla autentiserade/anon kan läsa aktiva.
- GRANT enligt regel.

**Ny tabell `service_listings`** (publika annonser i fl ödet):
- `tasker_user_id`, `category`, `title`, `description`, `city`, `price_sek`, `price_type`, `cover_image_url`, `status` ('active'|'paused'|'archived'), timestamps.
- RLS: ägaren CRUD; alla läser status='active'.
- GRANT enligt regel.

**`tasks`-tabellen**: ingen schemaändring behövs – beställning skapar vanlig task med `assigned_tasker_id` förifyllt + `source_service_id` (lägg till valfri kolumn) för spårbarhet.

## Frontend

### Nya/ändrade sidor
- **`/services`** – ny sida, listar `service_listings` (filter kategori/stad). Lägg route + länk i header/bottom nav.
- **`/services/new`** + **`/services/:id/edit`** – formulär för taskers att skapa/redigera annonser (återanvänd PostTask-mönstret).
- **`/services/:id`** – detaljsida för en annons med "Beställ"-knapp → navigerar till `/post-task?service_id=...&tasker=...&category=...&price=...`.
- **`PostTask.tsx`** – läs query params, förifyll kategori/pris/beskrivning, lås `assigned_tasker_id` om angivet, visa banner "Beställer från {tasker}".
- **`PublicProfile.tsx`** + **`TaskerDashboard.tsx`** – ny sektion "Tjänster jag erbjuder" som CRUD:ar `tasker_services`. På publik profil: kort med "Beställ" → samma förifyllda PostTask-flöde.
- **`Index.tsx`** – lägg till en rad "Erbjudna tjänster nära dig" från `service_listings`.
- **`BrowseTasks.tsx`** – toggle överst: "Sök hjälp" (tasks) / "Erbjud hjälp" (service_listings).

### Komponenter
- `ServiceCard.tsx` – återanvändbar för både listings och profile services.
- `ServiceForm.tsx` – delad form (kategori, titel, beskrivning, pris, bild upload till `task-photos`).
- `OrderServiceButton.tsx` – navigerar till PostTask med förifyllning.

### Memory
Uppdatera `mem://business/marketplace-mechanics` med det nya tvåvägs-fl ödet (söker hjälp ↔ erbjuder hjälp).

## Tekniska detaljer
- Befintliga kategorier i `src/lib/constants.ts` återanvänds.
- Bild-upload till befintlig `task-photos`-bucket.
- Realtime ej nödvändigt i första versionen.
- i18n: nya nycklar i `src/lib/i18n.tsx` (SV + EN).
- Mobile bottom nav får inte överfullas – länk till `/services` läggs i header/desktop nav och som chip på startsidan i mobil.

## Out of scope (görs ej nu)
- Recensioner per service-annons (använder taskerns generella rating).
- Marknadsföring/boost av annonser.
- Schemaläggning/kalender på profilen.

## Ordning
1. Migration (godkänns separat).
2. Efter approval: typer regenereras → bygg frontend i ett svep.
