import { 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut, 
    updateProfile, 
    sendPasswordResetEmail,
    onAuthStateChanged
  } from 'firebase/auth';
  import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
  import { auth, db } from './config';
  
  // サインアップ（新規ユーザー登録）
  export const registerUser = async (email, password, name) => {
    try {
      // メール/パスワードでユーザーを作成
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // ユーザープロファイルを更新（表示名を設定）
      await updateProfile(user, {
        displayName: name
      });
      
      // Firestoreにユーザー情報を保存
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        email: email,
        name: name,
        createdAt: serverTimestamp(),
        learning: {
          completedLessons: [],
          progress: {},
          quizResults: {}
        },
        portfolio: {
          cash: 1000000,
          stocks: [],
          transactions: [],
          history: [
            {
              date: new Date().toISOString(),
              value: 1000000
            }
          ]
        },
        settings: {
          theme: 'light',
          notifications: true
        }
      });
      
      return user;
    } catch (error) {
      console.error("Registration error:", error);
      throw error;
    }
  };
  
  // ログイン
  export const loginUser = async (email, password) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return userCredential.user;
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  };
  
  // ログアウト
  export const logoutUser = async () => {
    try {
      await signOut(auth);
      return true;
    } catch (error) {
      console.error("Logout error:", error);
      throw error;
    }
  };
  
  // パスワードリセットメールの送信
  export const resetPassword = async (email) => {
    try {
      await sendPasswordResetEmail(auth, email);
      return true;
    } catch (error) {
      console.error("Password reset error:", error);
      throw error;
    }
  };
  
  // 現在のユーザー情報を取得
  export const getCurrentUser = () => {
    return auth.currentUser;
  };
  
  // ユーザー認証状態の変更を監視
  export const subscribeToAuthChanges = (callback) => {
    return onAuthStateChanged(auth, callback);
  };
  
  // ユーザーデータの取得
  export const getUserData = async (userId) => {
    try {
      const docRef = doc(db, "users", userId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return docSnap.data();
      } else {
        console.log("User document does not exist");
        return null;
      }
    } catch (error) {
      console.error("Get user data error:", error);
      throw error;
    }
  };