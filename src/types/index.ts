/**
 * Minimal shape of a Firestore Timestamp as returned by the Firestore SDK.
 * Using a local interface avoids importing the firebase package into generic type files.
 */
export interface FirestoreTimestamp {
    seconds: number;
    nanoseconds: number;
    toDate(): Date;
}

/**
 * Safely converts a FirestoreTimestamp or plain Date to a JavaScript Date object.
 */
const isFirestoreTimestamp = (value: unknown): value is FirestoreTimestamp => {
    return (
        typeof value === 'object' &&
        value !== null &&
        'toDate' in value &&
        typeof (value as FirestoreTimestamp).toDate === 'function' &&
        'seconds' in value &&
        'nanoseconds' in value
    );
};

export const toJsDate = (value: FirestoreTimestamp | Date | unknown): Date => {
    if (value instanceof Date) {
        return value;
    }

    if (isFirestoreTimestamp(value)) {
        try {
            const converted = value.toDate();
            return converted instanceof Date ? converted : new Date(Number.NaN);
        } catch (_error) {
            return new Date(Number.NaN);
        }
    }

    return new Date(Number.NaN);
};

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
    // Firestore returns Timestamp objects at runtime even though we store Date values
    createdAt?: FirestoreTimestamp | Date;
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
    // Firestore returns a Timestamp with .toDate(); the plain Date fallback is for new items
    solution_check_date?: FirestoreTimestamp | Date;
    user1_post_mortem?: string;
    user2_post_mortem?: string;
}
