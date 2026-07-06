import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const InputSchema = z.object({
  to: z.string().email(),
  subject: z.string().min(1).max(200),
  html: z.string().optional(),
  text: z.string().optional(),
  from: z.string().email().optional(),
  fromName: z.string().optional(),
});

export const sendMail = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => InputSchema.parse(data))
  .handler(async ({ data }) => {
    const getApiBaseUrl = (): string => {
      if (typeof window !== "undefined" && window.location.hostname) {
        const host = window.location.hostname;
        const isLocal = host === "localhost" || host === "127.0.0.1" || host.startsWith("192.168.") || host.startsWith("10.");
        if (!isLocal) return "";
        return `http://${host}:8000`;
      }
      return "http://localhost:8000";
    };
    const BASE = getApiBaseUrl();
    
    let token = "";
    if (typeof window !== "undefined") {
      token = localStorage.getItem("cfs_token") || "";
    }

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch(`${BASE}/api/admin/send-mail`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        to: data.to,
        subject: data.subject,
        html: data.html,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      let msg = "Email sending failed";
      try {
        const json = JSON.parse(errText);
        msg = json.message || msg;
      } catch {
        msg = errText || msg;
      }
      throw new Error(msg);
    }

    return { ok: true };
  });