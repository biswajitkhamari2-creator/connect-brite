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
    const DEFAULT_API_BASE_URL = "http://localhost:8000";
    const BASE = "http://localhost:8000";
    
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