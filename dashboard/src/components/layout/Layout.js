import React, { useState } from 'react';
import { Box, styled } from '@mui/material';
import Sidebar from './Sidebar';

const DRAWER_WIDTH = 240;
const COLLAPSED_DRAWER_WIDTH = 72;

const Main = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'open',
})(({ theme, open }) => ({
  flexGrow: 1,
  padding: '20px',
  paddingLeft: '24px',
  transition: theme.transitions.create(['margin', 'padding'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.enteringScreen,
  }),
  [theme.breakpoints.down('sm')]: {
    padding: '12px',
    paddingLeft: '16px',
  },
}));

const Layout = ({ children }) => {
  const [isOpen, setIsOpen] = useState(true);

  const handleDrawerToggle = () => {
    setIsOpen(!isOpen);
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f4f6f8' }}>
      <Sidebar isOpen={isOpen} onToggle={handleDrawerToggle} />
      <Main open={isOpen}>
        {children}
      </Main>
    </Box>
  );
};

export default Layout; 