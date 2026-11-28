# Plan (seam-v2 steps 2 and 4, by hand)

Stack: kept from the old app (React 18 + Vite + TypeScript), plus Zod and Vitest as seam-v2
requires. One Vercel serverless function holds the AI key.

## Seams

| # | Seam | From → to | Contract |
|---|---|---|---|
| S1 | Rules | screens → crossing state | `contracts/crossing.ts` (`Crossing`, `Action`) |
| S2 | Turn | crossing state → who holds the phone | `Side \| 'both'` from `whoIsUp` |
| S3 | Storage | app ↔ browser localStorage | `CrossingSchema`, versioned key `wombat-border:v1` |
| S4 | Wombat client | screens → `/api/wombat` | `contracts/wombat.ts` (`WombatRequest`, `Finding`) |
| S5 | Provider | `/api/wombat` → xAI chat completions | `https://api.x.ai/v1/chat/completions`, `XAI_API_KEY` |
| S6 | Sniffer | any text → flagged phrases | `SniffHit[]` |

Outside services: one, xAI. The probe step is skipped (no key in the build sandbox; logged in
PROGRESS.md). The client is built against the contract and the server is tested against a
recorded response shape from xAI's documented OpenAI-compatible format.

## Files, steps and promises

### `src/core/rules.ts` (S1, S2)
Steps:
1. `newCrossing(names, dispute, now)` trims both names and the dispute, rejects empty ones,
   and starts at phase `dispute` with only the creator (A) agreed.
2. `apply(c, action, now)` checks the action is allowed in the current phase for that side and
   throws `RuleError` with a plain-English reason otherwise. It never mutates its input.
3. Dispute: an edit sets the editor agreed and the other not agreed; both agreed → `visa`.
4. Declare: each side declares once; both → `findings`; findings → `inspection`.
5. Visa: a side may submit when its latest attempt is missing or denied; once both latest
   attempts are pending or admitted → `stamp`.
6. Stamp: a side judges the *other* side's pending attempt. Any latest denied → back to
   `visa`; both admitted → `declare` (steelman first: you state their side, and they accept it, before you state your own). A denial must carry a note.
7. Propose and readback: once each per side; both → next phase.
8. Treaty: an edit signs for the editor and unsigns the other; both signed → `ratified`
   with `reviewDue` 7 days later. Review only once `now >= reviewDue`, once per side.
9. `whoIsUp(c)` returns the side that must act privately next, or `both`.
Promises:
- R1 a new crossing starts in `dispute` with A agreed and B not.
- R2 editing the dispute un-agrees the other side.
- R3 both agreeing moves to `visa`; declaring your own side there is refused.
- R4 a side cannot declare twice.
- R5 both declarations move to `findings`.
- R6 a visa can't be stamped by its own writer.
- R7 a denial without a note is refused.
- R8 a denied visa sends the crossing back to `visa` and only the denied side may resubmit.
- R9 both admitted moves to `declare`; nobody declares while a visa is still out.
- R10 editing the treaty unsigns the other side; both signed → `ratified`, review due in 7 days.
- R11 review is refused before it is due.
- R12 `apply` does not mutate the crossing it was given.
- R13 `whoIsUp` names the side without a declaration, the side whose visa needs writing, and
  the judge of a pending visa.
- R14 text over 2000 characters is refused.
- R15 findings lead to `inspection`.

### `src/core/sniffer.ts` (S6)
Steps: 1. lower-case the text once; 2. find every listed phrase on word boundaries;
3. return hits in reading order with the phrase, its position and the dog's reason.
Promises: N1 "you always" is flagged with its index; N2 "always" alone is not;
N3 several hits come back in reading order; N4 clean text returns `[]`.

### `src/core/storage.ts` (S3)
Steps: 1. read the key, parse JSON; 2. validate each crossing with Zod, dropping and counting
bad ones; 3. `saveCrossing` upserts by id and writes back; 4. storage failures never throw to
the screen (private mode) but report `ok: false`.
Promises: T1 saved crossing loads back equal; T2 a corrupt entry is dropped and counted;
T3 junk JSON loads as empty with `dropped: 1`; T4 a throwing storage returns `ok: false`.

### `src/core/wombatClient.ts` (S4)
Steps: 1. POST the validated request; 2. on 200, validate and return `{status:'ok', text}`;
3. on 200 `{closed:'off_duty'}` return `{status:'closed', reason:'off_duty'}`; 4. on 429 return
`reason:'busy'`; on anything else (network, 5xx, bad JSON) `reason:'error'`. Never throws.
Promises: C1 ok text; C2 off duty; C3 network failure → error; C4 429 → busy.

### `api/wombat.ts` + `api/_lib/prompts.ts` (S5)
Steps: 1. parse and validate the body with `WombatRequestSchema` (400 on failure);
2. no `XAI_API_KEY` → 200 `{closed:'off_duty'}` (drift 1); 3. build the task prompt with the persona
lock-in first; 4. call xAI with a timeout; 5. return `{text}` trimmed, or 502 when the
provider fails. The key is never echoed or logged.
Promises: A1 invalid body → 400; A2 no key → 200 closed off_duty; A3 success → 200 with the
provider text; A4 provider 500 → 502 and the key is not in the body; A5 every prompt starts
with the persona lock-in and contains the user's text.

### Screens (`src/ui/*`)
Passport cover (home + archive), new crossing form, curtain, one page per phase, treaty,
incident hotline, lost-luggage error boundary. Promises are checked by the browser walk in
`tests/e2e/walk.mjs`: E1 a full crossing from cover to ratified treaty with a denial and a
rewrite; E2 customs closed (no key) still lets the crossing finish; E3 a reload resumes where
you were; E4 no console errors; E5 no sideways scroll at 390px.

## Build order
contracts → sniffer → rules → storage → wombat client → api → screens.
