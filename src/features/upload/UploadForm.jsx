// src/features/upload/UploadForm.jsx
import { useState } from "react";
import { Box, Button, LinearProgress, Stack, TextField, Typography } from "@mui/material";
import { uploadTopicImage } from "@/utils/storageUtils";
import { useAuth } from "@/contexts/AuthProvider";

const UploadForm = ({ topic, onUploaded }) => {
  const { user } = useAuth();
  const [file, setFile] = useState(null);
  const [caption, setCaption] = useState("");
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);

  const handleFile = (e) => setFile(e.target.files?.[0] || null);

  const handleUpload = async () => {
    if (!file || !user?.uid || !topic?.id) return;
    setUploading(true);
    setProgress(0);
    try {
      const { url, path } = await uploadTopicImage(file, {
        topicId: topic.id,
        uid: user.uid,
        onProgress: setProgress,
      });
      onUploaded?.({ url, path, caption: caption.trim(), file });
      setFile(null);
      setCaption("");
    } catch (e) {
      alert(e.message || "アップロードに失敗しました");
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  return (
    <Stack spacing={2}>
      <Typography variant="h6">画像をアップロード</Typography>

      <Button variant="outlined" component="label">
        ファイルを選択
        <input hidden type="file" accept="image/*" onChange={handleFile} />
      </Button>
      {file && <Box sx={{ fontSize: 14, color: "text.secondary" }}>{file.name}</Box>}

      <TextField
        label="キャプション（任意）"
        value={caption}
        onChange={(e) => setCaption(e.target.value)}
        size="small"
      />

      {uploading && (
        <>
          <LinearProgress variant="determinate" value={progress} />
          <Typography variant="caption">{progress}%</Typography>
        </>
      )}

      <Button variant="contained" disabled={!file || uploading} onClick={handleUpload}>
        アップロード
      </Button>
    </Stack>
  );
};

export default UploadForm;
