/**
 * Tests for the AI service functions.
 * The Gemini API is mocked via a stubbed fetch so no real network calls are made.
 */

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { getTranslation, getAIAnalysis, getBSAnalysis, getEmergencyWombat, getBrainstorm, getCritique, getWager } from './ai';
import { Problem } from '../types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const stubFetchResponse = (text: string) => {
    globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
            candidates: [{ content: { parts: [{ text }] } }]
        })
    } as unknown as Response);
};

const mockProblem: Problem = {
    id: 'test-problem-1',
    problem_statement: 'We disagree about screen time.',
    user1_private_version: 'They are always on their phone.',
    user2_private_version: 'I need downtime after work.',
    user1_steelman: 'My partner needs dedicated connection time.',
    user2_steelman: 'My partner needs personal space to decompress.',
    user1_proposed_solution: 'Phone-free dinners every night.',
    user2_proposed_solution: 'One hour of solo time after work, then we connect.',
    user1_solution_steelman: 'A structured routine gives them the connection they need.',
    user2_solution_steelman: 'A boundary protects my recovery time.',
    ai_analysis: 'The real issue is neither of you said what you actually wanted.',
    human_verdict: '',
    wombats_wager: 'Solution B wins. It names a concrete time boundary.',
};

// ---------------------------------------------------------------------------
// Setup / teardown
// ---------------------------------------------------------------------------

beforeEach(() => {
    vi.stubEnv('VITE_GEMINI_API_KEY', 'test-api-key-123');
    // Ensure LangChain opt-in is disabled so we exercise the fetch path
    vi.stubEnv('VITE_USE_LANGCHAIN', 'false');
});

afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetAllMocks();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('AI Service Functions', () => {
    test('getTranslation returns the translated text', async () => {
        stubFetchResponse('You want attention NOW.');
        const result = await getTranslation("I feel like you don't listen to me anymore.");
        expect(result).toBe('You want attention NOW.');
    });

    test('getTranslation returns null when API key is missing', async () => {
        vi.stubEnv('VITE_GEMINI_API_KEY', '');
        const result = await getTranslation('some text');
        expect(result).toBeNull();
    });

    test('getAIAnalysis returns analysis text', async () => {
        const expected = 'The real issue is control, not screen time.';
        stubFetchResponse(expected);
        const result = await getAIAnalysis(mockProblem);
        expect(result).toBe(expected);
    });

    test('getBSAnalysis returns meter reading', async () => {
        stubFetchResponse('That is not a steelman, that is a veiled attack with a bow on it.');
        const result = await getBSAnalysis('I understand you are wrong about everything.');
        expect(result).toBe('That is not a steelman, that is a veiled attack with a bow on it.');
    });

    test('getEmergencyWombat returns advice', async () => {
        stubFetchResponse('Have you tried being less reactive? Asking for a wombat.');
        const result = await getEmergencyWombat();
        expect(result).toBe('Have you tried being less reactive? Asking for a wombat.');
    });

    test('getBrainstorm returns solution ideas', async () => {
        const expected = '1. Set a 30-minute phone-free window after dinner.\n2. Use a shared calendar.';
        stubFetchResponse(expected);
        const result = await getBrainstorm(mockProblem);
        expect(result).toBe(expected);
    });

    test('getCritique returns session critique', async () => {
        const expected = 'Both partners avoided naming the real power dynamic.';
        stubFetchResponse(expected);
        const result = await getCritique(mockProblem);
        expect(result).toBe(expected);
    });

    test('getWager returns wager text based on both proposed solutions', async () => {
        const expected = 'Solution B wins. It names a concrete time boundary.';
        stubFetchResponse(expected);
        const result = await getWager(mockProblem, 'A structured routine gives them the connection they need.');
        expect(result).toBe(expected);
    });

    test('callGemini handles a non-ok API response gracefully', async () => {
        globalThis.fetch = vi.fn().mockResolvedValue({
            ok: false,
            status: 429,
            json: () => Promise.resolve({})
        } as unknown as Response);
        const result = await getTranslation('rate limited');
        expect(result).toBeNull();
    });
});

describe('AI Integration Tests', () => {
    test.skip('Full workflow integration test', async () => {
        // Requires a real VITE_GEMINI_API_KEY set in the environment.
    });
});
