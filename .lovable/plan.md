## Vad som är fel idag

1. **`permission denied for table profiles`** — `public.profiles` har inga GRANTs alls för rollen `authenticated` (varken SELECT eller UPDATE). RLS-policyerna är korrekta, men utan tabell-grants når PostgREST inte tabellen och alla `.update("profiles")`/`.select("profiles")` från klienten faller. Det är därför onboarding-submit, settings, dashboard m.fl. inte fungerar.

2. **Onboarding tvingar val av roll** (`bestallare | tasker | foretag`). Du vill istället att alla användare ska kunna vara både beställare och utförare — och att `företag` tas bort helt. Personnummer/BankID skjuts upp tills BankID-API:t kopplas in.

## Plan

### 1. Migration — fixa GRANTs och rensa rolldata

- `GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated`
- `GRANT ALL ON public.profiles TO service_role`
- (Ingen anon-grant — RLS-policyerna är `auth.uid()`-baserade.)
- Lägg till nya kolumner:
  - `first_name text`
  - `last_name text`
  - (Behåll befintliga `name`, `phone`, `city`, `onboarding_completed`.)
- Gör `role`-kolumnen valfri och inaktuell:
  - `ALTER COLUMN role DROP NOT NULL` (om satt)
  - Vi slutar skriva till den från klienten. Lämnar enum och kolumn kvar för bakåtkompatibilitet — markeras som deprecated i kod. Inga nya värden skrivs.
- Trigger `handle_new_user` uppdateras så att `first_name`/`last_name` plockas från Google-metadata när det finns (`given_name`, `family_name`).
- INGEN personnummer-kolumn skapas nu.

### 2. Onboarding-formuläret

Ersätt nuvarande tre-vals roll-väljare med:

- Förnamn (obligatoriskt)
- Efternamn (obligatoriskt)
- Telefonnummer (obligatoriskt, samma validering som idag)
- Stad (obligatoriskt, samma dropdown)
- Godkänn villkor (obligatoriskt)

Vid submit:
- Skriv `first_name`, `last_name`, `name = first_name + " " + last_name`, `phone`, `city`, `google_connected = true`, `onboarding_completed = true`.
- Skriv INTE `role`.
- Vid fel — visa toast och logga som idag.

Hjälptext under formuläret: "Du kan både lägga upp uppdrag och utföra uppdrag — du behöver inte välja nu. BankID-verifiering krävs senare för att utföra uppdrag."

### 3. App-beteende kring "roll"

- `useAuth.isTasker` baseras redan på `tasker_profiles` (separat tabell) — inget byte behövs.
- "Beställare" är default — alla inloggade kan posta uppdrag.
- För att börja utföra uppdrag fortsätter `/become-tasker`-flödet som idag (skapar tasker_profile). Senare gate:as den bakom BankID — förbereds inte i denna migration.
- Tar bort referenser till `profile.role` i UI där det fortfarande används (inget kritiskt — främst Onboarding och eventuell visning).

### 4. Stadig grund för BankID senare (förberedelse, ingen kod nu)

- `bankid_verified` och `id_verified` finns redan på `profiles` (boolean, default false).
- När BankID-API:t läggs till sker det i ett separat steg: edge function + UI-knapp + uppdaterar `bankid_verified` + lagrar verifierat personnummer.

## Filer som ändras

- **Ny migration** — grants på `profiles`, nya kolumner `first_name`/`last_name`, uppdaterad `handle_new_user`-trigger, gör `role` nullable.
- **`src/pages/Onboarding.tsx`** — nytt formulär utan rollval, nya fält, ny submit-payload.
- **`src/hooks/useAuth.tsx`** — oförändrad logik, men skickar inte längre `role` någonstans (om något ställe gör det).
- **`src/integrations/supabase/types.ts`** — autogenereras efter migration.
- (Inga ändringar på BrowseTasks, PostTask, TaskCard, kategorier, betalningar, admin, meddelanden, recensioner, trust-badges eller språkväxling.)

## Tekniska detaljer

```sql
-- Data-API grants
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

-- Nya kolumner
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS first_name text,
  ADD COLUMN IF NOT EXISTS last_name  text;

-- Roll blir valfri
ALTER TABLE public.profiles ALTER COLUMN role DROP NOT NULL;

-- Trigger uppdatering: ta in given_name / family_name från Google
-- (CREATE OR REPLACE FUNCTION handle_new_user ...)
```

## Vad som inte ändras

- Befintliga RLS-policyer på `profiles` (ägare + admin) — redan korrekta.
- `public_profiles`-vyn (offentlig läsning av säkra fält).
- Säkerhetsfixar från förra migrationen (address_optional, helper-funktioner, GraphQL-revokes).
- Layout, design, kategorier, kategorisidor, övrig navigation.
