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

    async createUserProfile(uid: string): Promise<AppUser> {
        // Idempotent and returns the resulting row directly, rather than
        // requiring the caller to wait for it via onUserSnapshot's realtime
        // channel (whose subscription can still be establishing when this
        // write commits, missing the one-time creation event entirely).
        //
        // Deliberately not a single upsert(): postgrest-js's upsert only
        // exposes ignoreDuplicates as a whole-row on/off switch — "do
        // nothing" on conflict, which returns no row at all via RETURNING
        // (breaking the "always return the row" contract here), or a full
        // merge, which would reset an existing custom name back to the
        // "User XXXX" default on every idempotent call. Select-then-insert
        // instead, so an existing row is never touched.
        const { data: existing } = await this.client.from('users').select('*').eq('id', uid).maybeSingle();
        if (existing) return mapUserRow(existing);

        const { data, error } = await this.client
            .from('users')
            .insert({ id: uid, name: `User ${uid.substring(0, 4)}` })
            .select()
            .single();
        if (!error) return mapUserRow(data);

        // Multi-tab sign-in can lose this exact race: another tab inserted
        // between our select and our insert. Fetch what it wrote instead of
        // failing profile bootstrap over a benign duplicate-key error.
        const { data: raceWinner } = await this.client.from('users').select('*').eq('id', uid).maybeSingle();
        if (raceWinner) return mapUserRow(raceWinner);
        throw error;
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
            if (cancelled) return;
            const { data, error } = await this.client.from('users').select('*').eq('id', uid).maybeSingle();
            if (cancelled) return;
            if (error) {
                console.error(`Failed to fetch user (attempt ${attempt + 1}):`, uid, error);
                // A failed query is not the same as "no such user" — maybeSingle()
                // already reports a genuinely missing row as {data: null, error: null}.
                // Emitting null on a real query failure previously made AppContext
                // think a real user's profile didn't exist and try to recreate it —
                // and worse, once it gave up retrying, the only thing that could ever
                // trigger another attempt was some unrelated future change to this
                // row via the postgres_changes channel below, which might never come
                // for a rarely-updated profile, leaving the app stuck mid-outage even
                // after connectivity actually recovered. So: never give up. Retry with
                // capped backoff indefinitely instead of ever emitting a false null —
                // isLoading staying true for as long as the outage lasts is honest;
                // silently pretending the profile doesn't exist is not.
                const delay = Math.min(1000 * 2 ** attempt, 15000);
                if (!cancelled) setTimeout(() => { fetchWithRetry(attempt + 1); }, delay);
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

    async acceptInvite(inviterId: string): Promise<AppUser> {
        const { data, error } = await this.client.rpc('accept_invite', { p_inviter_id: inviterId }).single();
        if (error) throw error;
        return mapUserRow(data);
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
                console.error('Failed to fetch problems for user:', uid, error);
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
