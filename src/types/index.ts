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
    // Add any other properties that a problem object might have.
  }
