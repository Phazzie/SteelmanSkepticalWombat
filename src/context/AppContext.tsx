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
    updateProblem,
    getDoc,
} from '../services/firebase';
import { getTranslation, getAIAnalysis as getWombatAnalysis, getWager, getBSAnalysis, getEmergencyWombat, getProblemSummary, getRelationshipAdvice } from '../services/ai';
import { ConversationBufferMemory } from "langchain/memory";

export const AppContext = createContext(null);

export const AppProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [partner, setPartner] = useState(null);
    const [problems, setProblems] = useState([]);
    const [currentProblem, setCurrentProblem] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isAiLoading, setIsAiLoading] = useState(null);
    const [notification, setNotification] = useState({ show: false, message: '', type: 'info', duration: 4000 });
    const [emergencyWombatMemory, setEmergencyWombatMemory] = useState(new ConversationBufferMemory());
    const [inviteLink, setInviteLink] = useState('');
    const [showInvite, setShowInvite] = useState(false);

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
    }, [user?.uid, currentProblem?.id]);

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

        const onChunk = (chunk) => {
            const updates = {
                [`${myRole}_translation`]: chunk,
            };
            handleUpdate(currentProblem.id, updates);
        };

        const translationResult = await getTranslation(text, onChunk);
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

    const value = {
        user,
        partner,
        problems,
        currentProblem,
        isLoading,
        isAiLoading,
        notification,
        setNotification,
        activeTab,
        setActiveTab,
        inviteLink,
        showInvite,
        generateInviteLink: () => {
            if (!user) return;
            const link = `${window.location.origin}${window.location.pathname}?invite=${user.uid}`;
            setInviteLink(link);
            setShowInvite(true);
        },
        closeInviteModal: () => setShowInvite(false),
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
            const result = await getEmergencyWombat(emergencyWombatMemory);
            setNotification({ show: true, message: result || "The Wombat is on a coffee break.", type: 'info' });
            setIsAiLoading(null);
        },
        handleGetProblemSummary: async (problem) => {
            setIsAiLoading('summary');
            const result = await getProblemSummary(problem);
            setNotification({ show: true, message: result || "The Wombat is at a loss for words.", type: 'info' });
            setIsAiLoading(null);
        },
        handleGetRelationshipAdvice: async (problem) => {
            setIsAiLoading('advice');
            const result = await getRelationshipAdvice(problem);
            setNotification({ show: true, message: result || "The Wombat has nothing to say.", type: 'info' });
            setIsAiLoading(null);
        },
    };

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
