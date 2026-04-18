import { Problem } from "../types";

export const shouldRequestAIAnalysis = (problem: Problem, isAiLoading: any): boolean => {
    if (!problem) return false;
    if (isAiLoading) return false;
    if (problem.verdict_in_progress) return false;
    if (problem.ai_analysis) return false;
    return problem.status === 'ai_review';
};
