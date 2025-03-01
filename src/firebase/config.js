import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

// Firebase の設定
const firebaseConfig = {
  apiKey: "AIzaSyDSZ6F8iL59FAWMNbAC6R2bZymcr3Xgld8",
  authDomain: "money-suppli-e6fb2.firebaseapp.com",
  projectId: "money-suppli-e6fb2",
  storageBucket: "money-suppli-e6fb2.firebasestorage.app",
  messagingSenderId: "934822164884",
  appId: "1:934822164884:web:990603c989dd753ef2f781",
  measurementId: "G-DSSY4D7BQQ"
};

// Firebase の初期化
const app = initializeApp(firebaseConfig);

// 必要なサービスの初期化
export const auth = getAuth(app);
export const db = getFirestore(app);
export const analytics = getAnalytics(app);

export default app;