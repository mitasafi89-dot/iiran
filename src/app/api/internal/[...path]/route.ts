// ============================================================================
// DECOY ROUTE: Fake .env / config files
// Returns convincing but poisoned credentials to waste attacker time.
// ============================================================================

import { getFakeEnvFile, getFakeGitContent, recordSignal, logThreatIntel } from "@/lib/deception";
import { getClientIp } from "@/lib/security";
import type { NextRequest } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const ip = getClientIp(request);
  const { path } = await params;
  const fullPath = "/" + path.join("/");

  const signal = {
    type: "canary_access" as const,
    severity: "critical" as const,
    ip,
    timestamp: Date.now(),
    details: { trap: "sensitive_file_probe", path: fullPath },
  };
  recordSignal(signal);
  logThreatIntel(signal);

  // Short realistic delay
  await new Promise((r) => setTimeout(r, 30 + Math.random() * 70));

  // Route to appropriate fake content
  if (fullPath.includes(".env")) {
    return new Response(getFakeEnvFile(ip), {
      headers: { "content-type": "text/plain" },
    });
  }

  if (fullPath.includes(".git")) {
    return new Response(getFakeGitContent(fullPath, ip), {
      headers: { "content-type": "text/plain" },
    });
  }

  // Generic config file
  return new Response("# Configuration\napi_key=vault:managed\n", {
    headers: { "content-type": "text/plain" },
  });
}
