
-- S1: lock down rewards_audit_log inserts to admins only
DROP POLICY IF EXISTS "Authenticated insert audit entries" ON public.rewards_audit_log;
CREATE POLICY "Admins insert audit entries"
ON public.rewards_audit_log
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin') AND auth.uid() = actor_id);

-- S2: rewards_config no longer world-readable
DROP POLICY IF EXISTS "Anyone can read rewards config" ON public.rewards_config;
CREATE POLICY "Authenticated can read rewards config"
ON public.rewards_config
FOR SELECT
TO authenticated
USING (true);

-- S4: explicit UPDATE policy on claim-documents bucket (owner-only)
DROP POLICY IF EXISTS "Users can update own claim documents" ON storage.objects;
CREATE POLICY "Users can update own claim documents"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'claim-documents' AND auth.uid()::text = (storage.foldername(name))[1])
WITH CHECK (bucket_id = 'claim-documents' AND auth.uid()::text = (storage.foldername(name))[1]);
