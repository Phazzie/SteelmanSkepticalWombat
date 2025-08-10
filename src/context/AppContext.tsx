import React, { createContext, useState, useEffect, useContext, useMemo, useCallback } from 'react';
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
import { getBSAnalysis, getEmergencyWombat } from '../services/ai';
import { createProblemMutations } from '../hooks/useProblemMutations';
import { IProblem } from '../types';

export const AppContext = createContext(null);
export const useAppContext = () => useContext(AppContext);

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

    const problemMutations = useMemo(
        () => user ? createProblemMutations(user, currentProblem, setIsAiLoading) : null,
        [user, currentProblem]
    );

    useEffect(() => {
        if (!user?.uid || !problemMutations) return;

        const unsubscribe = onProblemsSnapshot(user.uid, (querySnapshot) => {
            const fetchedProblems = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as IProblem).sort((a, b) => b.createdAt.seconds - a.createdAt.seconds);
            setProblems(fetchedProblems);

            const updatedCurrent = currentProblem ? fetchedProblems.find(p => p.id === currentProblem.id) : null;
            if (updatedCurrent) {
                setCurrentProblem(updatedCurrent);
            }
        });

        return () => unsubscribe();
    }, [user?.uid, currentProblem, problemMutations]);

    // Effect for triggering AI analysis
    useEffect(() => {
        if (currentProblem?.status === 'ai_review' && !currentProblem.ai_analysis && !isAiLoading && problemMutations) {
            problemMutations.getAIAnalysis(currentProblem);
        }
    }, [currentProblem, isAiLoading, problemMutations]);

    // Effect for triggering Wager analysis
    useEffect(() => {
        if (currentProblem?.status === 'wager' && !currentProblem.wombats_wager && !isAiLoading && problemMutations) {
            problemMutations.getWagerAnalysis(currentProblem);
        }
    }, [currentProblem, isAiLoading, problemMutations]);

    const startNewProblem = useCallback(async () => {
        if (!user || !partner) return;
        const docRef = await createNewProblem(user, partner);
        const newProblem = { id: docRef.id, ...(await getDoc(docRef)).data() } as IProblem;
        setCurrentProblem(newProblem);
    }, [user, partner]);

    const updateUserName = useCallback((newName: string) => {
        if (!user) return;
        updateUserNameInDb(user.uid, newName);
    }, [user]);

    const handleBSMeter = useCallback(async (text: string) => {
        setIsAiLoading('bs-meter');
        const result = await getBSAnalysis(text);
        setNotification({ show: true, message: result || "The Wombat is speechless.", type: 'info' });
        setIsAiLoading(null);
    }, []);

    const handleEmergencyWombat = useCallback(async () => {
        setIsAiLoading('emergency');
        const result = await getEmergencyWombat();
        setNotification({ show: true, message: result || "The Wombat is on a coffee break.", type: 'info' });
        setIsAiLoading(null);
    }, []);

    const value = useMemo(() => ({
        user,
        partner,
        problems,
        currentProblem,
        isLoading,
        isAiLoading,
        setIsAiLoading,
        notification,
        setNotification,
        startNewProblem,
        setCurrentProblem,
        updateUserName,
        ...problemMutations,
        handleBSMeter,
        handleEmergencyWombat,
    }), [user, partner, problems, currentProblem, isLoading, isAiLoading, notification, startNewProblem, updateUserName, problemMutations, handleBSMeter, handleEmergencyWombat]);

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
