import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged, User } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, updateDoc, onSnapshot, collection, addDoc, query, where, DocumentSnapshot, QuerySnapshot } from 'firebase/firestore';
import { User as AppUser, Partner, Problem } from '../types';

// The Firebase configuration is read from an environment variable.
// See .env.example for more details.
let firebaseConfig;
try {
    firebaseConfig = JSON.parse(import.meta.env.VITE_FIREBASE_CONFIG || '{}');
} catch (error) {
    console.error('Invalid VITE_FIREBASE_CONFIG:', error);
    firebaseConfig = {};
}

// Validate required Firebase configuration fields
const requiredFields = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'];
const missingFields = requiredFields.filter(field => !firebaseConfig[field]);

if (missingFields.length > 0) {
    console.error('Missing required Firebase configuration fields:', missingFields);
    console.error('Please check your .env file and ensure VITE_FIREBASE_CONFIG contains all required fields.');
}

// --- App Initialization ---
let app;
let auth;
let db;

try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
} catch (error) {
    console.error('Failed to initialize Firebase:', error);
    console.error('The application may not function correctly without proper Firebase configuration.');
    throw new Error('Firebase initialization failed. Please check your configuration.');
}

const appId = (globalThis as any).__app_id || 'default-couples-app';

// --- Auth Functions ---
export const onAuthChange = (callback: (user: User | null) => void) => onAuthStateChanged(auth, callback);
export const anonymousSignIn = () => signInAnonymously(auth);
export const customTokenSignIn = (token: string) => signInWithCustomToken(auth, token);

// --- User Functions ---
export const getUserDoc = (uid: string) => doc(db, `artifacts/${appId}/users/${uid}`);

export const linkPartners = async (inviterId: string, inviteeId: string) => {
    const inviterRef = doc(db, `artifacts/${appId}/users/${inviterId}`);
    const inviteeRef = doc(db, `artifacts/${appId}/users/${inviteeId}`);
    await setDoc(inviteeRef, { partnerId: inviterId, uid: inviteeId, name: `User ${inviteeId.substring(0,4)}` });
    await setDoc(inviterRef, { partnerId: inviteeId }, { merge: true });
};

export const createUserProfile = (uid: string) => {
    const userDocRef = doc(db, `artifacts/${appId}/users/${uid}`);
    return setDoc(userDocRef, { uid, name: `User ${uid.substring(0,4)}`, partnerId: null });
}

export const updateUserName = (uid: string, newName: string) => {
    if (uid && newName) {
        const userDocRef = doc(db, `artifacts/${appId}/users/${uid}`);
        const sanitizedName = newName.trim().substring(0, 50);
        return updateDoc(userDocRef, { name: sanitizedName });
    }
};

export const onUserSnapshot = (uid: string, callback: (doc: DocumentSnapshot) => void, errorCallback?: (error: Error) => void) => {
    const userDocRef = doc(db, `artifacts/${appId}/users/${uid}`);
    return onSnapshot(userDocRef, callback, errorCallback);
};

export const onPartnerSnapshot = (partnerId: string, callback: (doc: DocumentSnapshot) => void, errorCallback?: (error: Error) => void) => {
    const partnerDocRef = doc(db, `artifacts/${appId}/users/${partnerId}`);
    return onSnapshot(partnerDocRef, callback, errorCallback);
};


// --- Problem Functions ---
const problemsCollection = collection(db, `artifacts/${appId}/public/data/problems`);

export const onProblemsSnapshot = (uid: string, callback: (snapshot: QuerySnapshot) => void) => {
    const q = query(problemsCollection, where('participants', 'array-contains', uid));
    return onSnapshot(q, callback);
};

export const createNewProblem = (user: AppUser, partner: Partner) => {
    const newProblem = {
        participants: [user.uid, partner.uid],
        roles: { [user.uid]: 'user1', [partner.uid]: 'user2' },
        createdAt: new Date(),
        status: 'agree_statement',
        problem_statement: '',
        user1_agreed_problem: false,
        user2_agreed_problem: false,
        user1_private_version: '',
        user2_private_version: '',
        user1_submitted_private: false,
        user2_submitted_private: false,
        user1_translation: '',
        user2_translation: '',
        user1_manipulation_analysis: '',
        user2_manipulation_analysis: '',
        user1_steelman: '',
        user2_steelman: '',
        user1_submitted_steelman: false,
        user2_submitted_steelman: false,
        user1_approved_steelman: false,
        user2_approved_steelman: false,
        ai_analysis: '',
        user1_proposed_solution: '',
        user2_proposed_solution: '',
        user1_solution_steelman: '',
        user2_solution_steelman: '',
        wombats_wager: '',
        solution_statement: '',
        user1_agreed_solution: false,
        user2_agreed_solution: false,
        solution_check_date: null,
        user1_post_mortem: '',
        user2_post_mortem: '',
    };
    return addDoc(problemsCollection, newProblem);
};

export const updateProblem = (problemId: string, data: Partial<Problem>) => {
    const problemRef = doc(db, `artifacts/${appId}/public/data/problems/${problemId}`);
    return updateDoc(problemRef, data);
};

export { getDoc };
