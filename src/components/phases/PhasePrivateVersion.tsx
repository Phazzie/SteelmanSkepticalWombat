import DraftTextarea from '../ui/DraftTextarea';
import { Problem } from '../../types';

interface PhasePrivateVersionProps {
  problem: Problem;
  onSave: (id: string, updates: Record<string, unknown>) => void;
  onSubmit: (text: string) => void | Promise<void>;
  myRole: 'user1' | 'user2';
  isAiLoading: string | null;
}

/** Renders UI for Phase 2: Stating private versions of the problem. */
const PhasePrivateVersion = ({ problem, onSave, onSubmit, myRole, isAiLoading }: PhasePrivateVersionProps) => {
    const iHaveSubmitted = problem[`${myRole}_submitted_private`];
    const partnerHasSubmitted = problem[`${myRole === 'user1' ? 'user2' : 'user1'}_submitted_private`];
    const handleSubmit = () => {
        const text = problem[`${myRole}_private_version`];
        onSubmit(text);
    };
    return (
        <div>
            <h3 className="text-2xl font-serif text-white mb-2">Phase 2: State Your Case (Privately)</h3>
            <p className="text-gray-400 mb-4">Here's your chance. Say what you really think. Your partner will <span className="font-bold text-red-400">not</span> see this. The Wombat will, so don't waste its time. Your draft saves when you click away.</p>
            <DraftTextarea
                value={problem[`${myRole}_private_version`]}
                onChange={() => {}} // No-op since we save on blur
                onSave={(text) => onSave(problem.id, { [`${myRole}_private_version`]: text })}
                onSubmit={handleSubmit}
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
