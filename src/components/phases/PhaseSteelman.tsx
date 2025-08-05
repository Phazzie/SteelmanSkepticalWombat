import React, { useRef } from 'react';
import DraftTextarea from '../ui/DraftTextarea';
import { useAppContext } from '../../hooks/useAppContext';

/** Renders UI for Phase 4: Writing the steelman of the partner's view. */
const PhaseSteelman = ({ problem, onSave, onSubmit, myRole, isAiLoading }) => {
    const { handleBSMeter } = useAppContext();
    const textareaRef = useRef(null);
    const iHaveSubmitted = problem[`${myRole}_submitted_steelman`];
    const partnerHasSubmitted = problem[`${myRole === 'user1' ? 'user2' : 'user1'}_submitted_steelman`];
    return (
        <div>
            <h3 className="text-2xl font-serif text-white mb-2">Phase 4: Argue Their Case</h3>
            <p className="text-gray-400 mb-2">Explain your partner's perspective as if you were a brilliant, sympathetic lawyer arguing their case. This is about understanding, not agreement. Don't embarrass yourself.</p>
            <div className="p-3 bg-gray-800 rounded-lg mb-4 text-gray-300"><strong>Agreed Problem:</strong> {problem.problem_statement}</div>
            <DraftTextarea
                ref={textareaRef}
                value={problem[`${myRole}_steelman`]}
                onSave={(text) => onSave(problem.id, { [`${myRole}_steelman`]: text })}
                onSubmit={onSubmit}
                placeholder="I imagine my partner feels that..."
                disabled={iHaveSubmitted}
            />
            <div className="flex justify-between items-center mt-4">
                <button onClick={() => {
                    if (textareaRef.current) {
                        handleBSMeter(textareaRef.current.value);
                    }
                }} disabled={isAiLoading === 'bs-meter'} className="bg-sky-500 hover:bg-sky-600 text-white font-bold py-2 px-4 rounded-lg transition">
                    {isAiLoading === 'bs-meter' ? 'Analyzing...' : 'BS Meter'}
                </button>
                <div className="text-sm text-gray-500 text-right">
                    {iHaveSubmitted ? "✅ Your steelman is locked." : "Click 'Submit & Lock' to finalize."}
                    <br/>
                    {partnerHasSubmitted ? "✅ Partner has submitted." : "⏳ Waiting for partner..."}
                </div>
            </div>
        </div>
    );
};

export default PhaseSteelman;
