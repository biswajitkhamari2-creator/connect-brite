import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AlertCircle, Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { AuthShell, Field, inputCx, btnGhost, btnPrimary } from "@/components/AuthCard";

export const Route = createFileRoute("/auth/reset")({
  component: ResetPage,
  head: () => ({ meta: [{ title: "New Password — ClaimForSure" }, { name: "robots", content: "noindex,nofollow" }] }),
});

const passwordRe = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

function ResetPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  // PHP backend sends token as ?token=... query param (not a hash)
  const [resetToken, setResetToken] = useState<string | null>(null);

  useEffect(() => {
    // Read token from URL query string: /auth/reset?token=abc123
    const params = new URLSearchParams(window.location.search);
    const t = params.get("token");
    setResetToken(t);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!passwordRe.test(password)) return toast.error("Password must have 8+ chars, upper, lower, number, special.");
    if (password !== confirm) return toast.error("Passwords do not match");
    if (!resetToken) return toast.error("Please open the reset link from your email.");
    setLoading(true);
    try {
      await api.auth.reset(resetToken, password);
      toast.success("Password updated. Please log in.");
      navigate({ to: "/auth/login" });
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell title="Set a new password" subtitle="Choose a strong password.">
      {!resetToken ? (
        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-lg border border-amber-300/30 bg-amber-300/10 p-4 text-sm text-amber-100">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
            <p>This reset link is missing, expired, or already used. Request a fresh link and open it from the same browser.</p>
          </div>
          <button type="button" onClick={() => navigate({ to: "/auth/forgot" })} className={btnGhost}>
            Request new reset link
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="New password" error={password && !passwordRe.test(password) ? "8+ chars with uppercase, lowercase, number & special character" : undefined}>
            <div className="relative">
              <input type={show ? "text" : "password"} className={inputCx} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
              <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1.5 text-white/60 hover:text-white">
                {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </Field>
          <Field label="Confirm password" error={confirm && password !== confirm ? "Passwords do not match" : undefined}>
            <input type={show ? "text" : "password"} className={inputCx} value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" />
          </Field>
          <p className="text-xs text-white/60">Must be 8+ characters and include uppercase, lowercase, a number, and a special character (e.g. <code>!@#$%</code>).</p>
          <button type="submit" disabled={loading} className={btnPrimary}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Update password"}
          </button>
        </form>
      )}
    </AuthShell>
  );
}
