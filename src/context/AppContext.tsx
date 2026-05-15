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

type Role = 'user1' | 'user2';
type LoadingState = null | 'verdict' | 'translation' | 'wager' | 'brainstorm' | 'critique' | 'escalate' | 'bs-meter' | 'emergency';
type NotificationType = 'info' | 'warning';

interface UserProfile {
    uid: string;
    name?: string;
    partnerId?: string | null;
}

interface NotificationState {
    show: boolean;
    message: string;
    type: NotificationType;
    duration: number;
}

interface AppContextType {
    user: UserProfile | null;
    partner: UserProfile | null;
    problems: Problem[];
    currentProblem: Problem | null;
    isLoading: boolean;
    isAiLoading: LoadingState;
    notification: NotificationState;
    setNotification: (notification: NotificationState) => void;
    signIn: () => void;
    signInWithToken: (token: string) => void;
    invitePartner: (inviteeId: string) => void;
    updateUserName: (newName: string) => void;
    createProblem: () => void;
    setCurrentProblemById: (id: string) => void;
    handleUpdate: (problemId: string, data: Partial<Problem> | Record<string, unknown>) => Promise<void>;
    handleSteelmanSubmit: (text: string) => void;
    handleSteelmanApproval: () => void;
    handleSolutionSteelmanSubmit: (text: string) => Promise<void>;
    handleEmergencyWombat: () => Promise<void>;
    handleEscalate: () => Promise<void>;
    handleBrainstorm: () => Promise<void>;
    handleCritique: (problem: Problem) => Promise<void>;
    handleGenerateImage: () => void;
    startNewProblem: () => Promise<void>;
    setCurrentProblem: (problem: Problem | null) => void;
    handleAgreement: (type: string) => void;
    handlePrivateSubmit: (text: string) => Promise<void>;
    handleProposeSolution: (text: string) => void;
    handleBSMeter: (text: string) => Promise<void>;
}

const getPartnerRole = (role: Role): Role => (role === 'user1' ? 'user2' : 'user1');

const getUserRole = (problem: Problem | null, user: UserProfile | null): Role | null => {
    if (!problem?.roles || !user?.uid) return null;
    return problem.roles[user.uid] ?? null;
};

export const AppContext = createContext<AppContextType | null>(null);

export const AppProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<UserProfile | null>(null);
    const [partner, setPartner] = useState<UserProfile | null>(null);
    const [problems, setProblems] = useState<Problem[]>([]);
    const [currentProblem, setCurrentProblem] = useState<Problem | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isAiLoading, setIsAiLoading] = useState<LoadingState>(null);
    const [notification, setNotification] = useState<NotificationState>({ show: false, message: '', type: 'info', duration: 4000 });

    const notify = useCallback((message: string, type: NotificationType = 'warning', duration = 4000) => {
        setNotification({ show: true, message, type, duration });
    }, []);

    const handleUpdate = useCallback(async (problemId: string, data: Partial<Problem> | Record<string, unknown>) => {
        try {
            await updateProblem(problemId, data);
        } catch (error) {
            console.error('Problem Update Error:', error);
            notify('Could not save that update. The Wombat blames the network goblin.', 'warning');
        }
    }, [notify]);

    const getAIAnalysis = useCallback(async (problem: Problem) => {
        setIsAiLoading('verdict');
        try {
            const analysisText = await getWombatAnalysis(problem);
            if (analysisText) {
                await updateProblem(problem.id, { ai_analysis: analysisText, status: 'propose_solutions' });
            } else {
                notify("The Wombat's verdict came back empty. Useless, but at least honest.", 'warning');
            }
        } catch (error) {
            console.error('AI Analysis Error:', error);
            notify('The Wombat failed to render judgment. Try again.', 'warning');
        } finally {
            setIsAiLoading(null);
        }
    }, [notify]);

    useEffect(() => {
        let unsubscribeUser: (() => void) | undefined;

        const unsubscribeAuth = onAuthChange(async (currentUser) => {
            unsubscribeUser?.();
            unsubscribeUser = undefined;

            if (currentUser) {
                unsubscribeUser = onUserSnapshot(currentUser.uid, async (snap) => {
                    if (snap.exists()) {
                        const userData = snap.data();
                        setUser({ uid: currentUser.uid, ...userData });
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
                setUser(null);
                setPartner(null);
                try {
                    const token = (globalThis as { __initial_auth_token?: string }).__initial_auth_token || null;
                    if (token) {
                        await customTokenSignIn(token);
                    } else {
                        await anonymousSignIn();
                    }
                } catch (error) {
                    console.error('Authentication Error:', error);
                    notify('Authentication failed. Please refresh.', 'warning');
                }
            }
            setIsLoading(false);
        });

        return () => {
            unsubscribeUser?.();
            unsubscribeAuth();
        };
    }, [notify]);

    useEffect(() => {
        if (!user?.partnerId) {
            setPartner(null);
            return;
        }

        const unsubscribePartner = onPartnerSnapshot(user.partnerId, (partnerSnap) => {
            if (partnerSnap.exists()) {
                setPartner({ uid: user.partnerId as string, ...partnerSnap.data() });
            } else {
                setPartner(null);
            }
        });

        return () => unsubscribePartner();
    }, [user?.partnerId]);

    useEffect(() => {
        if (!user?.uid) return;
        const unsubscribe = onProblemsSnapshot(user.uid, (querySnapshot) => {
            const fetchedProblems = querySnapshot.docs
                .map((doc) => ({ ...doc.data(), id: doc.id } as Problem))
                .sort((a, b) => {
                    const bSeconds = 'seconds' in (b.createdAt ?? {}) ? Number(b.createdAt?.seconds) : 0;
                    const aSeconds = 'seconds' in (a.createdAt ?? {}) ? Number(a.createdAt?.seconds) : 0;
                    return bSeconds - aSeconds;
                });
            setProblems(fetchedProblems);

            if (!currentProblem?.id) return;
            const updatedCurrent = fetchedProblems.find((p) => p.id === currentProblem.id);
            if (updatedCurrent) {
                setCurrentProblem(updatedCurrent);
                if (updatedCurrent.status === 'ai_review' && !updatedCurrent.ai_analysis && !isAiLoading) {
                    void getAIAnalysis(updatedCurrent);
                }
            }
        });
        return () => unsubscribe();
    }, [user?.uid, currentProblem?.id, isAiLoading, getAIAnalysis]);

    const handleAgreement = useCallback((type: string) => {
        const myRole = getUserRole(currentProblem, user);
        if (!currentProblem || !myRole) return;
        const partnerRole = getPartnerRole(myRole);
        if (type === 'problem') {
            const updates: Record<string, unknown> = { [`${myRole}_agreed_problem`]: true };
            if (currentProblem[`${partnerRole}_agreed_problem`]) updates.status = 'private_versions';
            void handleUpdate(currentProblem.id, updates);
        } else if (type === 'solution') {
            const updates: Record<string, unknown> = { [`${myRole}_agreed_solution`]: true };
            if (currentProblem[`${partnerRole}_agreed_solution`]) {
                updates.status = 'resolved';
                updates.solution_check_date = new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000);
            }
            void handleUpdate(currentProblem.id, updates);
        }
    }, [currentProblem, handleUpdate, user]);

    const handleSteelmanApproval = useCallback(() => {
        const myRole = getUserRole(currentProblem, user);
        if (!currentProblem || !myRole) return;
        const partnerRole = getPartnerRole(myRole);
        const updates: Record<string, unknown> = { [`${myRole}_approved_steelman`]: true };
        if (currentProblem[`${partnerRole}_approved_steelman`]) {
            updates.status = 'ai_review';
        }
        void handleUpdate(currentProblem.id, updates);
    }, [currentProblem, handleUpdate, user]);

    const handlePrivateSubmit = useCallback(async (text: string) => {
        const myRole = getUserRole(currentProblem, user);
        if (!currentProblem || !myRole) return;
        setIsAiLoading('translation');
        try {
            const partnerRole = getPartnerRole(myRole);
            const translationResult = await getTranslation(text);
            const updates: Record<string, unknown> = {
                [`${myRole}_private_version`]: text,
                [`${myRole}_submitted_private`]: true,
                [`${myRole}_translation`]: translationResult || 'Translation failed.',
            };
            if (currentProblem[`${partnerRole}_submitted_private`]) updates.status = 'translation';
            await handleUpdate(currentProblem.id, updates);
        } finally {
            setIsAiLoading(null);
        }
    }, [currentProblem, handleUpdate, user]);

    const handleSteelmanSubmit = useCallback((text: string) => {
        const myRole = getUserRole(currentProblem, user);
        if (!currentProblem || !myRole) return;
        const partnerRole = getPartnerRole(myRole);
        const updates: Record<string, unknown> = { [`${myRole}_steelman`]: text, [`${myRole}_submitted_steelman`]: true };
        if (currentProblem[`${partnerRole}_submitted_steelman`]) {
            updates.status = 'steelman_approval';
        }
        void handleUpdate(currentProblem.id, updates);
    }, [currentProblem, handleUpdate, user]);

    const handleProposeSolution = useCallback((text: string) => {
        const myRole = getUserRole(currentProblem, user);
        if (!currentProblem || !myRole) return;
        const partnerRole = getPartnerRole(myRole);
        const updates: Record<string, unknown> = { [`${myRole}_proposed_solution`]: text };
        if (currentProblem[`${partnerRole}_proposed_solution`]) {
            updates.status = 'solution_steelman';
        }
        void handleUpdate(currentProblem.id, updates);
    }, [currentProblem, handleUpdate, user]);

    const handleSolutionSteelmanSubmit = useCallback(async (text: string) => {
        const myRole = getUserRole(currentProblem, user);
        if (!currentProblem || !myRole) return;
        const partnerRole = getPartnerRole(myRole);
        const updates: Record<string, unknown> = { [`${myRole}_solution_steelman`]: text };

        if (!currentProblem[`${partnerRole}_solution_steelman`]) {
            await handleUpdate(currentProblem.id, updates);
            return;
        }

        setIsAiLoading('wager');
        try {
            const wagerResult = await getWager(currentProblem, text);
            if (wagerResult) {
                updates.wombats_wager = wagerResult;
                updates.status = 'wager';
            } else {
                notify("The Wombat couldn't pick a wager. Democracy has failed again.", 'warning');
            }
            await handleUpdate(currentProblem.id, updates);
        } finally {
            setIsAiLoading(null);
        }
    }, [currentProblem, handleUpdate, notify, user]);

    const handleBrainstorm = useCallback(async () => {
        if (!currentProblem) return;
        setIsAiLoading('brainstorm');
        try {
            const result = await getBrainstorm(currentProblem);
            if (result) {
                await updateProblem(currentProblem.id, { brainstormed_solutions: result });
            } else {
                notify("The Wombat's brainstorming circuit is jammed. Try again.", 'warning');
            }
        } finally {
            setIsAiLoading(null);
        }
    }, [currentProblem, notify]);

    const handleCritique = useCallback(async (problem: Problem) => {
        setIsAiLoading('critique');
        try {
            const result = await getCritique(problem);
            if (result) {
                notify(result, 'info', 8000);
            } else {
                notify('The Wombat refused to critique itself. Typical.', 'warning');
            }
        } finally {
            setIsAiLoading(null);
        }
    }, [notify]);

    const handleGenerateImage = useCallback(() => {
        notify('AI image generation requires a separate image API key (not yet configured). Coming soon.', 'info', 5000);
    }, [notify]);

    const handleEscalate = useCallback(async () => {
        if (!currentProblem || isAiLoading === 'escalate') return;
        if (currentProblem.escalated_for_human_review) {
            notify('Already escalated. The human wombat has your file.', 'info');
            return;
        }

        setIsAiLoading('escalate');
        try {
            await updateProblem(currentProblem.id, {
                escalated_for_human_review: true,
                human_verdict: currentProblem.human_verdict || 'Pending human review.',
            });
            notify('Escalated. Waiting for human wombat intervention.', 'info');
        } catch (error) {
            console.error('Escalation Error:', error);
            notify('Escalation failed. Try again.', 'warning');
        } finally {
            setIsAiLoading(null);
        }
    }, [currentProblem, isAiLoading, notify]);

    const createAndSelectProblem = useCallback(async () => {
        if (!user || !partner) return;
        const docRef = await createNewProblem(user, partner);
        const newProblem = { ...(await getDoc(docRef)).data(), id: docRef.id } as Problem;
        setCurrentProblem(newProblem);
    }, [partner, user]);

    const setCurrentProblemById = useCallback((id: string) => {
        const selected = problems.find((p) => p.id === id);
        if (selected) setCurrentProblem(selected);
    }, [problems]);

    const handleBSMeter = useCallback(async (text: string) => {
        setIsAiLoading('bs-meter');
        try {
            const result = await getBSAnalysis(text);
            notify(result || 'The Wombat is speechless.', 'info');
        } finally {
            setIsAiLoading(null);
        }
    }, [notify]);

    const handleEmergencyWombat = useCallback(async () => {
        setIsAiLoading('emergency');
        try {
            const result = await getEmergencyWombat();
            notify(result || 'The Wombat is on a coffee break.', 'info');
        } finally {
            setIsAiLoading(null);
        }
    }, [notify]);

    const value: AppContextType = {
        user,
        partner,
        problems,
        currentProblem,
        isLoading,
        isAiLoading,
        notification,
        setNotification,
        signIn: () => { void anonymousSignIn(); },
        signInWithToken: (token: string) => { void customTokenSignIn(token); },
        invitePartner: (inviteeId: string) => {
            if (user?.uid) void linkPartners(user.uid, inviteeId);
        },
        createProblem: () => { void createAndSelectProblem(); },
        setCurrentProblemById,
        startNewProblem: createAndSelectProblem,
        setCurrentProblem,
        updateUserName: (newName: string) => {
            if (user?.uid) void updateUserNameInDb(user.uid, newName);
        },
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
        handleBSMeter,
        handleEmergencyWombat,
    };

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
