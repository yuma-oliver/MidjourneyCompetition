// src/features/topics/AddTopicDialog.jsx
import { useState, useMemo, useCallback } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, Stack, Alert, Chip, Divider,
  FormControlLabel, Switch, Box, Typography,
  FormControl, InputLabel, Select, MenuItem
} from "@mui/material";
import {
  LocalizationProvider,
  DateTimePicker,
  TimeField
} from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import isoWeek from "dayjs/plugin/isoWeek";
import weekday from "dayjs/plugin/weekday";
import customParseFormat from "dayjs/plugin/customParseFormat";
import { collection, addDoc, serverTimestamp, Timestamp } from "firebase/firestore";
import { db } from "@/utils/firebase-config";
import { useAuth } from "@/contexts/AuthProvider";
import { fetchUserDocument } from "@/utils/userUtils"; // ★ username取得用

dayjs.extend(isoWeek);
dayjs.extend(weekday);
dayjs.extend(customParseFormat);

const FIXED_HOUR = 10; // 10:00運用

// 指定週の {isoWeekdayNum} 曜日 10:00 を返す（1=Mon, 3=Wed, 5=Fri）
const weekAt = (base, isoWeekdayNum, weekOffset = 0) =>
  dayjs(base)
    .add(weekOffset, "week")
    .isoWeekday(isoWeekdayNum)
    .hour(FIXED_HOUR).minute(0).second(0).millisecond(0);

// 公開日時の“同じ週”の水・金10:00を返す
const sameWeekWaterfall = (pub) => ({
  wed: weekAt(pub, 3, 0),
  fri: weekAt(pub, 5, 0),
});

// 常に“今週の月曜10:00”（過去でもOK）
const thisMonday10 = () => weekAt(dayjs(), 1, 0);
// 来週の月曜10:00
const nextMonday10 = () => weekAt(dayjs(), 1, 1);

export default function AddTopicDialog({ open, onClose }) {
  const { user } = useAuth();

  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [hint, setHint] = useState("");
  const [prompt, setPrompt] = useState("");

  // ルール
  const [aspect, setAspect] = useState("16:9");
  const [style, setStyle] = useState("");
  const [seed, setSeed] = useState("");

  // 可視性
  const [visibility, setVisibility] = useState("public"); // "public" | "private"

  // 既定値：公開＝今週の月曜10:00（過去でもOK）
  const initialPub = thisMonday10();
  const { wed: initialWed, fri: initialFri } = sameWeekWaterfall(initialPub);

  const [publishAt, setPublishAt] = useState(initialPub);
  const [uploadEndAt, setUploadEndAt] = useState(initialWed);
  const [votingEndAt, setVotingEndAt] = useState(initialFri);

  // 週テンプレは基本ON（公開を決めるだけで水/金が自動）
  const [useWeekTemplate, setUseWeekTemplate] = useState(true);
  // 相対連動はOFF（必要ならONで過去も含めて相対ずらし可能）
  const [linkDates, setLinkDates] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState("");

  // 相対差分（保全用）
  const uploadOffsetMs = useMemo(
    () => dayjs(uploadEndAt).diff(dayjs(publishAt)),
    [publishAt, uploadEndAt]
  );
  const votingOffsetMs = useMemo(
    () => dayjs(votingEndAt).diff(dayjs(publishAt)),
    [publishAt, votingEndAt]
  );

  // バリデーション（「過去かどうか」は不問。順序のみ担保）
  const invalid = useMemo(() => {
    if (!title.trim()) return "タイトルを入力してください。";
    if (![publishAt, uploadEndAt, votingEndAt].every((d) => d && dayjs(d).isValid()))
      return "日時の形式が不正です。";
    if (!dayjs(publishAt).isBefore(uploadEndAt))
      return "公開日時はアップロード締切より前である必要があります。";
    if (!dayjs(uploadEndAt).isBefore(votingEndAt))
      return "アップロード締切は投票締切より前である必要があります。";
    return "";
  }, [title, publishAt, uploadEndAt, votingEndAt]);

  // 公開日時変更（週テンプレ優先）
  const onChangePublish = useCallback(
    (val) => {
      if (!val || !dayjs(val).isValid()) return;
      const nextPub = dayjs(val).second(0).millisecond(0);
      setPublishAt(nextPub);

      if (useWeekTemplate) {
        const { wed, fri } = sameWeekWaterfall(nextPub);
        setUploadEndAt(wed);
        setVotingEndAt(fri);
      } else if (linkDates) {
        setUploadEndAt(nextPub.add(uploadOffsetMs, "millisecond"));
        setVotingEndAt(nextPub.add(votingOffsetMs, "millisecond"));
      }
    },
    [useWeekTemplate, linkDates, uploadOffsetMs, votingOffsetMs]
  );

  // プリセット：今週/来週の月10:00
  const applyThisMonday = () => onChangePublish(thisMonday10());
  const applyNextMonday = () => onChangePublish(nextMonday10());

  const prettyDuration = (start, end) => {
    const ms = Math.max(0, dayjs(end).diff(dayjs(start)));
    const days = Math.floor(ms / (24 * 3600 * 1000));
    const hours = Math.floor((ms % (24 * 3600 * 1000)) / (3600 * 1000));
    const mins = Math.floor((ms % (3600 * 1000)) / (60 * 1000));
    const out = [];
    if (days) out.push(`${days}日`);
    if (hours) out.push(`${hours}時間`);
    if (mins || out.length === 0) out.push(`${mins}分`);
    return out.join(" ");
  };

  const resetForm = () => {
    setTitle("");
    setDesc("");
    setHint("");
    setPrompt("");
    setAspect("16:9");
    setStyle("");
    setSeed("");
    setVisibility("public");
    setPublishAt(thisMonday10());
    const { wed, fri } = sameWeekWaterfall(thisMonday10());
    setUploadEndAt(wed);
    setVotingEndAt(fri);
    setUseWeekTemplate(true);
    setLinkDates(false);
  };

  const handleSave = async () => {
    setErr("");
    if (invalid) {
      setErr(invalid);
      return;
    }
    try {
      setSubmitting(true);

      // ★ 作成者の username を取得（なければ空）
      let createdByUsername = "";
      if (user?.uid) {
        try {
          const prof = await fetchUserDocument(user.uid);
          createdByUsername = prof?.username || "";
        } catch {
          createdByUsername = "";
        }
      }

      const payload = {
        title: title.trim(),
        description: desc.trim(),
        hint: hint.trim(),
        prompt: prompt.trim(),
        rules: {
          ...(aspect ? { aspect } : {}),
          ...(style ? { style } : {}),
          ...(seed ? { seed } : {}),
        },
        visibility, // "public" | "private"

        publishAt: Timestamp.fromDate(dayjs(publishAt).toDate()),
        uploadEndAt: Timestamp.fromDate(dayjs(uploadEndAt).toDate()),
        votingEndAt: Timestamp.fromDate(dayjs(votingEndAt).toDate()),

        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy: user?.uid || null,
        createdByUsername, // ★ 非正規化
        isActive: true,
      };

      await addDoc(collection(db, "topics"), payload);

      onClose?.();
      resetForm();
    } catch (e) {
      setErr(e?.message || "保存に失敗しました。");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={submitting ? undefined : onClose} fullWidth maxWidth="sm">
      <DialogTitle>お題を作成</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {err && <Alert severity="error">{err}</Alert>}

          <TextField
            label="タイトル *"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
            required
            fullWidth
          />

          <TextField
            label="説明（概要）"
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            multiline
            minRows={2}
            fullWidth
          />

          <TextField
            label="ヒント"
            value={hint}
            onChange={(e) => setHint(e.target.value)}
            multiline
            minRows={2}
            fullWidth
          />

          <TextField
            label="推奨プロンプト"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            multiline
            minRows={2}
            placeholder="右サイドバーでワンクリックコピーできます"
            fullWidth
          />

          {/* ルール */}
          <Typography variant="overline" color="text.secondary">ルール / 推奨パラメータ</Typography>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <TextField
              label="--ar（アスペクト）"
              value={aspect}
              onChange={(e) => setAspect(e.target.value)}
              fullWidth
            />
            <TextField
              label="--style"
              value={style}
              onChange={(e) => setStyle(e.target.value)}
              fullWidth
            />
            <TextField
              label="--seed"
              value={seed}
              onChange={(e) => setSeed(e.target.value)}
              fullWidth
            />
          </Stack>

          {/* 可視性 */}
          <FormControl fullWidth>
            <InputLabel id="vis-label">可視性</InputLabel>
            <Select
              labelId="vis-label"
              label="可視性"
              value={visibility}
              onChange={(e) => setVisibility(e.target.value)}
            >
              <MenuItem value="public">public（全員に公開）</MenuItem>
              <MenuItem value="private">private（限定公開）</MenuItem>
            </Select>
          </FormControl>

          <LocalizationProvider dateAdapter={AdapterDayjs}>
            {/* オプション：週テンプレ固定が基本 */}
            <Stack direction="row" alignItems="center" spacing={2} sx={{ flexWrap: "wrap" }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={useWeekTemplate}
                    onChange={(e) => setUseWeekTemplate(e.target.checked)}
                  />
                }
                label="週テンプレ（月10→水10→金10）を自動適用"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={linkDates}
                    onChange={(e) => setLinkDates(e.target.checked)}
                    disabled={useWeekTemplate}
                  />
                }
                label="相対連動（週テンプレOFF時のみ）"
              />
            </Stack>

            {/* 公開日時：今週/来週の月10:00プリセット */}
            <Box sx={{ mt: 1 }}>
              <Typography variant="subtitle2" sx={{ mb: 0.5 }}>公開日時（publishAt）</Typography>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems="center">
                <DateTimePicker
                  value={publishAt}
                  onChange={onChangePublish}
                  ampm={false}
                  minutesStep={5}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      helperText: "過去日時の設定も可能です（例：今週の月10:00）。",
                    },
                  }}
                />
                <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
                  <Chip size="small" label="今週の月 10:00" onClick={applyThisMonday} />
                  <Chip size="small" label="来週の月 10:00" onClick={applyNextMonday} />
                </Stack>
              </Stack>
            </Box>

            {/* アップロード締切：公開と同週の水10:00 */}
            <Divider sx={{ my: 1.5 }} />
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 0.5 }}>アップロード締切（uploadEndAt）</Typography>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems="center">
                <DateTimePicker
                  value={uploadEndAt}
                  onChange={(v) => v && setUploadEndAt(dayjs(v).second(0).millisecond(0))}
                  ampm={false}
                  minutesStep={5}
                  minDateTime={dayjs(publishAt).add(1, "minute")}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      helperText: `（公開→アップ）期間：${prettyDuration(publishAt, uploadEndAt)}`,
                    },
                  }}
                />
              </Stack>
            </Box>

            {/* 投票締切：公開と同週の金10:00 */}
            <Divider sx={{ my: 1.5 }} />
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 0.5 }}>投票締切（votingEndAt）</Typography>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems="center">
                <DateTimePicker
                  value={votingEndAt}
                  onChange={(v) => v && setVotingEndAt(dayjs(v).second(0).millisecond(0))}
                  ampm={false}
                  minutesStep={5}
                  minDateTime={dayjs(uploadEndAt).add(1, "minute")}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      helperText: `（アップ→投票）期間：${prettyDuration(uploadEndAt, votingEndAt)}`,
                    },
                  }}
                />
                {/* 必要なら時刻だけ微調整 */}
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1 }}>
                  <Typography variant="body2" color="text.secondary">時刻だけ微調整：</Typography>
                  <TimeField
                    value={dayjs(votingEndAt)}
                    onChange={(v) =>
                      v &&
                      setVotingEndAt(
                        dayjs(votingEndAt)
                          .hour(dayjs(v).hour())
                          .minute(dayjs(v).minute())
                          .second(0)
                          .millisecond(0)
                      )
                    }
                    ampm={false}
                    minutesStep={5}
                    format="HH:mm"
                  />
                  <Button
                    size="small"
                    onClick={() =>
                      setVotingEndAt(dayjs(votingEndAt).hour(FIXED_HOUR).minute(0).second(0).millisecond(0))
                    }
                  >
                    10:00にする
                  </Button>
                </Stack>
              </Stack>
            </Box>
          </LocalizationProvider>
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={submitting}>キャンセル</Button>
        <Button onClick={handleSave} variant="contained" disabled={!!invalid || submitting}>
          作成
        </Button>
      </DialogActions>
    </Dialog>
  );
}
