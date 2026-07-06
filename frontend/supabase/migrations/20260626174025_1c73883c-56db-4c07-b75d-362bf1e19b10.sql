
CREATE OR REPLACE FUNCTION public.issue_success_fee_invoice(_claim_id UUID)
RETURNS TABLE(invoice_id UUID, invoice_no TEXT, base_paise BIGINT, gst_paise BIGINT, total_paise BIGINT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin UUID := auth.uid();
  v_claim public.claims%ROWTYPE;
  v_counter public.invoice_counter%ROWTYPE;
  v_next INT;
  v_fy TEXT;
  v_invoice_no TEXT;
  v_base BIGINT;
  v_gst BIGINT;
  v_total BIGINT;
  v_invoice_id UUID;
  v_due DATE := (now() + interval '7 days')::date;
BEGIN
  IF v_admin IS NULL OR NOT public.has_role(v_admin, 'admin') THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  SELECT * INTO v_claim FROM public.claims WHERE id = _claim_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'claim not found'; END IF;
  IF v_claim.declared_payout_paise IS NULL OR v_claim.declared_payout_paise <= 0 THEN
    RAISE EXCEPTION 'payout not declared';
  END IF;
  IF v_claim.success_fee_invoice_no IS NOT NULL THEN
    RAISE EXCEPTION 'invoice already issued';
  END IF;

  v_base := (v_claim.declared_payout_paise * 20) / 100;
  v_gst := (v_base * 18) / 100;
  v_total := v_base + v_gst;

  SELECT * INTO v_counter FROM public.invoice_counter WHERE id = 1 FOR UPDATE;
  v_next := v_counter.next_no;
  v_fy := v_counter.fiscal_year;
  v_invoice_no := v_counter.prefix || '/' || v_fy || '/' || lpad(v_next::text, 5, '0');

  UPDATE public.invoice_counter
    SET next_no = v_next + 1, updated_at = now()
    WHERE id = 1;

  INSERT INTO public.invoices (
    invoice_no, claim_id, user_id,
    base_amount_paise, gst_paise, total_paise,
    status, due_date
  ) VALUES (
    v_invoice_no, _claim_id, v_claim.user_id,
    v_base, v_gst, v_total,
    'issued', v_due
  ) RETURNING id INTO v_invoice_id;

  UPDATE public.claims SET
    success_fee_paise = v_base,
    gst_paise = v_gst,
    success_fee_status = 'invoiced',
    success_fee_invoice_no = v_invoice_no,
    success_fee_due_date = v_due,
    payout_verification_status = 'verified',
    payout_verified_at = now(),
    payout_verified_by = v_admin
  WHERE id = _claim_id;

  RETURN QUERY SELECT v_invoice_id, v_invoice_no, v_base, v_gst, v_total;
END;
$$;

REVOKE ALL ON FUNCTION public.issue_success_fee_invoice(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.issue_success_fee_invoice(UUID) TO authenticated;

-- Helper to mark an invoice paid (admin or via Razorpay payment from owner)
CREATE OR REPLACE FUNCTION public.mark_invoice_paid(_invoice_id UUID, _razorpay_payment_id TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_inv public.invoices%ROWTYPE;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'forbidden'; END IF;
  SELECT * INTO v_inv FROM public.invoices WHERE id = _invoice_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'invoice not found'; END IF;
  IF v_inv.user_id <> v_uid AND NOT public.has_role(v_uid, 'admin') THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  IF v_inv.status = 'paid' THEN RETURN; END IF;

  UPDATE public.invoices SET
    status = 'paid',
    paid_at = now(),
    razorpay_payment_id = COALESCE(_razorpay_payment_id, razorpay_payment_id)
  WHERE id = _invoice_id;

  UPDATE public.claims SET success_fee_status = 'paid' WHERE id = v_inv.claim_id;
END;
$$;
REVOKE ALL ON FUNCTION public.mark_invoice_paid(UUID, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.mark_invoice_paid(UUID, TEXT) TO authenticated;

-- Helper to mark overdue (admin)
CREATE OR REPLACE FUNCTION public.mark_invoice_overdue(_invoice_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_uid UUID := auth.uid();
BEGIN
  IF v_uid IS NULL OR NOT public.has_role(v_uid, 'admin') THEN RAISE EXCEPTION 'forbidden'; END IF;
  UPDATE public.invoices SET status = 'overdue' WHERE id = _invoice_id AND status = 'issued';
END;
$$;
REVOKE ALL ON FUNCTION public.mark_invoice_overdue(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.mark_invoice_overdue(UUID) TO authenticated;
