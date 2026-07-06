// @ts-nocheck
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const MAX_ATTEMPTS = 5;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

async function sha256Hex(input: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json(405, { error: "Method not allowed" });

  try {
    const body = await req.json();
    const email = String(body.email || "").trim().toLowerCase();
    const otp = String(body.otp || "").trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json(400, { error: "invalid_email" });
    if (!/^\d{6}$/.test(otp)) return json(400, { error: "invalid_otp" });

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: row, error: selErr } = await admin
      .from("signup_otps")
      .select("*")
      .eq("email", email)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (selErr) return json(500, { error: "lookup_failed", detail: selErr.message });
    if (!row) return json(200, { ok: false, code: "no_pending" });
    if (row.consumed_at) return json(200, { ok: false, code: "already_used" });
    if (new Date(row.expires_at).getTime() < Date.now()) return json(200, { ok: false, code: "expired" });
    if ((row.attempts ?? 0) >= MAX_ATTEMPTS) return json(200, { ok: false, code: "too_many_attempts" });

    const expectedHash = await sha256Hex(`${email}:${otp}`);
    if (row.otp_hash !== expectedHash) {
      await admin
        .from("signup_otps")
        .update({ attempts: (row.attempts ?? 0) + 1 })
        .eq("id", row.id);
      return json(200, { ok: false, code: "invalid" });
    }

    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email,
      password: row.password_hash,
      email_confirm: true,
      user_metadata: { full_name: row.full_name, phone: row.phone },
    });
    if (createErr || !created?.user) {
      const msg = (createErr?.message || "").toLowerCase();
      if (msg.includes("already") || msg.includes("registered") || msg.includes("exists")) {
        return json(200, { ok: false, code: "already_registered" });
      }
      return json(500, { error: "create_user_failed", detail: createErr?.message || "unknown" });
    }

    try {
      await admin.from("agreement_acceptances").insert({
        user_id: created.user.id,
        agreement_version: "1.0",
        agreement_title: "ClaimForSure Service Agreement",
        full_name: row.full_name,
        email,
        phone: row.phone,
        ip_address: row.ip ?? "",
        user_agent: row.user_agent ?? "",
      });
    } catch (e) {
      console.error("agreement_acceptances insert failed", e);
    }

    await admin.from("signup_otps").delete().eq("email", email);

    return json(200, { ok: true });
  } catch (err) {
    console.error("[verify-signup-otp] error", err);
    return json(500, { error: "unexpected", detail: String(err) });
  }
});