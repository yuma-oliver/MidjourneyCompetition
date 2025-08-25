import { useEffect, useMemo, useState } from "react";
import {
  Box, Card, CardContent, CardMedia, Grid, IconButton, Typography, Chip, CircularProgress
} from "@mui/material";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import FavoriteIcon from "@mui/icons-material/Favorite";
import { useAuth } from "@/contexts/AuthProvider";
import DeadlineCountdown from "@/components/DeadlineCountdown";
import { db } from "@/utils/firebase-config";
import {
  collection, doc, onSnapshot, orderBy, query, where, limit, getDoc, runTransaction, serverTimestamp
} from "firebase/firestore";

const VotingPage = ({ topic }) => {
  const { user } = useAuth();

  const [subs, setSubs] = useState([]);          // 全投稿
  const [myVote, setMyVote] = useState(null);    // 自分の投票 {submissionId}
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const canVote = !!user?.uid && !!topic?.id;

  // 投稿一覧（匿名：投稿者情報は出さない）
  useEffect(() => {
    if (!topic?.id) return;
    setLoading(true);
    const q = query(
      collection(db, "topics", topic.id, "submissions"),
      orderBy("createdAt", "asc")
    );
    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setSubs(list);
      setLoading(false);
    });
    return () => unsub();
  }, [topic?.id]);

  // 自分の投票
  useEffect(() => {
    if (!canVote) return;
    const voteRef = doc(db, "topics", topic.id, "votes", user.uid);
    const unsub = onSnapshot(voteRef, (snap) => {
      setMyVote(snap.exists() ? { id: snap.id, ...snap.data() } : null);
    });
    return () => unsub?.();
  }, [canVote, topic?.id, user?.uid]);

  // 表示順：票数↓ → 作成順↑
  const sorted = useMemo(() => {
    return [...subs].sort((a, b) => {
      const av = a.votes ?? 0, bv = b.votes ?? 0;
      if (bv !== av) return bv - av;
      const at = a.createdAt?.seconds || 0, bt = b.createdAt?.seconds || 0;
      return at - bt;
    });
  }, [subs]);

  // クリック時の投票トグル（同じカード=取り消し）
  const choose = async (submissionId) => {
    if (!canVote || saving) return;
    setSaving(true);
    try {
      const voteRef = doc(db, "topics", topic.id, "votes", user.uid);
      const subRef  = doc(db, "topics", topic.id, "submissions", submissionId);

      await runTransaction(db, async (tx) => {
        const voteSnap = await tx.get(voteRef);
        const subSnap  = await tx.get(subRef);
        if (!subSnap.exists()) throw new Error("投稿が見つかりません");

        const currentId = voteSnap.exists() ? voteSnap.data().submissionId : null;

        // === 取り消し（同じカードを再クリック） ===
        if (currentId === submissionId) {
          const dec = Math.max((subSnap.data().votes || 0) - 1, 0);
          tx.update(subRef, { votes: dec });
          tx.delete(voteRef); // 自分の投票ドキュメントを削除
          return;
        }

        // === 変更（別のカードに乗り換え） ===
        // 新しい投稿 +1
        tx.update(subRef, { votes: (subSnap.data().votes || 0) + 1 });

        // 以前の投稿 -1
        if (currentId) {
          const prevRef  = doc(db, "topics", topic.id, "submissions", currentId);
          const prevSnap = await tx.get(prevRef);
          if (prevSnap.exists()) {
            const dec = Math.max((prevSnap.data().votes || 0) - 1, 0);
            tx.update(prevRef, { votes: dec });
          }
        }

        // 自分の投票ドキュメントを upsert
        tx.set(voteRef, {
          submissionId,
          userId: user.uid,
          updatedAt: serverTimestamp(),
          createdAt: voteSnap.exists() ? voteSnap.data().createdAt : serverTimestamp(),
        });
      });

      // onSnapshot が subs / myVote を自動で最新化してくれます
    } catch (e) {
      alert(e.message || "投票に失敗しました");
    } finally {
      setSaving(false);
    }
  };

  if (!topic?.id) return <Box sx={{ p: 2 }}>お題を選択してください。</Box>;
  if (loading) return <Box sx={{ p: 2, display: "flex", alignItems: "center", gap: 1 }}>
    <CircularProgress size={20}/> 読み込み中…
  </Box>;

  const votedId = myVote?.submissionId || null;

  return (
    <Box sx={{ p: 2 }}>
      <DeadlineCountdown
        target={topic?.votingEndAt}
        label="投票締切まで"
        endedText="投票は締め切りました"
      />

      <Typography variant="h6" sx={{ mb: 2 }}>投票画面</Typography>

      {!canVote && (
        <Typography sx={{ mb: 2 }} color="text.secondary">
          ログインすると投票できます。
        </Typography>
      )}

      <Grid container spacing={2}>
        {sorted.map((s) => {
          const selected = votedId === s.id;
          const votes = s.votes ?? 0;
          return (
            <Grid item xs={12} sm={6} md={4} lg={3} key={s.id}>
              <Card sx={{ position: "relative" }}>
                <CardMedia
                  component="img"
                  image={s.imageUrl}
                  alt="submission"
                  sx={{ height: 220, objectFit: "cover", bgcolor: "#f5f5f5" }}
                />
                <CardContent sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  {/* <Chip
                    label={`${votes} 票`}
                    size="small"
                    sx={{ bgcolor: selected ? "primary.main" : "default", color: selected ? "primary.contrastText" : "inherit" }}
                  /> */}
                  <IconButton
                    aria-label="like"
                    color={selected ? "error" : "default"}
                    disabled={!canVote || saving}
                    onClick={() => choose(s.id)}
                  >
                    {selected ? <FavoriteIcon/> : <FavoriteBorderIcon/>}
                  </IconButton>
                </CardContent>

                {selected && (
                  <Box
                    sx={{
                      position: "absolute", top: 8, left: 8,
                      bgcolor: "rgba(25,118,210,0.85)", color: "#fff",
                      px: 1, py: 0.25, borderRadius: 1, fontSize: 12
                    }}
                  >
                    あなたの投票
                  </Box>
                )}
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
};

export default VotingPage;
