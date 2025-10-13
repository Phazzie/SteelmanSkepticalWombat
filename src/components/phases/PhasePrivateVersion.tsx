import React, { useState, useEffect } from 'react';
import DraftTextarea from '../ui/DraftTextarea';

/** Renders UI for Phase 2: Stating private versions of the problem. */
const PhasePrivateVersion = ({ problem, onSave, onSubmit, myRole, isAiLoading }) => {
    const [draftText, setDraftText] = useState(problem[`${myRole}_private_version`] || '');
    
    useEffect(() => {
        setDraftText(problem[`${myRole}_private_version`] || '');
    }, [problem, myRole]);

    const iHaveSubmitted = problem[`${myRole}_submitted_private`];
    const partnerHasSubmitted = problem[`${myRole === 'user1' ? 'user2' : 'user1'}_submitted_private`];
    
    const handleTextChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
        setDraftText(event.target.value);
    };

    const handleSave = () => {
        if (draftText !== problem[`${myRole}_private_version`]) {
            onSave(problem.id, { [`${myRole}_private_version`]: draftText });
        }
    };

    return (
        <div>
            <h3 className="text-2xl font-serif text-white mb-2">Phase 2: State Your Case (Privately)</h3>
            <p className="text-gray-400 mb-4">Here's your chance. Say what you really think. Your partner will <span className="font-bold text-red-400">not</span> see this. The Wombat will, so don't waste its time. Your draft saves when you click away.</p>
            <DraftTextarea
                value={draftText}
                onChange={handleTextChange}
                onSave={handleSave}
                onSubmit={onSubmit}
                placeholder="From my point of view, the issue is..."
                disabled={iHaveSubmitted || !!isAiLoading}
            />
            {isAiLoading === 'translation' && <p className="text-amber-400 text-sm mt-2 animate-pulse">Wombat is checking for subtext...</p>}
            <div className="text-sm text-gray-500 mt-4">
                {iHaveSubmitted ? "✅ Your version is locked." : "Click 'Submit & Lock' to finalize."}
                <br/>
                {partnerHasSubmitted ? "✅ Partner has submitted." : "⏳ Waiting for partner..."}
            </div>
        </div>
    );
};

export default PhasePrivateVersion;
