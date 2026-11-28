# Drift log

Changes to the frozen plan, contracts or tests after the freeze.

## Drift 1 (2026-11-27): "off duty" is a 200, not a 503

- **Found by:** the browser walk. With no AI key, every 503 printed a red "Failed to load
  resource" line in the console, which breaks the definition of done ("no console errors"),
  and a preview without a key is a normal, expected state.
- **Changed:** `/api/wombat` answers `200 {closed:'off_duty'}` when `XAI_API_KEY` is missing.
  Contract `WombatClosedSchema` added; `off_duty` removed from the error enum.
- **Promises touched:** A2 and C2 now check the 200 shape. Neither was weakened: both still
  assert the exact status and body, and C2 still asserts the exact Finding.
- Real failures (bad request 400, rate limit 429, provider 502) stay non-2xx.

## Drift 2 (2026-11-28): steelman first, then your own side

- **Asked by:** Trizzy: "each player has to first enter the other person's side of the story
  and the other person has to agree before they get to enter their own."
- **Changed:** the phase order is now dispute → visa → stamp (repeat until both admitted) →
  declare → findings → inspection. Before, you declared your own side first and wrote theirs
  after reading the Wombat's findings, which let you steelman with a cheat sheet.
- **Promises touched:** R3 and R9 now point at the new next phase and each also asserts that an
  early DECLARE is refused (stronger, not weaker). R13 follows the new order. New R15: findings
  lead to inspection. The test helpers were reordered to match.
- **Pass-and-play kept:** there is still no two-device room, so the one-phone hand-over
  screens carry the privacy (they already did).
- **Follow-up (Codex review on #75):** crossings saved under the old order would get stuck
  (both admitted → declare, but both already declared). Fixed without a storage migration:
  findings with no admitted visas go to `visa`, and both admitted with both declarations go to
  `findings`. New promise R16 covers it.
