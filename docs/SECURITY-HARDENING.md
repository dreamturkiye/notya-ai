# Notya Pre-Launch Security Hardening

Branch: `security/pre-launch-hardening`

## Completed in this branch

### 1. Fail closed on missing encryption secrets
- `lib/security/encryption.ts` now throws if `ENCRYPTION_MASTER_KEY`, `ENCRYPTION_SALT`, or `TC_HASH_PEPPER` are missing or empty.
- Hardcoded fallbacks removed.
- Webhook signature comparison upgraded to `timingSafeEqual`.

### 9. Key management documentation
See section below.

## Remaining items

### 2. Expand middleware / central auth
Expand `PROTECTED_ROUTES` in `middleware.ts` so every `/api/doktor/*` route requires authentication by default. Prefer a shared auth helper.

### 3. Real rate limiting
Implement Upstash Redis rate limiting on auth, recording upload, and AI endpoints. Headers alone are not enforcement.

### 4. Tighten CSP
Remove `'unsafe-eval'`. Reduce `'unsafe-inline'` via nonces or hashes where possible.

### 5. Supabase RLS
Enable Row Level Security on patient-related tables. Policies must enforce doctor ownership. Test that cross-doctor access is denied even if application code is bypassed.

### 6. Service-role audit
Inventory every use of `SUPABASE_SERVICE_ROLE_KEY` / `servisSupabase`. Reduce to webhook, cron, and migration paths only. Add extra ownership checks on remaining paths.

### 7. Cron endpoints
Protect every `/api/cron/*` route with `CRON_SECRET` (constant-time compare). Fail closed if secret is missing.

### 8. External penetration test
Scope: cross-doctor data access, auth bypass, webhook abuse, patient portal PIN, recording consent bypass. Required before public launch with real patient data.

## Key management

**Secrets**
- `ENCRYPTION_MASTER_KEY` — derives AES-256-GCM key for patient PII.
- `ENCRYPTION_SALT` — salt for scrypt derivation.
- `TC_HASH_PEPPER` — pepper for TC identity hash.

**Rules**
- Never commit these values.
- Store in Vercel environment variables (Production + Preview as needed).
- Minimum length: 32 characters of high entropy for the master key.
- Rotate only with a planned re-encryption migration (old key required to decrypt existing data).
- Backup: store a sealed copy in a password manager or hardware-backed secret store accessible to the founder only.
- Access: founder only. Do not share with contractors or agents.
- Loss of the master key = permanent loss of ability to decrypt existing patient PII.

**Rotation procedure (future)**
1. Generate new master key and salt.
2. Deploy dual-key decryption (try new, fall back to old).
3. Background job re-encrypts all patient PII fields.
4. Remove old key after verification.
5. Document the rotation date.

## Pre-launch checklist

- [x] Encryption secrets fail-closed (this branch)
- [ ] Middleware protects all doctor APIs by default
- [ ] Rate limiting enforced on sensitive endpoints
- [ ] CSP tightened
- [ ] RLS enabled and tested on patient tables
- [ ] Service-role usage audited and minimized
- [ ] Cron routes protected with CRON_SECRET
- [ ] External pentest completed
- [x] Key management documented
- [ ] No patient data in application logs
- [ ] Consent gate verified before any recording
