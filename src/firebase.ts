import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

export const firebaseConfig = {
  apiKey: "AIzaSyDnq7-6LGIiShZlb8nSeZdfI7tQI8kZEjs",
  authDomain: "sunsun-66597.firebaseapp.com",
  projectId: "sunsun-66597",
  storageBucket: "sunsun-66597.firebasestorage.app",
  messagingSenderId: "13205057009",
  appId: "1:13205057009:web:275ecdf9aa3c6294736850",
  measurementId: "G-NBKEF4F8MT"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export default app;
