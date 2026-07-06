CREATE INDEX IF NOT EXISTS idx_claims_user_created ON public.claims (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_claims_status_created ON public.claims (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_rewards_user_created ON public.rewards (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_rewards_claim ON public.rewards (claim_id);
CREATE INDEX IF NOT EXISTS idx_rewards_status_created ON public.rewards (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_rewards_audit_reward_created ON public.rewards_audit_log (reward_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_rewards_audit_actor ON public.rewards_audit_log (actor_id);
CREATE INDEX IF NOT EXISTS idx_notices_active_expires ON public.notices (expires_at) WHERE active = true;