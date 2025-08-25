import { useState, useMemo } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, Stack, Alert
} from "@mui/material";
import { LocalizationProvider, DateTimePicker } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import { collection, addDoc, serverTimestamp, Timestamp } from "firebase/firestore";
import { db } from "@/utils/firebase-config";
import { useAuth } from "@/contexts/AuthProvider";

export default function AddTopicDialog({ open, onClose }) {
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");

  const [publishAt, setPublishAt] = useState(dayjs().second(0).millisecond(0));
  const [uploadEndAt, setUploadEndAt] = useState(dayjs().add(1, "day").second(0).millisecond(0));
  const [votingEndAt, setVotingEndAt] = useState(dayjs().add(2, "day").second(0).millisecond(0));

  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState("");

  const invalid = useMemo(() => {
    if (!title.trim()) return "タイトルを入力してください。";
    if (!publishAt || !uploadEndAt || !votingEndAt) return "日時が未設定です。";
    if (!dayjs(publishAt).isValid() || !dayjs(uploadEndAt).isValid() || !dayjs(votingEndAt).isValid()) return "日時の形式が不正です。";
    if (!(dayjs(publishAt).isBefore(uploadEndAt) && dayjs(uploadEndAt).isBefore(votingEndAt))) {
      return "時系列が不正です（公開 < アップロード締切 < 投票締切）。";
    }
    return "";
  }, [title, publishAt, uploadEndAt, votingEndAt]);

  const handleSave = async () => {
    setErr("");
    if (invalid) {
      setErr(invalid);
      return;
    }
    try {
      setSubmitting(true);
      await addDoc(collection(db, "topics"), {
        title: title.trim(),
        description: desc.trim(),
        publishAt: Timestamp.fromDate(dayjs(publishAt).toDate()),
        uploadEndAt: Timestamp.fromDate(dayjs(uploadEndAt).toDate()),
        votingEndAt: Timestamp.fromDate(dayjs(votingEndAt).toDate()),
        createdAt: serverTimestamp(),
        createdBy: user?.uid || null,
        // 必要ならフラグ類
        isActive: true,
      });
      onClose?.();
      setTitle(""); setDesc("");
    } catch (e) {
      setErr(e.message || "保存に失敗しました。");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>お題を作成</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {err && <Alert severity="error">{err}</Alert>}
          <TextField
            label="タイトル"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
          />
          <TextField
            label="説明（任意）"
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            multiline
            minRows={2}
          />
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DateTimePicker
              label="公開日時（publishAt）"
              value={publishAt}
              onChange={setPublishAt}
              slotProps={{ textField: { helperText: "この時刻からお題が見えるようになります" } }}
            />
            <DateTimePicker
              label="アップロード締切（uploadEndAt）"
              value={uploadEndAt}
              onChange={setUploadEndAt}
              slotProps={{ textField: { helperText: "ここまで投稿を受け付け" } }}
            />
            <DateTimePicker
              label="投票締切（votingEndAt）"
              value={votingEndAt}
              onChange={setVotingEndAt}
              slotProps={{ textField: { helperText: "ここで投票終了→結果発表へ" } }}
            />
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
