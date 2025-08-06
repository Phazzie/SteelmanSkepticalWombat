import React, { useRef } from 'react';
import DraftTextarea from '../ui/DraftTextarea';
import { useAppContext } from '../../hooks/useAppContext';
import { useCurrentProblemData } from '../../hooks/useCurrentProblemData';

/** Renders UI for Phase 4: Writing the steelman of the partner's view. */
const PhaseSteelman = () => {
    const { problem, myRole, iHaveSubmittedSteelman, partnerHasSubmittedSteelman } = useCurrentProblemData();
    const { handleBSMeter, handleSteelmanSubmit, handleUpdate, isAiLoading } = useAppContext();
    const textareaRef = useRef(null);

    if (!problem) return null;

    return (
        <div>
            <h3 className="text-2xl font-serif text-white mb-2">Phase 4: Argue Their Case</h3>
            <p className="text-gray-400 mb-2">Explain your partner's perspective as if you were a brilliant, sympathetic lawyer arguing their case. This is about understanding, not agreement. Don't embarrass yourself.</p>
            <div className="p-3 bg-gray-800 rounded-lg mb-4 text-gray-300"><strong>Agreed Problem:</strong> {problem.problem_statement}</div>
            <DraftTextarea
                ref={textareaRef}
                value={problem[`${myRole}_steelman`]}
                onSave={(text) => handleUpdate(problem.id, { [`${myRole}_steelman`]: text })}
                onSubmit={handleSteelmanSubmit}
                placeholder="I imagine my partner feels that..."
                disabled={iHaveSubmittedSteelman}
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
                    {iHaveSubmittedSteelman ? "✅ Your steelman is locked." : "Click 'Submit & Lock' to finalize."}
                    <br/>
                    {partnerHasSubmittedSteelman ? "✅ Partner has submitted." : "⏳ Waiting for partner..."}
                </div>
            </div>
        </div>
    );
};

export default PhaseSteelman;
