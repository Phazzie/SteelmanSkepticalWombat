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
} from '../services/firebase';

interface AuthContextType {
    user: { uid: string; [key: string]: any } | null;
    partner: { uid: string; [key: string]: any } | null;
    isLoading: boolean;
    notification: { show: boolean; message: string; type: string; duration: number };
    setNotification: React.Dispatch<React.SetStateAction<{ show: boolean; message: string; type: string; duration: number }>>;
    updateUserName: (newName: string) => void;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [partner, setPartner] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [notification, setNotification] = useState({ show: false, message: '', type: 'info', duration: 4000 });

    useEffect(() => {
        let unsubscribeUser = () => {};
        let unsubscribePartner = () => {};

        const unsubscribeAuth = onAuthChange(async (currentUser) => {
            // Clean up previous listeners to prevent memory leaks
            unsubscribeUser();
            unsubscribePartner();
            setPartner(null);

            if (currentUser) {
                unsubscribeUser = onUserSnapshot(currentUser.uid, async (snap) => {
                    if (snap.exists()) {
                        const userData = snap.data();
                        setUser({ uid: currentUser.uid, ...userData });

                        // Clean up previous partner listener before creating a new one
                        unsubscribePartner();
                        if (userData.partnerId) {
                            unsubscribePartner = onPartnerSnapshot(userData.partnerId, (partnerSnap) => {
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

        return () => {
            unsubscribeAuth();
            unsubscribeUser();
            unsubscribePartner();
        };
    }, []);

    const updateUserName = (newName) => {
        if (user && newName) {
            updateUserNameInDb(user.uid, newName);
        }
    };

    const value = {
        user,
        partner,
        isLoading,
        notification,
        setNotification,
        updateUserName,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
