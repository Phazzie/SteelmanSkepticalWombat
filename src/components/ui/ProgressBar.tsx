
const PHASE_LABELS: Record<string, string> = {
    agree_statement: 'Define',
    private_versions: 'Private',
    translation: 'Translation',
    steelman: 'Steelman',
    steelman_approval: 'Approval',
    ai_review: 'Verdict',
    propose_solutions: 'Propose',
    solution_steelman: 'Explain',
    wager: 'Wager',
    solution: 'Solution',
    resolved: 'Resolved',
};

/**
 * Renders a visual timeline of the problem-solving process.
 * @param {{status: string}} props - The current status of the problem.
 * @returns {JSX.Element}
 */
const ProgressBar = ({ status }) => {
    const phases = Object.keys(PHASE_LABELS);
    const currentPhaseIndex = phases.indexOf(status);
    return (
        <div className="flex justify-between items-center mb-6 p-1 bg-gray-900/50 rounded-full text-[8px] sm:text-xs">
            {phases.map((phase, index) => (
                <div className="flex-1 text-center" key={phase}>
                    <p className={`capitalize transition-colors duration-300 ${index <= currentPhaseIndex ? 'text-lime-400 font-bold' : 'text-gray-500'}`}>
                        {PHASE_LABELS[phase]}
                    </p>
                </div>
            ))}
        </div>
    );
};

export default ProgressBar;
