import { SupabaseClient } from '@supabase/supabase-js';
import { AppUser, Problem } from '../types';
import { DataService, Unsubscribe } from './DataService';

const mapUserRow = (row: any): AppUser => ({
    uid: row.id,
    name: row.name,
    partnerId: row.partner_id,
});

const mapProblemRow = (row: any): Problem => {
    const { created_at, ...rest } = row;
    return { ...rest, createdAt: created_at } as Problem;
};

/**
 * The only class in the app that imports @supabase/supabase-js.
 * Implements the DataService seam; AppContext never sees this file directly.
 */
export class SupabaseDataService implements DataService {
    constructor(private client: SupabaseClient) {}

    onAuthChange(callback: (userId: string | null) => void): Unsubscribe {
        // Supabase fires this on token refreshes and other events for the
        // same session, not just actual sign-in/sign-out. AppContext tears
        // down and rebuilds its user/partner subscriptions every time this
        // callback fires, so forwarding every event caused a resubscribe
        // cycle roughly every token refresh. Only forward genuine identity
        // changes.
        let lastUserId: string | null | undefined;
        const { data } = this.client.auth.onAuthStateChange((_event, session) => {
            const userId = session?.user?.id ?? null;
            if (userId === lastUserId) return;
            lastUserId = userId;
            callback(userId);
        });
        return () => data.subscription.unsubscribe();
    }

    async anonymousSignIn(): Promise<void> {
        const { error } = await this.client.auth.signInAnonymously();
        if (error) throw error;
    }

    async createUserProfile(uid: string): Promise<void> {
        // Idempotent: multi-tab sign-in, a retried auth event, or the
        // watchUserRow error-fallback below can all call this for a uid
        // that already has a row. A plain insert would throw a duplicate-key
        // error in that case and abort profile bootstrap for an existing user.
        const { error } = await this.client
            .from('users')
            .upsert({ id: uid, name: `User ${uid.substring(0, 4)}` }, { onConflict: 'id', ignoreDuplicates: true });
        if (error) throw error;
    }

    async updateUserName(uid: string, newName: string): Promise<void> {
        const sanitized = newName.trim().substring(0, 50);
        if (!uid || !sanitized) return;
        const { error } = await this.client.from('users').update({ name: sanitized }).eq('id', uid);
        if (error) throw error;
    }

    onUserSnapshot(uid: string, callback: (user: AppUser | null) => void): Unsubscribe {
        return this.watchUserRow(uid, callback);
    }

    onPartnerSnapshot(partnerId: string, callback: (partner: AppUser | null) => void): Unsubscribe {
        return this.watchUserRow(partnerId, callback);
    }

    private watchUserRow(uid: string, callback: (user: AppUser | null) => void): Unsubscribe {
        let cancelled = false;

        const fetchWithRetry = async (attempt = 0): Promise<void> => {
            const { data, error } = await this.client.from('users').select('*').eq('id', uid).maybeSingle();
            if (cancelled) return;
            if (error) {
                console.error(`Failed to fetch user ${uid} (attempt ${attempt + 1}):`, error);
                // A failed query is not the same as "no such user" — maybeSingle()
                // already reports a genuinely missing row as {data: null, error: null}
                // — so don't call back with null on the first failures, or AppContext
                // would think a real user's profile didn't exist. But never calling
                // back at all leaves AppContext's isLoading stuck true forever (it
                // only clears inside this callback), so after a few retries give up
                // and emit null anyway. createUserProfile is idempotent, so if this
                // was actually a transient blip on an existing user, the resulting
                // "recreate the profile" path is a harmless no-op rather than a bug.
                if (attempt < 2) {
                    setTimeout(() => { fetchWithRetry(attempt + 1); }, 500 * 2 ** attempt);
                    return;
                }
                callback(null);
                return;
            }
            callback(data ? mapUserRow(data) : null);
        };
        // .on('postgres_changes', ...) requires a niladic listener — keep the
        // retry counter out of its signature rather than defaulting a param.
        const fetchAndEmit = () => { fetchWithRetry(); };
        fetchAndEmit();

        const channel = this.client
            .channel(`users:${uid}`)
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'users', filter: `id=eq.${uid}` },
                fetchAndEmit
            )
            .subscribe();

        return () => {
            cancelled = true;
            this.client.removeChannel(channel);
        };
    }

    async acceptInvite(inviterId: string): Promise<void> {
        const { error } = await this.client.rpc('accept_invite', { p_inviter_id: inviterId });
        if (error) throw error;
    }

    onProblemsSnapshot(uid: string, callback: (problems: Problem[]) => void): Unsubscribe {
        let cancelled = false;

        const fetchAndEmit = async () => {
            const { data, error } = await this.client
                .from('problems')
                .select('*')
                .contains('participants', [uid])
                .order('created_at', { ascending: false });
            if (cancelled) return;
            if (error) {
                // Don't let a transient failure present as "you have zero
                // problems" — that would blow away currentProblem in AppContext.
                console.error(`Failed to fetch problems for ${uid}:`, error);
                return;
            }
            callback((data ?? []).map(mapProblemRow));
        };
        fetchAndEmit();

        // postgres_changes can't filter on "array contains uid" server-side,
        // so this re-fetches the whole list on any problems-table change and
        // re-filters client-side. Fine at this app's scale (a couple per
        // problem); would need a dedicated changefeed if that stops being true.
        const channel = this.client
            .channel('problems:all')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'problems' }, fetchAndEmit)
            .subscribe();

        return () => {
            cancelled = true;
            this.client.removeChannel(channel);
        };
    }

    async createNewProblem(user: AppUser, partner: AppUser): Promise<Problem> {
        const { data, error } = await this.client
            .from('problems')
            .insert({
                participants: [user.uid, partner.uid],
                roles: { [user.uid]: 'user1', [partner.uid]: 'user2' },
            })
            .select()
            .single();
        if (error) throw error;
        return mapProblemRow(data);
    }

    async updateProblem(problemId: string, data: Partial<Problem>): Promise<void> {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { createdAt, ...rest } = data;
        const { error } = await this.client.from('problems').update(rest).eq('id', problemId);
        if (error) throw error;
    }
}
