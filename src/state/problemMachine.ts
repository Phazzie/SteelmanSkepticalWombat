import { Problem } from '../types'; // Using our existing types

export type Action =
    | { type: 'AGREE_PROBLEM' }
    | { type: 'SUBMIT_PRIVATE_VERSION'; payload: { text: string; translation: string } }
    | { type: 'ADVANCE_TO_STEELMAN' }
    | { type: 'SUBMIT_STEELMAN'; payload: { text: string } }
    | { type: 'APPROVE_STEELMAN' }
    | { type: 'ADVANCE_TO_PROPOSE_SOLUTIONS' }
    | { type: 'PROPOSE_SOLUTION'; payload: { text: string } }
    | { type: 'SUBMIT_SOLUTION_STEELMAN'; payload: { text: string } }
    | { type: 'ADVANCE_TO_SOLUTION' }
    | { type: 'AGREE_SOLUTION' }
    | { type: 'SET_AI_ANALYSIS'; payload: { analysis: string } }
    | { type: 'SET_WAGER'; payload: { wager: string } };

export const problemStateReducer = (problem: Problem, action: Action, userId: string): Partial<Problem> => {
    const myRole = problem.roles?.[userId] as 'user1' | 'user2';
    const partnerRole = myRole === 'user1' ? 'user2' : 'user1';
    const updates: Partial<Problem> = {};

    switch (action.type) {
        case 'AGREE_PROBLEM':
            (updates as any)[`${myRole}_agreed_problem`] = true;
            if ((problem as any)[`${partnerRole}_agreed_problem`]) {
                (updates as any).status = 'private_versions';
            }
            return updates;

        case 'SUBMIT_PRIVATE_VERSION':
            (updates as any)[`${myRole}_private_version`] = action.payload.text;
            (updates as any)[`${myRole}_translation`] = action.payload.translation;
            (updates as any)[`${myRole}_submitted_private`] = true;
            if ((problem as any)[`${partnerRole}_submitted_private`]) {
                (updates as any).status = 'translation';
            }
            return updates;

        case 'ADVANCE_TO_STEELMAN':
            (updates as any).status = 'steelman';
            return updates;

        case 'SUBMIT_STEELMAN':
            (updates as any)[`${myRole}_steelman`] = action.payload.text;
            (updates as any)[`${myRole}_submitted_steelman`] = true;
            if ((problem as any)[`${partnerRole}_submitted_steelman`]) {
                (updates as any).status = 'steelman_approval';
            }
            return updates;

        case 'APPROVE_STEELMAN':
            (updates as any)[`${myRole}_approved_steelman`] = true;
            if ((problem as any)[`${partnerRole}_approved_steelman`]) {
                (updates as any).status = 'ai_review';
            }
            return updates;

        case 'ADVANCE_TO_PROPOSE_SOLUTIONS':
            (updates as any).status = 'propose_solutions';
            return updates;

        case 'PROPOSE_SOLUTION':
            (updates as any)[`${myRole}_proposed_solution`] = action.payload.text;
            (updates as any)[`${myRole}_has_proposed`] = true;
            if ((problem as any)[`${partnerRole}_has_proposed`]) {
                (updates as any).status = 'solution_steelman';
            }
            return updates;

        case 'SUBMIT_SOLUTION_STEELMAN':
            (updates as any)[`${myRole}_solution_steelman`] = action.payload.text;
            (updates as any)[`${myRole}_submitted_solution_steelman`] = true;
            if ((problem as any)[`${partnerRole}_submitted_solution_steelman`]) {
                (updates as any).status = 'wager';
            }
            return updates;

        case 'ADVANCE_TO_SOLUTION':
            (updates as any).status = 'solution';
            return updates;

        case 'AGREE_SOLUTION':
            (updates as any)[`${myRole}_agreed_solution`] = true;
            if ((problem as any)[`${partnerRole}_agreed_solution`]) {
                (updates as any).status = 'resolved';
                (updates as any).solution_check_date = new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000);
            }
            return updates;

        case 'SET_AI_ANALYSIS':
            (updates as any).ai_analysis = action.payload.analysis;
            return updates;

        case 'SET_WAGER':
            (updates as any).wombats_wager = action.payload.wager;
            return updates;

        default:
            return {};
    }
};