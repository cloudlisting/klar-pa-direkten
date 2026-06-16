---
name: Two-sided marketplace
description: Customers post tasks AND taskers post service offers; ordering a service creates a pre-filled task
type: feature
---
Moas är tvåsidigt:

1. **Kunder postar uppdrag** (`tasks`) – befintlig flöde via PostTask → bud/escrow.
2. **Taskers postar tjänster** på två nivåer:
   - `tasker_services` – en lista på profilen ("brukar hjälpa med") med titel/kategori/pris/beskrivning. CRUD från PublicProfile (ägaren) och TaskerDashboard.
   - `service_listings` – publika annonser i marknaden, listade på `/services` och som en rad på Index ("Erbjudna tjänster"). Status: active/paused/archived.

**Beställningsflöde** ("Beställ"-knapp på service-kort eller profil):
→ Navigerar till `/post-task?tasker={uid}&category=...&title=...&price=...&service_id=...&tasker_service_id=...`
→ PostTask förifyller fält, visar banner "Du beställer från {tasker}", och skickar `assigned_tasker_id` + `source_service_listing_id`/`source_tasker_service_id` på den nya task-raden. Statusen blir `published` så taskern accepterar via befintliga TaskActions/escrow.

Single editable offer-regeln (en kund kan bara ha ett aktivt bud per uppdrag) gäller fortfarande för det öppna bud-flödet.
