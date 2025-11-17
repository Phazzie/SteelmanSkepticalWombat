import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
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
    updateProblem,
    getDoc,
} from '../services/firebase';
import { getTranslation, getAIAnalysis as getWombatAnalysis, getWager, getBSAnalysis, getEmergencyWombat } from '../services/ai';
import { User, Partner, Problem, Notification } from '../types';

interface AppContextType {
    user: User | null;
    partner: Partner | null;
    problems: Problem[];
    currentProblem: Problem | null;
    isLoading: boolean;
    isAiLoading: string | null;
    notification: Notification;
    setNotification: (notification: Notification) => void;
    signIn: () => void;
    signInWithToken: (token: string) => void;
    invitePartner: (inviteeId: string) => void;
    updateUserName: (newName: string) => void;
    createProblem: () => void;
    setCurrentProblemById: (id: string) => void;
    handleUpdate: (problemId: string, data: Partial<Problem>) => void;
    handleSteelmanSubmit: (text: string) => void;
    handleSteelmanApproval: () => void;
    handleSolutionSteelmanSubmit: (text: string) => void;
    handleMemento: () => void;
    handleEmergencyWombat: () => void;
    startNewProblem: () => void;
    setCurrentProblem: (problem: Problem | null) => void;
    handleAgreement: (type: string) => void;
    handlePrivateSubmit: (text: string) => void;
    handleProposeSolution: (text: string) => void;
    handleBSMeter: (text: string) => void;
}

export const AppContext = createContext<AppContextType | null>(null);

export const AppProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [partner, setPartner] = useState<Partner | null>(null);
    const [problems, setProblems] = useState<Problem[]>([]);
    const [currentProblem, setCurrentProblem] = useState<Problem | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isAiLoading, setIsAiLoading] = useState<string | null>(null);
    const [notification, setNotification] = useState<Notification>({ show: false, message: '', type: 'info', duration: 4000 });

    const getAIAnalysis = useCallback(async (problem) => {
        try {
            setIsAiLoading('verdict');
            const analysisText = await getWombatAnalysis(problem);
            if (analysisText) {
                await updateProblem(problem.id, { ai_analysis: analysisText, status: 'propose_solutions' });
            }
        } catch (error) {
            console.error('Error getting AI analysis:', error);
            setNotification({
                show: true,
                message: 'Failed to get AI analysis. Please try again.',
                type: 'error',
                duration: 4000
            });
        } finally {
            setIsAiLoading(null);
        }
    }, []);

    useEffect(() => {
        const unsubscribe = onAuthChange(async (currentUser) => {
            if (currentUser) {
                onUserSnapshot(currentUser.uid, async (snap) => {
                    try {
                        if (snap.exists()) {
                            const userData = snap.data();
                            if (!userData) {
                                console.error("User data is null for uid:", currentUser.uid);
                                return;
                            }
                            setUser({ uid: currentUser.uid, ...userData } as User);
                            if (userData.partnerId) {
                                onPartnerSnapshot(userData.partnerId, (partnerSnap) => {
                                    try {
                                        if (partnerSnap.exists()) {
                                            const partnerData = partnerSnap.data();
                                            if (partnerData) {
                                                setPartner({ uid: userData.partnerId, ...partnerData } as Partner);
                                            } else {
                                                console.error("Partner data is null for partnerId:", userData.partnerId);
                                                setPartner(null);
                                            }
                                        } else {
                                            setPartner(null);
                                        }
                                    } catch (error) {
                                        console.error('Error in partner snapshot:', error);
                                        setNotification({
                                            show: true,
                                            message: 'Failed to load partner data.',
                                            type: 'error',
                                            duration: 4000
                                        });
                                    }
                                }, (error) => {
                                    console.error('Partner snapshot listener error:', error);
                                    setNotification({
                                        show: true,
                                        message: 'Lost connection to partner data.',
                                        type: 'error',
                                        duration: 4000
                                    });
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
                    } catch (error) {
                        console.error('Error in user snapshot:', error);
                        setNotification({
                            show: true,
                            message: 'Failed to load user data.',
                            type: 'error',
                            duration: 4000
                        });
                    }
                }, (error) => {
                    console.error('User snapshot listener error:', error);
                    setNotification({
                        show: true,
                        message: 'Lost connection to user data. Please refresh.',
                        type: 'error',
                        duration: 4000
                    });
                });
            } else {
                try {
                    const token = (globalThis as any).__initial_auth_token || null;
                    if (token) {
                        await customTokenSignIn(token);
                    } else {
                        await anonymousSignIn();
                    }
                } catch (error) {
                    console.error("Authentication Error:", error);
                    setNotification({show: true, message: "Authentication failed. Please refresh.", type: 'warning', duration: 4000});
                }
            }
            setIsLoading(false);
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (!user?.uid) return;
        const unsubscribe = onProblemsSnapshot(user.uid, (querySnapshot) => {
            const fetchedProblems = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Problem)).sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
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
    }, [user?.uid, currentProblem?.id, isAiLoading, currentProblem, getAIAnalysis]);

    const handleUpdate = (problemId, data) => {
        updateProblem(problemId, data);
    };

    const handleAgreement = (type: string) => {
        if (!currentProblem || !user) return;
        const myRole = currentProblem.roles[user.uid];
        const partnerRole = myRole === 'user1' ? 'user2' : 'user1';
        if (type === 'problem') {
            const updates: any = { [`${myRole}_agreed_problem`]: true };
            if (currentProblem[`${partnerRole}_agreed_problem`]) updates.status = 'private_versions';
            handleUpdate(currentProblem.id, updates);
        } else if (type === 'solution') {
            const updates: any = { [`${myRole}_agreed_solution`]: true };
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
        const updates: any = { [`${myRole}_approved_steelman`]: true };
        if (currentProblem[`${partnerRole}_approved_steelman`]) {
            updates.status = 'ai_review';
        }
        handleUpdate(currentProblem.id, updates);
    };

    const handlePrivateSubmit = async (text) => {
        if (!currentProblem || !user) return;
        try {
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
        } catch (error) {
            console.error('Error submitting private version:', error);
            setNotification({
                show: true,
                message: 'Failed to submit private version. Please try again.',
                type: 'error',
                duration: 4000
            });
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
        try {
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
            } else {
                await handleUpdate(currentProblem.id, updates);
            }
        } catch (error) {
            console.error('Error submitting solution steelman:', error);
            setNotification({
                show: true,
                message: 'Failed to submit solution steelman. Please try again.',
                type: 'error',
                duration: 4000
            });
        } finally {
            setIsAiLoading(null);
        }
    };

    const value = {
        user,
        partner,
        problems,
        currentProblem,
        isLoading,
        isAiLoading,
        notification,
        setNotification,
        signIn: () => anonymousSignIn(),
        signInWithToken: (token: string) => customTokenSignIn(token),
        invitePartner: (inviteeId: string) => linkPartners(user.uid, inviteeId),
        createProblem: () => {},
        setCurrentProblemById: (_id: string) => {},
        startNewProblem: async () => {
            try {
                const docRef = await createNewProblem(user, partner);
                const docSnap = await getDoc(docRef);
                const problemData = docSnap.data();
                if (!problemData) {
                    console.error("Failed to retrieve problem data after creation");
                    setNotification({ show: true, message: "Failed to create problem. Please try again.", type: 'warning', duration: 4000 });
                    return;
                }
                const newProblem = { id: docRef.id, ...problemData } as Problem;
                setCurrentProblem(newProblem)
            } catch (error) {
                console.error('Error starting new problem:', error);
                setNotification({
                    show: true,
                    message: 'Failed to create new problem. Please try again.',
                    type: 'error',
                    duration: 4000
                });
            }
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
            try {
                setIsAiLoading('bs-meter');
                const result = await getBSAnalysis(text);
                setNotification({ show: true, message: result || "The Wombat is speechless.", type: 'info', duration: 4000 });
            } catch (error) {
                console.error('Error getting BS analysis:', error);
                setNotification({
                    show: true,
                    message: 'Failed to get BS meter analysis. Please try again.',
                    type: 'error',
                    duration: 4000
                });
            } finally {
                setIsAiLoading(null);
            }
        },
        handleMemento: async () => {
            // Placeholder for memento functionality
            setNotification({ show: true, message: "Memento feature coming soon!", type: 'info', duration: 4000 });
        },
        handleEmergencyWombat: async () => {
            try {
                setIsAiLoading('emergency');
                const result = await getEmergencyWombat();
                setNotification({ show: true, message: result || "The Wombat is on a coffee break.", type: 'info', duration: 4000 });
            } catch (error) {
                console.error('Error calling emergency wombat:', error);
                setNotification({
                    show: true,
                    message: 'Failed to summon Emergency Wombat. Please try again.',
                    type: 'error',
                    duration: 4000
                });
            } finally {
                setIsAiLoading(null);
            }
        },
    };

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
