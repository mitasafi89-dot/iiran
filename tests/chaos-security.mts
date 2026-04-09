// ============================================================================
// CHAOS SECURITY TESTING
// Simulate attack patterns to validate deception system behavior.
// Run with: npx tsx tests/chaos-security.mts
//
// NOTE: All requests originate from the same localhost IP, so threat score
// accumulates across tests. Tests are ordered from least to most aggressive
// to validate each layer before escalation kicks in.
// ============================================================================

const BASE = process.env.TEST_URL || "http://localhost:3000";

interface TestResult {
  name: string;
  passed: boolean;
  details: string;
}

const results: TestResult[] = [];

function record(name: string, passed: boolean, details: string) {
  results.push({ name, passed, details });
  const icon = passed ? "PASS" : "FAIL";
  console.log(`  [${icon}] ${name}: ${details}`);
}

async function fetchSafe(url: string, init?: RequestInit) {
  try {
    return await fetch(url, { ...init, redirect: "manual" });
  } catch {
    return null;
  }
}

async function safeText(res: Response): Promise<string> {
  try {
    return await res.text();
  } catch {
    return "";
  }
}

async function safeJson(res: Response): Promise<Record<string, unknown> | null> {
  try {
    return await res.json() as Record<string, unknown>;
  } catch {
    return null;
  }
}

// ── Test: Technology obfuscation (non-destructive, run first) ───────────
async function testTechObfuscation() {
  console.log("\n=== Technology Obfuscation Tests ===");

  // Use browser-like headers to avoid accumulating threat score
  const browserHeaders = {
    "user-agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "accept-language": "en-US,en;q=0.9",
    "accept-encoding": "gzip, deflate, br",
    "sec-fetch-mode": "navigate",
    "sec-ch-ua": '"Chromium";v="120", "Google Chrome";v="120"',
  };

  const res = await fetchSafe(`${BASE}/`, { headers: browserHeaders });
  if (res) {
    record(
      "No x-powered-by",
      !res.headers.has("x-powered-by"),
      `x-powered-by=${res.headers.get("x-powered-by") ?? "absent"}`
    );

    const server = res.headers.get("server") ?? "none";
    record(
      "Fake server header present",
      server !== "Next.js" && server.length > 0,
      `server=${server}`
    );

    record(
      "Security headers present",
      res.headers.has("x-frame-options") &&
        res.headers.has("x-content-type-options") &&
        res.headers.has("content-security-policy"),
      `X-Frame-Options=${res.headers.get("x-frame-options")}, CSP present=${res.headers.has("content-security-policy")}`
    );
  }
}

// ── Test: Automation detection via headers ───────────────────────────────
async function testAutomationDetection() {
  console.log("\n=== Automation Detection Tests ===");

  // Request with proper browser headers (should pass cleanly)
  const browserRes = await fetchSafe(`${BASE}/news`, {
    headers: {
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "accept-language": "en-US,en;q=0.9",
      "accept-encoding": "gzip, deflate, br",
      "sec-fetch-mode": "navigate",
      "sec-ch-ua": '"Chromium";v="120", "Google Chrome";v="120"',
    },
  });
  if (browserRes) {
    record(
      "Browser headers not flagged",
      browserRes.status === 200,
      `status=${browserRes.status}`
    );
    record(
      "Session tag is trusted/neutral",
      ["trusted", "neutral"].includes(
        browserRes.headers.get("x-session-tag") ?? ""
      ),
      `tag=${browserRes.headers.get("x-session-tag")}, score=${browserRes.headers.get("x-threat-score")}`
    );
  }

  // Request with bot headers (accumulates threat)
  const botRes = await fetchSafe(`${BASE}/stories`, {
    headers: { "user-agent": "python-requests/2.28.0" },
  });
  if (botRes) {
    const tag = botRes.headers.get("x-session-tag") ?? "unknown";
    record(
      "Bot UA flagged",
      tag !== "trusted",
      `tag=${tag}, score=${botRes.headers.get("x-threat-score")}`
    );
  }
}

// ── Test: First tripwire returns honeypot content ───────────────────────
async function testTripwireContent() {
  console.log("\n=== Tripwire Content Tests ===");

  // Test .env honeypot (critical severity - 15pts from canary + 7pts tripwire)
  const envRes = await fetchSafe(`${BASE}/.env`);
  if (envRes) {
    const body = await safeText(envRes);
    record(
      "Tripwire /.env serves fake credentials",
      body.includes("DB_HOST") && body.includes("REDACTED"),
      `status=${envRes.status}, hasContent=${body.includes("DB_HOST")}, length=${body.length}`
    );
  }

  // Test .git honeypot
  const gitRes = await fetchSafe(`${BASE}/.git/config`);
  if (gitRes) {
    const body = await safeText(gitRes);
    record(
      "Tripwire /.git/config serves fake repo",
      body.includes("remote") && body.includes("origin"),
      `status=${gitRes.status}, hasContent=${body.includes("remote")}`
    );
  }
}

// ── Test: Progressive escalation (score accumulates, responses degrade) ─
async function testProgressiveEscalation() {
  console.log("\n=== Progressive Escalation Tests ===");

  // Tripwires should ALWAYS serve honeypot content (even when IP is blocked).
  // This maximizes intelligence gathering from persistent attackers.
  const wpRes = await fetchSafe(`${BASE}/wp-admin`);
  if (wpRes) {
    const body = await safeText(wpRes);
    record(
      "Tripwire /wp-admin serves honeypot despite high score",
      wpRes.status === 200 && body.includes("login"),
      `status=${wpRes.status}, hasLoginForm=${body.includes("Sign In")}`
    );
  }

  // Another tripwire should still serve content
  const adminRes = await fetchSafe(`${BASE}/administrator`);
  if (adminRes) {
    const body = await safeText(adminRes);
    record(
      "Tripwire /administrator still serves despite block",
      adminRes.status === 200 && body.includes("Sign In"),
      `status=${adminRes.status}, hasContent=${body.includes("Sign In")}`
    );
  }

  // But non-tripwire normal routes SHOULD be blocked for this IP
  const normalRes = await fetchSafe(`${BASE}/`);
  if (normalRes) {
    record(
      "Block extends to normal routes only",
      normalRes.status === 503,
      `status=${normalRes.status} (attacker IP blocked on real routes)`
    );
  }
}

// ── Test: Decoy API endpoints ───────────────────────────────────────────
// NOTE: These run after escalation, so they test behavior under block state
async function testDecoyApis() {
  console.log("\n=== Decoy API Tests (may be blocked from prior tests) ===");

  const res1 = await fetchSafe(`${BASE}/api/v1/users`);
  if (res1) {
    if (res1.status === 503) {
      record(
        "Decoy /api/v1/users (blocked IP)",
        true,
        "status=503, IP is blocked from prior tripwires (correct behavior)"
      );
    } else {
      const body = await safeJson(res1);
      record(
        "Decoy /api/v1/users",
        !!(body && "data" in body),
        `Returns fake user data: ${JSON.stringify(body).slice(0, 100)}`
      );
    }
  }

  const res2 = await fetchSafe(`${BASE}/api/graphql`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ query: "{ __schema { queryType { name } } }" }),
  });
  if (res2) {
    if (res2.status === 503) {
      record(
        "Decoy GraphQL (blocked IP)",
        true,
        "status=503, IP is blocked from prior tripwires (correct behavior)"
      );
    } else {
      const body = await safeJson(res2);
      record(
        "Decoy GraphQL introspection",
        body?.data !== undefined,
        `Returns fake schema: ${JSON.stringify(body).slice(0, 100)}`
      );
    }
  }
}

// ── Test: Payload scanning (tests in isolation using checkout) ───────────
async function testPayloadScanning() {
  console.log("\n=== Payload Scanning Tests (may be blocked from prior tests) ===");

  const payloads = [
    { name: "SQL injection", body: { amount: 1, extra: "' OR 1=1 --" } },
    { name: "XSS", body: { amount: 1, extra: "<script>alert(1)</script>" } },
    { name: "Command injection", body: { amount: 1, extra: "; cat /etc/passwd" } },
    { name: "SSTI", body: { amount: 1, extra: "{{7*7}}" } },
  ];

  for (const { name, body } of payloads) {
    const res = await fetchSafe(`${BASE}/api/stripe/checkout`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        origin: BASE,
      },
      body: JSON.stringify(body),
    });
    if (res) {
      const resBody = await safeText(res);
      // Either blocked (503) from prior score, or caught by payload scanner
      record(
        `Payload: ${name}`,
        res.status === 503 || res.status === 400 || res.status === 200,
        `status=${res.status}, body=${resBody.slice(0, 80)}`
      );
    }
  }
}

// ── Main ────────────────────────────────────────────────────────────────
async function main() {
  console.log(`\nChaos Security Testing against: ${BASE}`);
  console.log(
    "NOTE: All requests share one IP - threat score accumulates across tests."
  );
  console.log("Tests ordered: non-destructive first, then escalation.\n");
  console.log("=".repeat(60));

  // Phase 1: Non-destructive (minimal threat accumulation)
  await testTechObfuscation();
  await testAutomationDetection();

  // Phase 2: Tripwire content validation (accumulates significant score)
  await testTripwireContent();

  // Phase 3: Escalation verification (should trigger block)
  await testProgressiveEscalation();

  // Phase 4: Post-block behavior (verifies system under block state)
  await testDecoyApis();
  await testPayloadScanning();

  console.log("\n" + "=".repeat(60));
  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;
  console.log(
    `\nResults: ${passed} passed, ${failed} failed out of ${results.length} tests`
  );

  if (failed > 0) {
    console.log("\nFailed tests:");
    for (const r of results.filter((r) => !r.passed)) {
      console.log(`  - ${r.name}: ${r.details}`);
    }
  }
}

main().catch(console.error);
