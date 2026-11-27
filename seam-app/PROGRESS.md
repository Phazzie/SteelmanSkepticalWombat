# PROGRESS: Steelman Skeptical Wombat rebuild ("Wombat Border Control")

## Morning report

**Status: NOT DONE by the definition, one line short.** Everything is built, tested and
deployed to a private preview, but the line *"deployed to a preview you opened after
deploying"* can only be half-checked: this sandbox can't open `*.vercel.app`, so I confirmed
the deploy through Vercel's own records, not by looking at it in a browser. Open the link
once and it's done.

- **World, one line:** a passport office for arguments: you only get into your partner's side
  once *they* stamp your visa ADMITTED (or DENIED, with their reason).
- **Preview (private, Vercel login):**
  https://wombat-border-control-git-claude-proje-f4c92e-phazzies-projects.vercel.app
- **PR:** https://github.com/Phazzie/SteelmanSkepticalWombat/pull/74 (merged to main)
- **Honest score: 7/10.** The core mechanic is genuinely better than any earlier version
  (denials with reasons make the steelman step real instead of a formality) and the world
  runs every screen. It loses points because the AI has never been called for real, it's one
  phone only, and the cover is handsome rather than shocking.
- **Still rough:** no xAI key on the new Vercel project yet, so the Wombat says "customs
  closed" everywhere until you add `XAI_API_KEY`; one-phone only; archive lives in one
  browser; no delete button; the old app still sits at the repo root (cutover not done).
- **Boldest bit:** the "Do you have anything to declare?" checklist ("Your mother's opinion",
  "A score you are keeping", "“I’m fine” (a lie)") and a full-screen red DENIED slammed over
  your attempt at empathy.

### Choices I made on my own (check these)

1. **Branch, not a new repo.** Seam-v2's default for a rebuild is a new branch with the app in
   `seam-app/`. Creating a repo was also off-limits for my tools. The old app is untouched.
2. **One phone instead of accounts and invite links.** Dropped Supabase, accounts and the
   invite flow. Couples mid-fight are usually in the same room; private steps hand the phone
   over behind a "Now serving" screen. Two-phone play is the biggest missing feature.
3. **xAI Grok instead of Gemini**, called from a server function so the key never reaches the
   browser (the old app's own roadmap called its exposed Gemini key "critical").
4. **Dropped three dead ends from the old app:** the memento image (costs money per image),
   the self-critique "sent to the human handler" (no handler existed), and "escalate to a human
   Wombat" (nobody on the other end).
5. **New Vercel project `wombat-border-control`**, root directory `seam-app`, with Vercel
   login required on previews *and* production, so merging made nothing public.
6. **Drift 1:** "no AI key" answers 200 instead of 503 so keyless previews have no console
   errors (logged in `plan/DRIFT-LOG.md`).
7. **No name change.** Name ideas: Say It Back, Port of Entry, Their Side Customs, Visa Denied,
   Steel Yourself. "Wombat Border Control" is just the world's working title.
8. Spent $0. No RunPod.

### What I tested by hand (real Chromium, laptop 1280px and iPhone 13)

Opened a crossing (and got refused with blank names); amended the dispute as the second person
and re-agreed as the first; private declarations with the hand-over screen between them; the
declaration checklist; the K-9 unit flagging "you always" and "I'm just saying" with no AI;
customs findings with the raw declarations kept sealed; visa with an X-ray before submitting;
the judge seeing the X-ray reading; a denial refused without a reason; a denial with a reason
and the rewrite; both admitted; reload mid-crossing resumes on the same page; inspection
report; two proposals and two read-backs; the wager; brainstorm clauses; treaty filed by one
and signed by the other; ratified treaty with tries counted and review date; the diplomatic
incident hotline; the archive listing the treaty. Then the whole walk again with the AI
"off duty". No console errors and no sideways scroll at either size. All automated in
`tests/e2e/walk.mjs`.

### Blockers / what I need from you

- Add `XAI_API_KEY` to the Vercel project **wombat-border-control** (Settings → Environment
  Variables), then redeploy, and try one crossing to see the Wombat's real voice.
- Open the preview link once (it needs your Vercel login).

## The process (seam-v2 by hand)

Only stage 1 of the plugin (the guard) exists, so each step was done manually:
survey (`plan/INVENTORY.md`) → world (`plan/WORLD.md`) → plan with numbered steps and 37
promises (`plan/PLAN.md`) → Zod contracts → skeletons → 31 tests, all failing against the
skeletons → freeze (`.seam/freeze.json`, `npm run freeze:check`) → build → browser walk →
three rounds of screenshot critique.

## Log

- 12:59 UTC: started. Surveyed SteelmanSkepticalWombat (main + 31 bot branches),
  SkepticalWombat-66 (v0 mockup), SkepticalWombatSteelman (actually a Fairytales story app),
  SkepticalWombat (empty). Read seam-v2 PROCESS.md.
- 13:03: inventory, world and plan written. Picked border control over hostage negotiation
  and a ventriloquist act.
- 13:05: contracts, skeletons, 31 failing tests, freeze.
- 13:08: core built, 31/31 pass.
- 13:12: screens built; browser walk found my own wrong test and the 503 console error
  (drift 1). Walk passes at both sizes and with AI off.
- Critique round 1: stamps too faint to read; nothing *happened* when you stamped; treaty seal
  covered a signature; "whereas" had doubled punctuation; on a phone the start form was three
  screens down. Fixed: stronger ink, full-screen stamp slam, seal moved, punctuation, cover
  button.
- Critique round 2: the slam stamp ran off the side of a phone; the brand wrapped to two
  lines on phones. Fixed. Added the visa-pages stamp collage on the treaty.
- 13:18: pushed, PR #74, Vercel project created (private), preview building.
- 13:22: SonarCloud quality gate failed (B security, D reliability). Fixed: the browser walk
  starts Vite with node and an absolute path instead of `npx` on PATH; the stamp-slam overlay
  is dismissed by a real button instead of a clickable div; the freeze script sorts with an
  explicit compare. Tests, build, walk and freeze check all pass again. Gate now passes.
- Merged PR #74 (squash) once tests, build, CI and the review thread were all clear. The app
  lives in `seam-app/` on main; the old app at the root is still untouched.
