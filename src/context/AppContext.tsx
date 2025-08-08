import React from 'react';
import { AuthProvider } from './AuthContext';
import { ProblemsProvider } from './ProblemsContext';

export const AppProvider = ({ children }) => {
    return (
        <AuthProvider>
            <ProblemsProvider>
                {children}
            </ProblemsProvider>
        </AuthProvider>
    );
};
