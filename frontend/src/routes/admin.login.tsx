import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Shield, Eye, EyeOff, Loader2 } from "lucide-react";
import { BrandLockup } from "@/components/BrandLockup";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/login")({
  ssr: false,
  head: () => ({ meta: [{ title: "Admin Login — ClaimForSure" }, { name: "robots", content: "noindex,nofollow" }] }),
  component: AdminLoginPage,
});

function AdminLoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error || !data.user) {
        toast.error(error?.message || "Login failed");
        return;
      }
      const { data: isAdmin, error: roleErr } = await supabase.rpc("has_role", {
        _user_id: data.user.id,
        _role: "admin",
      });
      if (roleErr) {
        toast.error("Error verifying admin access");
        await supabase.auth.signOut();
        return;
      }
      if (!isAdmin) {
        toast.error("Access denied. Admin privileges required.");
        await supabase.auth.signOut();
        return;
      }
      toast.success("Welcome, Admin!");
      navigate({ to: "/admin" });
    } catch (err) {
      toast.error((err as Error).message || "Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[oklch(0.2_0.05_265)] text-white">
      <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-12">
        <Link to="/" className="mb-8 text-center text-sm text-white/70 hover:text-white">
          ← Back to ClaimForSure
        </Link>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-8 shadow-xl backdrop-blur">
          <div className="mb-6 flex flex-col items-center gap-2 text-center">
            <BrandLockup size="sm" layout="stacked" tone="light" />
            <h1 className="font-serif text-2xl font-bold">Admin Portal</h1>
            <p className="text-sm text-white/70">Restricted access — authorized personnel only</p>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-md border border-white/20 bg-white/10 px-3 py-2 text-sm text-white placeholder-white/40 focus:border-[oklch(0.82_0.14_80)] focus:outline-none"
                placeholder="admin@claimforsure.in"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Password</label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-md border border-white/20 bg-white/10 px-3 py-2 pr-10 text-sm text-white placeholder-white/40 focus:border-[oklch(0.82_0.14_80)] focus:outline-none"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((s) => !s)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-white/60 hover:text-white"
                  aria-label="Toggle password visibility"
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-[oklch(0.82_0.14_80)] px-4 py-2.5 text-sm font-semibold text-[oklch(0.2_0.05_265)] transition hover:scale-[1.01] disabled:opacity-60"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Shield className="h-4 w-4" />}
              {loading ? "Verifying…" : "Sign in to Admin"}
            </button>
          </form>
          <p className="mt-6 text-center text-xs text-white/50">
            Only verified admin accounts can sign in here. Misuse is monitored.
          </p>
        </div>
      </div>
    </div>
  );
}
