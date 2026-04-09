// ============================================================================
// DECOY ROUTE: Fake GraphQL endpoint
// Attackers probing for GraphQL get trapped.
// ============================================================================

import { recordSignal, logThreatIntel } from "@/lib/deception";
import { getClientIp } from "@/lib/security";
import type { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);

  let query = "";
  try {
    const body = await request.json();
    query = typeof body?.query === "string" ? body.query.slice(0, 500) : "";
  } catch {
    // ignore
  }

  const signal = {
    type: "honeypot_triggered" as const,
    severity: "critical" as const,
    ip,
    timestamp: Date.now(),
    details: { trap: "fake_graphql", query },
  };
  recordSignal(signal);
  logThreatIntel(signal);

  // Simulate GraphQL introspection response that looks real
  await new Promise((r) => setTimeout(r, 100 + Math.random() * 200));

  if (query.includes("__schema") || query.includes("__type")) {
    return Response.json({
      data: {
        __schema: {
          queryType: { name: "Query" },
          mutationType: { name: "Mutation" },
          types: [
            { name: "Query", kind: "OBJECT" },
            { name: "User", kind: "OBJECT" },
            { name: "String", kind: "SCALAR" },
            { name: "Int", kind: "SCALAR" },
            { name: "Boolean", kind: "SCALAR" },
          ],
        },
      },
    });
  }

  return Response.json({
    errors: [
      {
        message: "Unauthorized: Valid authentication required",
        extensions: { code: "UNAUTHENTICATED" },
      },
    ],
  });
}

export async function GET(request: NextRequest) {
  const ip = getClientIp(request);
  const signal = {
    type: "honeypot_triggered" as const,
    severity: "high" as const,
    ip,
    timestamp: Date.now(),
    details: { trap: "fake_graphql_get" },
  };
  recordSignal(signal);
  logThreatIntel(signal);

  // Return fake GraphiQL-style page indicator
  return new Response("GraphQL endpoint. Use POST with a query.", {
    status: 400,
    headers: { "content-type": "text/plain" },
  });
}
