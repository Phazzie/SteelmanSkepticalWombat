/**
 * Proves the point of the DataService seam: AppContext's real business logic
 * (role assignment, status transitions, partner linking) is exercised here
 * against FakeDataService — no network, no Supabase project, no mocking
 * framework wrangling a real client.
 */
import React from 'react';
import { describe, test, expect, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { AppProvider } from './AppContext';
import { useAppContext } from '../hooks/useAppContext';
import { FakeDataService } from '../services/FakeDataService';

vi.mock('../services/ai', () => ({
    getTranslation: vi.fn().mockResolvedValue('mock translation'),
    getAIAnalysis: vi.fn().mockResolvedValue('mock analysis'),
    getWager: vi.fn().mockResolvedValue('mock wager'),
    getBSAnalysis: vi.fn().mockResolvedValue('mock bs analysis'),
    getEmergencyWombat: vi.fn().mockResolvedValue('mock advice'),
    getBrainstorm: vi.fn().mockResolvedValue('mock brainstorm'),
    getCritique: vi.fn().mockResolvedValue('mock critique'),
}));

/** Minimal consumer that exposes context state/actions for assertions. */
const TestConsumer = () => {
    const { user, partner, currentProblem, createProblem, handlePrivateSubmit } = useAppContext();
    return (
        <div>
            <div data-testid="user">{user?.uid ?? 'no-user'}</div>
            <div data-testid="partner">{partner?.uid ?? 'no-partner'}</div>
            <div data-testid="problem-status">{currentProblem?.status ?? 'no-problem'}</div>
            <div data-testid="my-role">{currentProblem && user ? currentProblem.roles?.[user.uid] : ''}</div>
            <button onClick={createProblem}>Create Problem</button>
            <button onClick={() => handlePrivateSubmit('I feel unheard.')}>Submit Private Version</button>
        </div>
    );
};

/** Sets up two users already linked as partners, "logged in" as user-a. */
async function setUpLinkedPartners(): Promise<FakeDataService> {
    const ds = new FakeDataService();
    ds.seedAuthenticatedUser('user-a');
    await ds.createUserProfile('user-a');
    ds.seedAuthenticatedUser('user-b');
    await ds.acceptInvite('user-a');
    ds.seedAuthenticatedUser('user-a');
    return ds;
}

describe('AppContext against FakeDataService', () => {
    test('loads the signed-in user and their linked partner', async () => {
        const ds = await setUpLinkedPartners();
        render(<AppProvider dataService={ds}><TestConsumer /></AppProvider>);

        await waitFor(() => expect(screen.getByTestId('user')).toHaveTextContent('user-a'));
        expect(screen.getByTestId('partner')).toHaveTextContent('user-b');
    });

    test('creating a problem assigns user1/user2 roles from the two participants', async () => {
        const ds = await setUpLinkedPartners();
        render(<AppProvider dataService={ds}><TestConsumer /></AppProvider>);

        await waitFor(() => expect(screen.getByTestId('partner')).toHaveTextContent('user-b'));
        fireEvent.click(screen.getByText('Create Problem'));

        await waitFor(() => expect(screen.getByTestId('problem-status')).toHaveTextContent('agree_statement'));
        expect(screen.getByTestId('my-role')).toHaveTextContent('user1');
    });

    test('submitting a private version stores it under the caller\'s role and stamps a translation', async () => {
        const ds = await setUpLinkedPartners();
        render(<AppProvider dataService={ds}><TestConsumer /></AppProvider>);

        await waitFor(() => expect(screen.getByTestId('partner')).toHaveTextContent('user-b'));
        fireEvent.click(screen.getByText('Create Problem'));
        await waitFor(() => expect(screen.getByTestId('problem-status')).toHaveTextContent('agree_statement'));

        fireEvent.click(screen.getByText('Submit Private Version'));

        await waitFor(async () => {
            const problems = await new Promise<any[]>((resolve) => ds.onProblemsSnapshot('user-a', resolve));
            const problem = problems[0];
            expect(problem.user1_private_version).toBe('I feel unheard.');
            expect(problem.user1_submitted_private).toBe(true);
            expect(problem.user1_translation).toBe('mock translation');
        });
    });

    test('unmounting tears down every subscription — no leaked auth/user/partner listeners', async () => {
        const ds = await setUpLinkedPartners();
        const { unmount } = render(<AppProvider dataService={ds}><TestConsumer /></AppProvider>);

        // auth + user + partner subscriptions should all be live at this point
        await waitFor(() => expect(screen.getByTestId('partner')).toHaveTextContent('user-b'));
        expect(ds.activeListenerCount).toBeGreaterThan(0);

        unmount();

        expect(ds.activeListenerCount).toBe(0);
    });

    test('switching from a partnered user to a partnerless one drops the stale partner subscription', async () => {
        const ds = await setUpLinkedPartners();
        render(<AppProvider dataService={ds}><TestConsumer /></AppProvider>);
        await waitFor(() => expect(screen.getByTestId('partner')).toHaveTextContent('user-b'));

        const withPartnerCount = ds.activeListenerCount;

        ds.clearPartner('user-a');

        await waitFor(() => expect(screen.getByTestId('partner')).toHaveTextContent('no-partner'));
        expect(ds.activeListenerCount).toBeLessThan(withPartnerCount);
    });
});
