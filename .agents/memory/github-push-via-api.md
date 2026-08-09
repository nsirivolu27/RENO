---
name: GitHub push via Git Data API
description: How to push commits to GitHub from this workspace when git push credentials are unavailable
---

The built-in `gitPush` callback fails with NO_CREDENTIALS in this workspace even with the GitHub connector attached — it uses a separate "github-source-control" credential store, not the connector OAuth token.

**Why:** The connector proxy (`connectors.proxy("github", ...)`) only exposes the REST API, never a raw token, so `git push` over HTTPS cannot authenticate.

**How to apply:** Push by replaying the local tree through the Git Data API: get remote branch head + tree (`?recursive=1`), diff blob shas against `git ls-tree -r HEAD` (shas match for identical content), POST differing blobs (base64), create tree with `base_tree`, create commit with remote head as parent, then PATCH the ref (`force: false` = fast-forward only). Remote commit hashes will differ from local ones, so the local branch and GitHub branch histories diverge — reconcile by fetching, not pushing again blindly. PR creation works via `POST /repos/{owner}/{repo}/pulls`.
