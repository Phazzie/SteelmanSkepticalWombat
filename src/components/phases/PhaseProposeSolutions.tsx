import React from 'react';
import DraftTextarea from '../ui/DraftTextarea';

/** Renders UI for Phase 7: Proposing individual solutions. */
const PhaseProposeSolutions = ({ problem, onSave, onSubmit, myRole }) => {
    const iHaveProposed = !!problem[`${myRole}_proposed_solution`];
    const partnerHasProposed = !!problem[`${myRole === 'user1' ? 'user2' : 'user1'}_proposed_solution`];
    return (
        <div>
            <h3 className="text-2xl font-serif text-white mb-2">Phase 7: Propose a Solution</h3>
            <p className="text-gray-400 mb-4">Based on the verdict, propose your ideal, concrete solution. Don't worry about your partner yet. What do *you* think is the best path forward?</p>
            <DraftTextarea
                value={problem[`${myRole}_proposed_solution`] || ''}
                onSave={(text) => onSave(problem.id, { [`${myRole}_proposed_solution`]: text })}
                onSubmit={onSubmit}
                placeholder="My proposed solution is..."
                disabled={iHaveProposed}
            />
            <div className="text-sm text-gray-500 mt-4">
                {iHaveProposed ? "✅ Your proposal is locked." : "⏳ Waiting for you to propose a solution."}
                <br/>
                {partnerHasProposed ? "✅ Partner has proposed a solution." : "⏳ Waiting for partner to propose a solution."}
            </div>
        </div>
    );
};

export default PhaseProposeSolutions;
