import { useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { updateProblem } from '../services/firebase';
import { getTranslation, getWager, getAIAnalysis as getWombatAnalysis } from '../services/ai';
import { problemStateReducer, Action } from '../state/problemMachine';
import { IProblem } from '../types';

export const useProblemMutations = () => {
    const { user, currentProblem, setIsAiLoading } = useContext(AppContext);

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
            dispatch({ type: 'SET_AI_ANALYSIS', payload: { analysis: analysisText } });
        }
        setIsAiLoading(null);
    };

    const handleProposeSolution = (text: string) => {
        dispatch({ type: 'PROPOSE_SOLUTION', payload: { text } });
    };

    const handleSolutionSteelmanSubmit = async (text: string) => {
        if (!currentProblem || !user) return;
        const myRole = currentProblem.roles[user.uid];
        const partnerRole = myRole === 'user1' ? 'user2' : 'user1';

        // Dispatch local update immediately
        dispatch({ type: 'SUBMIT_SOLUTION_STEELMAN', payload: { text } });

        // If partner is already done, fetch wager and update again
        if (currentProblem[`${partnerRole}_solution_steelman`]) {
            setIsAiLoading('wager');
            const wagerResult = await getWager({ ...currentProblem, [`${myRole}_solution_steelman`]: text }, text);
            if (wagerResult) {
                dispatch({ type: 'SET_WAGER', payload: { wager: wagerResult } });
            }
            setIsAiLoading(null);
        }
    };

    return {
        handleUpdate,
        handleAgreement,
        handleSteelmanApproval,
        handlePrivateSubmit,
        handleSteelmanSubmit,
        getAIAnalysis,
        handleProposeSolution,
        handleSolutionSteelmanSubmit,
    };
};
