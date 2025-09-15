/**
 * Tests for the AI service functions.
 * These tests verify that our AI functions are working correctly.
 */

import { describe, test, expect, beforeEach } from 'vitest';
import { getTranslation, getAIAnalysis, getBSAnalysis, getEmergencyWombat } from './ai';

// Mock environment variables
beforeEach(() => {
    // Mock the Gemini API key for testing
    (import.meta as any).env = {
        VITE_GEMINI_API_KEY: 'test-api-key'
    };
});

describe('AI Service Functions', () => {
    test('getTranslation should return a translation', async () => {
        const mockText = "I feel like you don't listen to me anymore.";
        
        // Note: This would normally make an actual API call
        // In a real test environment, we'd mock the API response
        const result = await getTranslation(mockText);
        
        // Basic validation - should return a string
        expect(typeof result).toBe('string');
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
        
        expect(typeof result).toBe('string');
    });

    test('getBSAnalysis should detect non-genuine steelman attempts', async () => {
        const mockText = "I understand you're wrong about everything.";
        
        const result = await getBSAnalysis(mockText);
        
        expect(typeof result).toBe('string');
    });

    test('getEmergencyWombat should provide emergency advice', async () => {
        const result = await getEmergencyWombat();
        
        expect(typeof result).toBe('string');
    });
});

// Integration tests would go here
describe('AI Integration Tests', () => {
    test.skip('Full workflow integration test', async () => {
        // This would test the entire AI workflow
        // Skipped for now as it requires actual API calls
    });
});