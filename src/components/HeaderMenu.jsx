import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Button, Menu, MenuItem, Typography } from '@mui/material';
import { useAuth } from "../contexts/AuthProvider";
import { signOut } from "firebase/auth";
import { auth } from "../utils/firebase-config";

export default function HeaderMenu() {
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = React.useState(null);
  const open = Boolean(anchorEl);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  const { user } = useAuth();

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/login");
  };

  const routes = [
    { name: 'Home', path: '/' },
    { name: 'About', path: '/about' },
    { name: 'Contact', path: '/contact' },
  ];

  return (
    <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
      <Typography variant="body1">
          {user?.email || "ゲスト"} 
      </Typography>
      <Button
        onClick={handleClick}
        sx={{ color: 'white' }}
      >
        MENU
      </Button>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        sx={{ width:"100%" }}
      >
        {routes.map((route) => (
          <MenuItem
            key={route.path}
            onClick={() => {
              navigate(route.path);
              handleClose();
            }}
          >
            {route.name}
          </MenuItem>
        ))}
        <Button variant="contained" color="primary" onClick={handleLogout}>
          ログアウト
        </Button>
      </Menu>
    </Box>
  );
}
