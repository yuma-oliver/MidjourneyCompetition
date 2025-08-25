// src/pages/SignupPage.jsx
import { useState } from "react";
import { Box, TextField, Button, Typography, Alert } from "@mui/material";
import { auth } from "../utils/firebase-config";
import { useNavigate, Link } from "react-router-dom";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { createUserDocument } from "@/utils/userUtils";

const SignupPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [username, setUsername] = useState("");
  const navigate = useNavigate();

    const handleSignup = async (e) => {
    e.preventDefault();
    setError("");
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        await createUserDocument(user, username);
        navigate("/dashboard");
    } catch (err) {
        setError("登録に失敗しました。すでに登録済みか、パスワードが弱い可能性があります。");
    }
    };

  return (
    <Box sx={{ p: 4, maxWidth: 400, mx: "auto" }}>
      <Typography variant="h5" mb={3}>新規登録</Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <form onSubmit={handleSignup}>
        <TextField 
            label="ユーザーネーム"
            value={username}
            onChange={e => setUsername(e.target.value)}
            fullWidth
            required
            margin="normal"
        />

        <TextField
          label="メールアドレス"
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          fullWidth
          required
          margin="normal"
        />
        <TextField
          label="パスワード"
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          fullWidth
          required
          margin="normal"
        />
        <Button
          type="submit"
          variant="contained"
          color="primary"
          fullWidth
          sx={{ mt: 2 }}
        >
          登録
        </Button>
      </form>
      <Box sx={{ mt: 2 }}>
        <Typography variant="body2">
          すでにアカウントをお持ちの方は <Link to="/login">ログイン</Link>
        </Typography>
      </Box>
    </Box>
  );
};

export default SignupPage;
