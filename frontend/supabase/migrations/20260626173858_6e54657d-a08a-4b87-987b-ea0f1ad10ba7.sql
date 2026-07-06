
-- 1. Extend claims table
ALTER TABLE public.claims
  ADD COLUMN IF NOT EXISTS declared_payout_paise BIGINT,
  ADD COLUMN IF NOT EXISTS payout_declared_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS payout_proof_path TEXT,
  ADD COLUMN IF NOT EXISTS payout_insurer_name TEXT,
  ADD COLUMN IF NOT EXISTS payout_verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS payout_verified_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS payout_verification_status TEXT NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS success_fee_paise BIGINT,
  ADD COLUMN IF NOT EXISTS gst_paise BIGINT,
  ADD COLUMN IF NOT EXISTS success_fee_status TEXT NOT NULL DEFAULT 'not_due',
  ADD COLUMN IF NOT EXISTS success_fee_invoice_no TEXT,
  ADD COLUMN IF NOT EXISTS success_fee_due_date DATE;

-- 2. Extend profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_defaulter BOOLEAN NOT NULL DEFAULT false;

-- 3. invoice_counter
CREATE TABLE IF NOT EXISTS public.invoice_counter (
  id INT PRIMARY KEY DEFAULT 1,
  next_no INT NOT NULL DEFAULT 1,
  prefix TEXT NOT NULL DEFAULT 'CFS',
  fiscal_year TEXT NOT NULL DEFAULT to_char(now(), 'YY') || '-' || to_char(now() + interval '1 year', 'YY'),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT invoice_counter_singleton CHECK (id = 1)
);
INSERT INTO public.invoice_counter (id) VALUES (1) ON CONFLICT DO NOTHING;

GRANT SELECT ON public.invoice_counter TO authenticated;
GRANT ALL ON public.invoice_counter TO service_role;
ALTER TABLE public.invoice_counter ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view counter"
  ON public.invoice_counter FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 4. invoices
CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_no TEXT NOT NULL UNIQUE,
  claim_id UUID NOT NULL REFERENCES public.claims(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  base_amount_paise BIGINT NOT NULL,
  gst_paise BIGINT NOT NULL,
  total_paise BIGINT NOT NULL,
  status TEXT NOT NULL DEFAULT 'issued', -- issued | paid | overdue | written_off | cancelled
  issued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  due_date DATE NOT NULL,
  paid_at TIMESTAMPTZ,
  razorpay_payment_id TEXT,
  pdf_path TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.invoices TO authenticated;
GRANT ALL ON public.invoices TO service_role;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own invoices"
  ON public.invoices FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage invoices"
  ON public.invoices FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_invoices_updated_at
  BEFORE UPDATE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_invoices_user_status ON public.invoices(user_id, status);
CREATE INDEX IF NOT EXISTS idx_invoices_claim ON public.invoices(claim_id);
CREATE INDEX IF NOT EXISTS idx_invoices_due ON public.invoices(due_date) WHERE status IN ('issued','overdue');

-- 5. defaulters
CREATE TABLE IF NOT EXISTS public.defaulters (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_flagged_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  total_outstanding_paise BIGINT NOT NULL DEFAULT 0,
  last_reminder_at TIMESTAMPTZ,
  reminder_count INT NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active', -- active | recovered | written_off
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.defaulters TO authenticated;
GRANT ALL ON public.defaulters TO service_role;
ALTER TABLE public.defaulters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own defaulter record"
  ON public.defaulters FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage defaulters"
  ON public.defaulters FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_defaulters_updated_at
  BEFORE UPDATE ON public.defaulters
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 6. Trigger: sync defaulter status from invoices
CREATE OR REPLACE FUNCTION public.sync_defaulter_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_outstanding BIGINT;
BEGIN
  SELECT COALESCE(SUM(total_paise), 0) INTO v_outstanding
  FROM public.invoices
  WHERE user_id = NEW.user_id AND status = 'overdue';

  IF v_outstanding > 0 THEN
    INSERT INTO public.defaulters (user_id, total_outstanding_paise, status)
    VALUES (NEW.user_id, v_outstanding, 'active')
    ON CONFLICT (user_id) DO UPDATE
      SET total_outstanding_paise = v_outstanding,
          status = CASE WHEN public.defaulters.status = 'written_off' THEN 'written_off' ELSE 'active' END,
          updated_at = now();

    UPDATE public.profiles SET is_defaulter = true WHERE user_id = NEW.user_id;
  ELSE
    UPDATE public.defaulters
      SET total_outstanding_paise = 0,
          status = CASE WHEN status = 'written_off' THEN 'written_off' ELSE 'recovered' END,
          updated_at = now()
      WHERE user_id = NEW.user_id;

    UPDATE public.profiles SET is_defaulter = false WHERE user_id = NEW.user_id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_defaulter ON public.invoices;
CREATE TRIGGER trg_sync_defaulter
  AFTER INSERT OR UPDATE OF status ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.sync_defaulter_status();
