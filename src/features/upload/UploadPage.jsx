// src/features/upload/UploadPage.jsx
import { useEffect, useMemo, useState } from "react";
import { Box, Button, Card, CardContent, CardMedia, Stack, Typography } from "@mui/material";
import { useAuth } from "@/contexts/AuthProvider";
import { db } from "@/utils/firebase-config";
import {
  addDoc, collection, doc, getDocs, limit, query, serverTimestamp, updateDoc, where
} from "firebase/firestore";
import { deleteByPath } from "@/utils/storageUtils";
import UploadForm from "./UploadForm";
import DeadlineCountdown from "@/components/DeadlineCountdown";

const UploadPage = ({ topic }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [mine, setMine] = useState(null); // { id, imageUrl, storagePath, caption, ... }
  const [mode, setMode] = useState("view"); // 'view' | 'form'

  const canUse = useMemo(() => !!user?.uid && !!topic?.id, [user, topic]);

  // 自分の投稿を1件だけ取得
  useEffect(() => {
    const fetchMine = async () => {
      if (!canUse) return;
      setLoading(true);
      const q = query(
        collection(db, "topics", topic.id, "submissions"),
        where("userId", "==", user.uid),
        limit(1)
      );
      const snap = await getDocs(q);
      setMine(snap.empty ? null : { id: snap.docs[0].id, ...snap.docs[0].data() });
      setMode(snap.empty ? "form" : "view");
      setLoading(false);
    };
    fetchMine();
  }, [canUse, topic?.id, user?.uid]);

  // フォームからのコールバック：Firestore を更新（置き換え）
  const handleUploaded = async ({ url, path, caption }) => {
    if (!canUse) return;
    const colRef = collection(db, "topics", topic.id, "submissions");

    if (mine?.id) {
      // 既存ドキュメントを更新（1ユーザー1投稿を維持）
      const docRef = doc(db, "topics", topic.id, "submissions", mine.id);
      const oldPath = mine.storagePath;
      await updateDoc(docRef, {
        imageUrl: url,
        storagePath: path,
        caption: caption ?? "",
        updatedAt: serverTimestamp(),
      });
      // 古いストレージを掃除（パスが変わった場合のみ）
      if (oldPath && oldPath !== path) {
        try { await deleteByPath(oldPath); } catch (_e) {/* noop */}
      }
      setMine((m) => ({ ...(m || {}), imageUrl: url, storagePath: path, caption }));
      setMode("view");
    } else {
      // 新規作成
      const docRef = await addDoc(colRef, {
        userId: user.uid,
        caption: caption ?? "",
        imageUrl: url,
        storagePath: path,
        createdAt: serverTimestamp(),
        votes: 0,
      });
      setMine({ id: docRef.id, userId: user.uid, caption, imageUrl: url, storagePath: path });
      setMode("view");
    }
  };

  if (!canUse) {
    return <Box sx={{ p: 2 }}>ログイン後にアップロードできます。</Box>;
  }
  if (loading) {
    return <Box sx={{ p: 2 }}>読み込み中…</Box>;
  }

  // 表示：アップ済み or フォーム
  return (
    <Box sx={{ p: 2 }}>
      <DeadlineCountdown
        target={topic?.uploadEndAt}
        label="アップロード締切まで"
        endedText="アップロードは締め切りました"
      />
      {mode === "view" && mine && (
        <Card sx={{ maxWidth: 520 }}>
          <CardMedia
            component="img"
            image={mine.imageUrl}
            alt={mine.caption || "submission"}
            sx={{ maxHeight: 360, objectFit: "contain", backgroundColor: "#fafafa" }}
          />
          <CardContent>
            {mine.caption && <Typography variant="body2">{mine.caption}</Typography>}
            <Typography>お疲れ様です。アップロード完了いたしました！</Typography>
            <Typography>グッドラック</Typography>
            <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
              <Button variant="outlined" onClick={() => setMode("form")}>
                再投稿
              </Button>
            </Stack>
          </CardContent>
        </Card>
      )}

      {mode === "form" && (
        <UploadForm topic={topic} onUploaded={handleUploaded} />
      )}
    </Box>
  );
};

export default UploadPage;
