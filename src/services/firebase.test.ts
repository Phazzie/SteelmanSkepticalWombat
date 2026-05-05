import { describe, test, expect, vi, beforeEach } from 'vitest';
import { updateUserName } from './firebase';
import { updateDoc, doc } from 'firebase/firestore';

// Mock dependencies
vi.mock('firebase/app', () => ({
    initializeApp: vi.fn(),
}));

vi.mock('firebase/auth', () => ({
    getAuth: vi.fn(),
    signInAnonymously: vi.fn(),
    signInWithCustomToken: vi.fn(),
    onAuthStateChanged: vi.fn(),
}));

vi.mock('firebase/firestore', () => ({
    getFirestore: vi.fn(),
    doc: vi.fn(),
    getDoc: vi.fn(),
    setDoc: vi.fn(),
    updateDoc: vi.fn(),
    onSnapshot: vi.fn(),
    collection: vi.fn(),
    addDoc: vi.fn(),
    query: vi.fn(),
    where: vi.fn(),
}));

describe('firebase service', () => {
    describe('updateUserName', () => {
        beforeEach(() => {
            vi.clearAllMocks();
            // Provide a dummy return value for doc so updateDoc doesn't fail on undefined
            (doc as any).mockReturnValue('mock-doc-ref');
        });

        test('updates name with trimmed string when valid', async () => {
            const uid = 'test-uid';
            const newName = '  Valid Name  ';

            await updateUserName(uid, newName);

            expect(doc).toHaveBeenCalled();
            expect(updateDoc).toHaveBeenCalledWith('mock-doc-ref', { name: 'Valid Name' });
        });

        test('truncates name to 50 characters', async () => {
            const uid = 'test-uid';
            const longName = 'A'.repeat(60);

            await updateUserName(uid, longName);

            expect(updateDoc).toHaveBeenCalledWith('mock-doc-ref', { name: 'A'.repeat(50) });
        });

        test('does nothing when newName is empty', async () => {
            const uid = 'test-uid';
            const newName = '';

            const result = await updateUserName(uid, newName);

            expect(updateDoc).not.toHaveBeenCalled();
            expect(result).toBeUndefined();
        });

        test('does nothing when uid is empty', async () => {
            const uid = '';
            const newName = 'Valid Name';

            const result = await updateUserName(uid, newName);

            expect(updateDoc).not.toHaveBeenCalled();
            expect(result).toBeUndefined();
        });

        test('does nothing when newName is falsy', async () => {
            const uid = 'test-uid';
            // Passing undefined cast as string to test the JS-level protection
            const result = await updateUserName(uid, undefined as unknown as string);

            expect(updateDoc).not.toHaveBeenCalled();
            expect(result).toBeUndefined();
        });
    });
});
