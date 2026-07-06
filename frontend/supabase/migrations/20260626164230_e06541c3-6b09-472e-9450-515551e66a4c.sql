ALTER TABLE public.claims
  ADD COLUMN IF NOT EXISTS payment_status TEXT NOT NULL DEFAULT 'not_required',
  ADD COLUMN IF NOT EXISTS payment_amount_paise INTEGER,
  ADD COLUMN IF NOT EXISTS payment_order_id TEXT,
  ADD COLUMN IF NOT EXISTS payment_id TEXT,
  ADD COLUMN IF NOT EXISTS payment_paid_at TIMESTAMPTZ;

-- When a claim moves to 'approved', mark payment as pending with 1500 + 18% GST = 1770 INR (177000 paise)
CREATE OR REPLACE FUNCTION public.set_payment_on_approval()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'approved' AND (OLD.status IS DISTINCT FROM 'approved') THEN
    IF NEW.payment_status IN ('not_required', 'pending') AND NEW.payment_status <> 'paid' THEN
      NEW.payment_status := 'pending';
      NEW.payment_amount_paise := COALESCE(NEW.payment_amount_paise, 177000);
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_payment_on_approval ON public.claims;
CREATE TRIGGER trg_set_payment_on_approval
  BEFORE UPDATE ON public.claims
  FOR EACH ROW EXECUTE FUNCTION public.set_payment_on_approval();

CREATE INDEX IF NOT EXISTS idx_claims_user_payment_pending
  ON public.claims (user_id) WHERE payment_status = 'pending';