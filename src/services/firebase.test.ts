import { beforeEach, describe, expect, test, vi } from 'vitest';

const firestoreMocks = vi.hoisted(() => ({
    getFirestore: vi.fn(),
    doc: vi.fn(),
    updateDoc: vi.fn(),
    collection: vi.fn(),
    query: vi.fn(),
    where: vi.fn(),
    getDoc: vi.fn(),
    setDoc: vi.fn(),
    addDoc: vi.fn(),
    onSnapshot: vi.fn(),
}));

vi.mock('firebase/app', () => ({
    initializeApp: vi.fn(() => ({ name: 'mock-app' })),
}));

vi.mock('firebase/auth', () => ({
    getAuth: vi.fn(() => ({ currentUser: null })),
    signInAnonymously: vi.fn(),
    signInWithCustomToken: vi.fn(),
    onAuthStateChanged: vi.fn(),
}));

vi.mock('firebase/firestore', () => firestoreMocks);

describe('updateUserName', () => {
    const userDocRef = { path: 'mock-user-doc' };

    beforeEach(() => {
        vi.resetModules();
        vi.clearAllMocks();
        vi.stubEnv('VITE_FIREBASE_CONFIG', '{}');
        firestoreMocks.getFirestore.mockReturnValue({ kind: 'db' });
        firestoreMocks.doc.mockReturnValue(userDocRef);
        firestoreMocks.updateDoc.mockResolvedValue(undefined);
        firestoreMocks.collection.mockReturnValue({ path: 'problems' });
        firestoreMocks.query.mockReturnValue({ kind: 'query' });
        firestoreMocks.where.mockReturnValue({ kind: 'where' });
        vi.stubGlobal('__app_id', 'test-app');
    });

    test('trims names, truncates to 50 characters, and writes to the user document path', async () => {
        const { updateUserName } = await import('./firebase');
        const uid = 'test-uid';
        const longName = `   ${'A'.repeat(55)}   `;

        const result = await updateUserName(uid, longName);

        expect(firestoreMocks.doc).toHaveBeenCalledWith(expect.anything(), `artifacts/test-app/users/${uid}`);
        expect(firestoreMocks.updateDoc).toHaveBeenCalledWith(userDocRef, { name: 'A'.repeat(50) });
        expect(result).toBeUndefined();
    });

    test('does nothing when the uid is empty', async () => {
        const { updateUserName } = await import('./firebase');

        const result = await updateUserName('', 'Blunt Wombat');

        expect(firestoreMocks.doc).not.toHaveBeenCalledWith(expect.anything(), expect.stringContaining('/users/'));
        expect(firestoreMocks.updateDoc).not.toHaveBeenCalled();
        expect(result).toBeUndefined();
    });

    test('does nothing when the new name is only whitespace', async () => {
        const { updateUserName } = await import('./firebase');

        const result = await updateUserName('test-uid', '   ');

        expect(firestoreMocks.updateDoc).not.toHaveBeenCalled();
        expect(result).toBeUndefined();
    });

    test('does nothing when the new name is not a string at runtime', async () => {
        const { updateUserName } = await import('./firebase');

        const result = await (updateUserName as any)('test-uid', undefined);

        expect(firestoreMocks.updateDoc).not.toHaveBeenCalled();
        expect(result).toBeUndefined();
    });
});
