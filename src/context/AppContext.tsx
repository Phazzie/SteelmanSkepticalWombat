import React, { createContext, useState, useEffect } from 'react';
import {
    onAuthChange,
    anonymousSignIn,
    customTokenSignIn,
    onUserSnapshot,
    onPartnerSnapshot,
    linkPartners,
    createUserProfile,
    updateUserName as updateUserNameInDb,
    onProblemsSnapshot,
    createNewProblem,
    getDoc,
} from '../services/firebase';
import { getBSAnalysis, getEmergencyWombat, getAIAnalysis as getWombatAnalysis } from '../services/ai';
import { useProblemMutations } from '../hooks/useProblemMutations';
import { IProblem } from '../types';

export const AppContext = createContext(null);

export const AppProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [partner, setPartner] = useState(null);
    const [problems, setProblems] = useState<IProblem[]>([]);
    const [currentProblem, setCurrentProblem] = useState<IProblem | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isAiLoading, setIsAiLoading] = useState(null);
    const [notification, setNotification] = useState({ show: false, message: '', type: 'info', duration: 4000 });

    useEffect(() => {
        const unsubscribe = onAuthChange(async (currentUser) => {
            if (currentUser) {
                onUserSnapshot(currentUser.uid, async (snap) => {
                    if (snap.exists()) {
                        const userData = snap.data();
                        setUser({ uid: currentUser.uid, ...userData });
                        if (userData.partnerId) {
                            onPartnerSnapshot(userData.partnerId, (partnerSnap) => {
                                if (partnerSnap.exists()) {
                                    setPartner({ uid: userData.partnerId, ...partnerSnap.data() });
                                } else {
                                    setPartner(null);
                                }
                            });
                        } else {
                            setPartner(null);
                        }
                    } else {
                        const urlParams = new URLSearchParams(window.location.search);
                        const inviterId = urlParams.get('invite');
                        if (inviterId && inviterId !== currentUser.uid) {
                            await linkPartners(inviterId, currentUser.uid);
                            window.history.replaceState({}, document.title, window.location.pathname);
                        } else {
                            await createUserProfile(currentUser.uid);
                        }
                    }
                });
            } else {
                try {
                    const token = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;
                    if (token) {
                        await customTokenSignIn(token);
                    } else {
                        await anonymousSignIn();
                    }
                } catch (error) {
                    console.error("Authentication Error:", error);
                    setNotification({show: true, message: "Authentication failed. Please refresh.", type: 'warning'});
                }
            }
            setIsLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const {
        handleUpdate,
        handleAgreement,
        handleSteelmanApproval,
        handlePrivateSubmit,
        handleSteelmanSubmit,
        getAIAnalysis,
        handleProposeSolution,
        handleSolutionSteelmanSubmit,
    } = useProblemMutations();

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
    }, [user?.uid, currentProblem, isAiLoading, getAIAnalysis]);

    const value = {
        user,
        partner,
        problems,
        currentProblem,
        isLoading,
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
        updateUserName: (newName) => updateUserNameInDb(user.uid, newName),
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

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
