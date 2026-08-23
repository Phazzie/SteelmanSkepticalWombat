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
        const { data } = this.client.auth.onAuthStateChange((_event, session) => {
            callback(session?.user?.id ?? null);
        });
        return () => data.subscription.unsubscribe();
    }

    async anonymousSignIn(): Promise<void> {
        const { error } = await this.client.auth.signInAnonymously();
        if (error) throw error;
    }

    async createUserProfile(uid: string): Promise<void> {
        const { error } = await this.client
            .from('users')
            .insert({ id: uid, name: `User ${uid.substring(0, 4)}` });
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

        const fetchAndEmit = async () => {
            const { data } = await this.client.from('users').select('*').eq('id', uid).maybeSingle();
            if (!cancelled) callback(data ? mapUserRow(data) : null);
        };
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
            const { data } = await this.client
                .from('problems')
                .select('*')
                .contains('participants', [uid])
                .order('created_at', { ascending: false });
            if (!cancelled) callback((data ?? []).map(mapProblemRow));
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
