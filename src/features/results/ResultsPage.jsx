// src/features/results/ResultsPage.jsx
import { useEffect, useMemo, useState } from "react";
import {
  Box, Grid, Card, CardMedia, CardContent, Typography, Chip, CircularProgress, Alert
} from "@mui/material";
import { db } from "@/utils/firebase-config";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import dayjs from "dayjs";
import DeadlineCountdown from "@/components/DeadlineCountdown";

const toD = (v) => {
  if (!v) return dayjs.invalid();
  if (typeof v?.toDate === "function") return dayjs(v.toDate());
  if (typeof v?._seconds === "number") return dayjs.unix(v._seconds);
  return dayjs(v);
};

const ResultsPage = ({ topic }) => {
  const [subs, setSubs] = useState(null); // null=loading, []=empty
  const votingEnd = toD(topic?.votingEndAt);
  const votingEnded = votingEnd.isValid() ? dayjs().isAfter(votingEnd) : true;

  // 作品一覧をリアルタイム購読（票数・作成日時）
  useEffect(() => {
    if (!topic?.id) { setSubs([]); return; }
    const q = query(
      collection(db, "topics", topic.id, "submissions"),
      orderBy("votes", "desc"),
      orderBy("createdAt", "asc") // 同票時は古い方を上に
    );
    const unsub = onSnapshot(q, (snap) => {
      setSubs(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [topic?.id]);

  // 同票は同順位表示（例：1位, 2位, 2位, 4位…）
  const ranked = useMemo(() => {
    if (!subs) return [];
    let lastVotes = null;
    let lastRank = 0;
    let index = 0;
    return subs.map((s) => {
      index += 1;
      const v = s.votes ?? 0;
      const rank = v === lastVotes ? lastRank : index;
      lastVotes = v; lastRank = rank;
      return { ...s, rank };
    });
  }, [subs]);

  if (!topic?.id) {
    return <Box sx={{ p: 2 }}>お題が見つかりません。</Box>;
  }

  if (subs === null) {
    return (
      <Box sx={{ p: 2, display: "flex", alignItems: "center", gap: 1 }}>
        <CircularProgress size={20} /> 集計中…
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      {!votingEnded && (
        <>
          <DeadlineCountdown
            target={topic?.votingEndAt}
            label="投票締切まで"
            endedText="投票は締め切りました"
          />
          <Alert severity="info" sx={{ mb: 2 }}>
            まだ投票期間中です。順位はリアルタイムで変動します（最終結果は締切後に確定）。
          </Alert>
        </>
      )}

      <Typography variant="h6" sx={{ mb: 2 }}>結果発表</Typography>

      {ranked.length === 0 ? (
        <Typography color="text.secondary">まだ投稿がありません。</Typography>
      ) : (
        <Grid container spacing={2}>
          {ranked.map((s, i) => {
            const isTop = s.rank === 1 && (ranked[0]?.votes ?? 0) > 0;
            return (
              <Grid item xs={12} sm={6} md={4} lg={3} key={s.id}>
                <Card sx={{ position: "relative" }}>
                  <CardMedia
                    component="img"
                    image={s.imageUrl}
                    alt="submission"
                    sx={{ height: 240, objectFit: "cover", bgcolor: "#f5f5f5" }}
                  />
                  <CardContent sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <Chip
                      label={`${s.rank} 位`}
                      color={isTop ? "warning" : "default"}
                      variant={isTop ? "filled" : "outlined"}
                    />
                    <Chip label={`${s.votes ?? 0} 票`} />
                  </CardContent>

                  {isTop && (
                    <Box
                      sx={{
                        position: "absolute", top: 8, left: 8,
                        bgcolor: "rgba(255,193,7,0.92)", color: "#000",
                        px: 1, py: 0.25, borderRadius: 1, fontSize: 12, fontWeight: 700
                      }}
                    >
                      🏆 WINNER
                    </Box>
                  )}
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}
    </Box>
  );
};

export default ResultsPage;
