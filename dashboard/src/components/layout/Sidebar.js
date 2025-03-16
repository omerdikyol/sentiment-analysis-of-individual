import React from 'react';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  IconButton,
  Tooltip,
  styled,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Timeline as TimelineIcon,
  Language as LanguageIcon,
  Analytics as AnalyticsIcon,
  Settings as SettingsIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
} from '@mui/icons-material';

const DRAWER_WIDTH = 240;
const COLLAPSED_DRAWER_WIDTH = 72;

const StyledDrawer = styled(Drawer, {
  shouldForwardProp: (prop) => prop !== 'open',
})(({ theme, open }) => ({
  width: open ? DRAWER_WIDTH : COLLAPSED_DRAWER_WIDTH,
  flexShrink: 0,
  whiteSpace: 'nowrap',
  '& .MuiDrawer-paper': {
    width: open ? DRAWER_WIDTH : COLLAPSED_DRAWER_WIDTH,
    boxSizing: 'border-box',
    backgroundColor: '#1a2035',
    color: '#ffffff',
    transition: theme.transitions.create('width', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
    overflowX: 'hidden',
    borderRight: 'none',
    boxShadow: '2px 0 8px rgba(0,0,0,0.1)',
  },
}));

const Logo = styled(Box)(({ theme, open }) => ({
  padding: open ? '20px 16px' : '20px 0',
  borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: open ? 'space-between' : 'center',
  minHeight: '64px',
}));

const StyledListItem = styled(ListItem)(({ theme }) => ({
  padding: '4px',
  '& .MuiListItemButton-root': {
    borderRadius: '8px',
    margin: '2px 4px',
    padding: '8px 12px',
    display: 'flex',
    justifyContent: 'center',
    '&:hover': {
      backgroundColor: 'rgba(255, 255, 255, 0.08)',
    },
    '&.Mui-selected': {
      backgroundColor: 'rgba(255, 255, 255, 0.16)',
      '&:hover': {
        backgroundColor: 'rgba(255, 255, 255, 0.16)',
      },
    },
  },
  '& .MuiListItemIcon-root': {
    color: '#ffffff',
    minWidth: 40,
    display: 'flex',
    justifyContent: 'center',
    marginRight: 0
  },
}));

const menuItems = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
  { text: 'Sentiment Analysis', icon: <TimelineIcon />, path: '/sentiment' },
  { text: 'Geographic Data', icon: <LanguageIcon />, path: '/geographic' },
  { text: 'Analytics', icon: <AnalyticsIcon />, path: '/analytics' },
  { text: 'Settings', icon: <SettingsIcon />, path: '/settings' },
];

const Sidebar = ({ isOpen, onToggle, selectedPath = '/' }) => {
  return (
    <StyledDrawer variant="permanent" open={isOpen}>
      <Logo open={isOpen}>
        {isOpen ? (
          <>
            <Typography variant="h6" component="div" sx={{ fontWeight: 600, fontSize: '1.1rem' }}>
              Sentiment Analysis
            </Typography>
            <IconButton 
              onClick={onToggle}
              sx={{ 
                color: 'white',
                padding: '4px',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                }
              }}
            >
              <ChevronLeftIcon />
            </IconButton>
          </>
        ) : (
          <IconButton 
            onClick={onToggle}
            sx={{ 
              color: 'white',
              padding: '4px',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
              }
            }}
          >
            <ChevronRightIcon />
          </IconButton>
        )}
      </Logo>
      <List sx={{ mt: 1, px: 1 }}>
        {menuItems.map((item) => (
          <StyledListItem key={item.text} disablePadding>
            <Tooltip 
              title={!isOpen ? item.text : ''} 
              placement="right"
              arrow
            >
              <ListItemButton 
                selected={selectedPath === item.path}
                sx={{
                  justifyContent: 'center',
                  minHeight: 48,
                }}
              >
                <ListItemIcon sx={{ 
                  display: 'flex',
                  justifyContent: 'center',
                  minWidth: 40,
                }}>{item.icon}</ListItemIcon>
                {isOpen && <ListItemText primary={item.text} />}
              </ListItemButton>
            </Tooltip>
          </StyledListItem>
        ))}
      </List>
    </StyledDrawer>
  );
};

export default Sidebar; 