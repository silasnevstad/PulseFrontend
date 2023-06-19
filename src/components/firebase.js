import { initializeApp } from "firebase/app";
import { getFirestore, getDoc, doc, setDoc } from "firebase/firestore";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REATE_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const auth = getAuth(app);

async function signUp(email, password) {
    if (!email || !password) {
        return { success: false, error: 'missing-fields' };
    }
    return createUserWithEmailAndPassword(auth, email, password)
        .then(async (userCredential) => {
            // Save the nickname to Firestore.
            // const userDocRef = doc(db, `users/${userCredential.user.uid}`);
            // await setDoc(userDocRef, { nickname: nickname, email: email });

            return { success: true, user: userCredential.user }
        })
        .catch((error) => {
            const errorCode = error.code;
            return { success: false, error: errorCode };
        });
}

async function signIn(email, password) {
    if (!email || !password) {
        return { success: false, error: 'missing-fields' };
    }
    return signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            return { success: true, user: userCredential.user }
        })
        .catch((error) => {
            const errorCode = error.code;
            return { success: false, error: errorCode };
        });
}

async function signOut() {
    return auth.signOut().then(() => {
        return { success: true };
    }).catch((error) => {
        return { success: false, error: error };
    });
}

async function setSources(uid, sources) {
    if (!uid || !sources) {
        return { success: false, error: 'missing-fields' };
    }
    const userDocRef = doc(db, `users/${uid}`);
    return setDoc(userDocRef, { sources: sources }, { merge: true })
        .then(() => {
            return { success: true };
        })
        .catch((error) => {
            const errorCode = error.code;
            return { success: false, error: errorCode };
        });
}

async function getSources(uid) {
    if (!uid) {
        return { success: false, error: 'missing-fields' };
    }

    const userDocRef = doc(db, `users/${uid}`);
    return getDoc(userDocRef)
        .then((doc) => {
            if (doc.exists() && doc.data().sources) {
                return { success: true, sources: doc.data().sources };
            } else {
                return { success: false, error: 'no-document' };
            }
        }).catch((error) => {
            return { success: false, error: error };
        }
    );
}

// a function for adding an api key to a user's account
async function addApiKey(uid, apiKey) {
    if (!uid || !apiKey) {
        return { success: false, error: 'missing-fields' };
    }
    const userDocRef = doc(db, `users/${uid}`);
    return setDoc(userDocRef, { apiKey: apiKey }, { merge: true })
        .then(() => {
            return { success: true };
        })
        .catch((error) => {
            const errorCode = error.code;
            return { success: false, error: errorCode };
        });
}

// a function for retrieving an api key from a user's account
async function getApiKey(uid) {
    if (!uid) {
        return { success: false, error: 'missing-fields' };
    }
    const userDocRef = doc(db, `users/${uid}`);
    return getDoc(userDocRef)
        .then((doc) => {
            if (doc.exists()) {
                return { success: true, apiKey: doc.data().apiKey };
            } else {
                return { success: false, error: 'no-document' };
            }
        }).catch((error) => {
            return { success: false, error: error };
        }
    );
}

export { signUp, signIn, signOut, auth, addApiKey, getApiKey, setSources, getSources, onAuthStateChanged };