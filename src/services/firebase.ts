import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, updateDoc, onSnapshot, collection, addDoc, query, where } from 'firebase/firestore';

// The Firebase configuration is read from an environment variable.
// See .env.example for more details.
const firebaseConfig = JSON.parse(import.meta.env.VITE_FIREBASE_CONFIG);

// --- App Initialization ---
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-couples-app';

// --- Auth Functions ---
export const onAuthChange = (callback) => onAuthStateChanged(auth, callback);
export const anonymousSignIn = () => signInAnonymously(auth);
export const customTokenSignIn = (token) => signInWithCustomToken(auth, token);

// --- User Functions ---
export const getUserDoc = (uid) => doc(db, `artifacts/${appId}/users/${uid}`);

export const linkPartners = async (inviterId, inviteeId) => {
    const inviterRef = doc(db, `artifacts/${appId}/users/${inviterId}`);
    const inviteeRef = doc(db, `artifacts/${appId}/users/${inviteeId}`);
    await setDoc(inviteeRef, { partnerId: inviterId, uid: inviteeId, name: `User ${inviteeId.substring(0,4)}` });
    await setDoc(inviterRef, { partnerId: inviteeId }, { merge: true });
};

export const createUserProfile = (uid) => {
    const userDocRef = doc(db, `artifacts/${appId}/users/${uid}`);
    return setDoc(userDocRef, { uid, name: `User ${uid.substring(0,4)}` });
}

export const updateUserName = (uid, newName) => {
    if (uid && newName) {
        const userDocRef = doc(db, `artifacts/${appId}/users/${uid}`);
        return updateDoc(userDocRef, { name: newName });
    }
};

export const onUserSnapshot = (uid, callback) => {
    const userDocRef = doc(db, `artifacts/${appId}/users/${uid}`);
    return onSnapshot(userDocRef, callback);
};

export const onPartnerSnapshot = (partnerId, callback) => {
    const partnerDocRef = doc(db, `artifacts/${appId}/users/${partnerId}`);
    return onSnapshot(partnerDocRef, callback);
};


// --- Problem Functions ---
const problemsCollection = collection(db, `artifacts/${appId}/public/data/problems`);

export const onProblemsSnapshot = (uid, callback) => {
    const q = query(problemsCollection, where('participants', 'array-contains', uid));
    return onSnapshot(q, callback);
};

export const createNewProblem = (user, partner) => {
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

export const updateProblem = (problemId, data) => {
    const problemRef = doc(db, `artifacts/${appId}/public/data/problems/${problemId}`);
    return updateDoc(problemRef, data);
};
