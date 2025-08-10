import { IProblem } from '../types'; // Assuming types are defined in ../types

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

export const problemStateReducer = (problem: IProblem, action: Action, userId: string) => {
    const myRole = problem.roles[userId];
    const partnerRole = myRole === 'user1' ? 'user2' : 'user1';
    const updates: Partial<IProblem> = {};

    switch (action.type) {
        case 'AGREE_PROBLEM':
            updates[`${myRole}_agreed_problem`] = true;
            if (problem[`${partnerRole}_agreed_problem`]) {
                updates.status = 'private_versions';
            }
            return updates;

        case 'SUBMIT_PRIVATE_VERSION':
            updates[`${myRole}_private_version`] = action.payload.text;
            updates[`${myRole}_submitted_private`] = true;
            updates[`${myRole}_translation`] = action.payload.translation;
            if (problem[`${partnerRole}_submitted_private`]) {
                updates.status = 'translation';
            }
            return updates;

        case 'ADVANCE_TO_STEELMAN':
            updates.status = 'steelman';
            return updates;

        case 'SUBMIT_STEELMAN':
            updates[`${myRole}_steelman`] = action.payload.text;
            updates[`${myRole}_submitted_steelman`] = true;
            if (problem[`${partnerRole}_submitted_steelman`]) {
                updates.status = 'steelman_approval';
            }
            return updates;

        case 'APPROVE_STEELMAN':
            updates[`${myRole}_approved_steelman`] = true;
            if (problem[`${partnerRole}_approved_steelman`]) {
                updates.status = 'ai_review';
            }
            return updates;

        case 'SET_AI_ANALYSIS':
            updates.ai_analysis = action.payload.analysis;
            return updates;

        case 'ADVANCE_TO_PROPOSE_SOLUTIONS':
            updates.status = 'propose_solutions';
            return updates;

        case 'PROPOSE_SOLUTION':
            updates[`${myRole}_proposed_solution`] = action.payload.text;
            if (problem[`${partnerRole}_proposed_solution`]) {
                updates.status = 'solution_steelman';
            }
            return updates;

        case 'SUBMIT_SOLUTION_STEELMAN':
            updates[`${myRole}_solution_steelman`] = action.payload.text;
            if (problem[`${partnerRole}_solution_steelman`]) {
                updates.status = 'wager';
            }
            return updates;

        case 'SET_WAGER':
            updates.wombats_wager = action.payload.wager;
            updates.status = 'wager';
            return updates;

        case 'ADVANCE_TO_SOLUTION':
            updates.status = 'solution';
            return updates;

        case 'AGREE_SOLUTION':
            updates[`${myRole}_agreed_solution`] = true;
            if (problem[`${partnerRole}_agreed_solution`]) {
                updates.status = 'resolved';
                updates.solution_check_date = new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000);
            }
            return updates;

        default:
            return {};
    }
};
