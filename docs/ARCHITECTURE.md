# Architecture decisions

1. **Maintain both products.** Nexus is the hosted application; legacy Android
   adapters remain import-compatible. No browser user depends on ADB.
2. **D1 persistence.** Every agent, version, workflow, execution, event, report and
   usage aggregate comes from the server. localStorage holds theme/language only.
3. **Identity.** Trust dispatch-owned SIWC headers only behind the Sites boundary.
   Do not deploy this API behind an arbitrary proxy that accepts spoofed identity
   headers. Guest sessions use 256 random bits and store only their SHA-256 hash.
4. **Execution.** A compare-and-set database lease starts one worker per run.
   The initiating HTTP request processes a bounded plan; UI polling observes saved
   events. This is not a durable queue. Abandoned runs expire and become failed.
   Cancellation prevents the next step, not a network read already in progress.
5. **Approval.** Workflow approvals persist the plan cursor and require ownership
   checks before continuation. No generic external write tool is exposed.
6. **Evidence vs AI.** Deterministic extraction is useful with no model key. AI
   planning is optional and restricted to approved URLs. Reports preserve raw
   extracted evidence separately from model-generated interpretation.
7. **Model credentials.** Per-user credentials encrypted in D1 using AES-256-GCM,
   one random IV per save. Keys are never included in a model prompt or browser job.
8. **Browser service.** Chromium cannot run in this Worker. Deploy the separate
   Playwright service to an isolated host, configure NEXUS_BROWSER_RUNNER_URL and
   NEXUS_BROWSER_RUNNER_KEY, then test it. Browser contexts are per-job, no persistent
   login state, no public CDP/VNC, bounded concurrency, no writes/submissions.
9. **Scheduling.** A schedules schema exists for future migration compatibility,
   but no scheduler UI claims a schedule is active. Use a durable job service before
   enabling recurring work. Payments/team features are similarly explicit foundations.

## Local migrations

After `pnpm build`, apply each pending generated SQL once:

```bash
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_yielding_prodigy.sql
```

Then `pnpm dev`. Clean clones use the portable preview profile. The managed Sites
preview is controlled by its daemon; do not start duplicate preview servers there.
Production migrations are applied by Sites publication, separately from local D1.

## API surface

All paths below are under `/api/nexus/`.

| Route | Capability |
| --- | --- |
| POST session / GET me | Guest bootstrap / authenticated account and real stats |
| agents | Owned CRUD, duplicate, versions, publish |
| workflows | Owned validated definitions |
| runs | Create, start, poll, cancel, approve |
| artifacts/:id | Owner-only download |
| connections/openai | Encrypt/replace/delete provider key; never return it |
| marketplace | Public definitions visible to workspace users; import a copy |
| audit | Current user's audit trail |
| admin | Explicit operator allowlist only |
| schedules | Returns configuration-required, never a fake active schedule |

## Rollout and acceptance

0.4 accepts a real evidence journey and persistence, not the complete requested
commercial platform. AI live inference, interactive browser hosting, durable queues,
recurring scheduling, team permissions, billing and independent security review
must be completed before claiming the full product or production readiness.
