# Inventory: every Steelman / Skeptical Wombat version, and what this rebuild keeps

Seam-v2 step 1 (survey), done by hand because only the plugin's guard stage exists.
Surveyed 2026-11-27 from the code, not the docs.

## The versions

| Repo | What it is | State |
|---|---|---|
| `SteelmanSkepticalWombat` (main, root of this repo) | React 18 + Vite. 11-phase two-partner conflict flow, Supabase sync, Gemini prompts, invite links, Emergency Wombat, BS Meter, Wager, Brainstorm, 7-day post-mortem, memento image, self-critique, "escalate to human". | Builds, 13 tests. Never deployed. Gemini key ships to the browser (its own roadmap calls this critical). Memento, critique and "human verdict" lead nowhere. |
| `SteelmanSkepticalWombat` branches (31) | Bot branches: LangChain experiment, CodeQL, review-feedback fixes, Supabase migration, Depot CI. | Nothing product-level that main lacks. |
| `SkepticalWombat-66` | v0.dev Next.js mockup, 5 phases. | All fake data. Best copy of any version (the wombat's lines), plus **statement locking** ("no more 'that's not what I meant'") and **reject / modify** loops instead of only "agree". |
| `SkepticalWombatSteelman` | Despite the name, an Angular "Spicy Story Generator". | Not this app. Belongs to Fairytales. |
| `SkepticalWombat` | Empty repo. | Nothing. |
| `SkepticalWombatTellsYourTale`, `skeptical-wombat`, `...Postcard`, `...Passive-Aggresive-Tarot` | Other apps under the Wombat brand. | Separate ideas, out of scope. |

## Core flow kept (from main), with the v0 upgrades

1. **Agree on the dispute.** One neutral sentence both people accept. *Upgrade from v0:* either person can amend it, and an amendment cancels the other person's agreement, so nobody agrees to words they didn't see.
2. **Private declaration.** Each person writes their side privately. The Wombat "translates" it into the raw demand underneath.
3. **Customs findings.** Each sees their own declaration plus both translations; the partner's raw text stays hidden.
4. **Steelman.** Each argues the *other* person's side as their best lawyer would.
5. **The partner judges it.** *Upgrade from v0:* the partner can deny it with a note on what was missed, and the writer must try again. Main only had "approve", which made the step a formality.
6. **BS Meter.** Before locking, the Wombat checks whether the steelman is real or a complaint in disguise.
7. **Locking.** *From v0:* submitted text is locked and stays on the record.
8. **The Wombat's verdict** on the real disconnect, plus one unconventional fix.
9. **Propose solutions**, one each.
10. **Explain their solution** back to them.
11. **The Wager.** The Wombat bets on which proposal survives.
12. **Final agreement**, with a Brainstorm button when stuck. Both must sign.
13. **Resolved**, with a check-in 7 days later: holding or fell apart.
14. **Emergency Wombat** panic button at any time.

## New in the rebuild

- **The sniffer dog**: a free, instant, offline check that flags argument-starting phrases ("you always", "you never", "I'm just saying", "no offense, but"...) in anything you write. It works with no AI key at all.
- **One phone, two people.** Couples are usually in the same room mid-fight. Private steps hand the phone over behind a privacy screen, so no accounts, database or invite links are needed.
- **The AI key lives on the server** (`/api/wombat`), never in the browser. Provider is xAI Grok, the same as your other apps.
- **Honest outage.** With no key, the Wombat's AI parts say plainly that the Wombat is off duty and the human steps still work. No fake answers.
- **Saved on the device**: past disputes are kept in the browser and can be reopened.

## Dropped on purpose (dead ends in main)

- **Memento image**: costs money per image and added nothing to the fight.
- **Self-critique "sent to the human handler"**: there was no handler; it went nowhere.
- **Escalate to a human Wombat**: same, nobody on the other end.
- **Supabase accounts and invite links**: replaced by one-phone play. Two-phone play is listed as rough in the README.

## Name ideas (nothing renamed)

1. **Say It Back**: the whole method in three words.
2. **Port of Entry**: matches the world below.
3. **Their Side Customs**
4. **Visa Denied**: the one that could embarrass you.
5. **Steel Yourself**
