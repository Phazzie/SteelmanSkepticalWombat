# GRUDGES: things that failed silently or lied

Check this before every deploy.

1. **A 503 is a console error.** "No AI key" was first answered with HTTP 503. Nothing broke,
   but every keyless preview printed red "Failed to load resource" lines in the console, which
   fails the definition of done. Now a 200 `{closed:'off_duty'}` (drift 1 in `plan/DRIFT-LOG.md`).
2. **`tsc -b` with `noEmit` printed nothing.** Silence looked suspicious, so I planted a type
   error to prove the check really runs. It does (exit 1). Keep that habit.
3. **My own browser walk was wrong, not the app.** It expected a hand-over screen after the
   second visa, but the same person still holds the phone, so the app rightly skips it. A
   failing test is not automatically an app bug.
4. **Inherited from sibling apps (still true here):** GitHub Actions is billing-locked, so a
   PR shows only the Vercel check. Run `npm test`, `npm run build`, `npm run test:e2e` and
   `npm run freeze:check` yourself. This sandbox can't open `*.vercel.app`, so a preview is
   checked through Vercel's own deployment data, not a browser.
