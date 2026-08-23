-- Initial schema for The Skeptical Wombat, replacing the Firestore data model.
-- Mirrors the flat user1_*/user2_* field shape from src/types/index.ts so the
-- 11 phase components (which read problem[`${role}_field`]) don't need edits.

create table if not exists public.users (
    id uuid primary key references auth.users(id) on delete cascade,
    name text not null default 'New User',
    partner_id uuid references public.users(id) on delete set null,
    created_at timestamptz not null default now()
);

create table if not exists public.problems (
    id uuid primary key default gen_random_uuid(),
    participants uuid[] not null,
    roles jsonb not null, -- e.g. {"<uid1>": "user1", "<uid2>": "user2"}
    status text not null default 'agree_statement',

    problem_statement text not null default '',
    solution_statement text,
    ai_analysis text not null default '',
    human_verdict text not null default '',
    escalated_for_human_review boolean not null default false,
    wombats_wager text,
    brainstormed_solutions text,

    user1_agreed_problem boolean not null default false,
    user2_agreed_problem boolean not null default false,

    user1_private_version text not null default '',
    user2_private_version text not null default '',
    user1_submitted_private boolean not null default false,
    user2_submitted_private boolean not null default false,
    user1_translation text not null default '',
    user2_translation text not null default '',
    user1_manipulation_analysis text not null default '',
    user2_manipulation_analysis text not null default '',

    user1_steelman text not null default '',
    user2_steelman text not null default '',
    user1_submitted_steelman boolean not null default false,
    user2_submitted_steelman boolean not null default false,
    user1_approved_steelman boolean not null default false,
    user2_approved_steelman boolean not null default false,

    user1_proposed_solution text not null default '',
    user2_proposed_solution text not null default '',
    user1_solution_steelman text not null default '',
    user2_solution_steelman text not null default '',
    user1_submitted_solution_steelman boolean not null default false,
    user2_submitted_solution_steelman boolean not null default false,

    user1_agreed_solution boolean not null default false,
    user2_agreed_solution boolean not null default false,
    solution_check_date timestamptz,

    user1_post_mortem text not null default '',
    user2_post_mortem text not null default '',

    created_at timestamptz not null default now()
);

create index if not exists problems_participants_idx on public.problems using gin (participants);

-- --- Row Level Security ---

alter table public.users enable row level security;
alter table public.problems enable row level security;

-- A user can read their own row, and their partner's row (partner_id points back at them).
create policy users_select on public.users
    for select using (id = auth.uid() or partner_id = auth.uid());

create policy users_insert_own on public.users
    for insert with check (id = auth.uid());

create policy users_update_own on public.users
    for update using (id = auth.uid());

-- Problems: readable/writable only by the two listed participants.
create policy problems_select on public.problems
    for select using (auth.uid() = any(participants));

create policy problems_insert on public.problems
    for insert with check (auth.uid() = any(participants));

create policy problems_update on public.problems
    for update using (auth.uid() = any(participants));

-- KNOWN LIMITATION (tracked as a fast-follow, not silently accepted):
-- problems_update currently lets either participant write ANY column on a
-- shared row, including the partner's private_version/steelman fields before
-- they've submitted. The Firestore rules in the old roadmap had the identical
-- gap. Closing it properly means splitting private per-user fields into a
-- separate table (e.g. problem_sides keyed by (problem_id, user_id)) with
-- row-level ownership, and leaving only shared fields (status, ai_analysis,
-- wombats_wager, participants, roles) on the parent row. Not done here to
-- keep this migration mechanical and low-risk; flagging so it isn't confused
-- with "solved."

-- --- Invite flow (server-enforced, replaces client-side linkPartners) ---
-- Accepting an invite must update BOTH the inviter's and invitee's rows.
-- The invitee's own client can't do that under the RLS policies above (it
-- can only write its own row), which is correct — so the two-sided write
-- happens here, in a function that runs with the table owner's privileges
-- and enforces its own validation instead of trusting the client.

create or replace function public.accept_invite(p_inviter_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
    v_invitee_id uuid := auth.uid();
begin
    if v_invitee_id is null then
        raise exception 'Not authenticated';
    end if;
    if v_invitee_id = p_inviter_id then
        raise exception 'Cannot invite yourself';
    end if;
    if not exists (select 1 from public.users where id = p_inviter_id) then
        raise exception 'Inviter not found';
    end if;
    if exists (select 1 from public.users where id = p_inviter_id and partner_id is not null) then
        raise exception 'Inviter already has a partner';
    end if;

    insert into public.users (id, name, partner_id)
    values (v_invitee_id, 'New User', p_inviter_id)
    on conflict (id) do update set partner_id = excluded.partner_id;

    update public.users set partner_id = v_invitee_id where id = p_inviter_id;
end;
$$;

grant execute on function public.accept_invite(uuid) to authenticated;
