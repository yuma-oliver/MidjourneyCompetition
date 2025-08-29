// src/layout/RightSidebar.jsx
import React, { useContext, useMemo, useEffect, useState } from "react";
import {
  Box,
  Drawer,
  Toolbar,
  Typography,
  Divider,
  Chip,
  Stack,
  Button,
  IconButton,
  Tooltip,
  useMediaQuery,
} from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import ShareIcon from "@mui/icons-material/Share";
import EditIcon from "@mui/icons-material/Edit";
import LaunchIcon from "@mui/icons-material/Launch";
import AddPhotoAlternateIcon from "@mui/icons-material/AddPhotoAlternate";
import dayjs from "dayjs";
import { useTheme } from "@mui/material/styles";
import { useNavigate } from "react-router-dom";
import { PageContext } from "@/contexts/SelectedPage";
import { useTopics } from "@/contexts/TopicsContext";
import { useAuth } from "@/contexts/AuthProvider";

const drawerWidth = 300;

// Timestamp | Date | string | number -> dayjs()
const dj = (v) => {
  if (!v) return null;
  if (v?._seconds) return dayjs.unix(v._seconds);
  return dayjs(v);
};

// 日本語の曜日
const jpWeekdays = ["日", "月", "火", "水", "木", "金", "土"];

// "2025年9月1日 10:00（月）" の形で返す
const formatJpFull = (v) => {
  if (!v) return "";
  const d = v?._seconds ? dayjs.unix(v._seconds) : dayjs(v);
  if (!d.isValid()) return "";
  const w = jpWeekdays[d.day()];
  return `${d.format("YYYY年M月D日 HH:mm")}（${w}）`;
};

// 現在フェーズ判定
const phaseOf = (t) => {
  const now = dayjs();
  const pub = dj(t?.publishAt);
  const upEnd = dj(t?.uploadEndAt);
  const voteEnd = dj(t?.votingEndAt);

  if (!pub?.isValid()) return { key: "unknown", label: "情報未設定", color: "default" };

  if (now.isBefore(pub)) return { key: "pre", label: "公開前", color: "default" };
  if (upEnd?.isValid() && now.isBefore(upEnd))
    return { key: "upload", label: "投稿受付中", color: "primary" };
  if (voteEnd?.isValid() && now.isBefore(voteEnd))
    return { key: "voting", label: "投票受付中", color: "success" };
  return { key: "done", label: "終了", color: "default" };
};

// 残り時間テキスト（対象が未来の時）
const remainingTo = (target) => {
  const d = dj(target);
  if (!d?.isValid()) return "";
  const ms = d.diff(dayjs());
  if (ms <= 0) return "";
  const mins = Math.floor(ms / 60000);
  const days = Math.floor(mins / (60 * 24));
  const hrs = Math.floor((mins % (60 * 24)) / 60);
  const m = mins % 60;
  const seg = [];
  if (days) seg.push(`${days}日`);
  if (hrs) seg.push(`${hrs}時間`);
  seg.push(`${m}分`);
  return seg.join(" ");
};

const RightSidebar = () => {
  const theme = useTheme();
  const upMd = useMediaQuery(theme.breakpoints.up("md"));
  const navigate = useNavigate();

  const { selectedPage } = useContext(PageContext);
  const { topics } = useTopics();
  const { user } = useAuth();

  const t = useMemo(() => {
    if (!selectedPage || !Array.isArray(topics)) return null;
    return topics.find((x) => x.id === selectedPage) || null;
  }, [selectedPage, topics]);

  const isOwner = !!user?.uid && t?.createdBy === user.uid;
  const show = upMd && !!t;

  const phase = useMemo(() => phaseOf(t), [t]);

  // 1秒ごとに残り時間を更新（表示している場合のみ）
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (!t) return;
    const id = setInterval(() => setTick((v) => v + 1), 1000);
    return () => clearInterval(id);
  }, [t]);

  // 次の締切に向けた残り時間
  const nextTarget =
    phase.key === "pre"
      ? t?.publishAt
      : phase.key === "upload"
      ? t?.uploadEndAt
      : phase.key === "voting"
      ? t?.votingEndAt
      : null;
  const remainTxt = useMemo(() => remainingTo(nextTarget), [nextTarget, tick]);

  const visibility = t?.visibility || (t?.isActive ? "public" : "private");
  const shareUrl = t ? `${window.location.origin}/topics/${t.id}` : "";

  const copy = async (txt) => {
    try {
      await navigator.clipboard.writeText(String(txt || ""));
    } catch {}
  };

  return (
    <Drawer
      variant="permanent"
      anchor="right"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        display: show ? "block" : "none",
        "& .MuiDrawer-paper": { width: drawerWidth, boxSizing: "border-box" },
      }}
    >
      <Toolbar />
      {!t ? null : (
        <Box sx={{ p: 2 }}>
          {/* タイトル + フェーズ */}
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
            <Typography variant="subtitle1" fontWeight={700} noWrap sx={{ flex: 1 }}>
              {t.title || "(無題のお題)"}
            </Typography>
            <Chip size="small" label={phase.label} color={phase.color} />
          </Stack>

          {/* メタ */}
          <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 1 }}>
            <Chip size="small" variant="outlined" label={`可視性 ${visibility}`} />
            {t.createdByUsername && (
              <Chip size="small" variant="outlined" label={`作成者 ${t.createdByUsername}`} />
            )}
          </Stack>

          {/* 主要日程 */}
          <Box sx={{ mb: 1 }}>
            <Typography variant="overline" color="text.secondary">スケジュール</Typography>
            <Stack spacing={0.5} sx={{ mt: 0.5 }}>
              <Typography variant="body2">
                公開：{t?.publishAt ? formatJpFull(t.publishAt) : ""}
              </Typography>
              <Typography variant="body2">
                投稿締め切り：{t?.uploadEndAt ? formatJpFull(t.uploadEndAt) : ""}
              </Typography>
              <Typography variant="body2">
                投票締め切り：{t?.votingEndAt ? formatJpFull(t.votingEndAt) : ""}
              </Typography>
            </Stack>
            {remainTxt && phase.key !== "done" && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: "block" }}>
                締切まで残り {remainTxt}
              </Typography>
            )}
          </Box>

          <Divider sx={{ my: 1.5 }} />

          {/* 概要 */}
          {t.description && (
            <>
              <Typography variant="overline" color="text.secondary">概要</Typography>
              <Typography variant="body2" sx={{ mb: 1.5, whiteSpace: "pre-wrap" }}>
                {t.description}
              </Typography>
            </>
          )}

          {/* ヒント */}
          {t.hint && (
            <>
              <Typography variant="overline" color="text.secondary">ヒント</Typography>
              <Typography variant="body2" sx={{ mb: 1.5, whiteSpace: "pre-wrap" }}>
                {t.hint}
              </Typography>
            </>
          )}

          {/* ルール */}
          <Typography variant="overline" color="text.secondary">ルール / 推奨パラメータ</Typography>
          <Stack direction="row" spacing={1} sx={{ mb: 1.5, flexWrap: "wrap" }}>
            {t?.rules?.aspect && <Chip size="small" label={`--ar ${t.rules.aspect}`} />}
            {t?.rules?.style && <Chip size="small" label={`--style ${t.rules.style}`} />}
            {t?.rules?.seed && <Chip size="small" label={`--seed ${t.rules.seed}`} />}
            {!t?.rules?.aspect && !t?.rules?.style && !t?.rules?.seed && (
              <Chip size="small" label="（ルール未設定）" variant="outlined" />
            )}
          </Stack>

          {/* 推奨プロンプト（コピー可） */}
          {t.prompt && (
            <>
              <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 0.5 }}>
                <Typography variant="overline" color="text.secondary">推奨プロンプト</Typography>
                <Tooltip title="コピー">
                  <IconButton size="small" onClick={() => copy(t.prompt)}>
                    <ContentCopyIcon fontSize="inherit" />
                  </IconButton>
                </Tooltip>
              </Stack>
              <Box
                sx={{
                  p: 1,
                  borderRadius: 1,
                  bgcolor: "action.hover",
                  fontFamily: "monospace",
                  fontSize: "0.85rem",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  mb: 1.5,
                }}
              >
                {t.prompt}
              </Box>
            </>
          )}

          {/* アクション */}
          <Stack spacing={1} sx={{ mt: 0.5 }}>
            {phase.key === "upload" && (
              <Button
                variant="contained"
                size="small"
                startIcon={<AddPhotoAlternateIcon />}
                onClick={() => navigate(`/topics/${t.id}/submit`)}
              >
                投稿する
              </Button>
            )}

            <Stack direction="row" spacing={1}>
              {isOwner && (
                <Button
                  variant="text"
                  size="small"
                  startIcon={<EditIcon />}
                  onClick={() => navigate(`/dashboard/topics/${t.id}/edit`)}
                >
                  お題を編集
                </Button>
              )}
              <Button variant="text" size="small" startIcon={<ShareIcon />} onClick={() => copy(shareUrl)}>
                共有リンクをコピー
              </Button>
            </Stack>
          </Stack>
        </Box>
      )}
    </Drawer>
  );
};

export default RightSidebar;
