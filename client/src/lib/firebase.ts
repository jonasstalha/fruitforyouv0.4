import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC0bMWINNGLLS6bfnK-hfRQwHFnBSJqMhI",
  authDomain: "fruitsforyou-10acc.firebaseapp.com",
  projectId: "fruitsforyou-10acc",
  storageBucket: "fruitsforyou-10acc.appspot.com",
  messagingSenderId: "774475210821",
  appId: "1:774475210821:web:b70ceab6562385fa5f032c"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
const firestore = getFirestore(app);
const storage = getStorage(app);
const auth = getAuth(app);

// Export services
export { app, firestore, storage, auth };
export const db = firestore; // For backward compatibility