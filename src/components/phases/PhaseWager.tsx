import React from 'react';
import { useCurrentProblemData } from '../../hooks/useCurrentProblemData';
import { useAppContext } from '../../context/AppContext';

/** Renders UI for Phase 9: The Wombat's Wager */
const PhaseWager = () => {
    const { problem } = useCurrentProblemData();
    const { handleAdvanceToSolution, isAiLoading } = useAppContext();

    if (!problem) return null;

    return (
        <div className="text-center">
            <h3 className="text-2xl font-serif text-white mb-2">Phase 9: The Wombat's Wager</h3>
            <p className="text-gray-400 mb-4">The Wombat has reviewed both proposals and how well you understood them. It has now placed its bet. Consider this before creating your final plan.</p>
            {isAiLoading === 'wager' && <p className="text-amber-400 text-sm mt-2 animate-pulse">Wombat is calculating the odds...</p>}
            {problem.wombats_wager && (
                 <div className="p-4 bg-gray-800/70 rounded-lg border-2 border-dashed border-amber-500">
                    <p className="font-bold text-amber-300 mb-2">The Wombat's Wager:</p>
                    <p className="text-amber-200 whitespace-pre-wrap">{problem.wombats_wager}</p>
                </div>
            )}
             <button onClick={handleAdvanceToSolution} className="mt-6 w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg transition">
                Proceed to Final Solution
            </button>
        </div>
    );
};

export default PhaseWager;
