-- BankID via Signicat: column to recognize a returning BankID user at login.
-- We never store the personnummer itself, only a one-way hash of it, so a
-- leak of this column can't be reversed into a real personnummer.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS bankid_personnummer_hash text;

CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_bankid_personnummer_hash
  ON public.profiles (bankid_personnummer_hash)
  WHERE bankid_personnummer_hash IS NOT NULL;
