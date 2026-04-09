// ============================================================================
// DECOY ROUTE: Fake Admin Panel
// Monitored honeypot. Every interaction is logged as hostile.
// ============================================================================

import { getFakeAdminPage, checkHoneypotFields, recordSignal, logThreatIntel } from "@/lib/deception";
import { getClientIp } from "@/lib/security";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const ip = getClientIp(request);
  return new Response(getFakeAdminPage(ip), {
    status: 200,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);

  // Log the credential attempt
  let body: Record<string, unknown> = {};
  try {
    const text = await request.text();
    // Parse form data
    const params = new URLSearchParams(text);
    body = Object.fromEntries(params.entries());
  } catch {
    // Ignore parse errors
  }

  // Check honeypot field (bots fill the hidden "website" field)
  checkHoneypotFields(body, ip);

  // Log the credential capture attempt
  const signal = {
    type: "honeypot_triggered" as const,
    severity: "critical" as const,
    ip,
    timestamp: Date.now(),
    details: {
      trap: "admin_login_attempt",
      username: typeof body.username === "string" ? body.username.slice(0, 50) : undefined,
      // Never log actual passwords, just the fact an attempt was made
      hasPassword: !!body.password,
      honeypotFilled: !!body.website,
    },
  };
  recordSignal(signal);
  logThreatIntel(signal);

  // Simulate a failed login with a realistic delay
  await new Promise((r) => setTimeout(r, 800 + Math.random() * 1200));

  // Return a convincing failure (keep them trying)
  return new Response(
    getFakeAdminPage(ip).replace(
      '<p class="error" id="err"></p>',
      '<p class="error" id="err">Invalid credentials. Please try again.</p>'
    ),
    {
      status: 200,
      headers: {
        "content-type": "text/html; charset=utf-8",
        "cache-control": "no-store",
      },
    }
  );
}
