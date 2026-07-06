
CREATE TABLE public.promo_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percent','flat')),
  discount_value INT NOT NULL CHECK (discount_value > 0),
  active BOOLEAN NOT NULL DEFAULT true,
  expires_at TIMESTAMPTZ,
  max_uses INT,
  times_used INT NOT NULL DEFAULT 0,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.promo_codes TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.promo_codes TO authenticated;
GRANT ALL ON public.promo_codes TO service_role;

ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view active promo codes"
  ON public.promo_codes FOR SELECT
  TO authenticated
  USING (active = true AND (expires_at IS NULL OR expires_at > now()));

CREATE POLICY "Admins can view all promo codes"
  ON public.promo_codes FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert promo codes"
  ON public.promo_codes FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update promo codes"
  ON public.promo_codes FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete promo codes"
  ON public.promo_codes FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_promo_codes_updated_at
  BEFORE UPDATE ON public.promo_codes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.claims
  ADD COLUMN IF NOT EXISTS promo_code_applied TEXT,
  ADD COLUMN IF NOT EXISTS discount_paise INT NOT NULL DEFAULT 0;
