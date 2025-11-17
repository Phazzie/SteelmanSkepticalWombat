/**
 * Tests for the AI service functions.
 * These tests verify that our AI functions are working correctly.
 */

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { getTranslation, getAIAnalysis, getBSAnalysis, getEmergencyWombat } from './ai';

// Mock fetch globally
global.fetch = vi.fn();

// Mock the LangChain module to force using the basic fetch implementation
vi.mock('@langchain/google-genai', () => {
    throw new Error('LangChain not available');
});

beforeEach(() => {
    // Mock the Gemini API key for testing using vi.stubEnv
    vi.stubEnv('VITE_GEMINI_API_KEY', 'test-api-key');

    // Setup default mock response for fetch
    (global.fetch as any).mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
            candidates: [
                {
                    content: {
                        parts: [
                            { text: 'Mocked AI response' }
                        ]
                    }
                }
            ]
        })
    });
});

afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
});

describe('AI Service Functions', () => {
    test('getTranslation should return a translation', async () => {
        const mockText = "I feel like you don't listen to me anymore.";

        const result = await getTranslation(mockText);

        // Check that result is a string and contains content
        expect(result).toBeDefined();
        expect(result).toBe('Mocked AI response');
        expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    test('getAIAnalysis should analyze steelman arguments', async () => {
        const mockProblem = {
            id: "test-problem",
            problem_statement: "Test problem",
            user1_private_version: "",
            user2_private_version: "",
            user1_steelman: "I understand my partner feels unheard when I'm on my phone.",
            user2_steelman: "I understand my partner needs downtime after work.",
            user1_proposed_solution: "",
            user2_proposed_solution: "",
            user1_solution_steelman: "",
            user2_solution_steelman: "",
            ai_analysis: "",
            human_verdict: "",
        };

        const result = await getAIAnalysis(mockProblem);

        expect(result).toBeDefined();
        expect(result).toBe('Mocked AI response');
        expect(global.fetch).toHaveBeenCalled();
    });

    test('getBSAnalysis should detect non-genuine steelman attempts', async () => {
        const mockText = "I understand you're wrong about everything.";

        const result = await getBSAnalysis(mockText);

        expect(result).toBeDefined();
        expect(result).toBe('Mocked AI response');
        expect(global.fetch).toHaveBeenCalled();
    });

    test('getEmergencyWombat should provide emergency advice', async () => {
        const result = await getEmergencyWombat();

        expect(result).toBeDefined();
        expect(result).toBe('Mocked AI response');
        expect(global.fetch).toHaveBeenCalled();
    });

    test('should return null when API key is missing', async () => {
        // Clear the mocked env variable
        vi.unstubAllEnvs();

        const result = await getTranslation("test text");

        expect(result).toBeNull();
        expect(global.fetch).not.toHaveBeenCalled();
    });
});

// Integration tests would go here
describe('AI Integration Tests', () => {
    test.skip('Full workflow integration test', async () => {
        // This would test the entire AI workflow
        // Skipped for now as it requires actual API calls
    });
});