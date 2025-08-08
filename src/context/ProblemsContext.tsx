import React, { createContext, useState, useEffect, useContext } from 'react';
import {
    onProblemsSnapshot,
    createNewProblem,
    getDoc,
} from '../services/firebase';
import { getBSAnalysis, getEmergencyWombat, getAIAnalysis as getWombatAnalysis } from '../services/ai';
import { useProblemMutations } from '../hooks/useProblemMutations';
import { useAuth } from './AuthContext';

export const ProblemsContext = createContext(null);

export const ProblemsProvider = ({ children }) => {
    const { user, partner } = useAuth();
    const [problems, setProblems] = useState([]);
    const [currentProblem, setCurrentProblem] = useState(null);
    const [isAiLoading, setIsAiLoading] = useState(null);
    const [notification, setNotification] = useState({ show: false, message: '', type: 'info', duration: 4000 });


    const {
        handleUpdate,
        handleAgreement,
        handleSteelmanApproval,
        handlePrivateSubmit,
        handleSteelmanSubmit,
        getAIAnalysis,
        handleProposeSolution,
        handleSolutionSteelmanSubmit,
        handleGenerateImage,
        handleCritique,
        handleBrainstorm,
        handleEscalate,
        handlePostMortemSubmit,
    } = useProblemMutations();

    useEffect(() => {
        if (!user?.uid) return;
        const unsubscribe = onProblemsSnapshot(user.uid, (querySnapshot) => {
            const fetchedProblems = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).sort((a, b) => b.createdAt.seconds - a.createdAt.seconds);
            setProblems(fetchedProblems);
            if (currentProblem?.id) {
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
    }, [user?.uid, currentProblem?.id, isAiLoading, getAIAnalysis]);

    const value = {
        problems,
        currentProblem,
        isAiLoading,
        setIsAiLoading,
        notification,
        setNotification,
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
        handleGenerateImage,
        handleCritique,
        handleBrainstorm,
        handleEscalate,
        handlePostMortemSubmit,
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

    return <ProblemsContext.Provider value={value}>{children}</ProblemsContext.Provider>;
}

export const useProblems = () => {
    const context = useContext(ProblemsContext);
    if (context === null) {
        throw new Error('useProblems must be used within a ProblemsProvider');
    }
    return context;
}
