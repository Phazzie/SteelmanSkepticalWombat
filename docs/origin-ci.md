# Origin CI

GitHub Actions is billing-locked on this account. CI moves to Cursor Origin, which runs GitHub-Actions-syntax workflows in `.depot/workflows/` on `depot-ubuntu-24.04` after the repo is detached from GitHub. `.github/workflows/` stays in the tree until that detach. Nothing here deletes the Pages workflow.

Depot does not import Actions secrets. Re-enter the values below in the Depot project before a real build should carry them. Until then, the verify build substitutes placeholders and still passes.

## Workflow map

| GitHub workflow | GitHub job | Depot equivalent | Commands |
| --- | --- | --- | --- |
| `.github/workflows/deploy-pages.yml` | `build` | `.depot/workflows/ci.yml` job `verify` | `npm ci`, `npm run lint`, `npm run type-check`, `npm run test:run`, `npm run build` |
| `.github/workflows/deploy-pages.yml` | `deploy` | none | GitHub Pages only. Dropped. |
| (none) | (none) | `.depot/workflows/ci.yml` job `ai-review` | `npm ci`, `node scripts/ai-review.mjs` on pull requests |

Triggers match the Pages workflow's intent: every pull request, and pushes to `main`.

`verify` runs the repo's real scripts. The Pages workflow only ran `npm run test:run` and `npm run build`. Lint and type-check were already scripts in `package.json`; Depot runs them too. Installs stay locked to `package-lock.json` via `npm ci`. Node is 22, the same major the Pages workflow and `Dockerfile` use.

The build step reads `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, and `VITE_GEMINI_API_KEY` from Depot secrets when they are set. When a secret is empty, the step exports a placeholder (`https://placeholder.supabase.co`, `placeholder-anon-key`, `placeholder-gemini-key`) so `npm run build` still produces a bundle. Those placeholders are not a hosting config. Vite inlines `VITE_*` at build time, so a production host (Cloud Run build args, or whatever replaces Pages) needs the real values at the build that ships.

`ai-review` runs only on `pull_request`. `scripts/ai-review.mjs` calls the xAI chat API (`grok-4.5`) with `XAI_API_KEY`, then posts with:

```bash
origin pr comment "$PR_NUMBER" --body-file "$FILE" --edit-last --create-if-none
```

If `XAI_API_KEY` is unset, or the `origin` CLI is missing, the script prints the reason (and the review text, once it has one) to the job log and exits 0. Log lines are flattened so a review cannot forge extra log records. An empty diff also exits 0. A failed xAI response fails the job.

The script does not search `PATH`. It runs `/usr/bin/git` and an `origin` binary at one of `/usr/local/bin/origin`, `/usr/bin/origin`, `/root/.local/bin/origin`, `/home/runner/.local/bin/origin`, or `/github/home/.local/bin/origin` (the last three are where `install.sh` places the CLI). The job copies a runner-provided `origin` onto `/usr/local/bin/origin` when it is only available somewhere else. The posted comment still uses the original line breaks.

## GitHub-only, dropped on detach

These exist only to publish `./dist` to GitHub Pages. Depot has no Pages environment, so they are not reimplemented:

- `permissions` `pages: write` and `id-token: write`
- `concurrency` group `pages`
- `actions/configure-pages@v4`
- `actions/upload-pages-artifact@v3` (path `./dist`)
- job `deploy`: environment `github-pages`, `actions/deploy-pages@v4`, `if: github.ref == 'refs/heads/main'`
- `VITE_BASE_PATH=/SteelmanSkepticalWombat/`, the project-site subpath Pages uses. Depot's build leaves `base` at `/` (`vite.config.ts` default) unless a host sets `VITE_BASE_PATH`.

`vercel.json` is a legacy static-build config. It is not a workflow, and this CI does not call the Vercel CLI or deploy through it.

## Secrets to re-enter in Depot

| Secret | Used by | Notes |
| --- | --- | --- |
| `VITE_SUPABASE_URL` | `verify` build | Same value as the Actions secret. Public project URL. |
| `VITE_SUPABASE_ANON_KEY` | `verify` build | Same value as the Actions secret. Public anon key. |
| `VITE_GEMINI_API_KEY` | `verify` build | Same value as the Actions secret. Still inlined into the client bundle (see `DEPLOYMENT.md`). |
| `XAI_API_KEY` | `ai-review` | New. Not an Actions secret today. Without it, review skips and the job stays green. |

`GITHUB_TOKEN` is not required. The review posts through the Origin CLI, which the Depot runner provides.
