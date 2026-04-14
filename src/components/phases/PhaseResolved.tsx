import React, { useState } from 'react';
import { WOMBAT_TROPHY_URL } from '../../constants';
import { Problem } from '../../types';

interface PhaseResolvedProps {
    problem: Problem;
    onUpdate: (problemId: string, data: Record<string, unknown>) => void;
    myRole: 'user1' | 'user2';
    onGenerateImage: () => void;
    isAiLoading: string | boolean | null;
    mementoImage: string | null;
    onCritique: (problem: Problem) => void;
}

/** Renders UI for the final, resolved state. */
const PhaseResolved: React.FC<PhaseResolvedProps> = ({
    problem,
    onUpdate,
    myRole,
    onGenerateImage,
    isAiLoading,
    mementoImage,
    onCritique,
}) => {
    const isPostMortemTime =
        problem.solution_check_date != null &&
        (() => {
            const ts = problem.solution_check_date;
            const d = ts && typeof (ts as { toDate?: () => Date }).toDate === 'function'
                ? (ts as { toDate: () => Date }).toDate()
                : (ts as Date);
            return new Date() > d;
        })();

    const myFeedback = problem[`${myRole}_post_mortem`];
    const [allowCritique, setAllowCritique] = useState(false);

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
                <button onClick={onGenerateImage} disabled={isAiLoading === 'image'} className="bg-purple-500 hover:bg-purple-600 text-white font-bold py-2 px-4 rounded-lg transition disabled:bg-gray-600 disabled:cursor-not-allowed">
                    {isAiLoading === 'image' ? 'Generating...' : 'Generate a Memento'}
                </button>
                {mementoImage && <img src={mementoImage} alt="AI-generated memento" className="mt-4 rounded-lg shadow-lg mx-auto" />}
            </div>

            {isPostMortemTime && (
                <div className="mt-6 border-t-2 border-dashed border-sky-500 pt-6">
                    <h3 className="text-2xl font-serif text-sky-300 mb-2">Post-Mortem Review</h3>
                    <p className="text-gray-400 mb-4">It's been over a week. Is the solution actually working, or are you just pretending? Be honest.</p>
                    {myFeedback ? (
                        <div className="inline-flex items-center gap-2 px-4 py-3 bg-sky-900/30 border border-sky-500/30 rounded-lg">
                            <span className="text-sky-300 font-semibold">
                                {myFeedback === 'working' ? '✅ You reported it is working.' : '❌ You reported it fell apart.'}
                            </span>
                        </div>
                    ) : (
                        <div className="flex gap-4 justify-center flex-wrap">
                            <button
                                onClick={() => onUpdate(problem.id, { [`${myRole}_post_mortem`]: 'working' })}
                                className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-lg transition"
                            >
                                ✅ Yes, It's Working
                            </button>
                            <button
                                onClick={() => onUpdate(problem.id, { [`${myRole}_post_mortem`]: 'not_working' })}
                                className="bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-6 rounded-lg transition"
                            >
                                ❌ No, It Fell Apart
                            </button>
                        </div>
                    )}
                </div>
            )}

            <div className="border-t-2 border-dashed border-gray-600 pt-6">
                <h3 className="text-2xl font-serif text-gray-400 mb-2">Help Improve the Wombat</h3>
                <p className="text-gray-500 mb-4">If you allow it, the Wombat will review its own performance and send the anonymous feedback to its human handler to help it become even more skeptical and insightful.</p>
                <div className="flex items-center justify-center space-x-4 p-4 bg-gray-800 rounded-lg">
                    <input
                        type="checkbox"
                        id="critique-check"
                        checked={allowCritique}
                        onChange={(e) => setAllowCritique(e.target.checked)}
                        className="h-6 w-6 rounded text-lime-500 focus:ring-lime-400 bg-gray-700 border-gray-600"
                    />
                    <label htmlFor="critique-check" className="text-gray-300">I allow the Wombat to critique this session.</label>
                    <button
                        onClick={() => onCritique(problem)}
                        disabled={!allowCritique || isAiLoading === 'critique'}
                        className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg transition disabled:bg-gray-700 disabled:cursor-not-allowed"
                    >
                        {isAiLoading === 'critique' ? 'Critiquing...' : 'Submit Feedback'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PhaseResolved;
