import React from 'react';
import { useCurrentProblemData } from '../../hooks/useCurrentProblemData';
import { useAppContext } from '../../hooks/useAppContext';

/** Renders UI for Phase 3: The Wombat's Translation */
const PhaseTranslation = () => {
    const { problem, myRole, partnerRole, partnerName } = useCurrentProblemData();
    const { handleUpdate } = useAppContext();

    if (!problem) return null;

    return (
        <div>
            <h3 className="text-2xl font-serif text-white mb-2">Phase 3: The Wombat's Translation</h3>
            <p className="text-gray-400 mb-6">The Wombat has read your private statements and offers its interpretation of the subtext. This is what it thinks you're *really* saying. No need to respond, just absorb it.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-gray-800/70 rounded-lg border border-gray-700">
                    <p className="font-bold text-gray-300 mb-2">Your Statement:</p>
                    <p className="text-sm text-gray-400 italic whitespace-pre-wrap">"{problem[`${myRole}_private_version`]}"</p>
                    <hr className="my-3 border-gray-600"/>
                    <p className="font-bold text-lime-400 mb-2">Wombat's Translation:</p>
                    <p className="text-sm text-lime-200 whitespace-pre-wrap">{problem[`${myRole}_translation`] || "Wombat is thinking..."}</p>
                </div>
                <div className="p-4 bg-gray-800/70 rounded-lg border border-gray-700">
                    <p className="font-bold text-gray-300 mb-2">{partnerName}'s Statement:</p>
                    <p className="text-sm text-gray-400 italic">Hidden to maintain privacy.</p>
                     <hr className="my-3 border-gray-600"/>
                    <p className="font-bold text-lime-400 mb-2">Wombat's Translation:</p>
                    <p className="text-sm text-lime-200 whitespace-pre-wrap">{problem[`${partnerRole}_translation`] || "Wombat is thinking..."}</p>
                </div>
            </div>
            <button onClick={() => handleUpdate(problem.id, { status: 'steelman' })} className="mt-6 w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg transition">
                Continue to the Next Phase
            </button>
        </div>
    );
};

export default PhaseTranslation;
