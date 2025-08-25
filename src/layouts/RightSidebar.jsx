import { Box, Drawer, Toolbar, Typography } from '@mui/material'
import React from 'react'

const drawerWidth = 240;

const RightSidebar = () => {
  return (
    <Drawer
      variant='permanent'
      anchor='right'
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: {
          width: drawerWidth,
          boxSizing: 'border-box',
        },
        display: { xs: 'none', md: 'block' }, //小さい画面で非表示
      }}
    >
      {/* AppBarに被らないように余白 */}
      <Toolbar />

      <Box>
        <Typography variant='h6'>Right Sidebar</Typography>
        <Typography variant='body2'>
          右サイドバーにヒントを表示したいです。
          デフォルトは非表示でボタンで開閉できるようにしたいです。
        </Typography>
      </Box>
    </Drawer>
  )
}

export default RightSidebar