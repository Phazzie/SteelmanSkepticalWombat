import { useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { updateProblem } from '../services/firebase';
import { getTranslation, getWager, getAIAnalysis as getWombatAnalysis } from '../services/ai';

export const useProblemMutations = () => {
    const { user, currentProblem, setIsAiLoading, isAiLoading } = useContext(AppContext);

    const handleUpdate = (problemId, data) => {
        updateProblem(problemId, data);
    };

    const handleAgreement = (type) => {
        if (!currentProblem || !user) return;
        const myRole = currentProblem.roles[user.uid];
        const partnerRole = myRole === 'user1' ? 'user2' : 'user1';
        if (type === 'problem') {
            const updates = { [`${myRole}_agreed_problem`]: true };
            if (currentProblem[`${partnerRole}_agreed_problem`]) updates.status = 'private_versions';
            handleUpdate(currentProblem.id, updates);
        } else if (type === 'solution') {
            const updates = { [`${myRole}_agreed_solution`]: true };
            if (currentProblem[`${partnerRole}_agreed_solution`]) {
                updates.status = 'resolved';
                updates.solution_check_date = new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000);
            }
            handleUpdate(currentProblem.id, updates);
        }
    };

    const handleSteelmanApproval = () => {
        if (!currentProblem || !user) return;
        const myRole = currentProblem.roles[user.uid];
        const partnerRole = myRole === 'user1' ? 'user2' : 'user1';
        const updates = { [`${myRole}_approved_steelman`]: true };
        if (currentProblem[`${partnerRole}_approved_steelman`]) {
            updates.status = 'ai_review';
        }
        handleUpdate(currentProblem.id, updates);
    };

    const handlePrivateSubmit = async (text) => {
        if (!currentProblem || !user) return;
        setIsAiLoading('translation');
        const myRole = currentProblem.roles[user.uid];
        const partnerRole = myRole === 'user1' ? 'user2' : 'user1';
        const translationResult = await getTranslation(text);
        const updates = {
            [`${myRole}_private_version`]: text,
            [`${myRole}_submitted_private`]: true,
            [`${myRole}_translation`]: translationResult || "Translation failed.",
        };
        if (currentProblem[`${partnerRole}_submitted_private`]) updates.status = 'translation';
        handleUpdate(currentProblem.id, updates);
        setIsAiLoading(null);
    };

    const handleSteelmanSubmit = (text) => {
        if (!currentProblem || !user) return;
        const myRole = currentProblem.roles[user.uid];
        const partnerRole = myRole === 'user1' ? 'user2' : 'user1';
        const updates = { [`${myRole}_steelman`]: text, [`${myRole}_submitted_steelman`]: true };
        if (currentProblem[`${partnerRole}_submitted_steelman`]) {
            updates.status = 'steelman_approval';
        }
        handleUpdate(currentProblem.id, updates);
    };

    const getAIAnalysis = async (problem) => {
        setIsAiLoading('verdict');
        const analysisText = await getWombatAnalysis(problem);
        if (analysisText) {
            await handleUpdate(problem.id, { ai_analysis: analysisText, status: 'propose_solutions' });
        }
        setIsAiLoading(null);
    };

    const handleProposeSolution = (text) => {
        if (!currentProblem || !user) return;
        const myRole = currentProblem.roles[user.uid];
        const partnerRole = myRole === 'user1' ? 'user2' : 'user1';
        const updates = { [`${myRole}_proposed_solution`]: text };
        if (currentProblem[`${partnerRole}_proposed_solution`]) {
            updates.status = 'solution_steelman';
        }
        handleUpdate(currentProblem.id, updates);
    };

    const handleSolutionSteelmanSubmit = async (text) => {
        if (!currentProblem || !user) return;
        const myRole = currentProblem.roles[user.uid];
        const partnerRole = myRole === 'user1' ? 'user2' : 'user1';
        const updates = { [`${myRole}_solution_steelman`]: text };

        if (currentProblem[`${partnerRole}_solution_steelman`]) {
            setIsAiLoading('wager');
            const wagerResult = await getWager(currentProblem, text);
            if(wagerResult) {
                updates.wombats_wager = wagerResult;
                updates.status = 'wager';
                await handleUpdate(currentProblem.id, updates);
            }
            setIsAiLoading(null);
        } else {
            await handleUpdate(currentProblem.id, updates);
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
