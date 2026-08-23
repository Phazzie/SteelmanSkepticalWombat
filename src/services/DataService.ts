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
    createUserProfile(uid: string): Promise<void>;
    updateUserName(uid: string, newName: string): Promise<void>;
    onUserSnapshot(uid: string, callback: (user: AppUser | null) => void): Unsubscribe;
    onPartnerSnapshot(partnerId: string, callback: (partner: AppUser | null) => void): Unsubscribe;

    /** Server-enforced invite acceptance — see accept_invite() in the migration. */
    acceptInvite(inviterId: string): Promise<void>;

    // --- Problems ---
    onProblemsSnapshot(uid: string, callback: (problems: Problem[]) => void): Unsubscribe;
    createNewProblem(user: AppUser, partner: AppUser): Promise<Problem>;
    updateProblem(problemId: string, data: Partial<Problem>): Promise<void>;
}
