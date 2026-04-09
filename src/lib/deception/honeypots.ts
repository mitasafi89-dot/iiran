// ============================================================================
// HONEYPOT & TRIPWIRE SYSTEM
// Invisible traps that only attackers trigger.
// Zero impact on legitimate users.
// ============================================================================

import { recordSignal, logThreatIntel, type ThreatSignal } from "./threat-intel";

// ── Canary Tokens ───────────────────────────────────────────────────────
// Unique markers embedded in responses. If they appear in incoming requests,
// it proves the attacker is replaying captured data.

const CANARY_PREFIX = "ct_";

export function generateCanary(context: string): string {
  const array = new Uint8Array(8);
  crypto.getRandomValues(array);
  const token = Array.from(array, (b) => b.toString(16).padStart(2, "0")).join("");
  return `${CANARY_PREFIX}${context}_${token}`;
}

export function isCanaryToken(value: string): boolean {
  return value.startsWith(CANARY_PREFIX);
}

// ── Honeypot Field Detection ────────────────────────────────────────────
// Hidden form fields that legitimate browsers/users never fill.
// Bots auto-fill everything they find.

const HONEYPOT_FIELDS = new Set([
  "website",
  "url",
  "phone2",
  "fax",
  "company_url",
  "address2",
  "middle_name",
  "nickname",
  "homepage",
  "referrer_url",
]);

export function checkHoneypotFields(
  body: Record<string, unknown>,
  ip: string
): boolean {
  for (const field of HONEYPOT_FIELDS) {
    if (body[field] !== undefined && body[field] !== "" && body[field] !== null) {
      const signal: ThreatSignal = {
        type: "bot_field_filled",
        severity: "high",
        ip,
        timestamp: Date.now(),
        details: { field, value: String(body[field]).slice(0, 100) },
      };
      recordSignal(signal);
      logThreatIntel(signal);
      return true; // Bot detected
    }
  }
  return false;
}

// ── Tripwire Paths ──────────────────────────────────────────────────────
// Paths that legitimate users never visit but scanners/attackers probe.

const TRIPWIRE_PATHS = new Set([
  // Fake admin panels
  // NOTE: /admin/login has a dedicated route handler with credential capture.
  "/admin",
  "/admin/dashboard",
  "/administrator",
  "/wp-admin",
  "/wp-login.php",
  "/wp-login",
  // Fake config files
  "/.env",
  "/.git/config",
  "/.git/HEAD",
  "/config.php",
  "/config.yml",
  "/web.config",
  "/server-status",
  "/server-info",
  // Fake API endpoints
  // NOTE: /api/v1/*, /api/graphql, /api/internal/*, /admin/login have
  // dedicated route handlers with richer deception. Do NOT list them here;
  // let middleware pass them through to the route handlers.
  "/api/v2/auth/login",
  // Common exploit paths
  "/phpmyadmin",
  "/pma",
  "/mysql",
  "/debug",
  "/console",
  "/actuator",
  "/actuator/health",
  "/actuator/env",
  "/.DS_Store",
  "/xmlrpc.php",
  "/backup",
  "/backup.sql",
  "/db.sql",
  "/database.sql",
  // JWT/Auth probes
  "/api/auth/token",
  "/api/auth/refresh",
  "/oauth/token",
  // Info disclosure probes
  "/info",
  "/phpinfo.php",
  "/test",
  "/status",
  "/health",
  "/metrics",
  "/trace",
]);

// Patterns that indicate path scanning
const TRIPWIRE_PATTERNS = [
  /\/\.\./,                    // Path traversal
  /\/etc\/passwd/,             // LFI
  /\/proc\/self/,              // Linux proc access
  /\/windows\/system32/i,      // Windows paths
  /\.(sql|bak|old|orig|save|swp|tmp)$/i,  // Backup files
  /\.(asp|aspx|jsp|cgi|pl)$/i,           // Wrong stack probes
];

export function isTripwire(pathname: string): boolean {
  const normalized = pathname.toLowerCase().replace(/\/+$/, "");

  if (TRIPWIRE_PATHS.has(normalized)) return true;

  for (const pattern of TRIPWIRE_PATTERNS) {
    if (pattern.test(normalized)) return true;
  }

  return false;
}

export function triggerTripwire(
  pathname: string,
  ip: string,
  headers: Headers
): void {
  const signal: ThreatSignal = {
    type: "tripwire_hit",
    severity: "high",
    ip,
    timestamp: Date.now(),
    details: {
      path: pathname,
      userAgent: headers.get("user-agent")?.slice(0, 200) ?? "none",
      referer: headers.get("referer")?.slice(0, 200),
    },
  };
  recordSignal(signal);
  logThreatIntel(signal);
}

// ── Fake Admin Panel Responses ──────────────────────────────────────────
// Return convincing but useless admin panel responses to waste attacker time.

const FAKE_ADMIN_LOGIN_HTML = `<!DOCTYPE html>
<html><head><title>Administration Panel</title>
<meta name="robots" content="noindex,nofollow">
<style>body{font-family:Arial,sans-serif;margin:0;padding:0;background:#f5f5f5;display:flex;justify-content:center;align-items:center;height:100vh}
.login-box{background:#fff;padding:40px;border-radius:8px;box-shadow:0 2px 10px rgba(0,0,0,.1);width:360px}
h2{margin:0 0 24px;color:#333}input{width:100%;padding:12px;margin:8px 0;border:1px solid #ddd;border-radius:4px;box-sizing:border-box}
button{width:100%;padding:12px;background:#0066cc;color:#fff;border:0;border-radius:4px;cursor:pointer;font-size:16px}
button:hover{background:#0052a3}.error{color:#cc0000;font-size:13px;margin-top:8px}</style></head>
<body><div class="login-box"><h2>System Login</h2>
<form method="POST" action="/admin/login">
<input type="text" name="username" placeholder="Username" required autocomplete="off">
<input type="password" name="password" placeholder="Password" required>
<input type="hidden" name="csrf_token" value="__CANARY__">
<input type="text" name="website" style="display:none" tabindex="-1" autocomplete="off">
<button type="submit">Sign In</button>
<p class="error" id="err"></p></form></div></body></html>`;

export function getFakeAdminPage(ip: string): string {
  const signal: ThreatSignal = {
    type: "fake_admin_access",
    severity: "critical",
    ip,
    timestamp: Date.now(),
    details: { trap: "admin_login_page" },
  };
  recordSignal(signal);
  logThreatIntel(signal);

  const canary = generateCanary("admin");
  return FAKE_ADMIN_LOGIN_HTML.replace("__CANARY__", canary);
}

// Fake config/env file content to waste reverse engineering time
const FAKE_ENV_CONTENT = `# Application Configuration
DB_HOST=internal-db-primary.cluster-abc123.us-east-1.rds.amazonaws.com
DB_PORT=5432
DB_NAME=app_production
DB_USER=app_svc_readonly
DB_PASSWORD=**REDACTED_BY_VAULT**

REDIS_URL=redis://cache-node1.internal:6379/0

API_SECRET=vault:secret/data/api#key
JWT_SECRET=vault:secret/data/jwt#signing_key

STRIPE_SECRET_KEY=sk_live_REDACTED_SEE_VAULT
AWS_ACCESS_KEY_ID=AKIA_ROTATED_SEE_IAM_ROLE
AWS_SECRET_ACCESS_KEY=**MANAGED_BY_INSTANCE_PROFILE**

# Internal services
AUTH_SERVICE_URL=http://auth.internal.svc.cluster.local:8080
PAYMENT_SERVICE_URL=http://payments.internal.svc.cluster.local:8080
`;

export function getFakeEnvFile(ip: string): string {
  const signal: ThreatSignal = {
    type: "canary_access",
    severity: "critical",
    ip,
    timestamp: Date.now(),
    details: { trap: "fake_env_file" },
  };
  recordSignal(signal);
  logThreatIntel(signal);
  return FAKE_ENV_CONTENT;
}

// Fake Git content
const FAKE_GIT_HEAD = "ref: refs/heads/main\n";
const FAKE_GIT_CONFIG = `[core]
\trepositoryformatversion = 0
\tfilemode = true
\tbare = false
[remote "origin"]
\turl = git@github.com:internal/app-monorepo.git
\tfetch = +refs/heads/*:refs/remotes/origin/*
[branch "main"]
\tmerge = refs/heads/main
\tremote = origin
`;

export function getFakeGitContent(path: string, ip: string): string {
  const signal: ThreatSignal = {
    type: "canary_access",
    severity: "critical",
    ip,
    timestamp: Date.now(),
    details: { trap: "fake_git", path },
  };
  recordSignal(signal);
  logThreatIntel(signal);

  if (path.includes("HEAD")) return FAKE_GIT_HEAD;
  return FAKE_GIT_CONFIG;
}

// ── Fake API Responses ──────────────────────────────────────────────────
// Realistic but poisoned data for API probes.

export function getFakeApiResponse(pathname: string, ip: string): object {
  const signal: ThreatSignal = {
    type: "honeypot_triggered",
    severity: "high",
    ip,
    timestamp: Date.now(),
    details: { trap: "fake_api", path: pathname },
  };
  recordSignal(signal);
  logThreatIntel(signal);

  if (pathname.includes("users")) {
    return {
      data: [
        {
          id: "usr_" + generateCanary("user"),
          email: "admin@internal.local",
          role: "viewer",
          status: "inactive",
          created_at: "2024-01-15T00:00:00Z",
        },
      ],
      pagination: { page: 1, total: 1, hasMore: false },
    };
  }

  if (pathname.includes("config") || pathname.includes("debug")) {
    return {
      version: "3.2.1",
      environment: "staging",
      debug: false,
      features: { beta: false, maintenance: false },
      _canary: generateCanary("cfg"),
    };
  }

  if (pathname.includes("auth") || pathname.includes("token")) {
    return {
      error: "invalid_grant",
      message: "The authorization code has expired",
      request_id: generateCanary("auth"),
    };
  }

  return {
    status: "ok",
    timestamp: new Date().toISOString(),
    _trace: generateCanary("api"),
  };
}
