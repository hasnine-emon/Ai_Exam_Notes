
import { initializeApp } from "firebase/app";
import {getAuth, GoogleAuthProvider} from "firebase/auth"
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_APIKEY,
  authDomain: "authexamnote-17082.firebaseapp.com",
  projectId: "authexamnote-17082",
  storageBucket: "authexamnote-17082.firebasestorage.app",
  messagingSenderId: "422590103900",
  appId: "1:422590103900:web:28fce5b67f2277b9544199"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

const auth = getAuth(app)

const provider = new GoogleAuthProvider()

export {auth,provider}