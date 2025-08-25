// src/pages/HomePage.jsx
import { Box, Typography, Button } from "@mui/material";
import { useNavigate } from "react-router-dom";

const HomePage = () => {
  const navigate = useNavigate();

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h3" mb={2}>Midjourney Competition</Typography>
      <Typography variant="body1" mb={4}>
        AI画像コンペを毎日楽しもう！<br />
        ログインして参加するか、新規登録してください。
      </Typography>
      <Button
        variant="contained"
        color="primary"
        sx={{ mr: 2 }}
        onClick={() => navigate("/login")}
      >
        ログイン
      </Button>
      <Button
        variant="outlined"
        color="primary"
        onClick={() => navigate("/signup")}
      >
        新規登録
      </Button>
    </Box>
  );
};

export default HomePage;
