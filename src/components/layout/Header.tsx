import React from 'react';
import WombatAvatar from '../ui/WombatAvatar';
import { useAppContext } from '../../hooks/useAppContext';

const Header = ({ startTour }) => {
    const {
        user,
        partner,
        isAiLoading,
        handleEmergencyWombat,
        generateInviteLink,
    } = useAppContext();

    return (
        <header className="app-header bg-gray-900/50 backdrop-blur-sm shadow-lg sticky top-0 z-40 border-b border-white/10">
            <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
                <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center font-serif">
                    <WombatAvatar className="w-10 h-10 mr-3" />
                    Skeptical Wombat
                </h1>
                <div>
                    {!user && <div className="text-sm text-gray-400">Loading...</div>}
                    {user && !partner && (
                        <button onClick={generateInviteLink} className="bg-lime-500 hover:bg-lime-600 text-gray-900 font-bold py-2 px-4 rounded-lg transition">Invite Partner</button>
                    )}
                    {user && (
                        <button onClick={startTour} className="ml-4 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg transition">Start Tour</button>
                    )}
                    {user && partner && (
                         <button onClick={handleEmergencyWombat} disabled={!!isAiLoading} className="bg-red-500/80 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg transition disabled:bg-red-800 disabled:animate-pulse">
                            {isAiLoading === 'emergency' ? (
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            ) : 'Emergency Wombat'}
                        </button>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Header;
