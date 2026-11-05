# OpenDroid Nexus

**An Arabic/English workspace for agents, execution history and reports you can inspect.**

[Open the application](https://opendroid-agent-lab.biggerflea1.chatgpt.site) · [Watch the walkthrough](https://github.com/youcefhor/youcefhor/blob/main/assets/nexus-walkthrough.mp4) · [Architecture](docs/ARCHITECTURE.md) · [Security](docs/SECURITY.md) · [CI](https://github.com/youcefhor/OpenDroid-Agent/actions)

![Arabic workspace](https://raw.githubusercontent.com/youcefhor/youcefhor/main/assets/nexus-overview.jpg)

## A task you can try

Open a guest workspace and select **تجربة مستكشف الأدوات الذكي**. Ask for open-source tools in a category. The scout uses Gemini to form a GitHub search, retrieves public repository metadata and saves a comparison with source links.

The shared trial has a daily model-call cap and provider quotas. The current discovery tool searches GitHub. Agent definitions, reports and execution history persist on the server.

## Walk through the interface

[Watch or download the 20-second walkthrough](https://github.com/youcefhor/youcefhor/blob/main/assets/nexus-walkthrough.mp4)

The video steps through actual interface screenshots, including a previously completed research run.

| Agent library | Saved comparison |
| --- | --- |
| ![Library](https://raw.githubusercontent.com/youcefhor/youcefhor/main/assets/nexus-library.jpg) | ![Saved research result](https://raw.githubusercontent.com/youcefhor/youcefhor/main/assets/nexus-report.jpg) |

## What is in this repository

| Area | Entry point | Purpose |
| --- | --- | --- |
| Web interface | [app/](app/) | Arabic RTL and English workspace, agent studio and execution viewer |
| Execution engine | [lib/nexus/](lib/nexus/) | Planning, tool boundaries, ownership and persisted events |
| Data | [db/](db/) · [drizzle/](drizzle/) | Schema and database migrations |
| Browser adapter | [services/browser-runner/](services/browser-runner/) | Separate Playwright service source |
| Android bridge | [src/opendroid/](src/opendroid/) | Existing local-device integration |
| Tests | [tests/](tests/) | Unit, API/database and browser journey checks |

## Scope

The hosted workspace supports public source reading, text document extraction and GitHub metadata discovery. Android needs a local device connection. Interactive browser hosting and recurring background execution require additional deployment work. The architecture and security notes describe those boundaries.

## Development

Use the Node and pnpm versions declared in `package.json`.

```sh
pnpm install --frozen-lockfile
pnpm build
# Apply local D1 migrations as described in docs/ARCHITECTURE.md
pnpm dev
```

```sh
node --test tests/nexus/*.test.mjs tests/web/*.test.mjs services/browser-runner/policy.test.mjs
PYTHONPATH=src python -m unittest discover -s tests -v
pnpm exec tsc --noEmit
# With a running local server and migrated D1 database
node tests/nexus/api.integration.mjs
```

CI also exercises real HTTP/database requests and UI journeys at mobile and desktop widths. Live model requests are verified separately from credential-free CI.

## Provider configuration

The operator can configure `NEXUS_GEMINI_KEY` as a server secret for the Gemini scout. The shared trial permits up to 40 model calls per day across workspaces. A task typically needs two calls. Provider quotas can stop it earlier. No automatic paid fallback is implemented.

The optional per-user OpenAI connection stores credentials encrypted with AES-GCM using `NEXUS_ENCRYPTION_KEY`. Secrets belong in the hosting provider's secret settings. The tracked hosting manifest declares the project and storage bindings.

## Execution boundaries

- Guest data belongs to a random-token browser session. API ownership checks protect saved records and artifacts.
- Workflow nodes support ordered steps, conditions, approval checkpoints and result storage. Execution is request-driven with a lease rather than a durable background queue.
- The standalone Playwright service requires separate deployment. Its policy tests are distinct from an operational browser-service test.
- Free, Pro and Business entitlement definitions exist. Only the Free experience is available. Billing and team collaboration are unfinished.
- Android functionality requires a local connection. No physical-device autonomy result is claimed.
- A production security review and load testing remain outstanding.

See [architecture](docs/ARCHITECTURE.md), [security](docs/SECURITY.md), [contributing](CONTRIBUTING.md) and the [MIT license](LICENSE).
