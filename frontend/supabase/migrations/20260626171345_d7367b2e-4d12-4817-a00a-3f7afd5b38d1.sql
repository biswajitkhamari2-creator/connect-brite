CREATE OR REPLACE FUNCTION public.set_payment_on_approval()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  IF NEW.status = 'approved' AND (OLD.status IS DISTINCT FROM 'approved') THEN
    IF NEW.payment_status <> 'paid' THEN
      NEW.payment_status := 'pending';
      NEW.payment_amount_paise := COALESCE(NEW.payment_amount_paise, 177000);
    END IF;
  ELSIF NEW.status <> 'approved' AND OLD.status = 'approved' THEN
    IF NEW.payment_status = 'pending' THEN
      NEW.payment_status := 'not_required';
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS claims_set_payment_on_approval ON public.claims;
CREATE TRIGGER claims_set_payment_on_approval
BEFORE UPDATE ON public.claims
FOR EACH ROW
EXECUTE FUNCTION public.set_payment_on_approval();