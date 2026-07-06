DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace WHERE t.typname = 'app_role' AND n.nspname = 'public') THEN
    CREATE TYPE public.app_role AS ENUM ('admin', 'user');
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  full_name TEXT,
  phone TEXT,
  email TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role public.app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;

DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "Admins can insert roles" ON public.user_roles;
CREATE POLICY "Admins can insert roles" ON public.user_roles FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "Admins can update roles" ON public.user_roles;
CREATE POLICY "Admins can update roles" ON public.user_roles FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "Admins can delete roles" ON public.user_roles;
CREATE POLICY "Admins can delete roles" ON public.user_roles FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name, phone)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'phone', '')
  )
  ON CONFLICT (user_id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(NULLIF(EXCLUDED.full_name, ''), public.profiles.full_name),
    phone = COALESCE(NULLIF(EXCLUDED.phone, ''), public.profiles.phone),
    updated_at = now();

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user')
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TABLE IF NOT EXISTS public.claims (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  claim_id TEXT NOT NULL UNIQUE,
  user_id UUID,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  insurance_type TEXT NOT NULL,
  insurance_company TEXT NOT NULL,
  policy_number TEXT NOT NULL,
  claim_amount DECIMAL(15,2) NOT NULL,
  rejection_date DATE NOT NULL,
  rejection_reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  documents TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.claims TO authenticated;
GRANT ALL ON public.claims TO service_role;
ALTER TABLE public.claims ENABLE ROW LEVEL SECURITY;
DROP TRIGGER IF EXISTS update_claims_updated_at ON public.claims;
CREATE TRIGGER update_claims_updated_at BEFORE UPDATE ON public.claims FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP POLICY IF EXISTS "Authenticated users can submit claims" ON public.claims;
CREATE POLICY "Authenticated users can submit claims" ON public.claims FOR INSERT TO authenticated WITH CHECK (user_id IS NOT NULL AND auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can view their own claims" ON public.claims;
CREATE POLICY "Users can view their own claims" ON public.claims FOR SELECT TO authenticated USING (user_id IS NOT NULL AND auth.uid() = user_id);
DROP POLICY IF EXISTS "Admins can view all claims" ON public.claims;
CREATE POLICY "Admins can view all claims" ON public.claims FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "Admins can update claims" ON public.claims;
CREATE POLICY "Admins can update claims" ON public.claims FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE IF NOT EXISTS public.rewards_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enabled BOOLEAN NOT NULL DEFAULT false,
  reward_type TEXT NOT NULL DEFAULT 'amazon_gift_card',
  reward_value NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'INR',
  eligibility_rules JSONB NOT NULL DEFAULT '{"free_look_completed": true, "policy_active": true, "kyc_completed": true, "no_cancellation": true, "no_fraud_flags": true, "min_days_after_issuance": 30}'::jsonb,
  disclaimer TEXT NOT NULL DEFAULT 'Rewards, if offered, are promotional, subject to applicable law, eligibility criteria, and Terms & Conditions. ClaimForSure reserves the right to modify or withdraw the program at any time.',
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_by UUID,
  appreciation_enabled BOOLEAN NOT NULL DEFAULT false
);
GRANT SELECT ON public.rewards_config TO anon, authenticated;
GRANT ALL ON public.rewards_config TO service_role;
ALTER TABLE public.rewards_config ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read rewards config" ON public.rewards_config;
CREATE POLICY "Anyone can read rewards config" ON public.rewards_config FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins can insert rewards config" ON public.rewards_config;
CREATE POLICY "Admins can insert rewards config" ON public.rewards_config FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "Admins can update rewards config" ON public.rewards_config;
CREATE POLICY "Admins can update rewards config" ON public.rewards_config FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
DROP TRIGGER IF EXISTS rewards_config_set_updated_at ON public.rewards_config;
CREATE TRIGGER rewards_config_set_updated_at BEFORE UPDATE ON public.rewards_config FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
INSERT INTO public.rewards_config (enabled, reward_type, reward_value) SELECT false, 'amazon_gift_card', 0 WHERE NOT EXISTS (SELECT 1 FROM public.rewards_config);

CREATE TABLE IF NOT EXISTS public.rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  claim_id UUID,
  policy_reference TEXT,
  reward_type TEXT NOT NULL,
  reward_value NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'INR',
  status TEXT NOT NULL DEFAULT 'pending',
  eligibility_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  admin_notes TEXT,
  rejection_reason TEXT,
  issue_reference TEXT,
  decided_by UUID,
  decided_at TIMESTAMP WITH TIME ZONE,
  issued_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  program_type TEXT NOT NULL DEFAULT 'request',
  gift_type TEXT,
  gift_value_inr NUMERIC,
  shipping_status TEXT,
  courier TEXT,
  awb TEXT,
  delivered_at TIMESTAMP WITH TIME ZONE,
  admin_remarks TEXT
);
GRANT SELECT, INSERT, UPDATE ON public.rewards TO authenticated;
GRANT ALL ON public.rewards TO service_role;
ALTER TABLE public.rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rewards DROP CONSTRAINT IF EXISTS rewards_program_type_check;
ALTER TABLE public.rewards ADD CONSTRAINT rewards_program_type_check CHECK (program_type IN ('request','appreciation'));
DROP POLICY IF EXISTS "Users view own rewards" ON public.rewards;
CREATE POLICY "Users view own rewards" ON public.rewards FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "Users create own pending reward request" ON public.rewards;
CREATE POLICY "Users create own pending reward request" ON public.rewards FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND status = 'pending');
DROP POLICY IF EXISTS "Admins insert rewards" ON public.rewards;
CREATE POLICY "Admins insert rewards" ON public.rewards FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "Admins update rewards" ON public.rewards;
CREATE POLICY "Admins update rewards" ON public.rewards FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
DROP TRIGGER IF EXISTS rewards_set_updated_at ON public.rewards;
CREATE TRIGGER rewards_set_updated_at BEFORE UPDATE ON public.rewards FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.rewards_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reward_id UUID,
  config_id UUID,
  actor_id UUID,
  action TEXT NOT NULL,
  before_state JSONB,
  after_state JSONB,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.rewards_audit_log TO authenticated;
GRANT ALL ON public.rewards_audit_log TO service_role;
ALTER TABLE public.rewards_audit_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins view audit log" ON public.rewards_audit_log;
CREATE POLICY "Admins view audit log" ON public.rewards_audit_log FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "Authenticated insert audit entries" ON public.rewards_audit_log;
CREATE POLICY "Authenticated insert audit entries" ON public.rewards_audit_log FOR INSERT TO authenticated WITH CHECK (auth.uid() = actor_id);

CREATE TABLE IF NOT EXISTS public.notices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info',
  active BOOLEAN NOT NULL DEFAULT true,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
GRANT SELECT ON public.notices TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.notices TO authenticated;
GRANT ALL ON public.notices TO service_role;
ALTER TABLE public.notices ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view active notices" ON public.notices;
CREATE POLICY "Anyone can view active notices" ON public.notices FOR SELECT USING (active = true AND (expires_at IS NULL OR expires_at > now()));
DROP POLICY IF EXISTS "Admins can view all notices" ON public.notices;
CREATE POLICY "Admins can view all notices" ON public.notices FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "Admins can insert notices" ON public.notices;
CREATE POLICY "Admins can insert notices" ON public.notices FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "Admins can update notices" ON public.notices;
CREATE POLICY "Admins can update notices" ON public.notices FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "Admins can delete notices" ON public.notices;
CREATE POLICY "Admins can delete notices" ON public.notices FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
DROP TRIGGER IF EXISTS update_notices_updated_at ON public.notices;
CREATE TRIGGER update_notices_updated_at BEFORE UPDATE ON public.notices FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();