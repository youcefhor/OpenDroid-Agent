# OpenDroid Nexus · 0.4 foundation

An Arabic/English agent workspace with real server-side persistence, evidence
execution, saved agents, workflow checkpoints and private reports. This is a
working foundation, **not a production-ready or fully autonomous SaaS**.

**Application:** https://opendroid-agent-lab.biggerflea1.chatgpt.site

## First complete journey

1. Open a free guest workspace, or use the platform's Sign in with ChatGPT.
2. Add Source Research from the starter library or create an agent.
3. Enter a public HTTPS URL and run a task.
4. Follow server-persisted execution events.
5. Read/download the report, inspect source URL, fetch timestamp and SHA-256.
6. Reload and return to execution history. Records are stored in D1, not localStorage.

Evidence mode performs deterministic source extraction. It does **not** pretend to
understand arbitrary natural-language instructions. AI planning/synthesis requires
an OpenAI API key entered in Settings. No platform API key is bundled.

## Implemented

- Arabic RTL/English UI; light/dark preferences; responsive SaaS workspace.
- Platform-owned ChatGPT authentication, plus random-token guest sessions. No passwords collected.
- Agents: create/edit/test/duplicate/delete, tools, limits, permission policy,
  memory preference, model, input/output preferences, and immutable saved versions.
- Five starter definitions: source research, product comparison, job listing analysis,
  page-change comparison, and text document analysis. They read supplied URLs; no
  general search engine integration or jobs feed is fabricated.
- Real HTTPS fetching with redirect, network, robots, payload-size and timeout checks.
- Real TXT/Markdown/JSON text extraction with line references (not PDF/OCR).
- AI adapter: server-side OpenAI chat completions, structured plan allowlist,
  bounded URLs/tools, token usage tracking and cited synthesis. Cost remains unknown
  rather than inventing prices. Provider errors are recorded, not replaced with mock answers.
- Run lifecycle: queued/running/approval/completed/failed/cancelled; cancellation
  between steps; one timeout retry for read-only operations; expiring execution lease.
- Private persisted reports, ownership checks, audit trail, rate limits and Free-tier quotas.
- Workflow editor: ordered trigger/agent/condition/approval/store nodes; a condition
  runs/skips the next planned operation; stop-on-error policy. No loops/background queue.
- Community publishing/import of actual agent definitions, with explicit publication
  confirmation. Reports and secrets are never included. No fabricated listings or reviews.
- Free/Pro/Business entitlement definitions; only Free is available. Billing is off.
- Separate Playwright runner service and adapter; not deployed/configured on the public
  instance. Read-only navigation, reading, snapshots and local field filling are supported
  by its source. Clicks, form submission, login and payment are disabled.
- Existing Python Android/ADB code and original web simulator preserved under `src/`
  and `web/`. Nexus does not require an Android phone.

## Not finished / not verified

- No real provider credential was supplied, so paid AI inference is not verified end-to-end.
- No isolated browser hosting account is configured. The public deployment uses HTTP
  source extraction, **not** a headless browser. Runner policy unit tests are not proof
  of browser execution. Runner Chromium and Docker operation require deployment testing.
- Recurring schedules, durable background workers, email, search providers, team
  membership, payments, paid marketplace sales, account recovery and moderation are absent.
- Memory/output-format preferences are stored; no vector memory or arbitrary output
  schema execution is implemented. Historical page fingerprint comparison is available.
- No physical Android device was available. Full Android autonomy is unsupported.
- No penetration test, load test or independent security audit has been completed.

## Architecture

- `app/page.tsx`, `app/globals.css`: React workspace and responsive design system.
- `app/api/nexus/[[...path]]/route.ts`: same-origin API.
- `lib/nexus/server.ts`: identity, authorization, D1 storage, secrets and execution.
- `lib/nexus/core.mjs`: pure validation, workflow rules, extraction and report creation.
- `db/schema.ts`, `drizzle/`: D1 schema and generated immutable migrations.
- `services/browser-runner/`: separately deployed isolated Playwright service.
- `worker/`, `scripts/vite/`: preserved Sites/Vinext Cloudflare integration.

Cloudflare Workers + D1 minimize idle hosting overhead. Platform SIWC avoids
operating password storage. Guest sessions are explicitly device-bound and expire
after 30 days; linking ChatGPT transfers the current guest records to that account.

## Development and reproducible deployment

Node 22.13+ and pnpm version from package.json. Installation is for contributors,
not a requirement for using the hosted application.

```bash
pnpm install --frozen-lockfile
pnpm exec drizzle-kit generate # only after schema changes
pnpm build
# Apply pending SQL to local D1 before local development (see docs/ARCHITECTURE.md).
pnpm dev
```

The tracked `.openai/hosting.json` identifies this deployment and its DB/BUCKET
bindings. The Sites source workflow builds, packages, applies generated migrations
and deploys the matching commit. No production database is created in request handlers.

```bash
node --test tests/nexus/*.test.mjs tests/web/*.test.mjs services/browser-runner/policy.test.mjs
python -m unittest discover -s tests -v
pnpm exec tsc --noEmit
node tests/nexus/api.integration.mjs # local HTTP server + migrated D1 required
```

## Security and secrets

`NEXUS_ENCRYPTION_KEY` is a server-only 32-byte hex key. User provider keys are
AES-GCM encrypted with random IVs and never returned by APIs. The operator must
protect/backup the encryption key; losing it makes saved credentials unrecoverable.
Use Sites secret settings, never the hosting manifest or frontend bundle.
`NEXUS_ADMIN_USER_IDS` is an explicit comma-separated operator allowlist; the first
visitor is not an administrator. Browser runner secrets and URLs are operator-only.

API writes require same-origin requests and a valid session or platform identity.
Every owned lookup checks user_id. Guests have no admin access. Prompt injection
boundaries are structural: retrieved content is data, AI can read only user-approved
URLs and allowlisted tools, and synthesis has no tool access. This reduces risk;
it does not make arbitrary AI interpretation inherently trustworthy.

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) and
[docs/SECURITY.md](docs/SECURITY.md). MIT licensed.
