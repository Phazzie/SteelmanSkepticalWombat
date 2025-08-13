import React, { createContext, useState, useContext } from 'react';
import {
    createNewProblem,
    getDoc,
} from '../services/firebase';
import { useProblemMutations } from '../hooks/useProblemMutations';
import { useAuth } from './AuthContext';
import { useProblemsSubscription } from '../hooks/useProblemsSubscription';
import { useAIHandlers } from '../hooks/useAIHandlers';

export const ProblemsContext = createContext(null);

export const ProblemsProvider = ({ children }) => {
    const { user, partner } = useAuth();
    const [problems, setProblems] = useState([]);
    const [currentProblem, setCurrentProblem] = useState(null);
    const [notification, setNotification] = useState({ show: false, message: '', type: 'info', duration: 4000 });
    const [analysisRequestedId, setAnalysisRequestedId] = useState(null);
    const [generatedImage, setGeneratedImage] = useState(null);

    const { isAiLoading, setIsAiLoading, handleBSMeter, handleEmergencyWombat } = useAIHandlers(setNotification);

    const mutations = useProblemMutations(user, currentProblem, setIsAiLoading, setNotification, setGeneratedImage);

    useProblemsSubscription(user, currentProblem, mutations.getAIAnalysis, setProblems, setCurrentProblem, isAiLoading, analysisRequestedId, setAnalysisRequestedId);

    const value = {
        problems,
        currentProblem,
        isAiLoading,
        setIsAiLoading,
        notification,
        setNotification,
        generatedImage,
        startNewProblem: async () => {
            const docRef = await createNewProblem(user, partner);
            const newProblem = { id: docRef.id, ...(await getDoc(docRef)).data() };
            setCurrentProblem(newProblem)
        },
        setCurrentProblem,
        ...mutations,
        handleBSMeter,
        handleEmergencyWombat,
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
