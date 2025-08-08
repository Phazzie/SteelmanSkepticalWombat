import React, { useRef, useState, useEffect } from 'react';
import DraftTextarea from '../ui/DraftTextarea';
import { useAppContext } from '../../hooks/useAppContext';
import { Problem } from '../../types';

/**
 * Props for the PhaseSteelman component.
 */
interface PhaseSteelmanProps {
    problem: Problem;
    onSave: (problemId: string, data: { [key: string]: string }) => void;
    onSubmit: () => void;
    myRole: 'user1' | 'user2';
    isAiLoading: boolean | string;
}

/**
 * Renders the UI for Phase 4, where a user writes a "steelman" argument
 * for their partner's perspective.
 */
const PhaseSteelman: React.FC<PhaseSteelmanProps> = ({ problem, onSave, onSubmit, myRole, isAiLoading }) => {
    const { handleBSMeter } = useAppContext();
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // This state now holds the real-time value of the textarea.
    const [draftText, setDraftText] = useState(problem[`${myRole}_steelman`] || '');

    useEffect(() => {
        setDraftText(problem[`${myRole}_steelman`] || '');
    }, [problem, myRole]);

    // Determine the submission status for both the current user and their partner.
    const iHaveSubmitted = problem[`${myRole}_submitted_steelman`];
    const partnerRole = myRole === 'user1' ? 'user2' : 'user1';
    const partnerHasSubmitted = problem[`${partnerRole}_submitted_steelman`];

    const handleTextChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
        setDraftText(event.target.value);
    };

    const handleSave = () => {
        // Only save if the text has actually changed from what's in the prop.
        if (draftText !== problem[`${myRole}_steelman`]) {
            onSave(problem.id, { [`${myRole}_steelman`]: draftText });
        }
    };

    return (
        <div>
            <h3 className="text-2xl font-serif text-white mb-2">Phase 4: Argue Their Case</h3>
            <p className="text-gray-400 mb-2">Explain your partner's perspective as if you were a brilliant, sympathetic lawyer arguing their case. This is about understanding, not agreement. Don't embarrass yourself.</p>
            <div className="p-3 bg-gray-800 rounded-lg mb-4 text-gray-300"><strong>Agreed Problem:</strong> {problem.problem_statement}</div>

            <DraftTextarea
                ref={textareaRef}
                value={draftText}
                onChange={handleTextChange}
                onSave={handleSave}
                onSubmit={onSubmit}
                placeholder="I imagine my partner feels that..."
                disabled={iHaveSubmitted}
            />

            <div className="flex justify-between items-center mt-4">
                {/* The "BS Meter" button's disabled state is now tied to the real-time draftText state. */}
                <button
                    onClick={() => handleBSMeter(draftText)}
                    disabled={isAiLoading === 'bs-meter' || !draftText.trim()}
                    className="bg-sky-500 hover:bg-sky-600 text-white font-bold py-2 px-4 rounded-lg transition disabled:bg-gray-600 disabled:cursor-not-allowed"
                >
                    {isAiLoading === 'bs-meter' ? 'Analyzing...' : 'BS Meter'}
                </button>

                {/* Display the submission status to the user. */}
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
