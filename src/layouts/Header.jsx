import { AppBar, Toolbar, Typography, Box, IconButton } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import HeaderMenu from "@/components/HeaderMenu";
import { useLayoutUI } from "@/contexts/LayoutUIContext";

const appBarHeight = 64;

const Header = () => {
  const { toggleSidebar } = useLayoutUI();

  return (
    <AppBar
      position="fixed"
      color="primary"
      elevation={1}
      sx={{
        zIndex: (theme) => theme.zIndex.drawer + 1,
        height: appBarHeight,
      }}
    >
      <Toolbar>
        <IconButton
          edge="start"
          color="inherit"
          aria-label="menu"
          onClick={toggleSidebar}
          sx={{ mr: 2 }}
        >
          <MenuIcon />
        </IconButton>

        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          MC
        </Typography>

        <Box>
          <HeaderMenu />
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
