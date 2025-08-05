import React, { Suspense } from 'react';
import { AuthProvider, AuthContext } from './context/AuthContext';
import { ProblemProvider, ProblemContext } from './context/ProblemContext';
import WombatAvatar from './components/ui/WombatAvatar';
import ProgressBar from './components/ui/ProgressBar';
import Notification from './components/ui/Notification';
import { WOMBAT_TROPHY_URL } from './constants';

const PhaseAgreeStatement = React.lazy(() => import('./components/phases/PhaseAgreeStatement'));
const PhasePrivateVersion = React.lazy(() => import('./components/phases/PhasePrivateVersion'));
const PhaseTranslation = React.lazy(() => import('./components/phases/PhaseTranslation'));
const PhaseSteelman = React.lazy(() => import('./components/phases/PhaseSteelman'));
const PhaseSteelmanApproval = React.lazy(() => import('./components/phases/PhaseSteelmanApproval'));
const PhaseAIReview = React.lazy(() => import('./components/phases/PhaseAIReview'));
const PhaseProposeSolutions = React.lazy(() => import('./components/phases/PhaseProposeSolutions'));
const PhaseSolutionSteelman = React.lazy(() => import('./components/phases/PhaseSolutionSteelman'));
const PhaseWager = React.lazy(() => import('./components/phases/PhaseWager'));
const PhaseSolution = React.lazy(() => import('./components/phases/PhaseSolution'));
const PhaseResolved = React.lazy(() => import('./components/phases/PhaseResolved'));

const phaseMap = {
    agree_statement: PhaseAgreeStatement,
    private_versions: PhasePrivateVersion,
    translation: PhaseTranslation,
    steelman: PhaseSteelman,
    steelman_approval: PhaseSteelmanApproval,
    ai_review: PhaseAIReview,
    propose_solutions: PhaseProposeSolutions,
    solution_steelman: PhaseSolutionSteelman,
    wager: PhaseWager,
    solution: PhaseSolution,
    resolved: PhaseResolved,
};

const App = () => {
    return (
        <AuthProvider>
            <ProblemProvider>
                <MainApp />
            </ProblemProvider>
        </AuthProvider>
    );
};

const MainApp = () => {
    const { user, partner, isLoading, notification, setNotification, updateUserName } = React.useContext(AuthContext);
    const {
        problems,
        currentProblem,
        isAiLoading,
        startNewProblem,
        setCurrentProblem,
        handleUpdate,
        handleAgreement,
        handleSteelmanApproval,
        handlePrivateSubmit,
        handleProposeSolution,
        handleSolutionSteelmanSubmit,
        handleEmergencyWombat,
    } = React.useContext(ProblemContext);

    const [inviteLink, setInviteLink] = React.useState('');
    const [showInvite, setShowInvite] = React.useState(false);
    const [activeTab, setActiveTab] = React.useState('active');

    const generateInviteLink = () => {
        if (!user) return;
        const link = `${window.location.origin}${window.location.pathname}?invite=${user.uid}`;
        setInviteLink(link);
        setShowInvite(true);
    };

    const renderPhase = () => {
        if (!currentProblem) {
            return (
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
        }

        const myRole = currentProblem.roles[user.uid];
        const PhaseComponent = phaseMap[currentProblem.status];

        if (!PhaseComponent) {
            return <p>Unknown phase. The Wombat is confused.</p>;
        }

        const phaseProps = {
            problem: currentProblem,
            myRole,
            isAiLoading,
            onUpdate: handleUpdate,
            onAgree: handleAgreement,
            onSubmit: handlePrivateSubmit, // This will be overridden in some phases
            onSave: handleUpdate, // for DraftTextarea
            onNext: (status) => handleUpdate(currentProblem.id, { status }),
            partnerName: partner?.name || 'Your Partner',
            onApprove: handleSteelmanApproval,
            onEscalate: () => {},
            onGenerateImage: () => {},
            onCritique: () => {},
            mementoImage: null,
        };

        if (currentProblem.status === 'private_versions') {
            phaseProps.onSubmit = handlePrivateSubmit;
        } else if (currentProblem.status === 'steelman') {
            phaseProps.onSubmit = handleSteelmanSubmit;
        } else if (currentProblem.status === 'propose_solutions') {
            phaseProps.onSubmit = handleProposeSolution;
        } else if (currentProblem.status === 'solution_steelman') {
            phaseProps.onSubmit = handleSolutionSteelmanSubmit;
        }

        return (
            <div className="bg-gray-900 p-4 sm:p-6 rounded-xl shadow-2xl border border-gray-700">
                <ProgressBar status={currentProblem.status} />
                <Suspense fallback={<div>Loading phase...</div>}>
                    <PhaseComponent {...phaseProps} />
                </Suspense>
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
                             <button onClick={handleEmergencyWombat} disabled={!!isAiLoading} className="bg-red-500/80 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg transition disabled:bg-red-800 disabled:animate-pulse">
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
                                <button onClick={startNewProblem} className="w-full bg-lime-500 hover:bg-lime-600 text-gray-900 font-bold py-2 px-4 rounded-lg mb-4 transition">+ New Problem</button>
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

export default App;
