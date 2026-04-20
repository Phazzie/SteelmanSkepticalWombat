import { useState, useEffect } from 'react';
import DraftTextarea from '../ui/DraftTextarea';
import { Problem } from '../../types';

interface PhaseProposeSolutionsProps {
  problem: Problem;
  onSave: (id: string, updates: Record<string, unknown>) => void;
  onSubmit: (text: string) => void;
  myRole: 'user1' | 'user2';
}

/** Renders UI for Phase 7: Proposing individual solutions. */
const PhaseProposeSolutions = ({ problem, onSave, onSubmit, myRole }: PhaseProposeSolutionsProps) => {
    const partnerRole = myRole === 'user1' ? 'user2' : 'user1';
    const proposedSolution = problem[`${myRole}_proposed_solution`] || '';
    const iHaveProposed = !!proposedSolution;
    const partnerHasProposed = !!problem[`${partnerRole}_proposed_solution`];

    const [draftText, setDraftText] = useState(proposedSolution);

    useEffect(() => {
        setDraftText(proposedSolution);
    }, [proposedSolution, myRole]);

    return (
        <div>
            <h3 className="text-2xl font-serif text-white mb-2">Phase 7: Propose a Solution</h3>
            <p className="text-gray-400 mb-4">Based on the verdict, propose your ideal, concrete solution. Don't worry about your partner yet. What do *you* think is the best path forward?</p>
            <DraftTextarea
                value={draftText}
                onChange={(e) => setDraftText(e.target.value)}
                onSave={(text) => onSave(problem.id, { [`${myRole}_proposed_solution`]: text })}
                onSubmit={() => {
                    onSave(problem.id, { [`${myRole}_proposed_solution`]: draftText });
                    onSubmit(draftText);
                }}
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
