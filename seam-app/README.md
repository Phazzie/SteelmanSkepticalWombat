# Wombat Border Control

*A Skeptical Wombat app. Working title; the name is still open (ideas in `plan/INVENTORY.md`).*

A passport office for arguments. Two people in the same room, one phone. You don't get into
the other person's side of the argument until you've stated it well enough that **they**
stamp your visa.

1. **Statement of dispute:** agree on one boring sentence. Change a word and the other person
   has to agree again.
2. **Customs declaration:** each of you writes your side privately (the phone is handed over
   behind a "now serving" screen). The Wombat says what customs really found in the bag.
3. **Visa application:** write the *other* person's side as their best lawyer would. X-ray it
   first if you like: the Wombat checks it for smuggled complaints.
4. **Entry decision:** they stamp it ADMITTED, or DENIED with a reason, and you try again.
5. **Inspection report, treaty proposals, read-backs and the officer's wager.**
6. **Treaty:** one text, two signatures; editing voids the other signature. Seven days later,
   each of you says whether it held.

Always on: the **K-9 unit** flags argument-starting phrases ("you always", "I'm just
saying"…) as you type, with no AI needed, and the **Diplomatic incident** button gets you
five minutes of advice.

## Run it

```bash
cd seam-app
npm install
npm run dev            # http://localhost:5173 (the AI is not served by Vite: the Wombat shows "customs closed")
npm test               # 31 unit tests, labelled by promise (R1-R14, N1-N4, T1-T4, C1-C4, A1-A5)
npm run build          # type check + production build
npm run test:e2e       # after build: a full crossing in a real browser at laptop and phone size, and with the AI off
npm run freeze:check   # proves the plan, contracts and tests haven't changed since the freeze
```

To use the AI, deploy to Vercel (root directory `seam-app`) with `XAI_API_KEY` set. Optional
`XAI_MODEL` (default `grok-4-1-fast-reasoning`). The key lives only in `api/wombat.ts` on the
server. With no key the app still works end to end: the Wombat's parts say "customs closed".

## How it was built

Seam-v2, by hand (only the plugin's guard stage exists yet): survey → plan → contracts →
skeletons → tests that all failed → freeze → build. See `plan/` (inventory, world, plan, drift
log) and `.seam/freeze.json`. The old app in the repo root is untouched.

## What's still rough

- **One phone only.** Two people on two phones isn't supported (the old version's Supabase
  invite flow was dropped). Fine for a fight in the kitchen, not for one by text.
- **The AI has never been called for real** from this build: there was no xAI key in the
  build sandbox. The request and response shape follow xAI's OpenAI-compatible API and are
  unit-tested with a stubbed provider. First real run should be checked.
- **Saved in this browser only.** Clearing site data loses the archive. No delete button yet.
- The seven-day review only shows if you reopen the same browser after a week.
- The rate limit (20 AI calls per minute per IP) is per server instance, not global.
- The cutover (swapping this in for the old app at the repo root) hasn't been done.
