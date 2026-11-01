# OpenDroid Studio · v0.3

An Arabic-first, mobile-responsive Android agent workspace, with an interactive
virtual phone, command planner, execution timeline, result verification,
bounded recovery, approval dialogs, and a separately authenticated local ADB bridge.

## Try it now

**[Open the interactive demo](https://opendroid-agent-lab.biggerflea1.chatgpt.site)**

اضغط **تشغيل المهمة** لتجربة إعداد الهاتف الافتراضي. أو اختر حفظ ملاحظة، بحثاً
تجريبياً، أو إرسال رسالة تجريبية تتوقف حتى توافق. يمكنك النقر على تطبيقات الهاتف
مباشرة. جميع هذه التغييرات داخل المحاكاة فقط؛ لا تتحكم بهاتف الزائر الحقيقي.

## What is implemented

- Buildless web UI in `web/`, RTL Arabic, responsive layout, no runtime dependencies.
- Interactive home screen, settings, notes, messages and simulated search results.
- Arabic/English rule-based planning for the supported intents; unknown commands fail explicitly.
- Execution state machine: plan → execute → verify → complete/error.
- Cooperative cancellation between actions. One retry only for explicitly retryable
  failures that occurred before any effect; no blind replay of device actions.
- Mandatory per-action approvals for simulated send/delete; every real device plan
  requires a separate, single-use approval bound to the selected device (120-second expiry).
- JSON session log export, transient-error injection and explicit simulation labels.
- Optional server-side OpenAI-compatible chat-completions planner for **simulation only**.
- Authenticated local ADB mode with device selection, screenshot, settings, home and
  coordinate taps. No arbitrary shell supplied by users or models.

## Run the web interface locally

Python 3.10+ and a checkout of this repository:

```bash
python -m pip install -e .
python -m opendroid.server
```

Open the private session URL printed by the server. It contains a token in its
fragment; the UI removes it from the address bar and keeps it in session memory.
The server binds to `127.0.0.1:8765` by default. Static-only demo also works with
`python -m http.server 8000 --directory web`; ADB and AI need `opendroid.server`.

## Real Android mode

1. Install official [Android Platform Tools](https://developer.android.com/tools/releases/platform-tools).
2. Enable USB debugging on your own phone, connect it, and approve the computer on the phone.
3. Start `python -m opendroid.server` and open its private URL on the computer.
4. Select **جهاز حقيقي · ADB**, click **فحص اتصال ADB**, then enter a supported command.
5. Review and approve the plan. A real screenshot replaces the simulated phone.

Supported real commands: `افتح الإعدادات`, `الرئيسية`, `لقطة شاشة`, `انقر 100 200`.
Use `--serial DEVICE_ID` when multiple devices are attached. For a phone browser
on the same trusted LAN, bind to the computer's **specific private IP**, e.g.
`--host 192.168.1.10`, and open the printed URL there. This uses unencrypted local
HTTP: use only a trusted private network, never expose the bridge to the internet,
and stop it after use. Do not publish session URLs. No CORS access is allowed.
The public demo does not connect to localhost or secretly access devices.

Settings verification inspects Android's resumed activity. Screenshot verification
checks PNG data. Home and coordinate taps return a screen for **human visual
verification**; the interface does not claim their semantic outcome was verified.
No physical phone was available during development; hardware end-to-end behavior
remains unverified. OEM settings names and ADB behavior can differ.

## Optional AI interpretation

Set these environment variables in your **local server environment**:

| Variable | Value |
| --- | --- |
| `OPENDROID_AI_URL` | Full HTTPS chat-completions endpoint from your provider |
| `OPENDROID_AI_MODEL` | Your provider's model identifier |
| `OPENDROID_AI_KEY` | Your API key |

Restart the local server and enable **تفسير الأمر بنموذج AI**. Only command text
is sent to your configured provider, and the returned JSON must pass the strict
allowlist validator. Screenshots are not sent. Keys never enter client JavaScript,
logs, or this repository. This option may incur provider costs. It does not make
the agent general-purpose, and AI plans never drive real ADB actions in v0.3.

## Tests

```bash
python -m unittest discover -s tests -v
node --test tests/web/*.test.mjs
node --check web/app.mjs
```

Tests cover task execution, Arabic planning, approval denial/acceptance, cancellation,
concurrency, verification failures, transient recovery, ADB allowlists, device
selection, single-use approvals, HTTP authentication and origin protection.
GitHub Actions runs tests on Python 3.10–3.13 with Node 22.

The original CLI (`opendroid devices`, `screenshot`, `tap`, `swipe`, `hierarchy`,
`run`) remains available. See `examples/swipe.json` for its JSON format.

## Architecture and limitations

`web/engine.mjs` is the DOM-independent simulation engine. `web/app.mjs` renders
state and manages user approvals. `src/opendroid/server.py` serves the same UI,
keeps credentials server-side and isolates real device execution. Simulation is
in-memory and resets on reload. Search results are designed local samples, not
live web search. No APK, phone-only native automation, remote cloud ADB service,
vision planner, or arbitrary-app autonomous control is included.

MIT licensed. Contributions welcome; see CONTRIBUTING.md.
