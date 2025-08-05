import React, { createContext, useState, useEffect, useContext } from 'react';
import {
    onProblemsSnapshot,
    createNewProblem,
    updateProblem,
    getDoc,
    runTransaction,
} from '../services/firebase';
import { getTranslation, getAIAnalysis as getWombatAnalysis, getWager, getBSAnalysis, getEmergencyWombat } from '../services/ai';
import { AuthContext } from './AuthContext';

export const ProblemContext = createContext(null);

export const ProblemProvider = ({ children }) => {
    const { user } = useContext(AuthContext);
    const [problems, setProblems] = useState([]);
    const [currentProblem, setCurrentProblem] = useState(null);
    const [isAiLoading, setIsAiLoading] = useState(null);

    useEffect(() => {
        if (!user?.uid) return;
        const unsubscribe = onProblemsSnapshot(user.uid, (querySnapshot) => {
            const fetchedProblems = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).sort((a, b) => b.createdAt.seconds - a.createdAt.seconds);
            setProblems(fetchedProblems);
            if (currentProblem) {
                const updatedCurrent = fetchedProblems.find(p => p.id === currentProblem.id);
                if (updatedCurrent) {
                    setCurrentProblem(updatedCurrent);
                    if (updatedCurrent.status === 'ai_review' && !updatedCurrent.ai_analysis && !isAiLoading) {
                        getAIAnalysis(updatedCurrent);
                    }
                }
            }
        });
        return () => unsubscribe();
    }, [user?.uid, currentProblem?.id, isAiLoading]);

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

        try {
            await runTransaction(db, async (transaction) => {
                const problemRef = doc(db, `artifacts/${appId}/public/data/problems/${currentProblem.id}`);
                const problemDoc = await transaction.get(problemRef);

                if (!problemDoc.exists()) {
                    throw "Document does not exist!";
                }

                const problemData = problemDoc.data();

                // Prepare the update for the current user's submission
                const updates = {
                    [`${myRole}_private_version`]: text,
                    [`${myRole}_submitted_private`]: true,
                };

                // If the partner has already submitted, it's time to change the status
                if (problemData[`${partnerRole}_submitted_private`]) {
                    updates.status = 'translation';
                }

                transaction.update(problemRef, updates);
            });

            // The translation can happen outside the transaction
            const translationResult = await getTranslation(text);
            await handleUpdate(currentProblem.id, { [`${myRole}_translation`]: translationResult || "Translation failed." });

        } catch (error) {
            console.error("Transaction failed: ", error);
            // Optionally, set a notification for the user
        } finally {
            setIsAiLoading(null);
        }
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

    const value = {
        problems,
        currentProblem,
        isAiLoading,
        startNewProblem: async () => {
            const docRef = await createNewProblem(user, partner);
            const newProblem = { id: docRef.id, ...(await getDoc(docRef)).data() };
            setCurrentProblem(newProblem)
        },
        setCurrentProblem,
        handleUpdate,
        handleAgreement,
        handleSteelmanApproval,
        handlePrivateSubmit,
        handleSteelmanSubmit,
        handleProposeSolution,
        handleSolutionSteelmanSubmit,
        handleBSMeter: async (text) => {
            setIsAiLoading('bs-meter');
            const result = await getBSAnalysis(text);
            setNotification({ show: true, message: result || "The Wombat is speechless.", type: 'info' });
            setIsAiLoading(null);
        },
        handleEmergencyWombat: async () => {
            setIsAiLoading('emergency');
            const result = await getEmergencyWombat();
            setNotification({ show: true, message: result || "The Wombat is on a coffee break.", type: 'info' });
            setIsAiLoading(null);
        },
    };

    return <ProblemContext.Provider value={value}>{children}</ProblemContext.Provider>;
};
