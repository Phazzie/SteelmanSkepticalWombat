import React from 'react';
import { useCurrentProblemData } from '../../hooks/useCurrentProblemData';
import { useProblems } from '../../context/ProblemsContext';

/** Renders UI for Phase 10: Collaborating on a final solution. */
const PhaseSolution = () => {
    const { problem, iHaveAgreed } = useCurrentProblemData();
    const { handleUpdate, handleAgreement, isAiLoading, handleBrainstorm } = useProblems();

    if (!problem) return null;

    return (
        <div>
            <h3 className="text-2xl font-serif text-white mb-2">Phase 10: Agree on a Final Solution</h3>
            <p className="text-gray-400 mb-4">You've heard the Wombat. Now, write a single, concrete, actionable solution you can both live with. This is the final step. If you're stuck, ask the Wombat to brainstorm.</p>

            {problem.brainstormed_solutions && (
                <div className="prose prose-invert text-sm mt-2 mb-4 p-4 bg-gray-800/50 border border-gray-700 rounded-lg whitespace-pre-wrap font-serif">
                    <h4 className="font-bold text-lime-400">Wombat's Brainstorm:</h4>
                    {problem.brainstormed_solutions}
                </div>
            )}

            <textarea
                className="w-full p-3 border-2 border-gray-700 rounded-lg bg-gray-800 text-gray-200 focus:ring-2 focus:ring-lime-400 focus:border-lime-400 transition"
                rows="4"
                defaultValue={problem.solution_statement}
                onBlur={(e) => handleUpdate(problem.id, { solution_statement: e.target.value })}
                disabled={iHaveAgreed}
            />
            <div className="flex flex-col sm:flex-row justify-between items-center mt-4 gap-4">
                <button onClick={handleBrainstorm} disabled={isAiLoading === 'brainstorm'} className="bg-sky-500 hover:bg-sky-600 text-white font-bold py-2 px-4 rounded-lg transition w-full sm:w-auto">
                    {isAiLoading === 'brainstorm' ? 'Brainstorming...' : 'Wombat, Brainstorm for Us'}
                </button>
                <button onClick={() => handleAgreement('solution')} disabled={iHaveAgreed} className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg disabled:bg-gray-600 transition w-full sm:w-auto">
                    {iHaveAgreed ? "You Agreed" : "I Agree To This Final Solution"}
                </button>
            </div>
        </div>
    );
};

export default PhaseSolution;
