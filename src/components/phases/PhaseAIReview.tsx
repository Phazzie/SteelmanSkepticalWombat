import React from 'react';
import WombatAvatar from '../ui/WombatAvatar';
import { WOMBAT_AVATAR_URL } from '../../constants';
import { useCurrentProblemData } from '../../hooks/useCurrentProblemData';
import { useProblems } from '../../hooks/useProblems';

/** Renders UI for Phase 6: Displaying the Wombat's AI-generated verdict. */
const PhaseAIReview = () => {
    const { problem } = useCurrentProblemData();
    const { handleUpdate, isAiLoading, handleEscalate } = useProblems();

    if (!problem) return null;

    return (
        <div className="text-center">
            <h3 className="text-2xl font-serif text-white mb-4">Phase 6: The Wombat's Verdict</h3>
            <div className="flex justify-center mb-4">
               <WombatAvatar src={WOMBAT_AVATAR_URL} />
            </div>
            {isAiLoading === 'verdict' && <div className="text-center p-8"><div className="text-lg font-semibold animate-pulse text-lime-400">The Wombat is judging you...</div></div>}

            {problem.human_verdict && (
                <div className="prose prose-invert text-left mt-4 p-4 bg-sky-900/50 border-2 border-dashed border-sky-400 rounded-lg whitespace-pre-wrap font-serif">
                    <h4 className="font-bold text-sky-300">A Verdict from the Human Wombat:</h4>
                    {problem.human_verdict}
                </div>
            )}

            {problem.ai_analysis && !isAiLoading && (
                <div className="prose prose-invert text-left mt-4 p-4 bg-gray-800/50 border border-gray-700 rounded-lg whitespace-pre-wrap font-serif">{problem.ai_analysis}</div>
            )}

            <div className="mt-6 flex flex-col sm:flex-row gap-4">
                <button onClick={() => handleUpdate(problem.id, { status: 'propose_solutions' })} className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg transition">
                    Let's Propose Solutions
                </button>
                <button onClick={handleEscalate} disabled={problem.escalated_for_human_review} className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-bold py-2 px-4 rounded-lg transition disabled:bg-gray-600 disabled:cursor-not-allowed">
                    {problem.escalated_for_human_review ? 'Awaiting Human Verdict' : 'Escalate to Human Wombat (Premium)'}
                </button>
            </div>
        </div>
    );
};

export default PhaseAIReview;
