import { useEffect, useMemo, useState } from "react";
import { Box, Chip, Tooltip } from "@mui/material";
import dayjs from "dayjs";

// Firestore Timestamp / {_seconds} / Date / ISO に対応
const toD = (v) => {
  if (!v) return dayjs.invalid();
  if (typeof v?.toDate === "function") return dayjs(v.toDate());
  if (typeof v?._seconds === "number") return dayjs.unix(v._seconds);
  return dayjs(v);
};

// 見た目：Chip 1個。過ぎたら「締め切りました」
const DeadlineCountdown = ({ target, label = "締切まで", endedText = "締め切りました" }) => {
  const targetD = useMemo(() => toD(target), [target]);
  const [now, setNow] = useState(dayjs());

  useEffect(() => {
    const id = setInterval(() => setNow(dayjs()), 1000);
    return () => clearInterval(id);
  }, []);

  if (!targetD.isValid()) return null;

  const diff = targetD.diff(now, "second");
  const ended = diff <= 0;

  const abs = Math.max(diff, 0);
  const days = Math.floor(abs / 86400);
  const hrs  = Math.floor((abs % 86400) / 3600);
  const mins = Math.floor((abs % 3600) / 60);
  const secs = abs % 60;

  const text = ended
    ? endedText
    : days > 0
    ? `${days}日 ${String(hrs).padStart(2,"0")}:${String(mins).padStart(2,"0")}:${String(secs).padStart(2,"0")}`
    : `${String(hrs).padStart(2,"0")}:${String(mins).padStart(2,"0")}:${String(secs).padStart(2,"0")}`;

  return (
    <Box sx={{ mb: 2 }}>
      <Tooltip title={targetD.format("YYYY/MM/DD HH:mm")} arrow>
        <Chip
          color={ended ? "default" : "primary"}
          variant={ended ? "outlined" : "filled"}
          label={`${label}: ${text}`}
        />
      </Tooltip>
    </Box>
  );
};

export default DeadlineCountdown;
