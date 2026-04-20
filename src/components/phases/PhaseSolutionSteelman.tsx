import { useState, useEffect } from 'react';
import DraftTextarea from '../ui/DraftTextarea';
import { Problem } from '../../types';

interface PhaseSolutionSteelmanProps {
  problem: Problem;
  onSave: (id: string, updates: Record<string, unknown>) => void;
  onSubmit: (text: string) => void;
  myRole: 'user1' | 'user2';
  partnerName: string;
}

/** Renders UI for the new Phase 8: Steelmanning the partner's proposed solution. */
const PhaseSolutionSteelman = ({ problem, onSave, onSubmit, myRole, partnerName }: PhaseSolutionSteelmanProps) => {
    const partnerRole = myRole === 'user1' ? 'user2' : 'user1';
    const partnerSolution = problem[`${partnerRole}_proposed_solution`];
    const mySteelman = problem[`${myRole}_solution_steelman`] || '';
    const iHaveSubmitted = !!mySteelman;
    const partnerHasSubmitted = !!problem[`${partnerRole}_solution_steelman`];

    const [draftText, setDraftText] = useState(mySteelman);

    useEffect(() => {
        setDraftText(mySteelman);
    }, [mySteelman, myRole]);

    return (
        <div>
            <h3 className="text-2xl font-serif text-white mb-2">Phase 8: Explain Their Solution</h3>
            <p className="text-gray-400 mb-4">Now, explain your partner's proposed solution back to them. What do you think they are trying to achieve with it? What are the implications?</p>
            <div className="p-4 bg-gray-800 rounded-lg border border-gray-700 mb-4">
                <p className="text-sm font-bold text-gray-400 mb-2">{partnerName}'s Proposed Solution:</p>
                <p className="text-gray-200 whitespace-pre-wrap">{partnerSolution || "Waiting for partner..."}</p>
            </div>
            <DraftTextarea
                value={draftText}
                onChange={(e) => setDraftText(e.target.value)}
                onSave={(text) => onSave(problem.id, { [`${myRole}_solution_steelman`]: text })}
                onSubmit={() => {
                    onSave(problem.id, { [`${myRole}_solution_steelman`]: draftText });
                    onSubmit(draftText);
                }}
                placeholder={`I understand ${partnerName}'s solution to mean...`}
                disabled={iHaveSubmitted || !partnerSolution}
            />
            <div className="text-sm text-gray-500 mt-4">
                {iHaveSubmitted ? "✅ Your explanation is locked." : "⏳ Waiting for you to explain their solution."}
                <br/>
                {partnerHasSubmitted ? "✅ Partner has explained your solution." : "⏳ Waiting for partner..."}
            </div>
        </div>
    );
};

export default PhaseSolutionSteelman;
