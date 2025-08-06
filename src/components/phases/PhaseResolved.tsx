import React, { useState } from 'react';
import { WOMBAT_TROPHY_URL } from '../../constants';
import { useCurrentProblemData } from '../../hooks/useCurrentProblemData';
import { useAppContext } from '../../hooks/useAppContext';

/** Renders UI for the final, resolved state, with new features. */
const PhaseResolved = () => {
    const { problem } = useCurrentProblemData();
    const { isAiLoading } = useAppContext();
    const [allowCritique, setAllowCritique] = useState(false);

    if (!problem) return null;

    const isPostMortemTime = problem.solution_check_date && new Date() > problem.solution_check_date.toDate();

    return (
        <div className="text-center p-10 space-y-8">
            <div>
                <img src={WOMBAT_TROPHY_URL} alt="Trophy Wombat" className="w-48 h-48 mx-auto rounded-full border-4 border-amber-400" />
                <h2 className="text-3xl font-bold font-serif text-amber-300 mt-4">Problem Resolved (For Now)</h2>
                <div className="mt-6 text-left space-y-4 max-w-lg mx-auto">
                    <div>
                        <h4 className="font-bold text-gray-400">The Disagreement:</h4>
                        <p className="p-3 bg-gray-800 rounded-lg text-gray-200">{problem.problem_statement}</p>
                    </div>
                    <div>
                        <h4 className="font-bold text-lime-400">The Agreed Solution:</h4>
                        <p className="p-3 bg-lime-900/50 rounded-lg text-lime-200">{problem.solution_statement}</p>
                    </div>
                </div>
            </div>

            <div className="border-t-2 border-dashed border-purple-500 pt-6">
                <h3 className="text-2xl font-serif text-purple-300 mb-2">Create a Memento</h3>
                <p className="text-gray-400 mb-4">Generate a unique AI artwork that represents your journey through this disagreement.</p>
                <button disabled={isAiLoading === 'image'} className="bg-purple-500 hover:bg-purple-600 text-white font-bold py-2 px-4 rounded-lg transition">
                    {isAiLoading === 'image' ? 'Generating...' : 'Generate a Memento'}
                </button>
            </div>

            {isPostMortemTime && (
                 <div className="mt-6 border-t-2 border-dashed border-sky-500 pt-6">
                    <h3 className="text-2xl font-serif text-sky-300 mb-2">Post-Mortem Review</h3>
                    <p className="text-gray-400 mb-4">It's been over a week. Is the solution actually working, or are you just pretending? Be honest.</p>
                    {/* ... Post-mortem buttons ... */}
                </div>
            )}

            <div className="border-t-2 border-dashed border-gray-600 pt-6">
                <h3 className="text-2xl font-serif text-gray-400 mb-2">Help Improve the Wombat</h3>
                <p className="text-gray-500 mb-4">If you allow it, the Wombat will review its own performance and send the anonymous feedback to its human handler to help it become even more skeptical and insightful.</p>
                <div className="flex items-center justify-center space-x-4 p-4 bg-gray-800 rounded-lg">
                    <input type="checkbox" id="critique-check" checked={allowCritique} onChange={(e) => setAllowCritique(e.target.checked)} className="h-6 w-6 rounded text-lime-500 focus:ring-lime-400 bg-gray-700 border-gray-600"/>
                    <label htmlFor="critique-check" className="text-gray-300">I allow the Wombat to critique this session.</label>
                    <button disabled={!allowCritique || isAiLoading === 'critique'} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg transition disabled:bg-gray-700 disabled:cursor-not-allowed">
                        {isAiLoading === 'critique' ? 'Critiquing...' : 'Submit Feedback'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PhaseResolved;
