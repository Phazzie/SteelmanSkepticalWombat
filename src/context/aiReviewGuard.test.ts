import { describe, expect, it } from 'vitest';
import { shouldRequestAIAnalysis } from './aiReviewGuard';
import { Problem } from '../types';

const baseProblem: Problem = {
    id: 'p1',
    problem_statement: '',
    ai_analysis: '',
    human_verdict: '',
    user1_private_version: '',
    user2_private_version: '',
    user1_steelman: '',
    user2_steelman: '',
    user1_proposed_solution: '',
    user2_proposed_solution: '',
    user1_solution_steelman: '',
    user2_solution_steelman: '',
};

describe('shouldRequestAIAnalysis', () => {
    it('returns true when in ai_review without analysis or lock', () => {
        expect(shouldRequestAIAnalysis({ ...baseProblem, status: 'ai_review' }, null)).toBe(true);
    });

    it('returns false when analysis already present', () => {
        expect(shouldRequestAIAnalysis({ ...baseProblem, status: 'ai_review', ai_analysis: 'done' }, null)).toBe(false);
    });

    it('returns false when verdict is in progress', () => {
        expect(shouldRequestAIAnalysis({ ...baseProblem, status: 'ai_review', verdict_in_progress: true }, null)).toBe(false);
    });

    it('returns false when ai is currently loading', () => {
        expect(shouldRequestAIAnalysis({ ...baseProblem, status: 'ai_review' }, 'verdict')).toBe(false);
    });

    it('returns false when not in ai_review status', () => {
        expect(shouldRequestAIAnalysis({ ...baseProblem, status: 'translation' }, null)).toBe(false);
    });
});
