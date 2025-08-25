// src/layouts/LeftSidebar.jsx
import {
  Drawer, Toolbar, List, ListItemButton, ListItemText,
  IconButton, Box, Typography, Divider
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { useContext, useMemo, useState } from "react";
import { PageContext } from "@/contexts/SelectedPage";
import { useTopics } from "@/contexts/TopicsContext";
import AddTopicDialog from "@/features/topics/AddTopicDialog";
import dayjs from "dayjs";

const drawerWidth = 260;

const LeftSidebar = () => {
  const { selectedPage, setSelectedPage } = useContext(PageContext);
  const { topics } = useTopics();
  const [openAdd, setOpenAdd] = useState(false);

  const sorted = useMemo(() => {
    return [...(topics || [])].sort((a, b) => {
      const ap = a.publishAt?._seconds ? dayjs.unix(a.publishAt._seconds) : dayjs(a.publishAt);
      const bp = b.publishAt?._seconds ? dayjs.unix(b.publishAt._seconds) : dayjs(b.publishAt);
      return (bp?.valueOf() || 0) - (ap?.valueOf() || 0);
    });
  }, [topics]);

  const fmt = (v) => {
    const d = v?._seconds ? dayjs.unix(v._seconds) : dayjs(v);
    return d.isValid() ? `公開: ${d.format("MM/DD HH:mm")}` : "";
  };

  return (
    <>
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          "& .MuiDrawer-paper": { width: drawerWidth, boxSizing: "border-box" },
        }}
      >
        {/* AppBar 分のスペーサー（中身は入れない） */}
        <Toolbar />

        {/* 見出し行 */}
        <Box sx={{ px: 1.5, py: 1, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Typography variant="subtitle1">お題</Typography>
          <IconButton size="small" onClick={() => setOpenAdd(true)} aria-label="add-topic">
            <AddIcon />
          </IconButton>
        </Box>

        <Divider />

        <Box sx={{ overflowY: "auto", flex: 1 }}>
          <List dense disablePadding>
            {sorted.map((t) => {
              const active = selectedPage === t.id;
              const secondaryText = fmt(t.publishAt);
              return (
                <ListItemButton key={t.id} selected={active} onClick={() => setSelectedPage(t.id)}>
                  <ListItemText
                    primary={t.title || "(無題)"}
                    secondary={secondaryText || null} // ← 文字列/要素を渡す
                  />
                </ListItemButton>
              );
            })}
          </List>
        </Box>
      </Drawer>

      {/* ← コメントアウトせず必ずレンダーする */}
      <AddTopicDialog open={openAdd} onClose={() => setOpenAdd(false)} />
    </>
  );
};

export default LeftSidebar;
