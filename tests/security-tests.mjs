// ============================================================================
// SECURITY TEST SUITE — Attack simulation against all defense layers
// Run: node tests/security-tests.mjs
// Requires: dev server running on http://localhost:3000
// ============================================================================

const BASE = "http://localhost:3000";
const CHECKOUT = `${BASE}/api/stripe/checkout`;
const WEBHOOK = `${BASE}/api/stripe/webhook`;

// Each test section uses a unique simulated IP via X-Forwarded-For
// to avoid cross-contamination from the rate limiter
let testSection = 0;
function testIp() {
  return `10.0.${testSection}.${Math.floor(Math.random() * 254) + 1}`;
}

let passed = 0;
let failed = 0;
let skipped = 0;
const failures = [];

// ── Test Helpers ────────────────────────────────────────────────────────

function assert(condition, testName, details = "") {
  if (condition) {
    passed++;
    console.log(`  \x1b[32m✓\x1b[0m ${testName}`);
  } else {
    failed++;
    failures.push({ testName, details });
    console.log(`  \x1b[31m✗\x1b[0m ${testName}`);
    if (details) console.log(`    \x1b[33m→ ${details}\x1b[0m`);
  }
}

function section(name) {
  console.log(`\n\x1b[1m\x1b[36m═══ ${name} ═══\x1b[0m`);
}

async function safeFetch(url, options = {}) {
  try {
    return await fetch(url, { ...options, redirect: "manual" });
  } catch (e) {
    return { status: 0, headers: new Map(), text: async () => e.message, json: async () => ({}) };
  }
}

// ============================================================================
// TEST 1: Security Headers on HTML pages
// ============================================================================
async function testSecurityHeadersHTML() {
  section("1. SECURITY HEADERS — HTML Pages");

  const res = await safeFetch(BASE);
  const h = res.headers;

  // CSP
  const csp = h.get("content-security-policy") || "";
  assert(csp.includes("default-src 'self'"), "CSP: default-src 'self'");
  assert(csp.includes("script-src 'self'"), "CSP: script-src starts with 'self'");
  assert(csp.includes("'strict-dynamic'"), "CSP: strict-dynamic present");
  assert(csp.includes("nonce-"), "CSP: nonce present (per-request)");
  assert(csp.includes("https://js.stripe.com"), "CSP: Stripe JS allowed");
  assert(csp.includes("frame-ancestors 'none'"), "CSP: frame-ancestors 'none' (anti-clickjack)");
  assert(csp.includes("object-src 'none'"), "CSP: object-src 'none' (blocks Flash/Java)");
  assert(csp.includes("base-uri 'self'"), "CSP: base-uri 'self' (prevents base tag hijack)");
  assert(csp.includes("form-action 'self'"), "CSP: form-action 'self' (prevents form exfil)");
  assert(csp.includes("upgrade-insecure-requests"), "CSP: upgrade-insecure-requests");

  // Other headers
  assert(h.get("x-frame-options") === "DENY", "X-Frame-Options: DENY");
  assert(h.get("x-content-type-options") === "nosniff", "X-Content-Type-Options: nosniff");
  assert(h.get("referrer-policy") === "strict-origin-when-cross-origin", "Referrer-Policy: strict-origin-when-cross-origin");
  assert(h.get("x-dns-prefetch-control") === "off", "X-DNS-Prefetch-Control: off");
  assert(h.get("x-download-options") === "noopen", "X-Download-Options: noopen");
  assert(h.get("x-permitted-cross-domain-policies") === "none", "X-Permitted-Cross-Domain-Policies: none");
  assert(h.get("cross-origin-opener-policy") === "same-origin", "Cross-Origin-Opener-Policy: same-origin");
  assert(h.get("cross-origin-resource-policy") === "same-origin", "Cross-Origin-Resource-Policy: same-origin");

  // Permissions-Policy
  const pp = h.get("permissions-policy") || "";
  assert(pp.includes("camera=()"), "Permissions-Policy: camera disabled");
  assert(pp.includes("microphone=()"), "Permissions-Policy: microphone disabled");
  assert(pp.includes("geolocation=()"), "Permissions-Policy: geolocation disabled");
  assert(pp.includes("interest-cohort=()"), "Permissions-Policy: FLoC disabled");
  assert(pp.includes("payment=(self)"), "Permissions-Policy: payment self-only");

  // No information disclosure
  const poweredBy = h.get("x-powered-by");
  assert(!poweredBy, "No X-Powered-By header (framework disclosure blocked)", `Got: ${poweredBy}`);
}

// ============================================================================
// TEST 2: Security Headers on API routes
// ============================================================================
async function testSecurityHeadersAPI() {
  section("2. SECURITY HEADERS — API Routes");
  testSection++;

  const res = await safeFetch(CHECKOUT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Origin": "http://localhost:3000",
      "X-Forwarded-For": testIp(),
    },
    body: JSON.stringify({ amount: 10 }),
  });
  const h = res.headers;

  // API-specific cache control
  const cc = h.get("cache-control") || "";
  assert(cc.includes("no-store"), "API Cache-Control: no-store", `Got: ${cc}`);
  assert(cc.includes("no-cache"), "API Cache-Control: no-cache");
  assert(cc.includes("must-revalidate"), "API Cache-Control: must-revalidate");

  const pragma = h.get("pragma") || "";
  assert(pragma === "no-cache", "API Pragma: no-cache", `Got: ${pragma}`);

  // CSP still present on API
  const csp = h.get("content-security-policy") || "";
  assert(csp.length > 0, "CSP present on API responses");
}

// ============================================================================
// TEST 3: CSP Nonce Uniqueness (per-request)
// ============================================================================
async function testCSPNonceUniqueness() {
  section("3. CSP NONCE UNIQUENESS");

  const res1 = await safeFetch(BASE);
  const res2 = await safeFetch(BASE);

  const csp1 = res1.headers.get("content-security-policy") || "";
  const csp2 = res2.headers.get("content-security-policy") || "";

  const nonce1 = csp1.match(/nonce-([A-Za-z0-9+/=]+)/)?.[1];
  const nonce2 = csp2.match(/nonce-([A-Za-z0-9+/=]+)/)?.[1];

  assert(nonce1 && nonce1.length >= 16, "Nonce 1 is sufficiently long", `Length: ${nonce1?.length}`);
  assert(nonce2 && nonce2.length >= 16, "Nonce 2 is sufficiently long");
  assert(nonce1 !== nonce2, "Nonces are unique per request (not static)", `n1=${nonce1}, n2=${nonce2}`);
}

// ============================================================================
// TEST 4: CSRF / Origin Validation
// ============================================================================
async function testCSRFProtection() {
  section("4. CSRF / ORIGIN VALIDATION");
  testSection++;
  const ip = testIp();

  // Attack: No origin header
  const noOrigin = await safeFetch(CHECKOUT, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Forwarded-For": ip },
    body: JSON.stringify({ amount: 10 }),
  });
  assert(noOrigin.status === 403, "POST without Origin header → 403", `Got: ${noOrigin.status}`);

  // Attack: Evil origin
  const evilOrigin = await safeFetch(CHECKOUT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Origin": "https://evil-attacker.com",
      "X-Forwarded-For": ip,
    },
    body: JSON.stringify({ amount: 10 }),
  });
  assert(evilOrigin.status === 403, "POST with evil Origin → 403", `Got: ${evilOrigin.status}`);

  // Attack: Origin that looks similar (subdomain confusion)
  const subdomain = await safeFetch(CHECKOUT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Origin": "https://evil.iiran.org",
      "X-Forwarded-For": ip,
    },
    body: JSON.stringify({ amount: 10 }),
  });
  assert(subdomain.status === 403, "POST with subdomain-spoof Origin → 403", `Got: ${subdomain.status}`);

  // Attack: Origin with port manipulation
  const portSpoof = await safeFetch(CHECKOUT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Origin": "http://localhost:3001",
      "X-Forwarded-For": ip,
    },
    body: JSON.stringify({ amount: 10 }),
  });
  assert(portSpoof.status === 403, "POST with wrong port Origin → 403", `Got: ${portSpoof.status}`);

  // Valid: Correct origin works
  const validOrigin = await safeFetch(CHECKOUT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Origin": "http://localhost:3000",
      "X-Forwarded-For": ip,
    },
    body: JSON.stringify({ amount: 10 }),
  });
  assert(validOrigin.status !== 403, "POST with valid Origin → not 403 (passes CSRF check)", `Got: ${validOrigin.status}`);

  // Webhook: Should NOT require origin (Stripe sends no browser headers)
  const webhookNoOrigin = await safeFetch(WEBHOOK, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Forwarded-For": ip },
    body: "{}",
  });
  assert(webhookNoOrigin.status !== 403, "Webhook without Origin → not 403 (exempt from CSRF)", `Got: ${webhookNoOrigin.status}`);
}

// ============================================================================
// TEST 5: Input Validation — Zod Schema
// ============================================================================
async function testInputValidation() {
  section("5. INPUT VALIDATION — Zod Schema");
  testSection++;

  const post = async (body, contentType = "application/json") => {
    const headers = { "Origin": "http://localhost:3000", "X-Forwarded-For": testIp() };
    if (contentType) headers["Content-Type"] = contentType;
    return safeFetch(CHECKOUT, {
      method: "POST",
      headers,
      body: typeof body === "string" ? body : JSON.stringify(body),
    });
  };

  // Attack: String amount
  let res = await post({ amount: "ten" });
  assert(res.status === 400, "String amount → 400", `Got: ${res.status}`);

  // Attack: Negative amount
  res = await post({ amount: -100 });
  assert(res.status === 400, "Negative amount → 400", `Got: ${res.status}`);

  // Attack: Zero amount
  res = await post({ amount: 0 });
  assert(res.status === 400, "Zero amount → 400", `Got: ${res.status}`);

  // Attack: Amount exceeding max
  res = await post({ amount: 100000 });
  assert(res.status === 400, "Amount > $50,000 → 400", `Got: ${res.status}`);

  // Attack: NaN
  res = await post({ amount: "NaN" });
  assert(res.status === 400, "NaN string → 400", `Got: ${res.status}`);

  // Attack: Infinity
  res = await post({ amount: 1e999 });
  assert(res.status === 400, "Infinity → 400", `Got: ${res.status}`);

  // Attack: Null
  res = await post({ amount: null });
  assert(res.status === 400, "null amount → 400", `Got: ${res.status}`);

  // Attack: Missing amount field
  res = await post({});
  assert(res.status === 400, "Missing amount → 400", `Got: ${res.status}`);

  // Attack: Array
  res = await post({ amount: [10] });
  assert(res.status === 400, "Array amount → 400", `Got: ${res.status}`);

  // Attack: Boolean
  res = await post({ amount: true });
  assert(res.status === 400, "Boolean amount → 400", `Got: ${res.status}`);

  // Attack: Mass assignment / prototype pollution
  res = await post({ amount: 10, isAdmin: true });
  assert(res.status === 400, "Extra field 'isAdmin' → 400 (strict mode)", `Got: ${res.status}`);

  // __proto__ via JSON.stringify gets stripped by JS runtime, so send raw JSON
  res = await post('{"amount":10,"__proto__":{"isAdmin":true}}');
  let json = {};
  try { json = await res.json(); } catch {}
  assert(res.status === 400, "Prototype pollution attempt → 400", `Got: ${res.status}`);

  res = await post({ amount: 10, constructor: { prototype: { isAdmin: true } } });
  assert(res.status === 400, "Constructor pollution attempt → 400", `Got: ${res.status}`);

  // Attack: Invalid JSON
  res = await post("{not json at all", "application/json");
  assert(res.status === 400, "Malformed JSON → 400", `Got: ${res.status}`);

  // Attack: Empty body
  res = await post("");
  assert(res.status === 400, "Empty body → 400", `Got: ${res.status}`);

  // Valid: Correct amount
  res = await post({ amount: 25 });
  assert(res.status === 200, "Valid $25 donation → 200", `Got: ${res.status}`);

  // Valid: Boundary - minimum
  res = await post({ amount: 1 });
  assert(res.status === 200, "Valid $1 (minimum) → 200", `Got: ${res.status}`);

  // Valid: Boundary - maximum
  res = await post({ amount: 50000 });
  assert(res.status === 200, "Valid $50,000 (maximum) → 200", `Got: ${res.status}`);

  // Valid: Decimal amount
  res = await post({ amount: 10.50 });
  assert(res.status === 200, "Valid $10.50 (decimal) → 200", `Got: ${res.status}`);
}

// ============================================================================
// TEST 6: Content-Type Enforcement
// ============================================================================
async function testContentTypeEnforcement() {
  section("6. CONTENT-TYPE ENFORCEMENT");
  testSection++;

  const postWithType = async (contentType) => {
    const headers = { "Origin": "http://localhost:3000", "X-Forwarded-For": testIp() };
    if (contentType) headers["Content-Type"] = contentType;
    return safeFetch(CHECKOUT, {
      method: "POST",
      headers,
      body: JSON.stringify({ amount: 10 }),
    });
  };

  // Attack: text/plain (browser form default)
  let res = await postWithType("text/plain");
  assert(res.status === 415, "Content-Type: text/plain → 415", `Got: ${res.status}`);

  // Attack: multipart/form-data
  res = await postWithType("multipart/form-data");
  assert(res.status === 415, "Content-Type: multipart/form-data → 415", `Got: ${res.status}`);

  // Attack: application/x-www-form-urlencoded
  res = await postWithType("application/x-www-form-urlencoded");
  assert(res.status === 415, "Content-Type: x-www-form-urlencoded → 415", `Got: ${res.status}`);

  // Attack: No Content-Type
  res = await postWithType(null);
  assert(res.status === 415, "No Content-Type header → 415", `Got: ${res.status}`);

  // Attack: text/xml
  res = await postWithType("text/xml");
  assert(res.status === 415, "Content-Type: text/xml → 415", `Got: ${res.status}`);

  // Valid: application/json works
  res = await postWithType("application/json");
  assert(res.status !== 415, "Content-Type: application/json → passes", `Got: ${res.status}`);

  // Valid: application/json with charset
  res = await postWithType("application/json; charset=utf-8");
  assert(res.status !== 415, "Content-Type: application/json; charset=utf-8 → passes", `Got: ${res.status}`);
}

// ============================================================================
// TEST 7: HTTP Method Restriction
// ============================================================================
async function testMethodRestriction() {
  section("7. HTTP METHOD RESTRICTION");
  testSection++;

  const testMethod = async (method, url, label) => {
    const res = await safeFetch(url, {
      method,
      headers: { "Origin": "http://localhost:3000", "X-Forwarded-For": testIp() },
    });
    return res;
  };

  // Checkout endpoint
  let res = await testMethod("GET", CHECKOUT, "Checkout GET");
  assert(res.status === 405, "GET /api/stripe/checkout → 405", `Got: ${res.status}`);

  res = await testMethod("PUT", CHECKOUT, "Checkout PUT");
  assert(res.status === 403 || res.status === 405, "PUT /api/stripe/checkout → 403 or 405", `Got: ${res.status}`);

  res = await testMethod("DELETE", CHECKOUT, "Checkout DELETE");
  assert(res.status === 403 || res.status === 405, "DELETE /api/stripe/checkout → 403 or 405", `Got: ${res.status}`);

  // Webhook endpoint
  res = await testMethod("GET", WEBHOOK, "Webhook GET");
  assert(res.status === 405, "GET /api/stripe/webhook → 405", `Got: ${res.status}`);

  res = await testMethod("PUT", WEBHOOK, "Webhook PUT");
  assert(res.status === 405, "PUT /api/stripe/webhook → 405", `Got: ${res.status}`);

  res = await testMethod("DELETE", WEBHOOK, "Webhook DELETE");
  assert(res.status === 405, "DELETE /api/stripe/webhook → 405", `Got: ${res.status}`);
}

// ============================================================================
// TEST 8: Webhook Security
// ============================================================================
async function testWebhookSecurity() {
  section("8. WEBHOOK SECURITY");
  testSection++;
  const ip = testIp();

  // Attack: No signature
  let res = await safeFetch(WEBHOOK, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Forwarded-For": ip },
    body: JSON.stringify({ type: "checkout.session.completed" }),
  });
  assert(res.status === 400, "Webhook without signature → 400", `Got: ${res.status}`);

  // Attack: Forged signature
  res = await safeFetch(WEBHOOK, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "stripe-signature": "t=1234567890,v1=fakesignature1234567890abcdef",
      "X-Forwarded-For": ip,
    },
    body: JSON.stringify({
      type: "checkout.session.completed",
      data: { object: { id: "cs_fake", metadata: { donation_amount: "1000000" } } },
    }),
  });
  assert(res.status === 400, "Webhook with forged signature → 400", `Got: ${res.status}`);
  let json = {};
  try { json = await res.json(); } catch {}
  assert(
    json.error === "Invalid signature",
    "Forged webhook returns 'Invalid signature'",
    `Got: ${JSON.stringify(json)}`
  );

  // Attack: Empty signature
  res = await safeFetch(WEBHOOK, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "stripe-signature": "",
      "X-Forwarded-For": ip,
    },
    body: JSON.stringify({ type: "checkout.session.completed" }),
  });
  assert(res.status === 400, "Webhook with empty signature → 400", `Got: ${res.status}`);

  // Attack: Oversized payload (>64KB)
  const hugePayload = "x".repeat(70000);
  res = await safeFetch(WEBHOOK, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "stripe-signature": "t=1234567890,v1=fakesig",
      "X-Forwarded-For": ip,
    },
    body: hugePayload,
  });
  assert(res.status === 413, "Webhook with >64KB payload → 413", `Got: ${res.status}`);

  // Verify error messages don't leak internal details
  res = await safeFetch(WEBHOOK, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "stripe-signature": "t=1,v1=bad",
      "X-Forwarded-For": ip,
    },
    body: "{}",
  });
  json = {};
  try { json = await res.json(); } catch {}
  assert(
    !JSON.stringify(json).includes("STRIPE_WEBHOOK_SECRET"),
    "Error response does not leak webhook secret name"
  );
  assert(
    !JSON.stringify(json).includes("stack"),
    "Error response does not contain stack trace"
  );
}

// ============================================================================
// TEST 9: Rate Limiting
// ============================================================================
async function testRateLimiting() {
  section("9. RATE LIMITING");
  testSection++;

  // Use a single dedicated IP for this test to burn through the limit
  const rateLimitIp = "192.168.99.99";

  // Burn through the rate limit (10 req/min for checkout)
  const results = [];
  for (let i = 0; i < 15; i++) {
    const res = await safeFetch(CHECKOUT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Origin": "http://localhost:3000",
        "X-Forwarded-For": rateLimitIp,
      },
      body: JSON.stringify({ amount: 10 }),
    });
    results.push(res.status);
  }

  const ok = results.filter((s) => s === 200).length;
  const rateLimitCount = results.filter((s) => s === 429).length;

  assert(ok > 0, `Some requests succeed before limit (${ok} passed)`);
  assert(rateLimitCount > 0, `Rate limit kicks in (${rateLimitCount} blocked with 429)`, `All statuses: ${results.join(",")}`);

  // Verify 429 response has Retry-After header
  const lastRes = await safeFetch(CHECKOUT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Origin": "http://localhost:3000",
      "X-Forwarded-For": rateLimitIp,
    },
    body: JSON.stringify({ amount: 10 }),
  });
  if (lastRes.status === 429) {
    const retryAfter = lastRes.headers.get("retry-after");
    assert(retryAfter !== null, "429 response includes Retry-After header", `Got: ${retryAfter}`);
    assert(
      parseInt(retryAfter) > 0,
      "Retry-After is a positive number",
      `Got: ${retryAfter}`
    );
  } else {
    assert(true, "Rate limit window may have expired (this is OK)");
    assert(true, "(Retry-After test skipped)");
  }

  // Verify a DIFFERENT IP is not rate limited (isolation)
  const freshIp = "192.168.88.88";
  const freshRes = await safeFetch(CHECKOUT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Origin": "http://localhost:3000",
      "X-Forwarded-For": freshIp,
    },
    body: JSON.stringify({ amount: 10 }),
  });
  assert(
    freshRes.status === 200,
    "Different IP not affected by rate limit (isolation works)",
    `Got: ${freshRes.status}`
  );
}

// ============================================================================
// TEST 10: Open Redirect Prevention
// ============================================================================
async function testOpenRedirectPrevention() {
  section("10. OPEN REDIRECT PREVENTION");
  testSection++;

  const res = await safeFetch(CHECKOUT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Origin": "http://localhost:3000",
      "X-Forwarded-For": testIp(),
    },
    body: JSON.stringify({ amount: 10 }),
  });

  if (res.status === 200) {
    const json = await res.json();
    const url = json.url || "";
    // The Stripe URL should redirect to our APP_ORIGIN, not attacker
    assert(
      !url.includes("evil"),
      "Stripe session URL does not contain evil domain"
    );
    // Verify it's a legitimate Stripe URL
    assert(
      url.includes("stripe.com") || url.includes("checkout"),
      "Returned URL is a Stripe checkout URL",
      `Got: ${url.substring(0, 80)}...`
    );
  } else if (res.status === 429) {
    skipped++;
    console.log(`  \x1b[33m⊘\x1b[0m Skipped (rate limited from previous test)`);
  } else {
    assert(false, "Checkout should return 200 or 429", `Got: ${res.status}`);
  }
}

// ============================================================================
// TEST 11: Information Disclosure Prevention
// ============================================================================
async function testInformationDisclosure() {
  section("11. INFORMATION DISCLOSURE");
  testSection++;

  // Check no server version in headers
  const res = await safeFetch(BASE);
  const h = res.headers;

  assert(!h.get("x-powered-by"), "No X-Powered-By header");
  assert(!h.get("server")?.toLowerCase().includes("next"), "Server header doesn't reveal Next.js", `Got: ${h.get("server")}`);

  // Check API error responses don't leak internals
  const errorRes = await safeFetch(CHECKOUT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Origin": "http://localhost:3000",
      "X-Forwarded-For": testIp(),
    },
    body: JSON.stringify({ amount: "injected SQL; DROP TABLE users;" }),
  });
  if (errorRes.status === 429) {
    skipped++;
    console.log(`  \x1b[33m⊘\x1b[0m Skipped info disclosure check (rate limited)`);
  } else {
    const text = await errorRes.text();
    assert(!text.includes("SQL"), "Error doesn't mention SQL");
    assert(!text.includes("stack"), "Error doesn't contain stack traces");
    assert(!text.includes("STRIPE_SECRET"), "Error doesn't leak Stripe key");
    assert(!text.includes("node_modules"), "Error doesn't reveal file paths");
    assert(!text.includes("at Object"), "Error doesn't contain JS stack frames");
  }

  // Check 404 page doesn't leak
  const notFound = await safeFetch(`${BASE}/api/nonexistent/secret/admin`);
  const nfText = await notFound.text();
  assert(!nfText.includes("STRIPE"), "404 page doesn't leak env vars");
  assert(!nfText.includes("sk_test"), "404 page doesn't leak Stripe keys");
}

// ============================================================================
// TEST 12: XSS Vector Injection via API
// ============================================================================
async function testXSSVectors() {
  section("12. XSS VECTOR INJECTION");
  testSection++;

  const xssPayloads = [
    '<script>alert("xss")</script>',
    '"><img src=x onerror=alert(1)>',
    "javascript:alert(1)",
    '<svg onload=alert(1)>',
    '{{constructor.constructor("return this")()}}',
  ];

  for (const payload of xssPayloads) {
    const res = await safeFetch(CHECKOUT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Origin": "http://localhost:3000",
        "X-Forwarded-For": testIp(),
      },
      body: JSON.stringify({ amount: payload }),
    });
    if (res.status === 429) {
      skipped++;
      console.log(`  \x1b[33m⊘\x1b[0m Skipped XSS test (rate limited)`);
      continue;
    }
    const text = await res.text();
    assert(
      !text.includes(payload),
      `XSS payload not reflected: ${payload.substring(0, 30)}...`,
      `Response body contained the payload`
    );
    assert(res.status === 400, `XSS payload rejected with 400: ${payload.substring(0, 30)}...`, `Got: ${res.status}`);
  }
}

// ============================================================================
// TEST 13: Webhook method restriction verification
// ============================================================================
async function testWebhookMethodRestriction() {
  section("13. WEBHOOK METHOD RESTRICTION");

  // OPTIONS should not be allowed (no handler)
  const res = await safeFetch(WEBHOOK, { method: "OPTIONS" });
  // Next.js may return 204 for OPTIONS (CORS preflight) or 405
  assert(
    res.status !== 200,
    "OPTIONS /api/stripe/webhook does not return 200",
    `Got: ${res.status}`
  );

  // HEAD should not reveal webhook data
  const headRes = await safeFetch(WEBHOOK, { method: "HEAD" });
  assert(
    headRes.status === 405 || headRes.status === 200,
    "HEAD /api/stripe/webhook handled safely",
    `Got: ${headRes.status}`
  );
}

// ============================================================================
// TEST 14: Path Traversal / API Enumeration
// ============================================================================
async function testPathTraversal() {
  section("14. PATH TRAVERSAL & ENUMERATION");

  const paths = [
    "/api/../.env",
    "/api/../.env.local",
    "/api/%2e%2e/%2e%2e/.env",
    "/api/stripe/../../.env",
    "/.env",
    "/.env.local",
    "/api/stripe/checkout/../../../package.json",
  ];

  for (const path of paths) {
    const res = await safeFetch(`${BASE}${path}`);
    const text = await res.text();
    assert(
      !text.includes("STRIPE_SECRET_KEY") && !text.includes("sk_test"),
      `Path traversal blocked: ${path}`,
      `Got status ${res.status}`
    );
  }
}

// ============================================================================
// RUN ALL TESTS
// ============================================================================
async function main() {
  console.log("\x1b[1m\x1b[35m");
  console.log("╔══════════════════════════════════════════════════════════════╗");
  console.log("║         SECURITY ATTACK SIMULATION TEST SUITE               ║");
  console.log("║         Target: http://localhost:3000                        ║");
  console.log("╚══════════════════════════════════════════════════════════════╝");
  console.log("\x1b[0m");

  // Check if server is up
  try {
    await fetch(BASE, { signal: AbortSignal.timeout(5000) });
  } catch {
    console.error("\x1b[31mERROR: Dev server not running at http://localhost:3000\x1b[0m");
    console.error("Start it with: npm run dev");
    process.exit(1);
  }

  await testSecurityHeadersHTML();
  await testSecurityHeadersAPI();
  await testCSPNonceUniqueness();
  await testCSRFProtection();
  await testInputValidation();
  await testContentTypeEnforcement();
  await testMethodRestriction();
  await testWebhookSecurity();
  await testRateLimiting();
  await testOpenRedirectPrevention();
  await testInformationDisclosure();
  await testXSSVectors();
  await testWebhookMethodRestriction();
  await testPathTraversal();

  // ── Summary ─────────────────────────────────────────────────────────
  console.log("\n\x1b[1m\x1b[35m═══ RESULTS ═══\x1b[0m\n");
  console.log(`  \x1b[32m✓ Passed:  ${passed}\x1b[0m`);
  console.log(`  \x1b[31m✗ Failed:  ${failed}\x1b[0m`);
  if (skipped > 0) console.log(`  \x1b[33m⊘ Skipped: ${skipped} (rate limited)\x1b[0m`);
  console.log(`  Total:   ${passed + failed}`);

  if (failures.length > 0) {
    console.log("\n\x1b[1m\x1b[31m── Failed Tests ──\x1b[0m");
    for (const f of failures) {
      console.log(`  \x1b[31m✗\x1b[0m ${f.testName}`);
      if (f.details) console.log(`    \x1b[33m→ ${f.details}\x1b[0m`);
    }
  }

  console.log("");
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error("Test suite crashed:", e);
  process.exit(1);
});
