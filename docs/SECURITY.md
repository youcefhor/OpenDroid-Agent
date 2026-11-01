# Security notes and remaining work

Implemented: server-side ownership predicates; platform identity; hashed guest tokens;
HttpOnly/Secure/SameSite cookies in production; Origin checks; rate limits; quotas;
bounded input and response sizes; public HTTPS URL validation; public DNS checks;
redirect validation; robots checks; challenge detection; read-only tool allowlists;
AES-GCM provider secrets; audit events; owner-only artifacts; no public browser sessions.

Do not deploy the API where clients can inject trusted SIWC identity headers.
Do not expose the separate runner key, container control socket or browser ports.
Browser jobs use fresh contexts and discard cookies at completion. Its network
checks do not replace network-level egress filtering: DNS rebinding/time-of-check
races require an egress proxy/firewall in a production browser host. Sandbox must
remain enabled and the container must run as non-root. The runner has not undergone
production operational verification.

Remaining: independent penetration review, adversarial DNS testing, stricter egress
pinning, user-generated listing moderation, quotas robust against adversarial
concurrent requests, abuse handling, retention/deletion policy and full account
erasure, operator alerts, database backups/recovery exercises, load testing and
long-running job recovery. Guest usage is vulnerable to distributed account creation;
rate limits are a foundation, not a complete anti-abuse service.

Never treat provider synthesis as verified truth. Verification covers transport,
source extraction and provenance. A document or webpage may contain false claims.
No billing, consequential external submissions, payments, account creation on
third-party sites or CAPTCHA bypass is implemented.

Report vulnerabilities through a private repository security report if enabled;
do not post keys, cookies, source-private documents or session tokens in issues.
