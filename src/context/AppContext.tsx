import { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
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
import {
    getTranslation,
    getAIAnalysis as getWombatAnalysis,
    getWager,
    getBSAnalysis,
    getEmergencyWombat,
    getBrainstorm,
    getCritique,
} from '../services/ai';
import { Problem } from '../types';

interface AppContextType {
    user: any;
    partner: any;
    problems: any[];
    currentProblem: any;
    isLoading: boolean;
    isAiLoading: any;
    notification: any;
    setNotification: (notification: any) => void;
    signIn: () => void;
    signInWithToken: (token: string) => void;
    invitePartner: (inviteeId: string) => void;
    updateUserName: (newName: string) => void;
    createProblem: () => void;
    setCurrentProblemById: (id: string) => void;
    handleUpdate: (problemId: string, data: any) => void;
    handleSteelmanSubmit: (text: string) => void;
    handleSteelmanApproval: () => void;
    handleSolutionSteelmanSubmit: (text: string) => void;
    handleEmergencyWombat: () => void;
    handleEscalate: () => void;
    handleBrainstorm: () => void;
    handleCritique: (problem: Problem) => void;
    handleGenerateImage: () => void;
    startNewProblem: () => void;
    setCurrentProblem: (problem: any) => void;
    handleAgreement: (type: string) => void;
    handlePrivateSubmit: (text: string) => void;
    handleProposeSolution: (text: string) => void;
    handleBSMeter: (text: string) => void;
}

export const AppContext = createContext<AppContextType | null>(null);

export const AppProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<any>(null);
    const [partner, setPartner] = useState<any>(null);
    const [problems, setProblems] = useState<Problem[]>([]);
    const [currentProblem, setCurrentProblem] = useState<Problem | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isAiLoading, setIsAiLoading] = useState<string | null>(null);
    const [notification, setNotification] = useState({ show: false, message: '', type: 'info', duration: 4000 });

    const getAIAnalysis = useCallback(async (problem: Problem) => {
        setIsAiLoading('verdict');
        const analysisText = await getWombatAnalysis(problem);
        if (analysisText) {
            await updateProblem(problem.id, { ai_analysis: analysisText, status: 'propose_solutions' });
        }
        setIsAiLoading(null);
    }, []);

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
            const fetchedProblems = querySnapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() })).sort((a: any, b: any) => b.createdAt.seconds - a.createdAt.seconds);
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

    const handleUpdate = (problemId: string, data: Record<string, unknown>) => {
        updateProblem(problemId, data);
    };

    const handleAgreement = (type: string) => {
        if (!currentProblem || !user || !currentProblem.roles) return;
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
        if (!currentProblem || !user || !currentProblem.roles) return;
        const myRole = currentProblem.roles[user.uid];
        const partnerRole = myRole === 'user1' ? 'user2' : 'user1';
        const updates: any = { [`${myRole}_approved_steelman`]: true };
        if (currentProblem[`${partnerRole}_approved_steelman`]) {
            updates.status = 'ai_review';
        }
        handleUpdate(currentProblem.id, updates);
    };

    const handlePrivateSubmit = async (text: string) => {
        if (!currentProblem || !user || !currentProblem.roles) return;
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

    const handleSteelmanSubmit = (text: string) => {
        if (!currentProblem || !user || !currentProblem.roles) return;
        const myRole = currentProblem.roles[user.uid];
        const partnerRole = myRole === 'user1' ? 'user2' : 'user1';
        const updates = { [`${myRole}_steelman`]: text, [`${myRole}_submitted_steelman`]: true };
        if (currentProblem[`${partnerRole}_submitted_steelman`]) {
            updates.status = 'steelman_approval';
        }
        handleUpdate(currentProblem.id, updates);
    };

    const handleProposeSolution = (text: string) => {
        if (!currentProblem || !user || !currentProblem.roles) return;
        const myRole = currentProblem.roles[user.uid];
        const partnerRole = myRole === 'user1' ? 'user2' : 'user1';
        const updates = { [`${myRole}_proposed_solution`]: text };
        if (currentProblem[`${partnerRole}_proposed_solution`]) {
            updates.status = 'solution_steelman';
        }
        handleUpdate(currentProblem.id, updates);
    };

    const handleSolutionSteelmanSubmit = async (text: string) => {
        if (!currentProblem || !user || !currentProblem.roles) return;
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

    const handleBrainstorm = async () => {
        if (!currentProblem) return;
        setIsAiLoading('brainstorm');
        const result = await getBrainstorm(currentProblem);
        if (result) {
            await updateProblem(currentProblem.id, { brainstormed_solutions: result });
        } else {
            setNotification({ show: true, message: "The Wombat's brainstorming circuit is jammed. Try again.", type: 'warning', duration: 4000 });
        }
        setIsAiLoading(null);
    };

    const handleCritique = async (problem: Problem) => {
        setIsAiLoading('critique');
        const result = await getCritique(problem);
        if (result) {
            setNotification({ show: true, message: result, type: 'info', duration: 8000 });
        } else {
            setNotification({ show: true, message: "The Wombat refused to critique itself. Typical.", type: 'warning', duration: 4000 });
        }
        setIsAiLoading(null);
    };

    const handleGenerateImage = () => {
        setNotification({
            show: true,
            message: "AI image generation requires a separate image API key (not yet configured). Coming soon.",
            type: 'info',
            duration: 5000,
        });
    };

    const handleEscalate = async () => {
        if (!currentProblem) return;
        if (isAiLoading === 'escalate') return;
        if (currentProblem.escalated_for_human_review) {
            setNotification({
                show: true,
                message: "Already escalated. The human wombat has your file.",
                type: 'info',
                duration: 4000,
            });
            return;
        }

        setIsAiLoading('escalate');
        try {
            await updateProblem(currentProblem.id, {
                escalated_for_human_review: true,
                human_verdict: currentProblem.human_verdict || "Pending human review.",
            });

            setNotification({
                show: true,
                message: "Escalated. Waiting for human wombat intervention.",
                type: 'info',
                duration: 4000,
            });
        } catch (error) {
            console.error("Escalation Error:", error);
            setNotification({
                show: true,
                message: "Escalation failed. Try again.",
                type: 'warning',
                duration: 4000,
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
        createProblem: async () => {
            if (!user || !partner) return;
            const docRef = await createNewProblem(user, partner);
            const newProblem = { id: docRef.id, ...(await getDoc(docRef)).data() };
            setCurrentProblem(newProblem);
        },
        setCurrentProblemById: (id: string) => {
            const selected = problems.find((p) => p.id === id);
            if (selected) setCurrentProblem(selected);
        },
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
        handleBrainstorm,
        handleCritique,
        handleGenerateImage,
        handleEscalate,
        handleBSMeter: async (text) => {
            setIsAiLoading('bs-meter');
            const result = await getBSAnalysis(text);
            setNotification({ show: true, message: result || "The Wombat is speechless.", type: 'info', duration: 4000 });
            setIsAiLoading(null);
        },
        handleEmergencyWombat: async () => {
            setIsAiLoading('emergency');
            const result = await getEmergencyWombat();
            setNotification({ show: true, message: result || "The Wombat is on a coffee break.", type: 'info', duration: 4000 });
            setIsAiLoading(null);
        },
    };

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
