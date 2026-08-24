/**
 * Postgres/Supabase returns timestamptz columns as ISO 8601 strings over the
 * wire, not Date objects. createdAt/solution_check_date are typed as string
 * here; toJsDate covers callers that still hold a plain Date (e.g. an
 * optimistic local update before the row round-trips).
 */
export const toJsDate = (value: string | Date): Date => {
    return typeof value === 'string' ? new Date(value) : value;
};

/**
 * A user account. `partnerId` is null until the invite flow links two users.
 */
export interface AppUser {
    uid: string;
    name: string;
    partnerId: string | null;
}

/**
 * Defines the core data structure for a "problem" being worked on by the users.
 * This interface is used throughout the application to ensure type consistency.
 */
export interface Problem {
    id: string;
    problem_statement: string;
    solution_statement?: string;
    user1_private_version: string;
    user2_private_version: string;
    user1_steelman: string;
    user2_steelman: string;
    user1_submitted_steelman?: boolean;
    user2_submitted_steelman?: boolean;
    user1_approved_steelman?: boolean;
    user2_approved_steelman?: boolean;
    ai_analysis: string;
    human_verdict: string;
    escalated_for_human_review?: boolean;
    user1_proposed_solution: string;
    user2_proposed_solution: string;
    user1_solution_steelman: string;
    user2_solution_steelman: string;
    brainstormed_solutions?: string;
    roles?: { [userId: string]: 'user1' | 'user2' };
    status?: string;
    participants?: string[];
    createdAt?: string | Date;
    user1_agreed_problem?: boolean;
    user2_agreed_problem?: boolean;
    user1_submitted_private?: boolean;
    user2_submitted_private?: boolean;
    user1_translation?: string;
    user2_translation?: string;
    user1_manipulation_analysis?: string;
    user2_manipulation_analysis?: string;
    user1_has_proposed?: boolean;
    user2_has_proposed?: boolean;
    user1_submitted_solution_steelman?: boolean;
    user2_submitted_solution_steelman?: boolean;
    user1_agreed_solution?: boolean;
    user2_agreed_solution?: boolean;
    wombats_wager?: string;
    solution_check_date?: string | Date;
    user1_post_mortem?: string;
    user2_post_mortem?: string;
}
