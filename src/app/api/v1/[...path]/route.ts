// ============================================================================
// DECOY ROUTE: Fake API v1/v2 endpoints
// Returns realistic but poisoned data. Every interaction is intelligence.
// ============================================================================

import { getFakeApiResponse, recordSignal, logThreatIntel } from "@/lib/deception";
import { getClientIp } from "@/lib/security";
import type { NextRequest } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const ip = getClientIp(request);
  const { path } = await params;
  const fullPath = "/api/v1/" + path.join("/");

  // Add slight random delay to simulate real API
  await new Promise((r) => setTimeout(r, 50 + Math.random() * 150));

  const response = getFakeApiResponse(fullPath, ip);
  return Response.json(response, {
    headers: {
      "x-request-id": crypto.randomUUID(),
      "x-ratelimit-limit": "100",
      "x-ratelimit-remaining": String(Math.floor(Math.random() * 90 + 5)),
    },
  });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const ip = getClientIp(request);
  const { path } = await params;
  const fullPath = "/api/v1/" + path.join("/");

  const signal = {
    type: "honeypot_triggered" as const,
    severity: "critical" as const,
    ip,
    timestamp: Date.now(),
    details: { trap: "fake_api_post", path: fullPath },
  };
  recordSignal(signal);
  logThreatIntel(signal);

  // Return fake "created" response
  return Response.json(
    { id: crypto.randomUUID(), status: "created" },
    { status: 201 }
  );
}
