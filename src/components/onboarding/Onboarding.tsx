import React from 'react';
import Joyride, { STATUS } from 'react-joyride';

const Onboarding = ({ run, setRun }) => {
    const steps = [
        {
            target: '.app-header',
            content: 'Welcome to the Skeptical Wombat! This is where you can manage your account and invite your partner.',
        },
        {
            target: '.sidebar',
            content: 'This is the sidebar, where you can see a list of your problems and start new ones.',
        },
        {
            target: '.phase-component',
            content: 'This is the main content area, where you will see the current phase of your problem.',
        },
    ];

    const handleJoyrideCallback = (data) => {
        const { status } = data;
        if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status)) {
            setRun(false);
        }
    };

    return (
        <Joyride
            steps={steps}
            run={run}
            continuous
            showProgress
            showSkipButton
            callback={handleJoyrideCallback}
        />
    );
};

export default Onboarding;
