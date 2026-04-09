// ============================================================================
// DECEPTION ENGINE - BARREL EXPORT
// Central export for all counter-intelligence modules.
// ============================================================================

export {
  type ThreatSignal,
  recordSignal,
  getThreatScore,
  generateBehavioralFingerprint,
  detectAutomation,
  logThreatIntel,
} from "./threat-intel";

export {
  checkHoneypotFields,
  isTripwire,
  triggerTripwire,
  getFakeAdminPage,
  getFakeEnvFile,
  getFakeGitContent,
  getFakeApiResponse,
} from "./honeypots";

export {
  shapeResponseHeaders,
  computeDelay,
} from "./response-shaping";

export {
  getAdaptiveRateLimit,
  classifySession,
  scanBodyForProbes,
  recordNavigation,
  detectSuspiciousNavigation,
  evaluateAutoDefense,
  isBlocked,
} from "./adaptive-defense";
