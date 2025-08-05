import React from 'react';

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

export default ProgressBar;
