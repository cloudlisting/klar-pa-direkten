-- Create referrals table for tracking user signups
CREATE TABLE public.referrals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_user_id UUID NOT NULL,
  referred_user_id UUID,
  referral_code TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'rewarded')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- Users can view their own referrals
CREATE POLICY "Users can view own referrals"
ON public.referrals
FOR SELECT
USING (referrer_user_id = auth.uid() OR referred_user_id = auth.uid());

-- Users can create their own referral codes
CREATE POLICY "Users can create referral codes"
ON public.referrals
FOR INSERT
WITH CHECK (referrer_user_id = auth.uid());

-- Add referral_code to profiles for easy access
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE;

-- Function to generate referral code
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Generate a unique 8-character code
  NEW.referral_code := upper(substring(md5(random()::text || NEW.id::text) from 1 for 8));
  RETURN NEW;
END;
$$;

-- Trigger to auto-generate referral code on profile creation
CREATE TRIGGER generate_profile_referral_code
BEFORE INSERT ON public.profiles
FOR EACH ROW
WHEN (NEW.referral_code IS NULL)
EXECUTE FUNCTION public.generate_referral_code();

-- Generate referral codes for existing profiles
UPDATE public.profiles 
SET referral_code = upper(substring(md5(random()::text || id::text) from 1 for 8))
WHERE referral_code IS NULL;