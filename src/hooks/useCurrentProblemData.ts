import { useContext } from 'react';
import { AppContext } from '../context/AppContext';

export const useCurrentProblemData = () => {
    const { user, partner, currentProblem } = useContext(AppContext);

    if (!currentProblem || !user) {
        return {
            problem: null,
            myRole: null,
            partnerRole: null,
            partnerName: null,
            iHaveAgreed: false,
            partnerHasAgreed: false,
            iHaveSubmitted: false,
            partnerHasSubmitted: false,
            iHaveApproved: false,
            partnerHasApproved: false,
            iHaveProposed: false,
            partnerHasProposed: false,
            iHaveSubmittedSolutionSteelman: false,
            partnerHasSubmittedSolutionSteelman: false,
        };
    }

    const myRole = currentProblem.roles[user.uid];
    const partnerRole = myRole === 'user1' ? 'user2' : 'user1';
    const partnerName = partner?.name || 'Your Partner';

    // Agreement phase
    const iHaveAgreed = currentProblem[`${myRole}_agreed_problem`];
    const partnerHasAgreed = currentProblem[`${partnerRole}_agreed_problem`];

    // Private version submission
    const iHaveSubmitted = currentProblem[`${myRole}_submitted_private`];
    const partnerHasSubmitted = currentProblem[`${partnerRole}_submitted_private`];

    // Steelman approval
    const iHaveApproved = currentProblem[`${myRole}_approved_steelman`];
    const partnerHasApproved = currentProblem[`${partnerRole}_approved_steelman`];

    // Solution proposal
    const iHaveProposed = !!currentProblem[`${myRole}_proposed_solution`];
    const partnerHasProposed = !!currentProblem[`${partnerRole}_proposed_solution`];

    // Solution steelman submission
    const iHaveSubmittedSolutionSteelman = !!currentProblem[`${myRole}_solution_steelman`];
    const partnerHasSubmittedSolutionSteelman = !!currentProblem[`${partnerRole}_solution_steelman`];


    return {
        problem: currentProblem,
        myRole,
        partnerRole,
        partnerName,
        iHaveAgreed,
        partnerHasAgreed,
        iHaveSubmitted,
        partnerHasSubmitted,
        iHaveApproved,
        partnerHasApproved,
        iHaveProposed,
        partnerHasProposed,
        iHaveSubmittedSolutionSteelman,
        partnerHasSubmittedSolutionSteelman,
    };
};
