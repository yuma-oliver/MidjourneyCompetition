// src/utils/storageUtils.js
import { storage } from "@/utils/firebase-config";
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from "firebase/storage";

export const uploadTopicImage = (file, { topicId, uid, onProgress } = {}) =>
  new Promise((resolve, reject) => {
    const safeName = (file?.name || "image.jpg").replace(/\s+/g, "_");
    const path = `submissions/${topicId}/${uid}/${Date.now()}_${safeName}`;
    const fileRef = ref(storage, path);
    const task = uploadBytesResumable(fileRef, file, {
      contentType: file.type || "image/jpeg",
      cacheControl: "public,max-age=3600",
    });
    task.on(
      "state_changed",
      (s) => onProgress?.(Math.round((s.bytesTransferred / s.totalBytes) * 100)),
      reject,
      async () => resolve({ url: await getDownloadURL(task.snapshot.ref), path })
    );
  });

export const deleteByPath = async (path) => {
  if (!path) return;
  await deleteObject(ref(storage, path));
};
