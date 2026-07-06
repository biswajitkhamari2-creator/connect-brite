// @ts-nocheck
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const FROM_EMAIL = "noreply@claimforsure.in";
const FROM_NAME = "ClaimForSure";
const OTP_TTL_MINUTES = 10;

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

function otpHtml(otp: string, name: string) {
  const who = name?.trim() || "there";
  return `<!doctype html>
<html><body style="margin:0;padding:0;background:#f6f7fb;font-family:Arial,Helvetica,sans-serif;color:#1a1a2e;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f6f7fb;padding:32px 12px;">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;padding:32px;max-width:480px;">
        <tr><td style="font-size:20px;font-weight:700;color:#0f172a;padding-bottom:8px;">ClaimForSure</td></tr>
        <tr><td style="font-size:22px;font-weight:700;padding:12px 0 4px;">Your signup code</td></tr>
        <tr><td style="font-size:14px;line-height:22px;color:#334155;padding-bottom:20px;">
          Hi ${who},<br/><br/>
          Use the code below to complete your ClaimForSure signup. It expires in ${OTP_TTL_MINUTES} minutes.
        </td></tr>
        <tr><td align="center" style="padding:8px 0 20px;">
          <div style="display:inline-block;background:#0f172a;color:#ffffff;font-size:32px;letter-spacing:10px;font-weight:700;padding:16px 28px;border-radius:10px;">${otp}</div>
        </td></tr>
        <tr><td style="font-size:12px;color:#94a3b8;padding-top:16px;border-top:1px solid #e2e8f0;">
          If you did not request this code, you can safely ignore this email.
        </td></tr>
      </table>
      <div style="font-size:11px;color:#94a3b8;padding-top:16px;">© ClaimForSure · Bhubaneswar, India</div>
    </td></tr>
  </table>
</body></html>`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json(405, { error: "Method not allowed" });

  try {
    const body = await req.json();
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");
    const full_name = String(body.full_name || "").trim();
    const phone = String(body.phone || "");
    const ip = body.ip ? String(body.ip) : null;
    const user_agent = body.user_agent ? String(body.user_agent) : null;

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json(400, { error: "invalid_email" });
    if (password.length < 8) return json(400, { error: "weak_password" });
    if (!full_name) return json(400, { error: "missing_name" });
    if (!/^\d{10}$/.test(phone)) return json(400, { error: "invalid_phone" });

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // Reject if already registered
    const { data: existing } = await admin
      .from("profiles")
      .select("user_id")
      .eq("email", email)
      .maybeSingle();
    if (existing) return json(200, { ok: false, code: "already_registered" });

    // Generate OTP
    const otp = String(Math.floor(Math.random() * 1_000_000)).padStart(6, "0");
    const otp_hash = await sha256Hex(`${email}:${otp}`);
    const expires_at = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000).toISOString();

    await admin.from("signup_otps").delete().eq("email", email);
    const { error: insertErr } = await admin.from("signup_otps").insert({
      email,
      otp_hash,
      full_name,
      phone,
      password_hash: password, // transient; deleted after verify
      ip,
      user_agent,
      expires_at,
    });
    if (insertErr) return json(500, { error: "store_failed", detail: insertErr.message });

    // Send via user's own SMTP
    const host = Deno.env.get("SMTP_HOST");
    const portStr = Deno.env.get("SMTP_PORT");
    const user = Deno.env.get("SMTP_USER");
    const pass = Deno.env.get("SMTP_PASS");
    if (!host || !portStr || !user || !pass) {
      return json(500, { error: "smtp_not_configured" });
    }
    const port = Number(portStr);

    const client = new SMTPClient({
      connection: {
        hostname: host,
        port,
        tls: port === 465,
        auth: { username: user, password: pass },
      },
    });

    // Some providers require the From address to match the authenticated user's domain.
    // Prefer the requested branded sender whenever the SMTP account is from the same domain.
    const smtpDomain = user.split("@")[1]?.toLowerCase() || "";
    const brandedDomain = FROM_EMAIL.split("@")[1].toLowerCase();
    const fromEmail = smtpDomain && smtpDomain !== brandedDomain ? user : FROM_EMAIL;
    const startedAt = Date.now();

    try {
      await client.send({
        from: { mail: fromEmail, name: FROM_NAME },
        replyTo: { mail: FROM_EMAIL, name: FROM_NAME },
        to: { mail: email },
        subject: "Your ClaimForSure verification code",
        content: `Hi ${full_name || "there"},\n\nYour ClaimForSure signup code is: ${otp}\nIt expires in ${OTP_TTL_MINUTES} minutes.\n\nIf you did not request this, ignore this email.`,
        html: otpHtml(otp, full_name),
        headers: {
          "X-Entity-Ref-ID": crypto.randomUUID(),
          "X-Auto-Response-Suppress": "All",
        },
      });
      console.log("[send-signup-otp] SMTP accepted", {
        to: email,
        from: fromEmail,
        host,
        port,
        elapsed_ms: Date.now() - startedAt,
      });
    } catch (mailErr) {
      console.error("[send-signup-otp] SMTP send failed", mailErr);
      return json(500, { error: "send_failed", detail: String(mailErr) });
    } finally {
      try {
        await client.close();
      } catch {
        // already closed / connection failed
      }
    }

    return json(200, { ok: true });
  } catch (err) {
    console.error("[send-signup-otp] error", err);
    return json(500, { error: "unexpected", detail: String(err) });
  }
});