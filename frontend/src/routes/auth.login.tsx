import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { AuthShell, Field, inputCx, btnPrimary } from "@/components/AuthCard";
import { api } from "@/lib/api";

export const Route = createFileRoute("/auth/login")({
  component: LoginPage,
  head: () => ({
    meta: [
      { title: "Login — ClaimForSure" },
      { name: "description", content: "Sign in to your ClaimForSure account to track your insurance claim." },
      { name: "robots", content: "noindex,nofollow" },
      { property: "og:title", content: "Login — ClaimForSure" },
      { property: "og:description", content: "Sign in to your ClaimForSure account to track your insurance claim." },
    ],
  }),
});

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password required"),
});

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse({ email, password });
    if (!parsed.success) {
      toast.error(parsed.error.errors[0].message);
      return;
    }
    setLoading(true);
    try {
      await api.auth.login(email.trim(), password);
      toast.success("Welcome back!");
      navigate({ to: "/dashboard" });
    } catch (err) {
      toast.error((err as Error).message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to access your claims dashboard."
      footer={<>New to ClaimForSure? <Link to="/auth/signup" className="font-semibold text-[oklch(0.85_0.14_80)] hover:underline">Create an account</Link></>}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Email">
          <input type="email" autoComplete="email" className={inputCx} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
        </Field>
        <Field label="Password">
          <div className="relative">
            <input type={show ? "text" : "password"} autoComplete="current-password" className={inputCx} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
            <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1.5 text-white/60 hover:text-white">
              {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </Field>

        <div className="flex justify-end">
          <Link to="/auth/forgot" className="text-xs text-white/70 hover:text-white">Forgot password?</Link>
        </div>

        <button type="submit" disabled={loading} className={btnPrimary}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Login"}
        </button>
      </form>
    </AuthShell>
  );
}
