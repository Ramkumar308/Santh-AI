# Security Policy — SanthAI Platform

## Supported Versions

SanthAI follows semantic versioning for its produce vendor intelligence application, client encryption layers, and offline ledger systems.

| Version | Status | Security Update Policy |
| :--- | :--- | :--- |
| **1.2.x** | Current Production (`main`) | Supported with active patches, edge cache updates, and cryptographic audit maintenance |
| **1.1.x** | Prior Review Milestone | Security patches backported for critical storage bugs only |
| **< 1.0.x** | Prototype / Deprecated | Unsupported |

## Threat Model & Vendor Privacy Safeguards

1. **Local-First Zero-Knowledge Architecture**: Customer Khata ledgers, credit terms, and daily turnover figures reside directly in sandboxed vendor client storage (`localStorage` & IndexedDB). No customer phone numbers or credit history are forwarded to unauthenticated remote analytics servers.
2. **Encrypted Emergency Data Vault**: JSON backups (`santhai_emergency_backup_*.json`) are generated purely client-side using native browser memory allocations without external cloud intermediaries.
3. **Agmarknet API Ingress Isolation**: All upstream government open data API interactions occur either over HTTPS via our edge proxies (`/api/mandi-prices`) or strictly sanitized clients with response shape validation.

## Reporting a Vulnerability

If you discover a security issue or unexpected data exposure flaw in SanthAI:

1. **Direct Notification**: Email the maintainer at **`ksramkumar2148@gmail.com`** with the subject line: `[SECURITY AUDIT] SanthAI Vulnerability Report`.
2. **Details to Provide**:
   - Component / module name (e.g., `ErrorBoundary`, `KhataService`, `DataBackupService`, `/api/mandi-prices`).
   - Steps or proof-of-concept to reproduce the unexpected state or storage leakage.
   - Browser environment, device OS, and client version.
3. **Response SLA**:
   - Initial triage confirmation within **24 hours**.
   - Vulnerability assessment & patch release timeline within **72 hours**.

