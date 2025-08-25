import { Box, Container, Toolbar } from "@mui/material"
import Header from "@/layouts/Header"
import LeftSidebar from "@/layouts/LeftSidebar"
import Main from "@/layouts/Main"
import RightSidebar from "@/layouts/RightSidebar"
import { useState } from "react"


const DashboardPageContent = () => {
  const [selectedPage, setSelectedPage] = useState('HOME');

  return (
    <Box sx={{ display: 'flex'}}>
        <Header />

        {/* サイドバーとメイン */}
        <Box sx={{ display: 'flex', width: '100%' }}>
            <LeftSidebar selectedPage={selectedPage} setSelectedPage={setSelectedPage}/>
            
            <Box 
              component="main"
              sx={{ flexGrow: 1, bgcolor: '#f5f5f5', p: 2 }}
            >
              <Toolbar />
              <Main selectedPage={selectedPage} setSelectedPage={setSelectedPage}/>
            </Box>

            <RightSidebar />
        </Box>
    </Box>
  )
}

export default DashboardPageContent