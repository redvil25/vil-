# Fictivize Testing & Security Toolchain

## Functional Testing

| # | Tool | Purpose | Where It Runs |
|---|------|---------|---------------|
| 1 | **Jest** (v29.7) | Unit and integration tests for backend (Node.js) and frontend (React/Next.js). Enforces coverage thresholds. | Pre-commit hook, pre-push hook, CI |
| 2 | **Playwright** (v1.61) | Browser-based end-to-end tests across Chromium, Firefox, WebKit, and mobile viewports (Pixel 5, iPhone 12). | Local scripts, CI, nightly smoke tests |
| 3 | **openapi-response-validator** (v12.1) | Contract tests that verify API responses match the OpenAPI spec. | `npm run test:contract`, CI |
| 4 | **swagger-cli** | Validates `openapi.yaml` against the OpenAPI 3.x specification. | Pre-commit hook, CI |

**Supporting test libraries:** `ts-jest`, `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`, `aws-sdk-client-mock`, `aws-sdk-client-mock-jest`

---

## Static Analysis & Code Quality

| # | Tool | Purpose | Where It Runs |
|---|------|---------|---------------|
| 5 | **TypeScript** (v5.3, strict mode) | Static type checking with `noUnusedLocals`, `noImplicitReturns`, etc. | Pre-commit hook, CI |
| 6 | **ESLint** (v9.39) | Linting for TypeScript/JavaScript with `@typescript-eslint` rules. | Pre-commit hook (via lint-staged), CI |
| 7 | **Prettier** (v3.8) | Code formatting with Tailwind CSS class sorting (frontend). | Pre-commit hook (via lint-staged) |
| 8 | **dependency-cruiser** (v17.4) | Architecture enforcement -- prevents layer violations (e.g., handlers importing repositories directly, circular deps). | `npm run arch:check` |

---

## Security -- Static (SAST)

| # | Tool | Purpose | Where It Runs |
|---|------|---------|---------------|
| 9 | **Semgrep** (v1.166) | SAST scanner with OWASP Top 10, TypeScript, React, and Next.js rule packs plus custom Fictivize rules (XSS, stack trace leakage, hardcoded secrets, eval, command injection, weak randomness, missing auth). | Pre-commit hook, CI (uploads SARIF to GitHub Security tab) |

---

## Security -- Dynamic (DAST)

| # | Tool | Purpose | Where It Runs |
|---|------|---------|---------------|
| 10 | **OWASP ZAP** (v2.17, Docker) | Passive baseline scan of deployed app for HTTP security headers (HSTS, CSP, X-Frame-Options), cookie attributes, info leakage, XSS vectors. | CI (manual trigger or post-deploy), creates GitHub Issues |

---

## Security -- Dependencies & Supply Chain

| # | Tool | Purpose | Where It Runs |
|---|------|---------|---------------|
| 11 | **npm audit** | Scans npm dependencies for known CVEs at moderate+ severity (production deps only). | Pre-commit hook, CI |
| 12 | **Dependabot** | Automatically opens PRs for dependency updates across npm, GitHub Actions, pip, and Terraform. | GitHub scheduled (weekly) |
| 13 | **Hallucinated Package Detector** (custom) | Verifies all imported packages actually exist on the npm registry -- prevents AI-suggested dependency confusion / supply chain attacks. | CI |

---

## Security -- Infrastructure as Code (IaC)

| # | Tool | Purpose | Where It Runs |
|---|------|---------|---------------|
| 14 | **tfsec** | Security scanning of Terraform code (minimum severity: MEDIUM). | Pre-commit hook |
| 15 | **Checkov** | Policy-as-code scanning for Terraform against AWS best practices (IAM, Lambda, S3, API Gateway, etc.). | Pre-commit hook |
| 16 | **terraform fmt / validate** | Enforces canonical HCL formatting and validates configuration syntax. | Pre-commit hook |

---

## Security -- Runtime Defense

| # | Tool | Purpose | Where It Runs |
|---|------|---------|---------------|
| 17 | **AWS Amplify Custom HTTP Headers** | Applies security headers at the CDN edge: HSTS, X-Frame-Options DENY, CSP, Referrer-Policy, Permissions-Policy, COOP. | Always-on (every response) |

---

## Security -- Cloud Security Posture Management (CSPM)

> **Note:** CSPM services are **not enabled** in the lab/sandbox environment due to cost. Before going to production, you should enable the following AWS services to maintain continuous security monitoring and compliance:

| # | Service | Purpose | Estimated Cost |
|---|---------|---------|----------------|
| 18 | **AWS Config** | Continuously records resource configurations and evaluates them against rules. Required for Security Hub findings. | ~$2-5/month (varies by resource count) |
| 19 | **AWS Security Hub** | Aggregates findings from Config, GuardDuty, and other services. Evaluates against AWS Foundational Security Best Practices and CIS Benchmarks. | ~$1-3/month |
| 20 | **Amazon GuardDuty** | Continuous threat detection monitoring for malicious activity and unauthorized behavior (CloudTrail analysis, VPC flow logs, DNS logs). | ~$5-10/month |

To enable these services, create Terraform modules for `security` (AWS Config + Security Hub) and `guardduty` in `infrastructure/modules/`, then reference them from your environment's `main.tf`. See the [AWS Security Hub](https://docs.aws.amazon.com/securityhub/latest/userguide/) and [GuardDuty](https://docs.aws.amazon.com/guardduty/latest/ug/) documentation for configuration guidance.

---

## Hook Orchestration & CI Integration

| # | Tool | Purpose | Where It Runs |
|---|------|---------|---------------|
| 21 | **Husky** (v9.1) + **lint-staged** (v16.4) | Orchestrates pre-commit and pre-push quality gates for the JS/TS toolchain. | `git commit`, `git push` |
| 22 | **pre-commit** (Python framework) | Chains Terraform security hooks and Semgrep, then delegates to Husky. | `git commit` |
| 23 | **GitHub Actions CI** | Runs all of the above in pipelines (`backend-ci.yml`, `frontend-ci.yml`, `nightly-smoke-tests.yml`, `dast-zap-baseline.yml`). | Push, PR, nightly schedule, manual |
| 24 | **lcov-reporter-action** + **CodeQL SARIF upload** | Posts coverage summaries on PRs and uploads Semgrep findings to GitHub Security tab. | CI on PRs |

---

## How These Tools Layer Together

```
Developer commits code
  |
  v
Pre-commit hooks (local)
  |- Prettier + ESLint (formatting & linting)
  |- TypeScript (type checking)
  |- Jest (unit tests with coverage)
  |- OpenAPI validation
  |- npm audit (dependency CVEs)
  |- Semgrep (SAST)
  |- tfsec + Checkov (IaC security)
  |- terraform fmt/validate
  |
  v
Pre-push hooks (local)
  |- Jest with coverage (full suite)
  |- Next.js build verification
  |
  v
CI Pipeline (GitHub Actions)
  |- All of the above, plus:
  |- Contract tests
  |- Hallucinated package detection
  |- SARIF upload to GitHub Security
  |- Coverage reports on PRs
  |
  v
Post-Deploy (staging/production)
  |- OWASP ZAP baseline scan (DAST)
  |- Nightly Playwright smoke tests
  |- Amplify security headers (always-on)
  |
  v
Ongoing
  |- Dependabot weekly dependency PRs
```
