import React, { useState, useEffect, useCallback, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, updateDoc, onSnapshot, collection, addDoc, query, where } from 'firebase/firestore';

// --- Firebase Configuration ---
// This object is populated by the environment. In a local setup (Vite/Next.js),
// you would use import.meta.env.VITE_API_KEY or process.env.REACT_APP_API_KEY.
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// --- App Initialization ---
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-couples-app';

// --- Image URLs ---
const WOMBAT_AVATAR_URL = "https://i.imgur.com/tP2zJ7N.jpeg";
const WOMBAT_THINKING_URL = "https://i.imgur.com/gKEM9jE.jpeg";
const WOMBAT_TROPHY_URL = "https://i.imgur.com/Qh7aJ4B.jpeg";

// ===================================================================================
// --- Helper & UI Components ---
// ===================================================================================

/**
 * Displays the Skeptical Wombat's avatar.
 * @param {{className?: string, src?: string}} props - Component props.
 * @returns {JSX.Element}
 */
const WombatAvatar = ({ className = "w-24 h-24 md:w-32 md:h-32", src = WOMBAT_AVATAR_URL }) => (
    <img 
        src={src} 
        alt="The Skeptical Wombat" 
        className={`${className} rounded-full border-4 border-lime-400 shadow-lg object-cover`}
        onError={(e) => { e.target.onerror = null; e.target.src='https://placehold.co/128x128/1F2937/A3E635?text=Wombat'; }}
    />
);

/**
 * Renders a visual timeline of the problem-solving process.
 * @param {{status: string}} props - The current status of the problem.
 * @returns {JSX.Element}
 */
const ProgressBar = ({ status }) => {
    const phases = ['agree_statement', 'private_versions', 'translation', 'steelman', 'steelman_approval', 'ai_review', 'propose_solutions', 'solution_steelman', 'wager', 'solution', 'resolved'];
    const currentPhaseIndex = phases.indexOf(status);
    return (
        <div className="flex justify-between items-center mb-6 p-1 bg-gray-900/50 rounded-full text-[8px] sm:text-xs">
            {phases.map((phase, index) => (
                <div className="flex-1 text-center" key={phase}>
                    <p className={`capitalize transition-colors duration-300 ${index <= currentPhaseIndex ? 'text-lime-400 font-bold' : 'text-gray-500'}`}>
                        {phase.replace(/_/g, ' ').replace('ai ', 'Verdict ')}
                    </p>
                </div>
            ))}
        </div>
    );
};

/**
 * A component to display temporary notifications.
 * @param {{notification: object, onDismiss: function}} props - Notification object and dismiss handler.
 * @returns {JSX.Element|null}
 */
const Notification = ({ notification, onDismiss }) => {
    useEffect(() => {
        if (notification.show) {
            const timer = setTimeout(() => {
                onDismiss();
            }, notification.duration || 4000);
            return () => clearTimeout(timer);
        }
    }, [notification, onDismiss]);

    if (!notification.show) return null;

    const baseStyle = "fixed top-24 right-5 p-4 rounded-lg shadow-2xl text-white z-50 flex items-center max-w-sm border border-white/20 bg-gray-800/80 backdrop-blur-sm";
    
    return (
        <div className={baseStyle} onClick={onDismiss}>
            <img src={WOMBAT_THINKING_URL} alt="Wombat" className="w-12 h-12 rounded-full mr-4 border-2 border-white/50"/>
            <p className="text-sm font-semibold">{notification.message}</p>
        </div>
    );
};

/**
 * A textarea component that saves drafts on blur and has an explicit submit button.
 * @param {object} props - Component props including value, onSave, onSubmit, placeholder, and disabled state.
 * @returns {JSX.Element}
 */
const DraftTextarea = ({ value, onSave, onSubmit, placeholder, disabled, submitText = "Submit & Lock" }) => {
    const [text, setText] = useState(value);

    const handleBlur = () => {
        if (!disabled && text !== value) {
            onSave(text);
        }
    };

    return (
        <div>
            <textarea
                className="w-full p-3 border-2 border-gray-700 rounded-lg bg-gray-800 text-gray-200 focus:ring-2 focus:ring-lime-400 focus:border-lime-400 transition disabled:bg-gray-700/50"
                rows="8"
                placeholder={placeholder}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onBlur={handleBlur}
                disabled={disabled}
            />
            {!disabled && (
                <button onClick={() => onSubmit(text)} className="mt-4 bg-lime-500 hover:bg-lime-600 text-gray-900 font-bold py-2 px-4 rounded-lg transition">
                    {submitText}
                </button>
            )}
        </div>
    );
};


// ===================================================================================
// --- Phase-Specific Components ---
// ===================================================================================

/** Renders UI for Phase 1: Agreeing on a problem statement. */
const PhaseAgreeStatement = ({ problem, onUpdate, onAgree, myRole }) => {
    const iHaveAgreed = problem[`${myRole}_agreed_problem`];
    const partnerHasAgreed = problem[`${myRole === 'user1' ? 'user2' : 'user1'}_agreed_problem`];
    return (
        <div>
            <h3 className="text-2xl font-serif text-white mb-2">Phase 1: Define the Disagreement</h3>
            <p className="text-gray-400 mb-4">Collaborate on one, neutral sentence. No blame, no feelings. Just state the situation as if you were a boring robot. The Wombat is watching.</p>
            <textarea
                className="w-full p-3 border-2 border-gray-700 rounded-lg bg-gray-800 text-gray-200 focus:ring-2 focus:ring-lime-400 focus:border-lime-400 transition"
                rows="4"
                defaultValue={problem.problem_statement}
                onBlur={(e) => onUpdate(problem.id, { problem_statement: e.target.value })}
                disabled={iHaveAgreed}
            />
            <div className="flex flex-col sm:flex-row justify-between items-center mt-4 gap-4">
                <button onClick={() => onAgree('problem')} disabled={iHaveAgreed} className="w-full sm:w-auto bg-lime-500 hover:bg-lime-600 text-gray-900 font-bold py-2 px-4 rounded-lg disabled:bg-gray-600 disabled:cursor-not-allowed transition">
                    {iHaveAgreed ? "You've Agreed" : "I Agree With This Statement"}
                </button>
                <div className="text-sm text-gray-500">
                    {partnerHasAgreed ? "✅ Partner has agreed" : "⏳ Waiting for partner..."}
                </div>
            </div>
        </div>
    );
};

/** Renders UI for Phase 2: Stating private versions of the problem. */
const PhasePrivateVersion = ({ problem, onSave, onSubmit, myRole, isAiLoading }) => {
    const iHaveSubmitted = problem[`${myRole}_submitted_private`];
    const partnerHasSubmitted = problem[`${myRole === 'user1' ? 'user2' : 'user1'}_submitted_private`];
    return (
        <div>
            <h3 className="text-2xl font-serif text-white mb-2">Phase 2: State Your Case (Privately)</h3>
            <p className="text-gray-400 mb-4">Here's your chance. Say what you really think. Your partner will <span className="font-bold text-red-400">not</span> see this. The Wombat will, so don't waste its time. Your draft saves when you click away.</p>
            <DraftTextarea
                value={problem[`${myRole}_private_version`]}
                onSave={(text) => onSave(problem.id, { [`${myRole}_private_version`]: text })}
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

/** Renders UI for Phase 3: The Wombat's Translation */
const PhaseTranslation = ({ problem, onNext, myRole, partnerName }) => {
    const partnerRole = myRole === 'user1' ? 'user2' : 'user1';
    return (
        <div>
            <h3 className="text-2xl font-serif text-white mb-2">Phase 3: The Wombat's Translation</h3>
            <p className="text-gray-400 mb-6">The Wombat has read your private statements and offers its interpretation of the subtext. This is what it thinks you're *really* saying. No need to respond, just absorb it.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-gray-800/70 rounded-lg border border-gray-700">
                    <p className="font-bold text-gray-300 mb-2">Your Statement:</p>
                    <p className="text-sm text-gray-400 italic whitespace-pre-wrap">"{problem[`${myRole}_private_version`]}"</p>
                    <hr className="my-3 border-gray-600"/>
                    <p className="font-bold text-lime-400 mb-2">Wombat's Translation:</p>
                    <p className="text-sm text-lime-200 whitespace-pre-wrap">{problem[`${myRole}_translation`] || "Wombat is thinking..."}</p>
                </div>
                <div className="p-4 bg-gray-800/70 rounded-lg border border-gray-700">
                    <p className="font-bold text-gray-300 mb-2">{partnerName}'s Statement:</p>
                    <p className="text-sm text-gray-400 italic">Hidden to maintain privacy.</p>
                     <hr className="my-3 border-gray-600"/>
                    <p className="font-bold text-lime-400 mb-2">Wombat's Translation:</p>
                    <p className="text-sm text-lime-200 whitespace-pre-wrap">{problem[`${partnerRole}_translation`] || "Wombat is thinking..."}</p>
                </div>
            </div>
            <button onClick={onNext} className="mt-6 w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg transition">
                Continue to the Next Phase
            </button>
        </div>
    );
};

/** Renders UI for Phase 4: Writing the steelman of the partner's view. */
const PhaseSteelman = ({ problem, onSave, onSubmit, myRole, isAiLoading }) => {
    const iHaveSubmitted = problem[`${myRole}_submitted_steelman`];
    const partnerHasSubmitted = problem[`${myRole === 'user1' ? 'user2' : 'user1'}_submitted_steelman`];
    return (
        <div>
            <h3 className="text-2xl font-serif text-white mb-2">Phase 4: Argue Their Case</h3>
            <p className="text-gray-400 mb-2">Explain your partner's perspective as if you were a brilliant, sympathetic lawyer arguing their case. This is about understanding, not agreement. Don't embarrass yourself.</p>
            <div className="p-3 bg-gray-800 rounded-lg mb-4 text-gray-300"><strong>Agreed Problem:</strong> {problem.problem_statement}</div>
            <DraftTextarea
                value={problem[`${myRole}_steelman`]}
                onSave={(text) => onSave(problem.id, { [`${myRole}_steelman`]: text })}
                onSubmit={onSubmit}
                placeholder="I imagine my partner feels that..."
                disabled={iHaveSubmitted}
            />
            <div className="text-sm text-gray-500 text-right mt-4">
                {iHaveSubmitted ? "✅ Your steelman is locked." : "Click 'Submit & Lock' to finalize."}
                <br/>
                {partnerHasSubmitted ? "✅ Partner has submitted." : "⏳ Waiting for partner..."}
            </div>
        </div>
    );
};

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
             <div className="flex flex-col sm:flex-row justify-between items-center mt-4 gap-4">
                <button onClick={onApprove} disabled={iHaveApproved || !steelmanOfMyView} className="w-full sm:w-auto bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg disabled:bg-gray-600 transition">
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

/** Renders UI for Phase 6: Displaying the Wombat's AI-generated verdict. */
const PhaseAIReview = ({ problem, onNext, onEscalate, isAiLoading }) => (
    <div className="text-center">
        <h3 className="text-2xl font-serif text-white mb-4">Phase 6: The Wombat's Verdict</h3>
        <div className="flex justify-center mb-4">
           <WombatAvatar src={WOMBAT_AVATAR_URL} />
        </div>

        {problem.human_verdict && (
            <div className="prose prose-invert text-left mt-4 p-4 bg-sky-900/50 border-2 border-dashed border-sky-400 rounded-lg whitespace-pre-wrap font-serif">
                <h4 className="font-bold text-sky-300">A Verdict from the Human Wombat:</h4>
                {problem.human_verdict}
            </div>
        )}

        { (isAiLoading === 'verdict' || problem.ai_analysis) &&
            <div className="prose prose-invert text-left mt-4 p-4 bg-gray-800/50 border border-gray-700 rounded-lg min-h-[12rem] flex items-center justify-center">
                {isAiLoading === 'verdict' ? (
                    <div className="text-lg font-semibold animate-pulse text-lime-400">The Wombat is judging you...</div>
                ) : (
                    <div className="whitespace-pre-wrap font-serif">{problem.ai_analysis}</div>
                )}
            </div>
        }

        <div className="mt-6 flex flex-col sm:flex-row gap-4">
            <button onClick={onNext} className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg transition">
                Let's Propose Solutions
            </button>
            <button onClick={onEscalate} disabled={problem.escalated_for_human_review} className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-bold py-2 px-4 rounded-lg transition disabled:bg-gray-600 disabled:cursor-not-allowed">
                {problem.escalated_for_human_review ? 'Awaiting Human Verdict' : 'Escalate to Human Wombat (Premium)'}
            </button>
        </div>
    </div>
);

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

/** Renders UI for the new Phase 8: Steelmanning the partner's proposed solution. */
const PhaseSolutionSteelman = ({ problem, onSave, onSubmit, myRole, partnerName }) => {
    const partnerRole = myRole === 'user1' ? 'user2' : 'user1';
    const partnerSolution = problem[`${partnerRole}_proposed_solution`];
    const iHaveSubmitted = !!problem[`${myRole}_solution_steelman`];
    const partnerHasSubmitted = !!problem[`${partnerRole}_solution_steelman`];

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
                onSave={(text) => onSave(problem.id, { [`${myRole}_solution_steelman`]: text })}
                onSubmit={onSubmit}
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

/** Renders UI for Phase 9: The Wombat's Wager */
const PhaseWager = ({ problem, onNext, isAiLoading }) => (
    <div className="text-center">
        <h3 className="text-2xl font-serif text-white mb-2">Phase 9: The Wombat's Wager</h3>
        <p className="text-gray-400 mb-4">The Wombat has reviewed both proposals and how well you understood them. It has now placed its bet. Consider this before creating your final plan.</p>
        {isAiLoading === 'wager' && <p className="text-amber-400 text-sm mt-2 animate-pulse">Wombat is calculating the odds...</p>}
        {problem.wombats_wager && (
             <div className="p-4 bg-gray-800/70 rounded-lg border-2 border-dashed border-amber-500">
                <p className="font-bold text-amber-300 mb-2">The Wombat's Wager:</p>
                <p className="text-amber-200 whitespace-pre-wrap">{problem.wombats_wager}</p>
            </div>
        )}
         <button onClick={onNext} className="mt-6 w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg transition">
            Proceed to Final Solution
        </button>
    </div>
);

/** Renders UI for Phase 10: Collaborating on a final solution. */
const PhaseSolution = ({ problem, onUpdate, onAgree, onBrainstorm, myRole, isAiLoading }) => {
    const iHaveAgreed = problem[`${myRole}_agreed_solution`];
    const partnerHasAgreed = problem[`${myRole === 'user1' ? 'user2' : 'user1'}_agreed_solution`];
    return (
        <div>
            <h3 className="text-2xl font-serif text-white mb-2">Phase 10: Agree on a Final Solution</h3>
            <p className="text-gray-400 mb-4">You've heard the Wombat. Now, write a single, concrete, actionable solution you can both live with. This is the final step. If you're stuck, ask the Wombat to brainstorm.</p>
            
            {problem.brainstormed_solutions && (
                <div className="prose prose-invert text-sm mt-2 mb-4 p-4 bg-gray-800/50 border border-gray-700 rounded-lg whitespace-pre-wrap font-serif">
                    <h4 className="font-bold text-lime-400">Wombat's Brainstorm:</h4>
                    {problem.brainstormed_solutions}
                </div>
            )}

            <textarea
                className="w-full p-3 border-2 border-gray-700 rounded-lg bg-gray-800 text-gray-200 focus:ring-2 focus:ring-lime-400 focus:border-lime-400 transition"
                rows="4"
                defaultValue={problem.solution_statement}
                onBlur={(e) => onUpdate(problem.id, { solution_statement: e.target.value })}
                disabled={iHaveAgreed}
            />
            <div className="flex flex-col sm:flex-row justify-between items-center mt-4 gap-4">
                <button onClick={onBrainstorm} disabled={isAiLoading === 'brainstorm'} className="bg-sky-500 hover:bg-sky-600 text-white font-bold py-2 px-4 rounded-lg transition w-full sm:w-auto">
                    {isAiLoading === 'brainstorm' ? 'Brainstorming...' : 'Wombat, Brainstorm for Us'}
                </button>
                <button onClick={() => onAgree('solution')} disabled={iHaveAgreed} className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg disabled:bg-gray-600 transition w-full sm:w-auto">
                    {iHaveAgreed ? "You Agreed" : "I Agree To This Final Solution"}
                </button>
            </div>
        </div>
    );
};

/** Renders UI for the final, resolved state, with new features. */
const PhaseResolved = ({ problem, onUpdate, myRole, onGenerateImage, isAiLoading, mementoImage, onCritique }) => {
    const isPostMortemTime = problem.solution_check_date && new Date() > problem.solution_check_date.toDate();
    const myFeedback = problem[`${myRole}_post_mortem`];
    const [allowCritique, setAllowCritique] = useState(false);

    return (
        <div className="text-center p-10 space-y-8">
            <div>
                <img src={WOMBAT_TROPHY_URL} alt="Trophy Wombat" className="w-48 h-48 mx-auto rounded-full border-4 border-amber-400" />
                <h2 className="text-3xl font-bold font-serif text-amber-300 mt-4">Problem Resolved (For Now)</h2>
                <div className="mt-6 text-left space-y-4 max-w-lg mx-auto">
                    <div>
                        <h4 className="font-bold text-gray-400">The Disagreement:</h4>
                        <p className="p-3 bg-gray-800 rounded-lg text-gray-200">{problem.problem_statement}</p>
                    </div>
                    <div>
                        <h4 className="font-bold text-lime-400">The Agreed Solution:</h4>
                        <p className="p-3 bg-lime-900/50 rounded-lg text-lime-200">{problem.solution_statement}</p>
                    </div>
                </div>
            </div>
            
            <div className="border-t-2 border-dashed border-purple-500 pt-6">
                <h3 className="text-2xl font-serif text-purple-300 mb-2">Create a Memento</h3>
                <p className="text-gray-400 mb-4">Generate a unique AI artwork that represents your journey through this disagreement.</p>
                <button onClick={onGenerateImage} disabled={isAiLoading === 'image'} className="bg-purple-500 hover:bg-purple-600 text-white font-bold py-2 px-4 rounded-lg transition">
                    {isAiLoading === 'image' ? 'Generating...' : 'Generate a Memento'}
                </button>
                {mementoImage && <img src={mementoImage} alt="AI-generated memento" className="mt-4 rounded-lg shadow-lg mx-auto" />}
            </div>

            {isPostMortemTime && (
                 <div className="mt-6 border-t-2 border-dashed border-sky-500 pt-6">
                    <h3 className="text-2xl font-serif text-sky-300 mb-2">Post-Mortem Review</h3>
                    <p className="text-gray-400 mb-4">It's been over a week. Is the solution actually working, or are you just pretending? Be honest.</p>
                    {/* ... Post-mortem buttons ... */}
                </div>
            )}

            <div className="border-t-2 border-dashed border-gray-600 pt-6">
                <h3 className="text-2xl font-serif text-gray-400 mb-2">Help Improve the Wombat</h3>
                <p className="text-gray-500 mb-4">If you allow it, the Wombat will review its own performance and send the anonymous feedback to its human handler to help it become even more skeptical and insightful.</p>
                <div className="flex items-center justify-center space-x-4 p-4 bg-gray-800 rounded-lg">
                    <input type="checkbox" id="critique-check" checked={allowCritique} onChange={(e) => setAllowCritique(e.target.checked)} className="h-6 w-6 rounded text-lime-500 focus:ring-lime-400 bg-gray-700 border-gray-600"/>
                    <label htmlFor="critique-check" className="text-gray-300">I allow the Wombat to critique this session.</label>
                    <button onClick={() => onCritique(problem)} disabled={!allowCritique || isAiLoading === 'critique'} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg transition disabled:bg-gray-700 disabled:cursor-not-allowed">
                        {isAiLoading === 'critique' ? 'Critiquing...' : 'Submit Feedback'}
                    </button>
                </div>
            </div>
        </div>
    );
};


// ===================================================================================
// --- Main App Component ---
// ===================================================================================
export default function App() {
    // --- State Management ---
    const [user, setUser] = useState(null);
    const [partner, setPartner] = useState(null);
    const [problems, setProblems] = useState([]);
    const [currentProblem, setCurrentProblem] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isAiLoading, setIsAiLoading] = useState(null);
    const [showInvite, setShowInvite] = useState(false);
    const [inviteLink, setInviteLink] = useState('');
    const [notification, setNotification] = useState({ show: false, message: '', type: 'info', duration: 4000 });
    const [activeTab, setActiveTab] = useState('active');
    const [mementoImage, setMementoImage] = useState(null);
    const [isCreatingProblem, setIsCreatingProblem] = useState(false);
    
    // --- Authentication & User Profile ---
    useEffect(() => {
        let unsubscribeUser = () => {};
        let unsubscribePartner = () => {};

        unsubscribeUser = onAuthStateChanged(auth, async (currentUser) => {
            unsubscribePartner();
            if (currentUser) {
                const userDocRef = doc(db, `artifacts/${appId}/users/${currentUser.uid}`);
                onSnapshot(userDocRef, async (snap) => {
                    if (snap.exists()) {
                        const userData = snap.data();
                        setUser({ uid: currentUser.uid, ...userData });
                        if (userData.partnerId) {
                            const partnerDocRef = doc(db, `artifacts/${appId}/users/${userData.partnerId}`);
                            unsubscribePartner = onSnapshot(partnerDocRef, (partnerSnap) => {
                                if (partnerSnap.exists()) {
                                    setPartner({ uid: userData.partnerId, ...partnerSnap.data() });
                                } else {
                                    setPartner(null);
                                }
                            });
                        } else {
                            setPartner(null);
                        }
                    } else {
                        const urlParams = new URLSearchParams(window.location.search);
                        const inviterId = urlParams.get('invite');
                        if (inviterId && inviterId !== currentUser.uid) {
                            await linkPartners(inviterId, currentUser.uid);
                        } else {
                            await setDoc(userDocRef, { uid: currentUser.uid, name: `User ${currentUser.uid.substring(0,4)}` });
                        }
                    }
                });
            } else {
                try {
                    if (typeof __initial_auth_token !== 'undefined') {
                        await signInWithCustomToken(auth, __initial_auth_token);
                    } else {
                        await signInAnonymously(auth);
                    }
                } catch (error) { 
                    console.error("Authentication Error:", error);
                    setNotification({show: true, message: "Authentication failed. Please refresh.", type: 'warning'});
                }
            }
            setIsLoading(false);
        });
        return () => {
            unsubscribeUser();
            unsubscribePartner();
        };
    }, []);

    const linkPartners = async (inviterId, inviteeId) => {
        const inviterRef = doc(db, `artifacts/${appId}/users/${inviterId}`);
        const inviteeRef = doc(db, `artifacts/${appId}/users/${inviteeId}`);
        await setDoc(inviteeRef, { partnerId: inviterId, uid: inviteeId, name: `User ${inviteeId.substring(0,4)}` });
        await setDoc(inviterRef, { partnerId: inviteeId }, { merge: true });
        window.history.replaceState({}, document.title, window.location.pathname);
    };

    const updateUserName = (newName) => {
        if (user && newName) {
            const userDocRef = doc(db, `artifacts/${appId}/users/${user.uid}`);
            updateDoc(userDocRef, { name: newName });
        }
    };

    const generateInviteLink = () => {
        if(!user) return;
        const link = `${window.location.origin}${window.location.pathname}?invite=${user.uid}`;
        setInviteLink(link);
        setShowInvite(true);
    };
    
    // --- Firestore Real-time Listener for Problems ---
    useEffect(() => {
        if (!user?.uid) return;
        const q = query(collection(db, `artifacts/${appId}/public/data/problems`), where('participants', 'array-contains', user.uid));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const fetchedProblems = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).sort((a, b) => b.createdAt.seconds - a.createdAt.seconds);
            setProblems(fetchedProblems);
            if (currentProblem) {
                const updatedCurrent = fetchedProblems.find(p => p.id === currentProblem.id);
                if (updatedCurrent) {
                    setCurrentProblem(updatedCurrent);
                    if (updatedCurrent.status === 'ai_review' && !updatedCurrent.ai_analysis && !isAiLoading) {
                        getAIAnalysis(updatedCurrent);
                    }
                }
            }
        }, (error) => console.error("Error fetching problems:", error));
        return () => unsubscribe();
    }, [user?.uid, currentProblem?.id, isAiLoading]);

    // --- Core AI & Logic Functions ---
    const callGemini = async (prompt) => {
        const apiKey = "";
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;
        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
            });
            if (!response.ok) {
                throw new Error(`API call failed with status: ${response.status}`);
            }
            const result = await response.json();
            return result?.candidates?.[0]?.content?.parts?.[0]?.text;
        } catch (error) {
            console.error("Gemini API Error:", error);
            setNotification({show: true, message: "An AI error occurred. The Wombat is probably napping.", type: 'warning'});
            return null;
        }
    };

    const startNewProblem = async () => {
        if (!user?.uid || !partner?.uid) return;
        setIsCreatingProblem(true);
        try {
            const newProblem = {
                participants: [user.uid, partner.uid], roles: { [user.uid]: 'user1', [partner.uid]: 'user2' }, createdAt: new Date(),
                status: 'agree_statement', problem_statement: '', user1_agreed_problem: false, user2_agreed_problem: false,
                user1_private_version: '', user2_private_version: '', user1_submitted_private: false, user2_submitted_private: false,
                user1_translation: '', user2_translation: '',
                user1_manipulation_analysis: '', user2_manipulation_analysis: '',
                user1_steelman: '', user2_steelman: '', user1_submitted_steelman: false, user2_submitted_steelman: false,
                user1_approved_steelman: false, user2_approved_steelman: false,
                ai_analysis: '',
                user1_proposed_solution: '', user2_proposed_solution: '',
                user1_solution_steelman: '', user2_solution_steelman: '',
                wombats_wager: '',
                solution_statement: '', user1_agreed_solution: false, user2_agreed_solution: false,
                solution_check_date: null, user1_post_mortem: '', user2_post_mortem: '',
            };
            const docRef = await addDoc(collection(db, `artifacts/${appId}/public/data/problems`), newProblem);
            setCurrentProblem({ id: docRef.id, ...newProblem });
            setActiveTab('active');
        } finally {
            setIsCreatingProblem(false);
        }
    };

    const handleUpdate = async (problemId, data) => {
        const problemRef = doc(db, `artifacts/${appId}/public/data/problems/${problemId}`);
        await updateDoc(problemRef, data);
    };

    const handleAgreement = async (type) => {
        if (!currentProblem || !user) return;
        const myRole = currentProblem.roles[user.uid];
        const partnerRole = myRole === 'user1' ? 'user2' : 'user1';
        if (type === 'problem') {
            const updates = { [`${myRole}_agreed_problem`]: true };
            if (currentProblem[`${partnerRole}_agreed_problem`]) updates.status = 'private_versions';
            handleUpdate(currentProblem.id, updates);
        } else if (type === 'solution') {
            const updates = { [`${myRole}_agreed_solution`]: true };
            if (currentProblem[`${partnerRole}_agreed_solution`]) {
                updates.status = 'resolved';
                updates.solution_check_date = new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000);
            }
            handleUpdate(currentProblem.id, updates);
        }
    };

    const handleSteelmanApproval = async () => {
        if (!currentProblem || !user) return;
        const myRole = currentProblem.roles[user.uid];
        const partnerRole = myRole === 'user1' ? 'user2' : 'user1';
        const updates = { [`${myRole}_approved_steelman`]: true };
        if (currentProblem[`${partnerRole}_approved_steelman`]) {
            updates.status = 'ai_review';
        }
        handleUpdate(currentProblem.id, updates);
    };
    
    const handlePrivateSubmit = async (text) => {
        if (!currentProblem || !user || isAiLoading) return;
        setIsAiLoading('translation');
        const myRole = currentProblem.roles[user.uid];
        const partnerRole = myRole === 'user1' ? 'user2' : 'user1';

        const translationPrompt = `You are The Skeptical Wombat. A user has submitted their private thoughts on an issue. Your job is to "translate" it, cutting through polite language to reveal the raw, underlying feeling or demand. Be blunt, insightful, and use your dry wit. Keep it to one or two sentences. Text: "${text}"`;
        const translationResult = await callGemini(translationPrompt);
        
        const updates = {
            [`${myRole}_private_version`]: text,
            [`${myRole}_submitted_private`]: true,
            [`${myRole}_translation`]: translationResult || "Translation failed.",
        };

        if (currentProblem[`${partnerRole}_submitted_private`]) updates.status = 'translation';
        handleUpdate(currentProblem.id, updates);
        setIsAiLoading(null);
    };
    
    const handleSteelmanSubmit = async (text) => {
        if (!currentProblem || !user) return;
        const myRole = currentProblem.roles[user.uid];
        const partnerRole = myRole === 'user1' ? 'user2' : 'user1';
        const updates = { [`${myRole}_steelman`]: text, [`${myRole}_submitted_steelman`]: true };
        if (currentProblem[`${partnerRole}_submitted_steelman`]) {
            updates.status = 'steelman_approval';
        }
        handleUpdate(currentProblem.id, updates);
    };
    
    const getAIAnalysis = async (problem) => {
        if (isAiLoading) return;
        setIsAiLoading('verdict');
        const beefedUpPrompt = `
        **Persona Lock-in:** You are The Skeptical Wombat. Your voice is essential. You are NOT a therapist.
        **Your Goal:** To cut through the emotional fog and expose the core logical disconnect.
        **Chain of Thought:** 1. Review all data.
        2. Analyze Partner 1's steelman vs Partner 2's private version. Is it accurate or a veiled complaint?
        3. Analyze Partner 2's steelman vs Partner 1's private version.
        4. Synthesize the Verdict: What is the *real* issue here? Frame it with a witty, sharp opening.
        5. Propose an Unconventional Solution: Offer a concrete, weirdly practical next step.
        **Input Data:**
        - Agreed Problem: "${problem.problem_statement}"
        - P1 Private: "${problem.user1_private_version}"
        - P2 Private: "${problem.user2_private_version}"
        - P1 Steelman of P2: "${problem.user1_steelman}"
        - P2 Steelman of P1: "${problem.user2_steelman}"
        **Begin Analysis:**`;
        const analysisText = await callGemini(beefedUpPrompt);
        if (analysisText) {
            await handleUpdate(problem.id, { ai_analysis: analysisText, status: 'propose_solutions' });
        }
        setIsAiLoading(null);
    };

    const handleProposeSolution = async (text) => {
        if (!currentProblem || !user) return;
        const myRole = currentProblem.roles[user.uid];
        const partnerRole = myRole === 'user1' ? 'user2' : 'user1';
        const updates = { [`${myRole}_proposed_solution`]: text };
        if (currentProblem[`${partnerRole}_proposed_solution`]) {
            updates.status = 'solution_steelman';
        }
        handleUpdate(currentProblem.id, updates);
    };

    const handleSolutionSteelmanSubmit = async (text) => {
        if (!currentProblem || !user || isAiLoading) return;
        const myRole = currentProblem.roles[user.uid];
        const partnerRole = myRole === 'user1' ? 'user2' : 'user1';
        const updates = { [`${myRole}_solution_steelman`]: text };

        if (currentProblem[`${partnerRole}_solution_steelman`]) {
            setIsAiLoading('wager');
            const wagerPrompt = `
            **Persona:** You are The Skeptical Wombat. You are blunt, realistic, and highly skeptical of starry-eyed, vague solutions.
            **Task:** You are given two proposed solutions AND each partner's attempt to explain the other's solution. Your job is to make a "wager" on which proposal is more likely to actually work, based on its realism and whether the partners seem to actually understand each other. Be blunt and explain your reasoning with dry wit.
            - **Solution A (from Partner 1):** "${currentProblem.user1_proposed_solution}"
            - **Partner 2's understanding of Solution A:** "${currentProblem.user2_solution_steelman}"
            - **Solution B (from Partner 2):** "${currentProblem.user2_proposed_solution}"
            - **Partner 1's understanding of Solution B:** "${text}" 
            **Wager:**`;
            const wagerResult = await callGemini(wagerPrompt);
            if(wagerResult) {
                updates.wombats_wager = wagerResult;
                updates.status = 'wager';
                await handleUpdate(currentProblem.id, updates);
            }
            setIsAiLoading(null);
        } else {
            await handleUpdate(currentProblem.id, updates);
        }
    };

    const handleGenerateImage = async () => {
        if (!currentProblem || isAiLoading) return;
        setIsAiLoading('image');
        try {
            const prompt = `
            **Persona:** You are a poetic and slightly surreal art director.
            **Task:** Generate a concise, evocative, and visually rich prompt for an AI image generator (like Midjourney or DALL-E). The prompt should be a single, flowing sentence that artistically captures the emotional journey from the problem to the solution. Do not use any line breaks.
            **Problem Statement:** "${currentProblem.problem_statement}"
            **Solution Statement:** "${currentProblem.solution_statement}"
            **Image Prompt:**`;

            const imagePrompt = await callGemini(prompt);
            if (imagePrompt) {
                setNotification({ show: true, message: `Image Prompt: "${imagePrompt}"`, duration: 8000 });
            } else {
                setNotification({ show: true, message: "The Wombat is feeling uninspired. Try again later.", type: 'warning' });
            }
        } finally {
            setIsAiLoading(null);
        }
    };

    const handleWombatCritique = async () => {
        // Placeholder for now
        setNotification({ show: true, message: "The Wombat is thinking about how to improve itself." });
    };

    const handleEscalate = async () => {
        setNotification({ show: true, message: "This feature is for premium users only." });
    };

    const handleBrainstorm = async () => {
        if (!currentProblem || isAiLoading) return;
        setIsAiLoading('brainstorm');
        try {
            const prompt = `
            **Persona:** You are The Skeptical Wombat. You've been asked to brainstorm solutions.
            **Task:** Based on the problem and the failed final solution attempt, provide three distinct, concrete, and slightly unconventional brainstorming ideas. Frame them as if you're slightly annoyed you have to do this.
            - **Problem:** "${currentProblem.problem_statement}"
            - **Failed Solution Attempt:** "${currentProblem.solution_statement}"
            **Brainstorming Ideas:**`;
            const brainstormed = await callGemini(prompt);
            if (brainstormed) {
                await handleUpdate(currentProblem.id, { brainstormed_solutions: brainstormed });
            }
        } finally {
            setIsAiLoading(null);
        }
    };
    
    const checkBS = async () => {
        // ... implementation ...
    };
    
    const emergencyWombat = async () => {
        // ... implementation ...
    };

    // --- Render Functions ---
    const renderPhase = () => {
        if (!currentProblem) return (
             <div className="text-center p-8 sm:p-12 bg-gray-900 rounded-xl shadow-2xl flex flex-col items-center justify-center h-full border-2 border-dashed border-gray-700">
                <WombatAvatar className="w-32 h-32 mb-4" />
                <h2 className="text-2xl font-serif text-white">How The Wombat Works</h2>
                <p className="text-gray-400 mt-2 mb-6 max-w-lg">This isn't therapy. It's a structured process to see if you're actually listening to each other. Select a drama from the list, or start a new one.</p>
                <ol className="text-left space-y-3 text-gray-300">
                    <li className="flex items-start"><span className="bg-lime-900 text-lime-300 font-bold rounded-full w-6 h-6 text-center mr-3 flex-shrink-0">1</span><span><span className="font-bold">Define the Problem:</span> You both agree on one neutral sentence.</span></li>
                    <li className="flex items-start"><span className="bg-lime-900 text-lime-300 font-bold rounded-full w-6 h-6 text-center mr-3 flex-shrink-0">2</span><span><span className="font-bold">State Your Case:</span> Privately, you each give your side. No one sees this but the Wombat.</span></li>
                    <li className="flex items-start"><span className="bg-lime-900 text-lime-300 font-bold rounded-full w-6 h-6 text-center mr-3 flex-shrink-0">3</span><span><span className="font-bold">Get the Translation:</span> The Wombat reveals what it thinks you *really* mean.</span></li>
                    <li className="flex items-start"><span className="bg-lime-900 text-lime-300 font-bold rounded-full w-6 h-6 text-center mr-3 flex-shrink-0">4</span><span><span className="font-bold">Argue Their Case:</span> You each try to explain the *other* person's argument charitably.</span></li>
                    <li className="flex items-start"><span className="bg-lime-900 text-lime-300 font-bold rounded-full w-6 h-6 text-center mr-3 flex-shrink-0">5</span><span><span className="font-bold">Approve the Summary:</span> You each confirm your partner understood your view.</span></li>
                    <li className="flex items-start"><span className="bg-lime-900 text-lime-300 font-bold rounded-full w-6 h-6 text-center mr-3 flex-shrink-0">6</span><span><span className="font-bold">Get the Verdict:</span> The Wombat delivers its blunt, insightful analysis.</span></li>
                    <li className="flex items-start"><span className="bg-lime-900 text-lime-300 font-bold rounded-full w-6 h-6 text-center mr-3 flex-shrink-0">7</span><span><span className="font-bold">Propose Solutions:</span> You each propose your own ideal solution.</span></li>
                    <li className="flex items-start"><span className="bg-lime-900 text-lime-300 font-bold rounded-full w-6 h-6 text-center mr-3 flex-shrink-0">8</span><span><span className="font-bold">Explain Their Solution:</span> You each explain what you think your partner's solution means.</span></li>
                    <li className="flex items-start"><span className="bg-lime-900 text-lime-300 font-bold rounded-full w-6 h-6 text-center mr-3 flex-shrink-0">9</span><span><span className="font-bold">See the Wager:</span> The Wombat places its bet on which solution is more realistic.</span></li>
                    <li className="flex items-start"><span className="bg-lime-900 text-lime-300 font-bold rounded-full w-6 h-6 text-center mr-3 flex-shrink-0">10</span><span><span className="font-bold">Find a Final Solution:</span> Armed with the wager, you both agree on a concrete next step.</span></li>
                </ol>
            </div>
        );
        
        const myRole = currentProblem.roles[user.uid];

        let phaseComponent;
        switch (currentProblem.status) {
            case 'agree_statement':
                phaseComponent = <PhaseAgreeStatement problem={currentProblem} onUpdate={handleUpdate} onAgree={handleAgreement} myRole={myRole} />;
                break;
            case 'private_versions':
                phaseComponent = <PhasePrivateVersion problem={currentProblem} onSave={handleUpdate} onSubmit={handlePrivateSubmit} myRole={myRole} isAiLoading={isAiLoading} />;
                break;
            case 'translation':
                phaseComponent = <PhaseTranslation problem={currentProblem} onNext={() => handleUpdate(currentProblem.id, {status: 'steelman'})} myRole={myRole} partnerName={partner?.name} />;
                break;
            case 'steelman':
                phaseComponent = <PhaseSteelman problem={currentProblem} onSave={handleUpdate} onSubmit={handleSteelmanSubmit} myRole={myRole} isAiLoading={isAiLoading}/>;
                break;
            case 'steelman_approval':
                phaseComponent = <PhaseSteelmanApproval problem={currentProblem} onApprove={handleSteelmanApproval} myRole={myRole} partnerName={partner?.name || 'Your Partner'} />;
                break;
            case 'ai_review':
                phaseComponent = <PhaseAIReview problem={currentProblem} onNext={() => handleUpdate(currentProblem.id, { status: 'propose_solutions' })} onEscalate={handleEscalate} isAiLoading={isAiLoading} />;
                break;
            case 'propose_solutions':
                phaseComponent = <PhaseProposeSolutions problem={currentProblem} onSave={handleUpdate} onSubmit={handleProposeSolution} myRole={myRole} />;
                break;
            case 'solution_steelman':
                phaseComponent = <PhaseSolutionSteelman problem={currentProblem} onSave={handleUpdate} onSubmit={handleSolutionSteelmanSubmit} myRole={myRole} partnerName={partner?.name || 'Your Partner'} />;
                break;
            case 'wager':
                 phaseComponent = <PhaseWager problem={currentProblem} onNext={() => handleUpdate(currentProblem.id, {status: 'solution'})} isAiLoading={isAiLoading} />;
                break;
            case 'solution':
                phaseComponent = <PhaseSolution problem={currentProblem} onUpdate={handleUpdate} onAgree={handleAgreement} onBrainstorm={handleBrainstorm} myRole={myRole} isAiLoading={isAiLoading} />;
                break;
            case 'resolved':
                phaseComponent = <PhaseResolved problem={currentProblem} onUpdate={handleUpdate} myRole={myRole} onGenerateImage={handleGenerateImage} isAiLoading={isAiLoading} mementoImage={mementoImage} onCritique={handleWombatCritique} />;
                break;
            default:
                phaseComponent = <p>Unknown phase. The Wombat is confused.</p>;
        }

        return (
            <div className="bg-gray-900 p-4 sm:p-6 rounded-xl shadow-2xl border border-gray-700">
                <ProgressBar status={currentProblem.status} />
                {phaseComponent}
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-800 font-sans text-gray-200 bg-gradient-to-br from-gray-800 to-gray-900">
            <style>
                {`
                    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700&family=Playfair+Display:wght@700&display=swap');
                    .font-serif { font-family: 'Playfair Display', serif; }
                    .font-sans { font-family: 'Inter', sans-serif; }
                `}
            </style>
            <Notification notification={notification} onDismiss={() => setNotification({ ...notification, show: false })} />
            
            {showInvite && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
                    <div className="bg-gray-800 p-8 rounded-lg shadow-2xl border border-gray-700 text-center">
                        <h2 className="text-2xl font-serif text-white mb-4">Invite Your Partner</h2>
                        <p className="text-gray-400 mb-4">Send this link to your partner to connect.</p>
                        <input type="text" readOnly value={inviteLink} className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md text-white"/>
                        <button onClick={() => setShowInvite(false)} className="mt-4 bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg">Close</button>
                    </div>
                </div>
            )}

            <header className="bg-gray-900/50 backdrop-blur-sm shadow-lg sticky top-0 z-40 border-b border-white/10">
                <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
                    <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center font-serif">
                        <WombatAvatar className="w-10 h-10 mr-3" />
                        Skeptical Wombat
                    </h1>
                    <div>
                        {!user && isLoading && <div className="text-sm text-gray-400">Loading...</div>}
                        {user && !partner && (
                            <button onClick={generateInviteLink} className="bg-lime-500 hover:bg-lime-600 text-gray-900 font-bold py-2 px-4 rounded-lg transition">Invite Partner</button>
                        )}
                        {user && partner && (
                             <button onClick={emergencyWombat} disabled={!!isAiLoading} className="bg-red-500/80 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg transition disabled:bg-red-800 disabled:animate-pulse">
                                {isAiLoading === 'emergency' ? 'Thinking...' : 'Emergency Wombat'}
                            </button>
                        )}
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                {!partner ? (
                    <div className="text-center p-12 bg-gray-900 rounded-xl shadow-2xl relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent z-10"></div>
                        <div className="absolute inset-0 animate-[spin_20s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#10B981_0%,#3B82F6_50%,#10B981_100%)] opacity-20"></div>
                        <div className="relative z-20">
                            <h2 className="text-3xl font-bold font-serif text-white">Welcome.</h2>
                            <p className="mt-4 text-gray-400">Let's sort out your little dramas. <br/> Invite your partner so the adjudication can begin.</p>
                        </div>
                    </div>
                ) : (
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="md:col-span-1">
                        <div className="bg-gray-900 p-4 rounded-xl shadow-2xl border border-gray-700 space-y-4">
                           <div>
                                <h3 className="font-bold text-lg text-white">Your Names</h3>
                                <div className="space-y-2 mt-2">
                                    <input type="text" placeholder="Your Name" defaultValue={user?.name} onBlur={(e) => updateUserName(e.target.value)} className="w-full p-2 bg-gray-800 border border-gray-600 rounded-md text-white"/>
                                    <input type="text" placeholder="Partner's Name" value={partner?.name || ''} disabled className="w-full p-2 bg-gray-800 border border-gray-600 rounded-md text-gray-400"/>
                                </div>
                           </div>
                           <hr className="border-gray-700"/>
                            <div>
                                <div className="flex border-b border-gray-700 mb-4">
                                    <button onClick={() => setActiveTab('active')} className={`py-2 px-4 font-bold ${activeTab === 'active' ? 'text-lime-400 border-b-2 border-lime-400' : 'text-gray-400'}`}>Active Dramas</button>
                                    <button onClick={() => setActiveTab('trophy')} className={`py-2 px-4 font-bold ${activeTab === 'trophy' ? 'text-lime-400 border-b-2 border-lime-400' : 'text-gray-400'}`}>Trophy Room</button>
                                </div>
                                <button onClick={startNewProblem} disabled={isCreatingProblem} className="w-full bg-lime-500 hover:bg-lime-600 text-gray-900 font-bold py-2 px-4 rounded-lg mb-4 transition disabled:bg-gray-600 disabled:cursor-not-allowed">
                                    {isCreatingProblem ? 'Creating...' : '+ New Problem'}
                                </button>
                                <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                                    {problems.filter(p => activeTab === 'active' ? p.status !== 'resolved' : p.status === 'resolved').map(p => (
                                        <div key={p.id} onClick={() => setCurrentProblem(p)} className={`p-4 rounded-lg cursor-pointer transition ${currentProblem?.id === p.id ? 'bg-lime-900/50 ring-2 ring-lime-400' : 'bg-gray-800 hover:bg-gray-700'}`}>
                                            <p className="font-semibold truncate text-white">{p.problem_statement || `Problem from ${new Date(p.createdAt.seconds * 1000).toLocaleDateString()}`}</p>
                                            <span className={`text-xs font-medium px-2 py-1 rounded-full ${ p.status === 'resolved' ? 'bg-green-500/20 text-green-300' : 'bg-yellow-500/20 text-yellow-300'}`}>{p.status.replace(/_/g, ' ')}</span>
                                        </div>
                                    ))}
                                    {activeTab === 'trophy' && problems.filter(p=>p.status === 'resolved').length === 0 && 
                                        <div className="text-center p-8 text-gray-500">
                                            <img src={WOMBAT_TROPHY_URL} className="w-32 h-32 mx-auto rounded-full opacity-30" />
                                            <p className="mt-4 font-serif">The Trophy Room is depressingly empty.</p>
                                            <p className="text-sm">Try solving a problem first.</p>
                                        </div>
                                    }
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="md:col-span-2">
                       {renderPhase()}
                    </div>
                </div>
                )}
            </main>
        </div>
    );
}

// ===================================================================================
// --- App Structure Explanation for AI ---
// ===================================================================================
//
// **Overview:**
// This is a single-file React application designed to help couples resolve conflicts
// through a structured, multi-phase process adjudicated by an AI persona called
// "The Skeptical Wombat". It uses Firebase for real-time database and authentication.
//
// **Core Technologies:**
// - **React:** For the user interface, using Hooks (useState, useEffect, useRef) for state management.
// - **Firebase Firestore:** A NoSQL database used for storing user profiles and problem data in real-time.
// - **Firebase Authentication:** For anonymous user sign-in to provide a unique ID for each session.
// - **Tailwind CSS:** For styling the application. Custom fonts are imported via a <style> tag.
// - **Gemini API:** The generative AI model that powers the Skeptical Wombat persona.
//
// **Data Model (Firestore):**
// 1.  **Users:** Stored in `/artifacts/{appId}/users/{userId}`. Each user document contains:
//     - `uid`: The user's unique authentication ID.
//     - `name`: A display name the user can set.
//     - `partnerId`: The `uid` of their connected partner.
// 2.  **Problems:** Stored in `/artifacts/{appId}/public/data/problems/{problemId}`. Each problem document contains all the data for a single conflict resolution session, including:
//     - `participants`: An array of the two user `uid`s.
//     - `roles`: An object mapping `uid` to 'user1' or 'user2'.
//     - `status`: A string representing the current phase of the process (e.g., 'agree_statement', 'steelman', 'wager').
//     - Fields for each piece of user-submitted text (e.g., `problem_statement`, `user1_private_version`, `user2_steelman`).
//     - Fields for AI-generated content (e.g., `user1_translation`, `ai_analysis`, `wombats_wager`).
//     - Boolean flags for tracking progress (e.g., `user1_agreed_problem`, `user2_submitted_steelman`).
//
// **Component Structure:**
// The code is organized into logical blocks within this single file, intended to be easily split:
// 1.  **Helper & UI Components:** Small, reusable components like `WombatAvatar`, `ProgressBar`, `Notification`, and `DraftTextarea`.
// 2.  **Phase-Specific Components:** A component for each distinct phase of the conflict resolution process (e.g., `PhaseAgreeStatement`, `PhaseTranslation`, `PhaseWager`). These components receive the `currentProblem` object as a prop and render the appropriate UI.
// 3.  **Main App Component (`App`):** The orchestrator. It handles:
//     - **State Management:** Holds all major state variables (`user`, `partner`, `problems`, `currentProblem`).
//     - **Authentication Flow:** Manages user sign-in and linking with a partner via URL parameters.
//     - **Firestore Listeners:** Uses `onSnapshot` to listen for real-time updates to user profiles and the list of problems.
//     - **Core Logic Handlers:** Contains all the functions that update Firestore (`handleUpdate`, `handleAgreement`, etc.) and call the AI (`callGemini`).
//     - **Rendering Logic:** The `renderPhase` function acts as a router, selecting which phase-specific component to display based on the `currentProblem.status`.
//
// **AI Integration:**
// - The `callGemini` function is a centralized utility for making `fetch` requests to the Gemini API.
// - Different features are powered by distinct, carefully crafted prompts:
//   - **Translation:** Translates polite language into its underlying meaning.
//   - **BS Meter:** Provides a quick check on the quality of a "steelman" attempt.
//   - **Verdict (`getAIAnalysis`):** The main analysis, synthesizing all user input into a final judgment.
//   - **Wager:** Analyzes proposed solutions and their steelmans to predict which is more viable.
//   - **Emergency Wombat:** Provides generic, witty advice.
//
// **User Flow:**
// 1. A user arrives and is signed in anonymously.
// 2. They generate an invite link.
// 3. A second user (partner) opens the link, which links their accounts via Firestore.
// 4. Once partnered, they can create a "New Problem".
// 5. They proceed through the multi-phase process, with their progress saved in real-time to the problem's document in Firestore.
// 6. The app's UI reacts to changes in the problem document's `status` field, showing the correct component for the current phase.
//
// ===================================================================================
// --- Prompt for AI UI Generation Tool ---
// ===================================================================================
//
// **Tool:** An AI-powered UI/UX design tool or code generator (e.g., v0.dev, Midjourney for UI).
// **Goal:** To generate an alternative, high-fidelity UI design for the "Skeptical Wombat" application.
//
// **Prompt:**
// "Generate a UI design for a web application called 'Skeptical Wombat'. It's a tool for couples to resolve conflicts, guided by a witty, skeptical AI wombat.
//
// **Core Aesthetic:**
// - **Theme:** Dark mode, sophisticated, modern, and slightly unconventional. Think 'premium software' meets 'a quirky detective's office'.
// - **Color Palette:** Primary background should be a very dark charcoal or slate gray (e.g., #111827). The main accent color should be a vibrant, electric lime green (#A3E635) used for buttons, highlights, and progress bars. Secondary accents can include a deep purple (#8B5CF6) for AI-related actions and a warm amber (#F59E0B) for success states or highlights.
// - **Typography:** Use a two-font system. A sharp, elegant serif font (like 'Playfair Display') for all major headings and titles. A clean, highly-readable sans-serif font (like 'Inter') for all body text, labels, and instructions.
// - **Imagery:** The app's mascot is a skeptical-looking wombat, often dressed in quirky, formal wear (like a bow tie or monocle). This character should be integrated thoughtfully, not just slapped on.
//
// **Key Screens to Design:**
// 1.  **The Main Interface (Dashboard View):**
//     - A two-column layout.
//     - **Left Column:** A control panel. At the top, it should have fields for the user and their partner to enter their names. Below that, two tabs: 'Active Dramas' and 'Trophy Room'. Below the tabs, a list of current problems, each represented by a clean card with its title and status. A prominent lime green 'New Problem' button should be at the top of this list.
//     - **Right Column:** The main content area. When no problem is selected, this should display a large, welcoming "How It Works" guide, explaining the app's multi-step process with icons and short descriptions.
//
// 2.  **The Problem-Solving View (An active problem is selected):**
//     - This view replaces the "How It Works" guide in the right column.
//     - At the very top, there must be a multi-step progress bar that visually tracks the user's current phase (e.g., 'Define Problem', 'Translation', 'Verdict', 'Wager').
//     - Below the progress bar is the main content card for the current phase. This card should contain a title (e.g., "Phase 4: Argue Their Case"), a short, witty instruction, and a large textarea for user input.
//     - Buttons for actions (e.g., "Agree", "Submit", "BS Meter") should be clearly labeled and styled with the accent colors.
//
// 3.  **The AI Verdict Screen:**
//     - This is a special phase. It should be visually impactful.
//     - Display a large avatar of the Skeptical Wombat.
//     - Below the avatar, present the AI's text analysis in a beautifully formatted, easy-to-read block, perhaps styled like a formal judgment or a detective's case notes. Use the serif font for the verdict's title.
//
// **Overall Feel:**
// The UI should feel clean, spacious, and premium. Use subtle gradients, soft box shadows, and glowing effects on interactive elements to add depth. It should be intuitive but also reflect the unique, slightly sarcastic, and intelligent personality of the Skeptical Wombat."
//
