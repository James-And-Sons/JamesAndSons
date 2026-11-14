# Developer Handoff, Contributing & Maintenance Guide

## Project: James & Sons High-End Luxury E-Commerce Platform

**Document Version:** 1.0.0  
**Date:** August 2026

---

## 1. Branching & Commit Guidelines

### 1.1 Git Flow Architecture

We follow a standardized Git Flow model designed for stability across monorepo package boundaries:

- **`main`**: Production branch. Code in `main` must always be deployable to Vercel production servers.
- **`staging`**: Pre-production integration branch used for QA testing.
- **`feature/*`**: Feature branches branched off `main` or `staging` (e.g., `feature/custom-canvas-text-overlay`).
- **`fix/*`**: Bug fix branches (e.g., `fix/razorpay-webhook-signature-padding`).
- **`release/*`**: Production release candidates.

### 1.2 Branch Naming Standard

Branch names must follow lowercase, hyphen-separated conventions:

```
<type>/<short-description>
```

**Examples**:

- `feature/amazon-sp-api-lwa-refresh`
- `fix/shiprocket-pincode-cache`
- `chore/upgrade-prisma-7.5`

### 1.3 Conventional Commit Message Rules

All commit messages are validated before commit and must comply with the Conventional Commits specification:

```
<type>(<workspace/scope>): <short description in present tense>

[optional body providing technical rationale]
```

**Allowed Types**:

- `feat`: A new end-user or admin feature.
- `fix`: A bug fix.
- `docs`: Documentation updates.
- `style`: Formatting, missing semi-colons, no code logic change.
- `refactor`: Code restructuring without modifying behavior.
- `test`: Adding missing tests or refactoring test suites.
- `chore`: Maintenance tasks, package updates, build configuration.

**Examples**:

```bash
git commit -m "feat(media): add auto-enhance luminosity sampling to ProductImageEditor"
git commit -m "fix(razorpay): enforce sha256 digest comparison on webhook signature"
git commit -m "chore(deps): update nextjs to 16.2.1 and react to 19.2.4"
```

---

## 2. Code Standards & Formatting Rules

### 2.1 Workspace Linters & Prettier

The monorepo enforces unified coding styles via standard configurations shared across workspaces (`packages/config`):

- **ESLint v9**: Flat configuration (`eslint.config.mjs`) configured with Next.js core web vitals rules, React 19 hooks rules, and TypeScript strict checks.
- **Prettier v3**: Enforced project-wide via root scripts.
- **Husky & lint-staged**: Git pre-commit hook executing automatic formatting checks on staged files prior to commit creation.

### 2.2 Formatting Commands

```bash
# Check code formatting across the entire monorepo
yarn format

# Run ESLint across admin and storefront workspaces
yarn lint

# Execute TypeScript type checking without emitting files
yarn type-check
```

### 2.3 Automated Testing Suites

#### Unit & Integration Testing (Vitest)

Unit tests are written using Vitest v3 and located adjacent to implementation files or in `__tests__` directories:

```bash
# Run unit tests across packages
yarn test:unit
```

#### End-to-End Browser Testing (Playwright)

Browser E2E tests are located in the `e2e/` folder and configured via `playwright.config.ts`:

```bash
# Execute full Playwright E2E test suite
yarn test:e2e
```

---

## 3. Troubleshooting Common Runtime Errors

### 3.1 Database Connection Drops & Connection Pool Exhaustion

#### Symptom

Serverless API endpoints throw `PrismaClientInitializationError: Connection pool timed out` or PostgreSQL `FATAL: remaining connection slots are reserved for non-replication superuser connections`.

#### Root Cause

In serverless environments (Vercel API routes), each function instance creates new database pool connections. Without connection limit constraints, sudden traffic spikes exceed Supabase's max connection limit.

#### Step-by-Step Diagnostic Fix

1. **Verify Connection String**: Ensure `DATABASE_URL` uses the **Supabase Transaction Pooler** endpoint on port `6543` with `?pgbouncer=true`:
   ```ini
   DATABASE_URL="postgresql://postgres.ref:pass@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
   ```
2. **Inspect PG Pool Limit**: Check `packages/db/src/index.ts`. Ensure `Pool` initialization explicitly caps max pool size to `2`:
   ```typescript
   const pool = new Pool({
     connectionString: url,
     max: 2, // Serverless limit per lambda instance
     idleTimeoutMillis: 30000,
     connectionTimeoutMillis: 5000,
   });
   ```

---

### 3.2 Razorpay Webhook Signature Verification Failures

#### Symptom

Incoming Razorpay webhooks return HTTP `400 Bad Request` with error message `Invalid Razorpay Webhook Signature`.

#### Root Cause

The raw request body was parsed or modified before calculating the HMAC SHA-256 digest, or `RAZORPAY_KEY_SECRET` differs between test and live modes.

#### Step-by-Step Diagnostic Fix

1. Ensure the raw request text (not parsed JSON) is passed to `verifySignature`:
   ```typescript
   const bodyText = await req.text();
   const expectedSignature = crypto
     .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
     .update(bodyText)
     .digest("hex");
   ```
2. Verify that `RAZORPAY_KEY_SECRET` matches the webhook secret configured in the Razorpay Developer Dashboard under Webhooks -> Secret.

---

### 3.3 Shiprocket Authentication & Token Expiration

#### Symptom

Logistics order push fails with `HTTP 401 Unauthorized` or `Invalid Token Provided`.

#### Root Cause

The cached Shiprocket JWT bearer token expired or login credentials in `.env.local` are missing or locked out.

#### Step-by-Step Diagnostic Fix

1. Clear the serverless in-memory cached token by re-deploying or restarting the dev server.
2. Verify credentials manually via curl:
   ```bash
   curl -X POST https://apiv2.shiprocket.in/v1/external/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"dev.team@jamesandsons.in","password":"your_password"}'
   ```
3. Ensure `SHIPROCKET_PICKUP_LOCATION` string matches an exact registered pickup location name in the Shiprocket dashboard settings.

---

### 3.4 Amazon SP-API LWA Token & AWS SigV4 Authorization Errors

#### Symptom

Amazon marketplace sync returns `Unauthorized / Access Denied` or `The request signature we calculated does not match the signature you provided`.

#### Root Cause

- Login with Amazon (LWA) refresh token expired or client secret is incorrect.
- Server time drift caused AWS SigV4 timestamp validation to fail.

#### Step-by-Step Diagnostic Fix

1. Test LWA Refresh Token exchange via curl:
   ```bash
   curl -X POST https://api.amazon.com/auth/o2/token \
     -d "grant_type=refresh_token" \
     -d "refresh_token=YOUR_LWA_REFRESH_TOKEN" \
     -d "client_id=YOUR_LWA_CLIENT_ID" \
     -d "client_secret=YOUR_LWA_CLIENT_SECRET"
   ```
2. Verify that system clock time is synchronized via NTP (`sudo ntpdate pool.ntp.org`).
3. Ensure `AMAZON_MARKETPLACE_ID` matches the target region (Amazon India Marketplace ID: `A21TJRUUN4KGV`).

---

### 3.5 Cloudinary Upload Preset Errors

#### Symptom

Custom Image Editor upload throws `Cloudinary Upload Failed: Invalid upload_preset`.

#### Root Cause

The `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET` defined in `.env.local` is not configured as an **Unsigned** upload preset in the Cloudinary Console.

#### Step-by-Step Diagnostic Fix

1. Log into Cloudinary Dashboard -> Settings -> Upload.
2. Under "Upload presets", ensure `ml_default` (or your custom preset name) has **Signing Mode** set to `Unsigned`.
3. Verify that Allowed Formats include `webp`, `jpg`, `png`.

---

## 4. Operational Maintenance Checklist

Before handing off or deploying new features to production:

- [ ] Execute `yarn lint` and resolve all ESLint warnings.
- [ ] Execute `yarn type-check` across all workspace projects.
- [ ] Execute `yarn test:unit` to verify core domain packages pass all unit tests.
- [ ] Run `npx prisma validate` to confirm schema integrity.
- [ ] Verify that `.env.example` includes any newly added environment variables.
- [ ] Verify that all secrets in production Vercel dashboards are updated.
