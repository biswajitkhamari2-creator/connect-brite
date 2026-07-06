import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { sendMail } from "@/lib/mail.functions";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/mail-test")({
  ssr: false,
  component: MailTestPage,
  head: () => ({ meta: [{ title: "SMTP Test — Admin" }, { name: "robots", content: "noindex,nofollow" }] }),
});

function MailTestPage() {
  const send = useServerFn(sendMail);
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("SMTP test from Claim For Sure");
  const [html, setHtml] = useState("<h2>Hello 👋</h2><p>This is a test email sent via your SMTP.</p>");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate({ to: "/admin/login" }); return; }
      const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" });
      if (!isAdmin) { await supabase.auth.signOut(); navigate({ to: "/admin/login" }); return; }
      setChecking(false);
    })();
  }, [navigate]);

  if (checking) return null;

  const submit = async () => {
    if (!to) {
      toast.error("Recipient email is required");
      return;
    }
    setLoading(true);
    try {
      await send({ data: { to, subject, html } });
      toast.success("Email sent!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Send failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">SMTP Test</h1>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="to">Recipient email</Label>
          <Input id="to" type="email" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="subject">Subject</Label>
          <Input id="subject" value={subject} onChange={(e) => setSubject(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="html">HTML body</Label>
          <Textarea id="html" rows={6} value={html} onChange={(e) => setHtml(e.target.value)} />
        </div>
        <Button type="button" onClick={submit} disabled={loading}>{loading ? "Sending..." : "Send test email"}</Button>
      </div>
    </div>
  );
}