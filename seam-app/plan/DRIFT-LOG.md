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
