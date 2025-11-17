/**
 * Represents a Firebase Timestamp object
 */
export interface FirebaseTimestamp {
    seconds: number;
    nanoseconds: number;
}

/**
 * Represents a user in the system
 */
export interface User {
    uid: string;
    name: string;
    partnerId?: string | null;
}

/**
 * Represents a partner user in the system
 */
export interface Partner {
    uid: string;
    name: string;
    partnerId?: string | null;
}

/**
 * Represents a notification displayed to the user
 */
export interface Notification {
    show: boolean;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    duration: number;
}

/**
 * Defines the core data structure for a "problem" being worked on by the users.
 * This interface is used throughout the application to ensure type consistency.
 */
export interface Problem {
    id: string;
    problem_statement: string;
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
    // Additional properties from other branches
    roles?: { [userId: string]: 'user1' | 'user2' };
    status?: string;
    participants?: string[];
    createdAt?: FirebaseTimestamp;
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
    solution_check_date?: Date;
}
