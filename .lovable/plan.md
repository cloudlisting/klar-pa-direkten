## Fix: RLS error vid skapande av uppdrag

**Problem:** `new row violates row-level security policy for table "tasks"` — sessionen kan vara utgången eller saknas när `insert` körs, så `auth.uid()` blir `null` på servern och RLS-checken `customer_user_id = auth.uid()` failar.

### Ändring (endast `src/pages/PostTask.tsx`)

I `handleSubmit`, före `supabase.from("tasks").insert(...)`:

1. Hämta färsk session:
   ```ts
   let { data: { session } } = await supabase.auth.getSession();
   if (!session) {
     const { data } = await supabase.auth.refreshSession();
     session = data.session;
   }
   if (!session?.user) {
     toast.error("Din session har gått ut. Logga in igen.");
     navigate("/auth");
     return;
   }
   const uid = session.user.id;
   ```
2. Använd `uid` istället för `user.id` från `useAuth` för `customer_user_id`.
3. Använd `uid` även i `uploadPhotos` (skicka in som parameter) så storage-path matchar inloggad användare.

### Inga andra filer rörs
- Ingen migration, ingen RLS-ändring (policyn är korrekt).
- `useAuth`, klient, övriga sidor oförändrade.

### Verifiering
- Skapa uppdrag som inloggad → ska sparas utan RLS-fel.
- Om session saknas → redirect till `/auth` istället för kryptiskt fel.
