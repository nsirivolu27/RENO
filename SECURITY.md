# Security policy

## Reporting

Please report vulnerabilities privately using GitHub's **Report a vulnerability**
button on the Security tab of https://github.com/nsirivolu27/RENO, rather than
opening a public issue.

Include reproduction steps and the impact you believe it has. Expect an initial
response within a few days; this is a small open-source project.

## What to know about Reno's current model

Reno is an open-source MVP. These are known, documented properties — not
vulnerabilities:

- **No authentication.** Ownership of server-side projects is an httpOnly
  `reno_visitor` cookie. Anyone with that cookie controls those projects.
- **Share links are unlisted secrets.** `/r/:shareId` is public to anyone
  holding the URL. Revoke with **Disable share**, which also deletes the
  server-side snapshot.
- **BYO API keys live in the browser** under `reno_key` (localStorage) and are
  sent to the server only to make that render. They are never persisted
  server-side or logged.
- **File-backed storage.** Server projects are JSON on disk under
  `RENO_DATA_DIR`. Protect that path; it contains client images.

Genuine issues we do want to hear about: key leakage into logs or responses,
cross-visitor data access, path traversal in the file store, SSRF via provider
calls, or XSS in shared/rendered project content.
