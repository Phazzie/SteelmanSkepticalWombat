import { updateProblem } from '../services/firebase';
import { getTranslation, getWager, getAIAnalysis as getWombatAnalysis, getEscalation, getBrainstorm } from '../services/ai';
import { problemStateReducer, Action } from '../state/problemMachine';
import { IProblem } from '../types';
import { User } from 'firebase/auth';

type SetIsAiLoading = (loading: string | null) => void;

export const createProblemMutations = (
    user: User,
    currentProblem: IProblem | null,
    setIsAiLoading: SetIsAiLoading
) => {
    const handleUpdate = (problemId: string, data: Partial<IProblem>) => {
        updateProblem(problemId, data);
    };

    const dispatch = (action: Action) => {
        if (!currentProblem || !user) return;
        const updates = problemStateReducer(currentProblem, action, user.uid);
        handleUpdate(currentProblem.id, updates);
    };

    const handleAgreement = (type: 'problem' | 'solution') => {
        dispatch({ type: type === 'problem' ? 'AGREE_PROBLEM' : 'AGREE_SOLUTION' });
    };

    const handleSteelmanApproval = () => {
        dispatch({ type: 'APPROVE_STEELMAN' });
    };

    const handlePrivateSubmit = async (text: string) => {
        if (!currentProblem || !user) return;
        setIsAiLoading('translation');
        const translationResult = await getTranslation(text);
        dispatch({
            type: 'SUBMIT_PRIVATE_VERSION',
            payload: { text, translation: translationResult || 'Translation failed.' },
        });
        setIsAiLoading(null);
    };

    const handleSteelmanSubmit = (text: string) => {
        dispatch({ type: 'SUBMIT_STEELMAN', payload: { text } });
    };

    const getAIAnalysis = async (problem: IProblem) => {
        setIsAiLoading('verdict');
        const analysisText = await getWombatAnalysis(problem);
        if (analysisText) {
            // Since dispatch relies on currentProblem from the closure, we pass the problem explicitly
            const updates = problemStateReducer(problem, { type: 'SET_AI_ANALYSIS', payload: { analysis: analysisText } }, user.uid);
            handleUpdate(problem.id, updates);
        }
        setIsAiLoading(null);
    };

    const handleProposeSolution = (text: string) => {
        dispatch({ type: 'PROPOSE_SOLUTION', payload: { text } });
    };

    const handleSolutionSteelmanSubmit = (text: string) => {
        dispatch({ type: 'SUBMIT_SOLUTION_STEELMAN', payload: { text } });
    };

    const getWagerAnalysis = async (problem: IProblem) => {
        if (!user) return;
        setIsAiLoading('wager');
        // We need to find out which text to use for the wager. It's the partner's solution steelman.
        const myRole = problem.roles[user.uid];
        const partnerRole = myRole === 'user1' ? 'user2' : 'user1';
        const partnerSolutionSteelman = problem[`${partnerRole}_solution_steelman`];

        if (partnerSolutionSteelman) {
            const wagerResult = await getWager(problem, partnerSolutionSteelman);
            if (wagerResult) {
                const updates = problemStateReducer(problem, { type: 'SET_WAGER', payload: { wager: wagerResult } }, user.uid);
                handleUpdate(problem.id, updates);
            }
        }
        setIsAiLoading(null);
    };

    const handleAdvanceToSteelman = () => dispatch({ type: 'ADVANCE_TO_STEELMAN' });
    const handleAdvanceToProposeSolutions = () => dispatch({ type: 'ADVANCE_TO_PROPOSE_SOLUTIONS' });
    const handleAdvanceToSolution = () => dispatch({ type: 'ADVANCE_TO_SOLUTION' });

    const handleEscalate = async () => {
        if (!currentProblem) return;
        setIsAiLoading('escalate');
        const escalationResult = await getEscalation(currentProblem);
        if (escalationResult) {
            handleUpdate(currentProblem.id, { human_verdict: escalationResult, escalated_for_human_review: true });
        }
        setIsAiLoading(null);
    };

    const handleBrainstorm = async () => {
        if (!currentProblem) return;
        setIsAiLoading('brainstorm');
        const brainstormResult = await getBrainstorm(currentProblem);
        if (brainstormResult) {
            handleUpdate(currentProblem.id, { brainstormed_solutions: brainstormResult });
        }
        setIsAiLoading(null);
    };

    return {
        handleUpdate,
        handleAgreement,
        handleSteelmanApproval,
        handlePrivateSubmit,
        handleSteelmanSubmit,
        getAIAnalysis,
        getWagerAnalysis,
        handleProposeSolution,
        handleSolutionSteelmanSubmit,
        handleAdvanceToSteelman,
        handleAdvanceToProposeSolutions,
        handleAdvanceToSolution,
        handleEscalate,
        handleBrainstorm,
    };
};
