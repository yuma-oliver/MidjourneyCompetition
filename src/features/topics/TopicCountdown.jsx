import { useEffect, useState } from "react";
import dayjs from "dayjs";

const COUNTDOWN_DURATION_MS = 48 * 60 * 60 * 1000;

export const TopicCountdown = ({ publishAt }) => {
  const [now, setNow] = useState(dayjs());

  useEffect(() => {
    const timer = setInterval(() => setNow(dayjs()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (!publishAt) return null;

  const publishTime = dayjs(publishAt.toDate ? publishAt.toDate() : publishAt);
  const endTime = publishTime.add(48, "hour");
  const diffMs = endTime.diff(now);

  if (diffMs <= 0) return <span>カウントダウン終了</span>;

  const h = Math.floor(diffMs / (1000 * 60 * 60));
  const m = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  const s = Math.floor((diffMs % (1000 * 60)) / 1000);

  return (
    <span>
      お題終了まで残り: {h}h {m}m {s}s
    </span>
  );
};
