// src/utils/userUtils.js

import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase-config";

// 新規ユーザー作成
export const createUserDocument = async (user, username) => {
  await setDoc(doc(db, "users", user.uid), {
    uid: user.uid,
    email: user.email,
    username,
    createdAt: serverTimestamp(),
  });
};

// ユーザードキュメント取得
export const fetchUserDocument = async (uid) => {
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? snap.data() : null;
};
