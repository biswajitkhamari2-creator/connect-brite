-- RLS policies for claim-documents bucket
-- Files are stored under <user_id>/<claim_id>/<filename>

create policy "Users can upload own claim documents"
on storage.objects for insert to authenticated
with check (bucket_id = 'claim-documents' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can read own claim documents"
on storage.objects for select to authenticated
using (bucket_id = 'claim-documents' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can delete own claim documents"
on storage.objects for delete to authenticated
using (bucket_id = 'claim-documents' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Admins can read all claim documents"
on storage.objects for select to authenticated
using (bucket_id = 'claim-documents' and public.has_role(auth.uid(), 'admin'));
