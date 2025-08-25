import { createContext, useContext, useEffect, useState } from "react";
import { db } from "@/utils/firebase-config";
import { collection, onSnapshot, addDoc, serverTimestamp } from "firebase/firestore";

const TopicsContext = createContext();

export function TopicsProvider({ children }) {
  const [topics, setTopics] = useState([]);

  // Firestoreのtopicsコレクションを購読
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "topics"), (snapshot) => {
      const list = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      // 新しい順でソート
      setTopics(list.sort((a, b) => b.createdAt?.seconds - a.createdAt?.seconds));
    });
    return () => unsub();
  }, []);

  // お題追加関数
  const addTopic = async ({ title, content, createdBy }) => {
    await addDoc(collection(db, "topics"), {
      title,
      content,
      createdAt: serverTimestamp(),
      createdBy,
    });
  };

  return (
    <TopicsContext.Provider value={{ topics, addTopic }}>
      {children}
    </TopicsContext.Provider>
  );
}
export const useTopics = () => useContext(TopicsContext);
