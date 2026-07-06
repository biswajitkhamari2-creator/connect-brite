
CREATE TABLE IF NOT EXISTS public.agreement_acceptances (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  agreement_version TEXT NOT NULL,
  agreement_title TEXT NOT NULL DEFAULT 'ClaimForSure Service Agreement',
  full_name TEXT,
  email TEXT,
  phone TEXT,
  ip_address TEXT,
  user_agent TEXT,
  accepted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_agreement_acceptances_user ON public.agreement_acceptances(user_id);

GRANT SELECT, INSERT ON public.agreement_acceptances TO authenticated;
GRANT ALL ON public.agreement_acceptances TO service_role;

ALTER TABLE public.agreement_acceptances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_select_own_acceptances"
  ON public.agreement_acceptances FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "users_insert_own_acceptances"
  ON public.agreement_acceptances FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
