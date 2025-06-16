import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyC5Ih7VvdcRV53XBErPfga-2jj1iOdYuWI",
    authDomain: "jdp-finance-app.firebaseapp.com",
    projectId: "jdp-finance-app",
    storageBucket: "jdp-finance-app.firebasestorage.app",
    messagingSenderId: "1038925198280",
    appId: "1:1038925198280:web:10675785d022bf004306fd",
    measurementId: "G-9Z54MMM08Q"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app); 