
CREATE TABLE public.signup_otps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  otp_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  ip TEXT,
  user_agent TEXT,
  attempts INT NOT NULL DEFAULT 0,
  expires_at TIMESTAMPTZ NOT NULL,
  consumed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX signup_otps_email_idx ON public.signup_otps(email);
GRANT ALL ON public.signup_otps TO service_role;
ALTER TABLE public.signup_otps ENABLE ROW LEVEL SECURITY;
-- No policies: only service_role (server) accesses this table.
