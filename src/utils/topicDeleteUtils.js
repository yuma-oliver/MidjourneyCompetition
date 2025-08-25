import { db } from "@/utils/firebase-config";
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import { deleteByPath } from "@/utils/storageUtils";

/**
 * submissions / votes / Storage を掃除してから topic 本体を削除
 */
export async function deleteTopicAndChildren(topicId) {
  // 1) submissions
  const subCol = collection(db, "topics", topicId, "submissions");
  const subSnap = await getDocs(subCol);

  // 画像削除 → doc削除（順序固定）
  for (const d of subSnap.docs) {
    const data = d.data() || {};
    try {
      if (data.storagePath) await deleteByPath(String(data.storagePath));
    } catch (e) {
      console.warn("[deleteTopic] storage delete failed:", data.storagePath, e);
      // 画像は消えなくても先へ進む（後で Functions で掃除してもOK）
    }
    try {
      await deleteDoc(doc(db, "topics", topicId, "submissions", d.id));
    } catch (e) {
      console.error("[deleteTopic] submissions doc delete failed:", d.id, e);
      throw e; // ← ここで止まる場合は Firestore ルール未反映が濃厚
    }
  }

  // 2) votes
  const votesCol = collection(db, "topics", topicId, "votes");
  const votesSnap = await getDocs(votesCol);
  for (const d of votesSnap.docs) {
    try {
      await deleteDoc(doc(db, "topics", topicId, "votes", d.id));
    } catch (e) {
      console.error("[deleteTopic] votes doc delete failed:", d.id, e);
      throw e;
    }
  }

  // 3) topic 本体
  await deleteDoc(doc(db, "topics", topicId));
}
