// src/layouts/Main.jsx
import { useContext, useEffect, useMemo, useState } from "react";
import { PageContext } from "@/contexts/SelectedPage";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/utils/firebase-config";
import dayjs from "dayjs";
import { Box, CircularProgress, Typography, Alert } from "@mui/material";

import UploadPage from "@/features/upload/UploadPage";
import VotingPage from "@/features/voting/VotingPage";
import ResultsPage from "@/features/results/ResultsPage";

const toD = (v) => {
  if (!v) return dayjs.invalid();
  // Firestore Timestamp
  if (typeof v?.toDate === "function") return dayjs(v.toDate());
  // {_seconds: number} っぽいもの
  if (typeof v?._seconds === "number") return dayjs.unix(v._seconds);
  // ISO/Date
  return dayjs(v);
};

const useTopic = (topicId) => {
  const [topic, setTopic] = useState(null);
  const [loading, setLoading] = useState(!!topicId);
  useEffect(() => {
    if (!topicId) { setTopic(null); setLoading(false); return; }
    const ref = doc(db, "topics", topicId);
    const unsub = onSnapshot(ref, (snap) => {
      setTopic(snap.exists() ? ({ id: snap.id, ...snap.data() }) : null);
      setLoading(false);
    });
    return () => unsub();
  }, [topicId]);
  return { topic, loading };
};

const MainContent = () => {
  const { selectedPage: topicId } = useContext(PageContext);
  const { topic, loading } = useTopic(topicId);
  const now = dayjs();

  const { phase, warn } = useMemo(() => {
    if (!topic) return { phase: "empty" };

    const p = toD(topic.publishAt);
    const u = toD(topic.uploadEndAt);
    const v = toD(topic.votingEndAt);

    // 値が欠けている旧フォーマット対応
    const missing = {
      publishAt: !p.isValid(),
      uploadEndAt: !u.isValid(),
      votingEndAt: !v.isValid(),
    };

    if (missing.publishAt && missing.uploadEndAt && missing.votingEndAt) {
      // 旧データ：すべて未設定 → アップロード中として扱う
      return { phase: "upload", warn: "このお題は旧フォーマットです（日時未設定）。暫定的にアップロード期間として表示します。" };
    }

    if (missing.publishAt || missing.uploadEndAt || missing.votingEndAt) {
      // 一部欠損 → 可能な範囲で推定
      if (!missing.publishAt && now.isBefore(p)) return { phase: "soon", warn: "一部日時が未設定です。時間推定で表示しています。" };
      if (!missing.uploadEndAt && now.isBefore(u)) return { phase: "upload", warn: "一部日時が未設定です。時間推定で表示しています。" };
      if (!missing.votingEndAt && now.isBefore(v)) return { phase: "voting", warn: "一部日時が未設定です。時間推定で表示しています。" };
      return { phase: "results", warn: "一部日時が未設定です。時間推定で表示しています。" };
    }

    if (now.isBefore(p)) return { phase: "soon" };
    if (now.isBefore(u)) return { phase: "upload" };
    if (now.isBefore(v)) return { phase: "voting" };
    return { phase: "results" };
  }, [topic, now]);

  if (!topicId) return <Box sx={{ p: 3 }}><Typography variant="h6">左の「お題」から選択してください。</Typography></Box>;
  if (loading)  return <Box sx={{ p: 3, display:"flex", alignItems:"center", gap:1 }}><CircularProgress size={20}/> 読み込み中…</Box>;
  if (!topic)   return <Box sx={{ p: 3 }}><Typography color="error">このお題は存在しません。</Typography></Box>;

  return (
    <Box sx={{ p: 0 }}>
      {warn && <Alert severity="warning" sx={{ m: 2 }}>{warn}</Alert>}
      {phase === "soon"    && <Box sx={{ p: 3 }}><Typography variant="h6">{topic.title}</Typography><Typography sx={{ mt: 1 }}>公開前です。カウントダウンを表示します。</Typography></Box>}
      {phase === "upload"  && <UploadPage topic={topic} />}
      {phase === "voting"  && <VotingPage topic={topic} />}
      {phase === "results" && <ResultsPage topic={topic} />}
    </Box>
  );
};

export default MainContent;
