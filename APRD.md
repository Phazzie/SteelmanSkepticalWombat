# Architecture & Product Requirements Document (APRD)
## The Skeptical Wombat — Roadmap to Production

**Last Updated:** April 15, 2026  
**Status:** Beta Ready (Security & Quality Issues Required Before Public Launch)  
**Total Estimated Work:** ~92.5 hours (3 weeks focused development)

---

## Executive Summary

**The Skeptical Wombat** is a React 18 + TypeScript web application designed to help partners navigate disagreements through AI-driven analysis using Google Gemini and Firebase.

**Current State:**
- ✅ Core features complete (10-phase workflow)
- ✅ All React components built and functional
- ✅ AI service integrated with fallback logic
- ✅ Multi-platform deployment configs ready
- 🟡 **Shipping Readiness: ~60%**
- 🚨 **Critical blockers: Security issues (API key exposure, missing Firebase RLS)**

**Recommendation:** Fix security issues (1 week) before beta. Full hardening & refactoring takes 2-3 weeks.

---

## 1. SECURITY ISSUES (Ship-Blocking) ⛔

These must be fixed before any users access the app.

### SEC-01: Gemini API Key Exposed in Client Bundle
**Severity:** 🔴 CRITICAL  
**File:** `src/services/ai.ts:29`  
**Problem:**
```typescript
const apiKey = import.meta.env.VITE_GEMINI_API_KEY;  // Exposed to browser
const response = await fetch(apiUrl + `?key=${apiKey}`);  // Sent in URL
```
**Impact:** Anyone can intercept API key, drain quota, incur charges  
**Solution:** Move to backend proxy  
**Effort:** 8 hours
- Create `/api/ai/*` endpoints on backend
- Backend calls Gemini, returns result
- Frontend calls backend instead
- Rotate API key immediately

---

### SEC-02: Firebase Config with API Key Embedded
**Severity:** 🔴 CRITICAL  
**File:** `src/services/firebase.ts:7`  
**Problem:**
```typescript
const firebaseConfig = JSON.parse(import.meta.env.VITE_FIREBASE_CONFIG || '{}');
// VITE_FIREBASE_CONFIG = {"apiKey": "AIzaSy...", ...}  // Public
```
**Impact:** Firebase API key is restricted to Android/iOS/Web, but still reduces security posture  
**Solution:** Use Firebase public config (no sensitive keys), rely on RLS  
**Effort:** 4 hours
- Remove `apiKey` from VITE_FIREBASE_CONFIG
- Use only public fields (projectId, authDomain, etc.)
- Verify RLS prevents unauthorized access

---

### SEC-03: Missing Firestore Security Rules ⛔⛔ HIGHEST PRIORITY
**Severity:** 🔴 CRITICAL  
**File:** Firebase Console (not in repo)  
**Problem:** Default Firebase rules allow authenticated reads/writes to everything
```
// Current (insecure):
match /{document=**} {
  allow read, write: if request.auth != null;
}
// Any authenticated user can:
// - Read all other users' problems and private versions
// - Modify other users' steelmans, solutions, etc.
```
**Solution:** Implement proper RLS
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /artifacts/{appId}/users/{uid} {
      allow read, write: if request.auth.uid == uid;
    }
    match /artifacts/{appId}/public/data/problems/{problemId} {
      allow read: if request.auth.uid in resource.data.participants;
      allow write: if request.auth.uid in resource.data.participants;
    }
  }
}
```
**Effort:** 3 hours
- Write rules
- Deploy to Firebase
- Test with unauthorized user

---

### SEC-04: Production Build Includes Source Maps
**Severity:** 🟡 HIGH  
**File:** `vite.config.ts:14`  
**Problem:**
```typescript
build: {
  sourcemap: true,  // ❌ Exposes full TypeScript source to DevTools
}
```
**Impact:** Users can read complete source code from Network tab  
**Solution:**
```typescript
build: {
  sourcemap: false,  // ✅ Only sourcemaps during dev
}
```
**Effort:** 0.5 hours

---

### SEC-05: Invite Link Has No Expiry
**Severity:** 🟡 MEDIUM  
**File:** `src/context/AppContext.tsx:86-90`  
**Problem:**
```typescript
const urlParams = new URLSearchParams(window.location.search);
const inviterId = urlParams.get('invite');
if (inviterId && inviterId !== currentUser.uid) {
    await linkPartners(inviterId, currentUser.uid);  // No expiry, no validation
}
```
**Impact:** Invite links never expire; old links can be reused maliciously  
**Solution:** Store invites in Firebase with 7-day expiry, validate before accepting  
**Effort:** 2 hours

---

### SEC-06: No Rate Limiting on AI API Calls
**Severity:** 🟡 HIGH  
**File:** `src/services/ai.ts` (entire file)  
**Problem:** Any user can call `getTranslation()`, `getAIAnalysis()`, etc. unlimited times  
**Impact:** Attacker can drain API quota, incur charges, cause DoS  
**Solution:** Implement rate limiting (e.g., 10 calls/minute per user)  
**Effort:** 4 hours

---

## 2. SOLID PRINCIPLE VIOLATIONS 📐

These don't block shipping but hurt maintainability and extensibility.

### SOL-01: Single Responsibility Principle Violation
**Severity:** 🟡 HIGH  
**File:** `src/context/AppContext.tsx` (270 lines)  
**Problem:** One context handles:
1. Authentication (signIn, customTokenSignIn, onAuthChange)
2. Partner linking (linkPartners, onPartnerSnapshot)
3. Problem CRUD (createNewProblem, updateProblem, onProblemsSnapshot)
4. AI orchestration (getAIAnalysis, getWager, getTranslation)
5. Notifications (setNotification)
6. Loading states (isAiLoading)

**Violation:** 6+ responsibilities in one file  
**Impact:** Hard to test, hard to reason about, tight coupling  
**Solution:** Split into 3-4 focused contexts
```
AuthContext          // signIn, customTokenSignIn, user, partner
ProblemsContext      // createNewProblem, updateProblem, problems
AIContext            // AI calls + loading states
UIContext            // Notifications
```
**Effort:** 6 hours

---

### SOL-02: Open/Closed Principle Violation (AI Providers)
**Severity:** 🟡 HIGH  
**File:** `src/services/ai.ts`  
**Problem:** To add a new AI provider (OpenAI, Claude, Groq), you must:
1. Modify `ai.ts` (add new provider logic)
2. Modify `AppContext.tsx` (import new provider)
3. Update `callGemini` function

**Violation:** Code is closed to extension, open to modification  
**Solution:** Extract AI provider interface
```typescript
interface AIProvider {
  translate(text: string): Promise<string>;
  analyze(problem: Problem): Promise<string>;
  // ...
}
class GeminiProvider implements AIProvider { }
class OpenAIProvider implements AIProvider { }
class ClaudeProvider implements AIProvider { }
```
**Effort:** 4 hours

---

### SOL-03: Open/Closed Principle Violation (Phases)
**Severity:** 🟡 MEDIUM  
**File:** `src/App.tsx:86-122`  
**Problem:** Adding a new workflow phase requires editing a 36-line switch statement in App.tsx
**Solution:** Registry pattern or dynamic phase loading  
**Effort:** 2 hours

---

### SOL-04: Interface Segregation Principle Violation
**Severity:** 🟡 MEDIUM  
**File:** `src/context/AppContext.tsx:18-45`  
**Problem:** `AppContextType` exposes 15+ methods; a component that only needs `handleBSMeter` must import the entire interface
```typescript
interface AppContextType {
  user: any;
  partner: any;
  problems: any[];
  // ... 13 more properties
  handleBSMeter: (text: string) => void;  // Only this is needed
}
```
**Solution:** Split into focused interfaces
```typescript
interface AuthContext { user, partner, signIn }
interface ProblemsContext { problems, createProblem, updateProblem }
interface AIContext { handleBSMeter, handleEmergencyWombat }
```
**Effort:** 3 hours

---

### SOL-05: Dependency Inversion Principle Violation (Firebase)
**Severity:** 🟡 HIGH  
**File:** `src/context/AppContext.tsx:2-15`  
**Problem:** AppContext directly imports Firebase functions
```typescript
import {
    onAuthChange, anonymousSignIn, customTokenSignIn,
    onUserSnapshot, onPartnerSnapshot, linkPartners,
    // ...
} from '../services/firebase';
```
**Impact:** Tightly coupled; hard to replace Firebase with another backend  
**Solution:** Dependency injection or repository pattern
```typescript
const dataService = new FirebaseDataService();
// or swap to: new PostgresDataService()
```
**Effort:** 5 hours

---

### SOL-06: Dependency Inversion Principle Violation (AI)
**Severity:** 🟡 MEDIUM  
**File:** `src/services/ai.ts:27-79`  
**Problem:** `callGemini` directly calls Gemini REST API; no abstraction  
**Solution:** Inject AI provider at app startup  
**Effort:** 3 hours

---

## 3. DRY (Don't Repeat Yourself) VIOLATIONS 🔁

These cause bugs and make changes tedious.

### DRY-01: Role/Partner Role Calculation Repeated
**Severity:** 🟡 MEDIUM  
**File:** `src/context/AppContext.tsx:138,155,165,181,192,203`  
**Problem:**
```typescript
// Handler 1
const myRole = currentProblem.roles[user.uid];
const partnerRole = myRole === 'user1' ? 'user2' : 'user1';

// Handler 2
const myRole = currentProblem.roles[user.uid];
const partnerRole = myRole === 'user1' ? 'user2' : 'user1';

// ... repeated 6+ times
```
**Solution:** Extract custom hook
```typescript
const useProblemRole = (problem: Problem, userId: string) => {
  const myRole = problem.roles[userId];
  const partnerRole = myRole === 'user1' ? 'user2' : 'user1';
  return { myRole, partnerRole };
};
```
**Effort:** 2 hours

---

### DRY-02: Dynamic Field Access Pattern Repeated
**Severity:** 🟡 MEDIUM  
**File:** All 11 phase components  
**Problem:**
```typescript
// PhasePrivateVersion
const myValue = problem[`${myRole}_private_version`];
const partnerValue = problem[`${partnerRole}_private_version`];

// PhaseSteelman
const myValue = problem[`${myRole}_steelman`];
const partnerValue = problem[`${partnerRole}_steelman`];

// ... repeated everywhere
```
**Solution:** Helper function
```typescript
function getField(problem: Problem, field: string, role: Role): string {
  return problem[`${role}_${field}`];
}
getField(problem, 'steelman', myRole);
```
**Effort:** 3 hours

---

### DRY-03: Button Tailwind Classes Repeated
**Severity:** 🟢 LOW  
**File:** Multiple components  
**Problem:**
```typescript
// App.tsx
<button className="bg-lime-500 hover:bg-lime-600 text-gray-900 font-bold py-2 px-4 rounded-lg">

// PhaseAgreeStatement
<button className="bg-lime-500 hover:bg-lime-600 text-gray-900 font-bold py-2 px-4 rounded-lg">

// PhaseSteelman
<button className="bg-lime-500 hover:bg-lime-600 text-gray-900 font-bold py-2 px-4 rounded-lg">
```
**Solution:** Extract to `styles.css` or Tailwind component
```css
.btn-primary { @apply bg-lime-500 hover:bg-lime-600 text-gray-900 font-bold py-2 px-4 rounded-lg; }
```
**Effort:** 1 hour

---

### DRY-04: AI Loading State Check Pattern
**Severity:** 🟡 MEDIUM  
**File:** 4+ phase components  
**Problem:**
```typescript
{isAiLoading === 'translation' && <p>Wombat is checking...</p>}
{isAiLoading === 'verdict' && <p>Wombat is thinking...</p>}
{isAiLoading === 'wager' && <p>Wombat is betting...</p>}
```
**Solution:** Component wrapper
```typescript
<AILoadingIndicator 
  isLoading={isAiLoading === 'translation'} 
  message="Wombat is checking for subtext..."
/>
```
**Effort:** 2 hours

---

### DRY-05: Partner Submission Status UI
**Severity:** 🟢 LOW  
**File:** 3+ phase components  
**Problem:**
```typescript
{partnerHasSubmitted ? "✅ Partner has submitted." : "⏳ Waiting for partner..."}
```
**Solution:** Extracted component  
**Effort:** 1.5 hours

---

### DRY-06: Phase Component Boilerplate
**Severity:** 🟡 MEDIUM  
**File:** All 11 phase components (`src/components/phases/`)  
**Problem:** Every phase component duplicates:
- Props structure (`{ problem, onSave, onSubmit, myRole, isAiLoading }`)
- Role derivation (`const partnerRole = myRole === 'user1' ? 'user2' : 'user1'`)
- Error boundary setup
- Loading state handling

**Solution:** Custom hook + base component pattern  
**Effort:** 2 hours

---

## 4. ARCHITECTURE ISSUES 🏗️

### ARCH-01: State Machine Not Used
**Severity:** 🟡 HIGH  
**File:** `src/state/problemMachine.ts` vs `src/context/AppContext.tsx`  
**Problem:**
- `problemMachine.ts` defines a typed reducer with 12 action types
- `AppContext.tsx` ignores it and directly calls `updateProblem()`
- State transitions are implicit, scattered across handlers

**Solution:** Use the reducer
```typescript
const [problem, dispatch] = useReducer(problemStateReducer, initialProblem);
dispatch({ type: 'SUBMIT_PRIVATE_VERSION', payload: { text, translation } });
```
**Effort:** 4 hours

---

### ARCH-02: LangChain Partial Integration
**Severity:** 🟡 MEDIUM  
**File:** `src/services/ai.ts:10-18`  
**Problem:**
```typescript
const { ChatGoogleGenerativeAI } = require("@langchain/google-genai");  // CommonJS in ESM
useLangChain = true;  // Flag set but incomplete implementation
// Uses ~100KB of LangChain but only for `invoke()` wrapper
```
**Impact:** Dead code, bundle bloat, ESM/CJS compatibility issues  
**Solution:** Either (A) remove LangChain, or (B) fully integrate for chains/memory  
**Effort:** 1 hour (remove) or 8 hours (integrate properly)

---

### ARCH-03: Type Safety (Too Many `any` Types)
**Severity:** 🟡 HIGH  
**File:** `src/context/AppContext.tsx:19-21,50-56`  
**Problem:**
```typescript
const [user, setUser] = useState<any>(null);
const [partner, setPartner] = useState<any>(null);
const [problems, setProblems] = useState<any[]>([]);
const [currentProblem, setCurrentProblem] = useState<any>(null);
```
**Impact:** Runtime errors instead of compile-time errors  
**Solution:** Define interfaces
```typescript
interface User { uid: string; name: string; partnerId?: string; }
interface Problem { id: string; status: string; /* ... */ }
```
**Effort:** 3 hours

---

### ARCH-04: No Error Boundaries ⚠️
**Severity:** 🟡 HIGH  
**File:** `src/App.tsx`  
**Problem:** If any phase component crashes, the entire app goes down  
**Solution:** Wrap phase rendering in `<ErrorBoundary>`
```typescript
<ErrorBoundary fallback={<ErrorPage />}>
  {renderPhase()}
</ErrorBoundary>
```
**Effort:** 2 hours

---

### ARCH-05: BS Meter Analysis Not Persisted
**Severity:** 🟡 MEDIUM  
**File:** `src/context/AppContext.tsx:251-255`  
**Problem:**
```typescript
const result = await getBSAnalysis(text);
setNotification({ message: result });  // Shown then lost forever
```
**Solution:** Save to Firestore
```typescript
await updateProblem(problemId, { 
  [`${myRole}_manipulation_analysis`]: result 
});
```
**Effort:** 2 hours

---

### ARCH-06: `manipulation_analysis` Fields Never Written
**Severity:** 🟢 LOW  
**File:** `src/types/index.ts:28-29`, `src/services/firebase.ts:77-78`  
**Problem:** Schema includes `user1_manipulation_analysis`, `user2_manipulation_analysis` but code never writes to them  
**Solution:** Either delete the fields or wire them up (see ARCH-05)  
**Effort:** 1 hour

---

### ARCH-07: Stub Functions Wired Into UI
**Severity:** 🟡 MEDIUM  
**File:** `src/App.tsx:103,115,118`  
**Problem:**
```typescript
onEscalate={() => {}}  // Does nothing
onBrainstorm={() => {}}  // Does nothing
onGenerateImage={() => {}}  // Does nothing
onCritique={() => {}}  // Does nothing
handleMemento: async () => {  // Placeholder
    setNotification({ message: "Memento feature coming soon!" });
}
```
**Impact:** Confusing UX, dead buttons  
**Solution:** Either implement or remove from UI  
**Effort:** Variable (depends on what you want)

---

### ARCH-08: Font Import in JSX
**Severity:** 🟢 LOW  
**File:** `src/App.tsx:134-139`  
**Problem:**
```typescript
<style>
  @import url('https://fonts.googleapis.com/css2?family=...');
</style>
```
**Solution:** Move to `src/styles.css` or `index.html`  
**Effort:** 0.5 hours

---

### ARCH-09: No Monitoring or Error Tracking
**Severity:** 🟡 HIGH  
**File:** Global (not implemented)  
**Problem:** If users hit bugs in production, you won't know  
**Solution:** Add error tracking (Sentry, Rollbar, or custom logging)
```typescript
try {
  // code
} catch (error) {
  logError(error, { userId, problemId });  // Send to monitoring service
}
```
**Effort:** 4 hours

---

## 5. TEST COVERAGE GAPS 🧪

### TEST-01: AI Service Tests Make Real API Calls
**Severity:** 🟡 HIGH  
**File:** `src/services/ai.test.ts`  
**Problem:**
```typescript
test('getTranslation should return a translation', async () => {
  const result = await getTranslation(mockText);
  expect(typeof result).toBe('string');  // Fails without Gemini credentials
});
```
**Solution:** Mock the Gemini API
```typescript
vi.mock('../services/ai', () => ({
  callGemini: vi.fn().mockResolvedValue('mocked response')
}));
```
**Effort:** 2 hours

---

### TEST-02: Zero Component Tests
**Severity:** 🟡 HIGH  
**File:** `src/components/phases/`  
**Problem:** Not a single phase component is tested  
**Solution:** Add React Testing Library tests for each phase
```typescript
test('PhasePrivateVersion renders textarea', () => {
  render(<PhasePrivateVersion problem={mockProblem} />);
  expect(screen.getByPlaceholderText('From my point of view...')).toBeInTheDocument();
});
```
**Effort:** 8 hours

---

### TEST-03: No Integration Test for Full Workflow
**Severity:** 🟡 HIGH  
**File:** N/A (doesn't exist)  
**Problem:** No test verifies the entire 10-phase workflow works  
**Solution:** E2E or integration test that simulates both users  
**Effort:** 6 hours

---

### TEST-04: No Test for Partner Linking / Invite Flow
**Severity:** 🟡 MEDIUM  
**File:** N/A  
**Problem:** Invite flow is untested  
**Solution:** Test invite generation, expiry, and linking  
**Effort:** 3 hours

---

## 6. PRIORITIZED ACTION PLAN 🚀

### Phase 1: Ship-Blockers (1 week, ~22 hours) 🚨
**Goal:** Make the app safe to deploy to beta testers

1. **SEC-03** (3h): Add Firestore security rules
2. **SEC-01 + SEC-02** (8h): Move API keys to backend proxy
3. **SEC-04** (0.5h): Disable sourcemaps in production
4. **ARCH-04** (2h): Add error boundaries
5. **SEC-05** (2h): Add invite link expiry
6. **SEC-06** (4h): Implement rate limiting

**Dependencies:** None (can start immediately)  
**Testing:** Manual smoke test of full workflow  
**Result:** App is secure for private beta

---

### Phase 2: Quality & Correctness (1-2 weeks, ~25 hours) ⚙️
**Goal:** Make the codebase maintainable and extensible

1. **ARCH-01** (4h): Wire state machine reducer into AppContext
2. **SOL-01** (6h): Split AppContext into 3-4 focused contexts
3. **DRY-01 + DRY-02** (5h): Extract `useProblemRole` hook + field helpers
4. **ARCH-02** (1h): Remove LangChain or properly integrate
5. **ARCH-03** (3h): Replace `any` types with proper interfaces
6. **ARCH-05 + ARCH-06** (2h): Persist BS Meter and manipulation analysis
7. **DRY-03 + DRY-04** (3h): Extract shared UI components

**Dependencies:** Phase 1 complete  
**Testing:** Run type-check, lint, existing tests pass  
**Result:** Codebase is cleaner, type-safe, easier to extend

---

### Phase 3: Hardening (2 weeks, ~30 hours) 💪
**Goal:** Production-grade reliability and test coverage

1. **SOL-02** (4h): Extract AI provider interface
2. **SOL-04** (3h): Split AppContextType into focused interfaces
3. **TEST-01 → TEST-04** (19h): Add mocked tests + integration tests
4. **ARCH-09** (4h): Add error tracking (Sentry or similar)

**Dependencies:** Phase 2 complete  
**Testing:** Achieve >80% code coverage  
**Result:** App is production-ready with monitoring

---

## 7. EFFORT SUMMARY 📊

| Category | Issues | Total Hours |
|----------|--------|------------|
| **Security** | 6 | 21.5h |
| **SOLID Principles** | 6 | 23h |
| **DRY Violations** | 6 | 11.5h |
| **Architecture** | 9 | 17.5h |
| **Testing** | 4 | 19h |
| **TOTAL** | **31** | **92.5h** |

**Timeline:**
- Phase 1 (Ship-blockers): 1 week (focused dev)
- Phase 2 (Quality): 1-2 weeks
- Phase 3 (Hardening): 2 weeks
- **Total: 4-7 weeks to production-ready**

---

## 8. SUCCESS CRITERIA ✅

### Beta Readiness (Week 1)
- [ ] Firestore RLS deployed and tested
- [ ] API keys moved to backend
- [ ] Sourcemaps disabled
- [ ] Error boundaries in place
- [ ] Full workflow tested manually with 2 test users
- [ ] Deploy to staging, verify works end-to-end

### Production Readiness (Week 4)
- [ ] All Phase 1-2 work complete
- [ ] Type checking passes (`npm run type-check`)
- [ ] Linting passes (`npm run lint`)
- [ ] Existing tests pass + Phase 1 security tests added
- [ ] Deploy to production, monitor for 48h

### Scale-Ready (Week 7)
- [ ] >80% test coverage
- [ ] All Phase 3 refactoring complete
- [ ] Error tracking (Sentry) deployed
- [ ] Rate limiting enforced
- [ ] Ready for public launch

---

## 9. Risk Register 🚨

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|-----------|
| Firestore RLS breaks app | High | Medium | Test RLS in staging first |
| Backend API becomes bottleneck | High | Low | Use caching, CDN |
| Users hit undiscovered bugs during beta | Medium | High | Collect error reports from Sentry |
| Refactoring introduces new bugs | Medium | Medium | Keep tests passing, review PRs carefully |
| API quota exceeded under load | Medium | Low | Implement rate limiting, request higher quota |

---

## 10. Next Steps 🎯

**This Week:**
1. Read this APRD in full
2. Prioritize Phase 1 work
3. Create Firebase RLS (SEC-03) — start here
4. Begin backend API setup (SEC-01 + SEC-02)

**By End of Week 1:**
- [ ] All security issues fixed
- [ ] Deploy to staging
- [ ] Test with 2-3 beta users

**By End of Week 4:**
- [ ] Phase 2 refactoring complete
- [ ] Type safety and DRY improvements in place
- [ ] Ready for broader beta launch

---

**Questions?** Reference this APRD when planning sprints. Update it as issues are resolved.
