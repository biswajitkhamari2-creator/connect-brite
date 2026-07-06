import { createFileRoute, Link } from "@tanstack/react-router";
import type { FormEvent } from "react";
import { useMemo, useState } from "react";
import { Eye, EyeOff, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { api } from "@/lib/api";
import { AuthShell, Field, inputCx, btnPrimary } from "@/components/AuthCard";

export const Route = createFileRoute("/auth/signup")({
  component: SignupPage,
  head: () => ({ meta: [{ title: "Sign Up — ClaimForSure" }, { name: "robots", content: "noindex,nofollow" }] }),
});

const passwordRe = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
const AGREEMENT_VERSION = "1.0";

const schema = z
  .object({
    full_name: z.string().trim().min(2, "Enter your full name"),
    email: z.string().trim().email("Enter a valid email"),
    phone: z.string().regex(/^\d{10}$/, "Mobile must be exactly 10 digits"),
    password: z.string().regex(passwordRe, "8+ chars with upper, lower, number, special"),
    confirm: z.string(),
    accept: z.literal(true, { errorMap: () => ({ message: "You must accept the Privacy Policy" }) }),
    accept_agreement: z.literal(true, { errorMap: () => ({ message: "You must accept the Service Agreement (20% + GST success fee)" }) }),
  })
  .refine((d) => d.password === d.confirm, { path: ["confirm"], message: "Passwords do not match" });

function SignupPage() {
  const [form, setForm] = useState({ full_name: "", email: "", phone: "", password: "", confirm: "", accept: false, accept_agreement: false });
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const validation = useMemo(() => schema.safeParse(form), [form]);
  const valid = validation.success;
  const errors: Record<string, string> = !valid
    ? Object.fromEntries(validation.error.errors.map((e) => [e.path[0] as string, e.message]))
    : {};

  function set<K extends keyof typeof form>(key: K, val: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  async function submitSignup(formEl: HTMLFormElement) {
    if (loading) return;
    const data = new FormData(formEl);
    const payload = {
      email: String(data.get("email") ?? "").trim(),
      password: String(data.get("password") ?? ""),
      full_name: String(data.get("full_name") ?? "").trim(),
      phone: String(data.get("phone") ?? ""),
      confirm: String(data.get("confirm") ?? ""),
      accept: data.get("accept") === "yes",
      accept_agreement: data.get("accept_agreement") === "yes",
    };

    const parsed = schema.safeParse(payload);
    if (!parsed.success) {
      const message = parsed.error.errors[0]?.message || "Please check your details.";
      setSubmitError(message);
      toast.error(message);
      return;
    }

    setSubmitError("");
    setLoading(true);
    try {
      // Register via PHP backend
      await api.auth.signup({
        email: payload.email,
        password: payload.password,
        full_name: payload.full_name,
        phone: payload.phone,
      });

      // Auto-login after registration
      await api.auth.login(payload.email, payload.password);

      toast.success("Account created. Signing you in…");
      window.location.href = "/dashboard";
    } catch (err) {
      const rawMessage = (err as Error).message || "Signup failed. Please try again.";
      const lower = rawMessage.toLowerCase();
      const message =
        lower.includes("already") || lower.includes("duplicate") || lower.includes("exists")
          ? "This email is already registered. Please proceed to login."
          : lower.includes("weak") || lower.includes("pwned")
          ? "This password is too common. Please use a strong unique password (14+ characters with mixed words, numbers, and symbols)."
          : rawMessage;
      setSubmitError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    void submitSignup(e.currentTarget);
  }

  return (
    <AuthShell
      title="Create your account"
      subtitle="Track your claim end-to-end."
      footer={<>Already have an account? <Link to="/auth/login" className="font-semibold text-[oklch(0.85_0.14_80)] hover:underline">Login</Link></>}
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <Field label="Full name" error={form.full_name ? errors.full_name : undefined}>
          <input name="full_name" className={inputCx} value={form.full_name} onChange={(e) => set("full_name", e.target.value)} placeholder="Your name" />
        </Field>
        <Field label="Email" error={form.email ? errors.email : undefined}>
          <input name="email" type="email" autoComplete="email" className={inputCx} value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="you@example.com" />
        </Field>
        <Field label="Mobile (10 digits)" error={form.phone ? errors.phone : undefined}>
          <input name="phone" inputMode="numeric" maxLength={10} className={inputCx} value={form.phone} onChange={(e) => set("phone", e.target.value.replace(/\D/g, ""))} placeholder="9876543210" />
        </Field>
        <Field label="Password" error={form.password ? errors.password : undefined}>
          <div className="relative">
            <input name="password" type={show ? "text" : "password"} autoComplete="new-password" className={inputCx} value={form.password} onChange={(e) => set("password", e.target.value)} placeholder="••••••••" />
            <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1.5 text-white/60 hover:text-white">
              {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </Field>
        <Field label="Confirm password" error={form.confirm ? errors.confirm : undefined}>
          <input name="confirm" type={show ? "text" : "password"} autoComplete="new-password" className={inputCx} value={form.confirm} onChange={(e) => set("confirm", e.target.value)} placeholder="••••••••" />
        </Field>

        <label className="flex items-start gap-2.5 text-xs text-white/75">
          <input name="accept" value="yes" type="checkbox" checked={form.accept} onChange={(e) => set("accept", e.target.checked as never)} className="mt-0.5 h-4 w-4 rounded border-white/30 bg-white/10 accent-[oklch(0.78_0.14_78)]" />
          <span>
            I accept the{" "}
            <Link to="/privacy" className="text-[oklch(0.85_0.14_80)] underline">Privacy Policy</Link> and{" "}
            <Link to="/terms" className="text-[oklch(0.85_0.14_80)] underline">Terms</Link>.
          </span>
        </label>

        <label className="flex items-start gap-2.5 rounded-lg border border-[oklch(0.78_0.14_78)]/30 bg-[oklch(0.78_0.14_78)]/5 p-3 text-xs text-white/85">
          <input name="accept_agreement" value="yes" type="checkbox" checked={form.accept_agreement} onChange={(e) => set("accept_agreement", e.target.checked as never)} className="mt-0.5 h-4 w-4 rounded border-white/30 bg-white/10 accent-[oklch(0.78_0.14_78)]" />
          <span>
            I have read, understood and accept the{" "}
            <Link to="/service-agreement" target="_blank" className="font-semibold text-[oklch(0.85_0.14_80)] underline">ClaimForSure Service Agreement (v{AGREEMENT_VERSION})</Link>,
            including the <strong>processing fee of ₹1,770</strong> on claim approval and the <strong>success fee of 20% + GST</strong> on any amount sanctioned/paid by the insurer.
            I agree this electronic acceptance is legally binding under the IT Act, 2000 and that jurisdiction lies with the courts at Bhubaneswar, Odisha.
          </span>
        </label>

        {submitError && (
          <div className="rounded-lg border border-red-300/30 bg-red-400/10 p-3 text-xs leading-relaxed text-red-100" role="alert">
            <p>{submitError}</p>
            {submitError.toLowerCase().includes("already registered") && (
              <Link to="/auth/login" className="mt-2 inline-block font-semibold text-[oklch(0.85_0.14_80)] underline">
                Proceed to login →
              </Link>
            )}
          </div>
        )}

        <button type="submit" disabled={loading} className={btnPrimary}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><span>Create account</span> <CheckCircle2 className="h-4 w-4" /></>}
        </button>
      </form>
    </AuthShell>
  );
}
