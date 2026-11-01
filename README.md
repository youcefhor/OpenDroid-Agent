# OpenDroid Agent

An experimental, open-source, permission-first toolkit for automating **your own Android device** through Android Debug Bridge (ADB).

> Status: v0.2.0 prototype. This is **not yet an autonomous AI agent**.
> Current features: list devices, capture screenshots, tap, swipe, UI hierarchy extraction and validated JSON tasks.
> Interactive actions require confirmation; task execution supports explicit --yes approval. No cloud service or API keys required.

## Requirements

- Python 3.10+
- [Android SDK Platform Tools](https://developer.android.com/tools/releases/platform-tools)
- Android phone with USB debugging enabled and its connection authorized

## Install

```bash
python -m pip install -e .
```

## Commands

```bash
opendroid devices
opendroid screenshot screen.png
opendroid tap 200 400
opendroid swipe 200 700 200 250 --duration 500
```

If more than one device is connected, use `--serial DEVICE_ID` **before** the command.

## Tests

```bash
python -m unittest discover -s tests -v
```

## Safety

Only connect devices you own or have permission to control. Screen captures may contain personal data; keep them local. Never expose ADB over an untrusted network. This project does not bypass device locks or security prompts.

## Roadmap

1. Stable ADB controls and tests (initial prototype)
2. UI hierarchy extraction and device selection
3. Local task planner with explicit user approval
4. Optional model-provider adapters and safer action policies
5. Cross-platform GUI and community documentation

## Contributing

Issues, reproducible bug reports and small pull requests are welcome. See CONTRIBUTING.md.

## Task execution (v0.2)

```bash
opendroid hierarchy
opendroid run examples/swipe.json --dry-run
opendroid run examples/swipe.json
# Explicitly approve all steps for unattended execution:
opendroid run examples/swipe.json --yes
```

A task contains only a `steps` array. Supported actions: `tap` (`x`, `y`),
`swipe` (`x1`, `y1`, `x2`, `y2`, `duration` in milliseconds), and `wait`
(`seconds`). All values must be integers. Coordinates and duration: 0..10000;
wait: 0..60 seconds. Maximum 100 steps. The complete task is validated before
any device action. Execution stops on the first error; completed actions are
not rolled back. Dry-run never contacts the phone. Coordinates are specific to
your screen size and current app state; inspect before approving.

## دليل عربي سريع

هذه نسخة أولية تعمل من حاسوب متصل بهاتفك عبر ADB؛ ليست تطبيق APK ولا وكيلاً
يفهم الأوامر باللغة الطبيعية بعد. تحتاج Python 3.10 أو أحدث وأدوات Android
Platform Tools، ثم تفعيل USB debugging على الهاتف والموافقة على اتصال الحاسوب.
بعد تنزيل المستودع افتح الطرفية داخل مجلده وشغّل `python -m pip install -e .`.
الأمر `opendroid devices` يعرض الهواتف، و`opendroid screenshot screen.png`
يحفظ صورة للشاشة. افحص ملف المهمة باستخدام `--dry-run` ثم شغّله ووافق مرة
واحدة لتنفيذ خطواته. قراءة الشاشة متاحة بالأمر `opendroid hierarchy`.

## Validation limits

Automated tests mock ADB and cover command construction, connection failures,
XML validation, task validation, execution order and stopping after errors.
A physical Android device is required for end-to-end verification.
No language model provider, autonomous planner or phone-only runtime is included yet.
