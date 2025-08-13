# Merge & Consolidation Checklist

Persona: **Release Conductor Wombat (RCW)**  
Role: Orchestrates safe, ordered merging of legacy / divergent branches while preserving history, minimizing conflict churn, and enforcing quality gates (lint, typecheck, smoke run).  
Voice (internal): Terse, status‑driven.  
Decision Principles: (1) Preserve context (no squashing unless noise), (2) Isolate risk late, (3) Never advance on red CI, (4) Small conflict surface per step, (5) Delete dead branches promptly after verification.

---
## Legend
`[ ]` = pending  |  `[~]` = in progress  |  `[x]` = complete  |  `(opt)` optional

---
## 0. Inventory & Preparation
[ ] Pull latest `main` and ensure clean working tree (`git status` empty).  
[ ] Run branch divergence report: `npm run branch:report > branch-report.txt` (archive artifact).  
[ ] Identify duplicate / superseded branches (earlier analysis: 
    - `fix-code-review-feedback` vs `fix/code-review-feedback`
    - `refactor-phase-components` vs `refactor-phase-components-1`
  )  
[ ] Confirm obsolete (ahead=0) branches truly have no unique commits (e.g. `git log <branch> ^main`).  
[ ] Tag baseline: `git tag pre-merge-baseline-YYYYMMDD` & push tag.  
[ ] Enable conflict learning (local): `git config rerere.enabled true`.

---
## 1. Quality Gates (applied at EVERY merge)
[ ] Lint + typecheck: `npm run check` (must be green).  
[ ] Minimal build / dev start (if applicable) & smoke navigate core UI.  
[ ] Commit & push merge result only after green.  
[ ] Append entry to `MERGE_LOG.md` (script auto-updates when using `npm run rcw:merge <branch>`).  
[ ] If conflict resolution >15 min, checkpoint partial notes in `MERGE_NOTES.md` (opt).

---
## 2. Duplicate Branch Consolidation
[ ] Checkout primary duplicate (pick canonical naming: prefer hyphen style over slash if inconsistent).  
[ ] Diff secondary: `git diff secondaryBranch..primaryBranch` – cherry‑pick missing commits (oldest first).  
[ ] Force push updated canonical branch if rebasing done.  
[ ] Mark secondary for deletion post‑merge.

---
## 3. Quick Win Merges (Low Conflict, High Signal)
Target order (adjust if divergence metrics differ):
1. `[ ]` `refactor/monolith-to-modular` (already largely integrated logically; expect minimal conflict now that types are clean).  
2. `[ ]` Consolidated code‑review feedback branch.  
3. `[ ]` Minor UI polish branches (`ui-improvements`, etc.).

Process per branch:
```
git checkout main
git pull --ff-only
git merge --no-ff <branch>
# Resolve conflicts (editor) → run: npm run check
git commit (if needed) && git push
# OR use helper:
npm run rcw:merge -- <branch>
```
If conflicts dense & mostly formatting: consider single reformat of conflicting files AFTER merging to avoid rebasing churn.

---
## 4. Structural/Refactor Branches
[ ] Merge `refactor-phase-components` (post duplicate consolidation)  
[ ] Re-run full checks.  
[ ] Manual UI regression spot check (phase navigation, context initialization, AI calls stubbed/failing gracefully).

---
## 5. Feature / Behavior Branches (Medium Risk)
[ ] Merge logic changes (e.g., wager prompt fixes).  
[ ] For each: Add a short note to `CHANGELOG.md` (create if absent) summarizing user‑visible effect.

---
## 6. Experimental / High Risk Last
[ ] Update experimental branch (`feat/advanced-langchain-impl`) with latest `main` via merge (not rebase to keep prior review context).  
[ ] Resolve conflicts, ensure feature flag / guarded code paths (add if missing).  
[ ] Merge into `main` only after green & optional manual acceptance test.

---
## 7. Post-Merge Cleanup
[ ] Delete merged branches (locally & remote): `git branch -d <b>` then `git push origin --delete <b>`.  
[ ] Delete duplicate secondary branches.  
[ ] Prune tracking refs: `git fetch --prune`.  
[ ] Run `npm run branch:report` expecting only active future branches.  
[ ] Tag milestone: `git tag post-consolidation-YYYYMMDD` & push.

---
## 8. Verification & Monitoring
[ ] Observe CI on `main` for all merged commits (no red builds).  
[ ] If production deploy pipeline exists, verify metrics / error logs stable.  
[ ] Draft retrospective note: what conflicts recurred → candidate for earlier abstraction / shared component extraction.

---
## 9. Rollback / Contingency Plan
If a merged branch introduces regression:  
1. `git revert -m 1 <merge_commit_sha>` (preserve history)  
2. Hotfix branch off `main` for targeted correction if revert not feasible.  
3. Re‑cherry‑pick individual safe commits from reverted merge as needed.

---
## 10. Optional Enhancements (After Consolidation)
(opt) Introduce lightweight unit tests for context reducers / handlers.  
(opt) Add storybook or visual regression for phase components.  
(opt) Enable semantic PR titles (conventional commits) & release automation.  
(opt) Add pre-push hook running `npm run check`.

---
## Status Journal (append entries chronologically)
Date | Action | Notes
-----|--------|------
YYYY-MM-DD | Initialized checklist | Baseline lint clean
2025-08-13 | Repo hygiene | Added root .gitignore to ignore node_modules and common artifacts; verified node_modules no longer shows in git status

---
## Inputs Needed (If Any)
If branch list changes or new duplicates appear, update Section 2 & 3 before proceeding.

---
## Using This File
RCW persona updates statuses, commits changes to this file alongside merge commits to provide an auditable narrative without polluting commit bodies.
