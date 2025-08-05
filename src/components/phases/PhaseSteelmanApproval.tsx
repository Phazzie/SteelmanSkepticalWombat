import React from 'react';

/** Renders UI for Phase 5: Approving the partner's steelman. */
const PhaseSteelmanApproval = ({ problem, onApprove, myRole, partnerName }) => {
    const partnerRole = myRole === 'user1' ? 'user2' : 'user1';
    const steelmanOfMyView = problem[`${partnerRole}_steelman`];
    const iHaveApproved = problem[`${myRole}_approved_steelman`];
    const partnerHasApproved = problem[`${partnerRole}_approved_steelman`];

    return (
        <div>
            <h3 className="text-2xl font-serif text-white mb-2">Phase 5: Accuracy Check</h3>
            <p className="text-gray-400 mb-4">Your partner has attempted to explain your point of view. Did they get it right? Read their attempt below. If it's a fair and accurate representation, approve it.</p>
            <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
                <p className="text-sm font-bold text-gray-400 mb-2">{partnerName}'s attempt to explain your view:</p>
                <p className="text-gray-200 whitespace-pre-wrap">{steelmanOfMyView || "Waiting for partner to write their steelman..."}</p>
            </div>
             <div className="flex justify-between items-center mt-4">
                <button onClick={onApprove} disabled={iHaveApproved || !steelmanOfMyView} className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg disabled:bg-gray-600 transition">
                    {iHaveApproved ? "You Approved This" : "Yes, This Is Accurate"}
                </button>
                 <div className="text-sm text-gray-500 text-right">
                    {iHaveApproved ? "✅ You have approved." : "Approve if this is a fair summary."}
                    <br/>
                    {partnerHasApproved ? "✅ Partner has approved." : "⏳ Waiting for partner to approve..."}
                </div>
            </div>
        </div>
    );
};

export default PhaseSteelmanApproval;
