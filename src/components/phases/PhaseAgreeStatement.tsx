import React from 'react';

/** Renders UI for Phase 1: Agreeing on a problem statement. */
const PhaseAgreeStatement = ({ problem, onUpdate, onAgree, myRole }) => {
    const iHaveAgreed = problem[`${myRole}_agreed_problem`];
    const partnerHasAgreed = problem[`${myRole === 'user1' ? 'user2' : 'user1'}_agreed_problem`];
    return (
        <div>
            <h3 className="text-2xl font-serif text-white mb-2">Phase 1: Define the Disagreement</h3>
            <p className="text-gray-400 mb-4">Collaborate on one, neutral sentence. No blame, no feelings. Just state the situation as if you were a boring robot. The Wombat is watching.</p>
            <textarea
                className="w-full p-3 border-2 border-gray-700 rounded-lg bg-gray-800 text-gray-200 focus:ring-2 focus:ring-lime-400 focus:border-lime-400 transition"
                rows="4"
                defaultValue={problem.problem_statement}
                onBlur={(e) => onUpdate(problem.id, { problem_statement: e.target.value })}
                disabled={iHaveAgreed}
            />
            <div className="flex justify-between items-center mt-4">
                <button onClick={() => onAgree('problem')} disabled={iHaveAgreed} className="bg-lime-500 hover:bg-lime-600 text-gray-900 font-bold py-2 px-4 rounded-lg disabled:bg-gray-600 disabled:cursor-not-allowed transition">
                    {iHaveAgreed ? "You've Agreed" : "I Agree With This Statement"}
                </button>
                <div className="text-sm text-gray-500">
                    {partnerHasAgreed ? "✅ Partner has agreed" : "⏳ Waiting for partner..."}
                </div>
            </div>
        </div>
    );
};

export default PhaseAgreeStatement;
