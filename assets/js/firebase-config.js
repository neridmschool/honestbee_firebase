import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js';
import {
    createUserWithEmailAndPassword,
    getAuth,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    sendPasswordResetEmail,
    signOut
} from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js';
import {
    addDoc,
    arrayUnion,
    collection,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    getFirestore,
    limit,
    onSnapshot,
    query,
    serverTimestamp,
    setDoc,
    updateDoc,
    where
} from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js';

const firebaseConfig = {
    apiKey: 'AIzaSyDl9JjEwepPw-0hUCWO32ZpnnYd2_9s4Zc',
    authDomain: 'honestbee-6b314.firebaseapp.com',
    projectId: 'honestbee-6b314',
    storageBucket: 'honestbee-6b314.firebasestorage.app',
    messagingSenderId: '277837413779',
    appId: '1:277837413779:web:3b936165301f8469317c66',
    measurementId: 'G-NN2CWMN30Y'
};

export const firebaseApp = initializeApp(firebaseConfig);
export const firebaseAuth = getAuth(firebaseApp);
export const firestoreDb = getFirestore(firebaseApp);

export {
    addDoc as firebaseAddDoc,
    arrayUnion as firebaseArrayUnion,
    createUserWithEmailAndPassword,
    collection as firebaseCollection,
    deleteDoc as firebaseDeleteDoc,
    doc as firebaseDoc,
    getDoc as firebaseGetDoc,
    getDocs as firebaseGetDocs,
    limit as firebaseLimit,
    onAuthStateChanged,
    onSnapshot as firebaseOnSnapshot,
    query as firebaseQuery,
    serverTimestamp as firebaseServerTimestamp,
    sendPasswordResetEmail,
    setDoc as firebaseSetDoc,
    signInWithEmailAndPassword,
    signOut,
    updateDoc as firebaseUpdateDoc,
    where as firebaseWhere
};
