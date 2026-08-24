import { AppUser, Problem } from '../types';
import { DataService, Unsubscribe } from './DataService';

/**
 * In-memory DataService for tests. No network, no Supabase project needed.
 * Implements the same seam as SupabaseDataService — a test renders
 * <AppProvider dataService={new FakeDataService()}> and exercises real
 * AppContext logic (role assignment, status transitions) against it.
 */
export class FakeDataService implements DataService {
    private users = new Map<string, AppUser>();
    private problems = new Map<string, Problem>();
    private authUserId: string | null = null;
    private authListeners = new Set<(userId: string | null) => void>();
    private userListeners = new Map<string, Set<(user: AppUser | null) => void>>();
    private problemsListeners = new Map<string, Set<(problems: Problem[]) => void>>();
    private nextId = 1;

    private emitUser(uid: string) {
        const user = this.users.get(uid) ?? null;
        this.userListeners.get(uid)?.forEach((cb) => cb(user));
    }

    private emitProblems(uid: string) {
        const list = [...this.problems.values()]
            .filter((p) => p.participants?.includes(uid))
            .sort((a, b) => new Date(b.createdAt as string).getTime() - new Date(a.createdAt as string).getTime());
        this.problemsListeners.get(uid)?.forEach((cb) => cb(list));
    }

    private emitProblemsToAllParticipants(problem: Problem) {
        (problem.participants ?? []).forEach((uid) => this.emitProblems(uid));
    }

    // --- test helpers, not part of DataService ---
    seedAuthenticatedUser(uid: string) {
        this.authUserId = uid;
        this.authListeners.forEach((cb) => cb(uid));
    }

    /** Simulates the backend clearing a user's partner link (e.g. the partner unlinked). */
    clearPartner(uid: string) {
        const user = this.users.get(uid);
        if (!user) return;
        this.users.set(uid, { ...user, partnerId: null });
        this.emitUser(uid);
    }

    /** Total live subscriptions across auth/user/problems listeners — used to assert nothing leaks. */
    get activeListenerCount(): number {
        let count = this.authListeners.size;
        for (const set of this.userListeners.values()) count += set.size;
        for (const set of this.problemsListeners.values()) count += set.size;
        return count;
    }

    // --- DataService ---
    onAuthChange(callback: (userId: string | null) => void): Unsubscribe {
        this.authListeners.add(callback);
        callback(this.authUserId);
        return () => this.authListeners.delete(callback);
    }

    async anonymousSignIn(): Promise<void> {
        this.seedAuthenticatedUser(`fake-user-${this.nextId++}`);
    }

    async createUserProfile(uid: string): Promise<void> {
        // Idempotent, matching SupabaseDataService: calling this for a uid
        // that already has a row must not clobber an existing partnerId.
        if (this.users.has(uid)) return;
        this.users.set(uid, { uid, name: `User ${uid.substring(0, 4)}`, partnerId: null });
        this.emitUser(uid);
    }

    async updateUserName(uid: string, newName: string): Promise<void> {
        const user = this.users.get(uid);
        if (!user) return;
        this.users.set(uid, { ...user, name: newName.trim().substring(0, 50) });
        this.emitUser(uid);
    }

    onUserSnapshot(uid: string, callback: (user: AppUser | null) => void): Unsubscribe {
        if (!this.userListeners.has(uid)) this.userListeners.set(uid, new Set());
        this.userListeners.get(uid)!.add(callback);
        callback(this.users.get(uid) ?? null);
        return () => this.userListeners.get(uid)?.delete(callback);
    }

    onPartnerSnapshot(partnerId: string, callback: (partner: AppUser | null) => void): Unsubscribe {
        return this.onUserSnapshot(partnerId, callback);
    }

    async acceptInvite(inviterId: string): Promise<void> {
        const inviteeId = this.authUserId;
        if (!inviteeId) throw new Error('Not authenticated');
        if (inviteeId === inviterId) throw new Error('Cannot invite yourself');
        const inviter = this.users.get(inviterId);
        if (!inviter) throw new Error('Inviter not found');
        if (inviter.partnerId) throw new Error('Inviter already has a partner');

        this.users.set(inviteeId, { uid: inviteeId, name: `User ${inviteeId.substring(0, 4)}`, partnerId: inviterId });
        this.users.set(inviterId, { ...inviter, partnerId: inviteeId });
        this.emitUser(inviteeId);
        this.emitUser(inviterId);
    }

    onProblemsSnapshot(uid: string, callback: (problems: Problem[]) => void): Unsubscribe {
        if (!this.problemsListeners.has(uid)) this.problemsListeners.set(uid, new Set());
        this.problemsListeners.get(uid)!.add(callback);
        this.emitProblems(uid);
        return () => this.problemsListeners.get(uid)?.delete(callback);
    }

    async createNewProblem(user: AppUser, partner: AppUser): Promise<Problem> {
        const id = `problem-${this.nextId++}`;
        const problem: Problem = {
            id,
            participants: [user.uid, partner.uid],
            roles: { [user.uid]: 'user1', [partner.uid]: 'user2' },
            status: 'agree_statement',
            problem_statement: '',
            user1_private_version: '',
            user2_private_version: '',
            user1_steelman: '',
            user2_steelman: '',
            ai_analysis: '',
            human_verdict: '',
            user1_proposed_solution: '',
            user2_proposed_solution: '',
            user1_solution_steelman: '',
            user2_solution_steelman: '',
            createdAt: new Date().toISOString(),
        };
        this.problems.set(id, problem);
        this.emitProblemsToAllParticipants(problem);
        return problem;
    }

    async updateProblem(problemId: string, data: Partial<Problem>): Promise<void> {
        const existing = this.problems.get(problemId);
        if (!existing) throw new Error(`No such problem: ${problemId}`);
        const updated = { ...existing, ...data };
        this.problems.set(problemId, updated);
        this.emitProblemsToAllParticipants(updated);
    }
}
