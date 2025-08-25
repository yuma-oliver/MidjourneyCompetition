// src/layout/LeftSidebar.jsx（まるごと置き換え）
import {
  Drawer, Toolbar, List, ListItemButton, ListItemText,
  IconButton, Box, Typography, Divider, useMediaQuery,
  Tooltip, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { useContext, useMemo, useState } from "react";
import { PageContext } from "@/contexts/SelectedPage";
import { useTopics } from "@/contexts/TopicsContext";
import AddTopicDialog from "@/features/topics/AddTopicDialog";
import dayjs from "dayjs";
import { useTheme } from "@mui/material/styles";
import { useLayoutUI } from "@/contexts/LayoutUIContext";
import { useAuth } from "@/contexts/AuthProvider";
import { db } from "@/utils/firebase-config";
import { deleteDoc, doc } from "firebase/firestore";
import { deleteTopicAndChildren } from "@/utils/topicDeleteUtils";

const drawerWidth = 260;

const LeftSidebar = () => {
  const { selectedPage, setSelectedPage } = useContext(PageContext);
  const { topics } = useTopics();
  const [openAdd, setOpenAdd] = useState(false);

  const theme = useTheme();
  const upMd = useMediaQuery(theme.breakpoints.up("md"));
  const { sidebarOpen, closeSidebar } = useLayoutUI();
  const { user } = useAuth();

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

  const variant = upMd ? "persistent" : "temporary";

  // 削除ダイアログ用
  const [confirm, setConfirm] = useState({ open: false, id: null, title: "" });
  const [deleting, setDeleting] = useState(false);

  const requestDelete = (t) => {
    setConfirm({ open: true, id: t.id, title: t.title || "(無題)" });
  };
  const handleCancel = () => setConfirm({ open: false, id: null, title: "" });

  const handleDelete = async () => {
    if (!confirm.id) return;
    try {
      setDeleting(true);
      // ★ 配下の submissions / votes / 画像 を掃除してから topics を削除
      await deleteTopicAndChildren(confirm.id);
      if (selectedPage === confirm.id) setSelectedPage(null);
    } catch (e) {
      alert(e?.message || "削除に失敗しました。");
    } finally {
      setDeleting(false);
      handleCancel();
    }
  };

  return (
    <>
      <Drawer
        variant={variant}
        open={sidebarOpen}
        onClose={closeSidebar}
        ModalProps={{ keepMounted: true }}
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          display: { xs: "block", md: "block" },
          "& .MuiDrawer-paper": {
            width: drawerWidth,
            boxSizing: "border-box",
          },
        }}
      >
        {/* AppBar 分のスペーサー */}
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
              const isOwner = !!user?.uid && t?.createdBy === user.uid;

              return (
                <ListItemButton
                  key={t.id}
                  selected={active}
                  onClick={() => {
                    setSelectedPage(t.id);
                    if (!upMd) closeSidebar();
                  }}
                  sx={{
                    pr: 1,
                    display: "flex",
                    alignItems: "center",
                    "& .topic-del": { opacity: active ? 1 : 0 },         // 選択中は常時表示
                    "&:hover .topic-del": { opacity: 1 },                // ホバーで表示
                  }}
                >
                  <ListItemText
                    primary={t.title || "(無題)"}
                    secondary={secondaryText || null}
                    sx={{ mr: 0.5 }}
                  />
                  {/* 右端の削除アイコン（作成者のみ表示） */}
                  {isOwner && (
                    <Box className="topic-del" sx={{ opacity: 0, transition: "opacity .15s" }}>
                      <Tooltip title="お題を削除">
                        <IconButton
                          size="small"
                          edge="end"
                          onClick={(e) => {
                            e.stopPropagation(); // 行クリックの選択を抑止
                            requestDelete(t);
                          }}
                          aria-label="delete-topic"
                        >
                          <DeleteOutlineIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  )}
                </ListItemButton>
              );
            })}
          </List>
        </Box>
      </Drawer>

      {/* 追加ダイアログ */}
      <AddTopicDialog open={openAdd} onClose={() => setOpenAdd(false)} />

      {/* 削除確認ダイアログ（このファイル内に完結） */}
      <Dialog open={confirm.open} onClose={deleting ? undefined : handleCancel}>
        <DialogTitle>お題を削除しますか？</DialogTitle>
        <DialogContent>
          <DialogContentText>
            「{confirm.title}」を削除します。<br />
            ※この操作は取り消せません。（submissions / votes は残ります）
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancel} disabled={deleting}>キャンセル</Button>
          <Button onClick={handleDelete} color="error" variant="contained" disabled={deleting}>
            {deleting ? "削除中..." : "削除する"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default LeftSidebar;
