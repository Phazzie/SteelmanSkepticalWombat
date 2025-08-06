import React from 'react';
import DraftTextarea from '../ui/DraftTextarea';
import { useCurrentProblemData } from '../../hooks/useCurrentProblemData';
import { useAppContext } from '../../hooks/useAppContext';

/** Renders UI for the new Phase 8: Steelmanning the partner's proposed solution. */
const PhaseSolutionSteelman = () => {
    const {
        problem,
        myRole,
        partnerRole,
        partnerName,
        iHaveSubmittedSolutionSteelman,
        partnerHasSubmittedSolutionSteelman,
    } = useCurrentProblemData();
    const { handleUpdate, handleSolutionSteelmanSubmit } = useAppContext();

    if (!problem) return null;

    const partnerSolution = problem[`${partnerRole}_proposed_solution`];

    return (
        <div>
            <h3 className="text-2xl font-serif text-white mb-2">Phase 8: Explain Their Solution</h3>
            <p className="text-gray-400 mb-4">Now, explain your partner's proposed solution back to them. What do you think they are trying to achieve with it? What are the implications?</p>
            <div className="p-4 bg-gray-800 rounded-lg border border-gray-700 mb-4">
                <p className="text-sm font-bold text-gray-400 mb-2">{partnerName}'s Proposed Solution:</p>
                <p className="text-gray-200 whitespace-pre-wrap">{partnerSolution || "Waiting for partner..."}</p>
            </div>
            <DraftTextarea
                value={problem[`${myRole}_solution_steelman`] || ''}
                onSave={(text) => handleUpdate(problem.id, { [`${myRole}_solution_steelman`]: text })}
                onSubmit={handleSolutionSteelmanSubmit}
                placeholder={`I understand ${partnerName}'s solution to mean...`}
                disabled={iHaveSubmittedSolutionSteelman || !partnerSolution}
            />
            <div className="text-sm text-gray-500 mt-4">
                {iHaveSubmittedSolutionSteelman ? "✅ Your explanation is locked." : "⏳ Waiting for you to explain their solution."}
                <br/>
                {partnerHasSubmittedSolutionSteelman ? "✅ Partner has explained your solution." : "⏳ Waiting for partner..."}
            </div>
        </div>
    );
};

export default PhaseSolutionSteelman;
