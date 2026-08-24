import { AppUser, Problem } from '../types';

export type Unsubscribe = () => void;

/**
 * The seam: everything AppContext needs from a backend, and nothing more.
 * AppContext depends only on this interface — never on Supabase, Firebase,
 * or any other concrete client. Swapping backends means writing a new class
 * that implements this interface and changing one line in the composition
 * root (src/index.tsx). Testing AppContext means passing FakeDataService
 * instead of SupabaseDataService — no network, no mocking framework.
 */
export interface DataService {
    // --- Auth ---
    onAuthChange(callback: (userId: string | null) => void): Unsubscribe;
    anonymousSignIn(): Promise<void>;

    // --- Users ---
    // createUserProfile/acceptInvite return the resulting profile directly,
    // rather than leaving the caller to wait for it to arrive via
    // onUserSnapshot's realtime channel. That channel's subscription can
    // still be establishing when the profile-creating write commits, in
    // which case the one-time creation event is missed entirely and the
    // caller would otherwise wait indefinitely (or until some unrelated
    // later change to the row happens to trigger a refetch).
    createUserProfile(uid: string): Promise<AppUser>;
    updateUserName(uid: string, newName: string): Promise<void>;
    onUserSnapshot(uid: string, callback: (user: AppUser | null) => void): Unsubscribe;
    onPartnerSnapshot(partnerId: string, callback: (partner: AppUser | null) => void): Unsubscribe;

    /** Server-enforced invite acceptance — see accept_invite() in the migration. Returns the invitee's resulting profile. */
    acceptInvite(inviterId: string): Promise<AppUser>;

    // --- Problems ---
    onProblemsSnapshot(uid: string, callback: (problems: Problem[]) => void): Unsubscribe;
    createNewProblem(user: AppUser, partner: AppUser): Promise<Problem>;
    updateProblem(problemId: string, data: Partial<Problem>): Promise<void>;
}
