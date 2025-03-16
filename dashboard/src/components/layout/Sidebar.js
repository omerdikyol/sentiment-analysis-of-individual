import React from 'react';
import { Link, useLocation } from 'react-router-dom';
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
  TableChart as TableChartIcon,
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
  display: 'flex',
  alignItems: 'center',
  justifyContent: open ? 'space-between' : 'center',
  borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
}));

const StyledListItem = styled(ListItem)(({ theme }) => ({
  display: 'block',
  padding: 0,
  marginBottom: theme.spacing(0.5),
}));

const StyledListItemIcon = styled(ListItemIcon)(({ theme, open }) => ({
  minWidth: 0,
  marginRight: open ? theme.spacing(2) : 'auto',
  justifyContent: 'center',
  marginRight: 0
}));

// Simplified menu items - only keeping Dashboard and Sentiment Data
const menuItems = [
  { text: 'Dashboard', icon: <DashboardIcon sx={{ color: 'white' }} />, path: '/' },
  { text: 'Sentiment Data', icon: <TableChartIcon sx={{ color: 'white' }} />, path: '/sentiment-data' },
];

const Sidebar = ({ isOpen, onToggle }) => {
  const location = useLocation();
  
  return (
    <StyledDrawer variant="permanent" open={isOpen}>
      <Logo open={isOpen}>
        {isOpen ? (
          <>
            <Typography variant="h6" component="div" sx={{ fontWeight: 600, fontSize: '0.95rem' }}>
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
                component={Link}
                to={item.path}
                selected={location.pathname === item.path}
                sx={{
                  minHeight: 48,
                  justifyContent: isOpen ? 'initial' : 'center',
                  px: 2.5,
                  borderRadius: '8px',
                  mb: 0.5,
                  '&.Mui-selected': {
                    backgroundColor: 'rgba(255, 255, 255, 0.12)',
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.18)',
                    }
                  },
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  }
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 0,
                    mr: isOpen ? 2 : 'auto',
                    justifyContent: 'center',
                    color: 'white'
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                {isOpen && (
                  <ListItemText 
                    primary={item.text} 
                    primaryTypographyProps={{
                      fontSize: '0.9rem',
                    }}
                  />
                )}
              </ListItemButton>
            </Tooltip>
          </StyledListItem>
        ))}
      </List>
    </StyledDrawer>
  );
};

export default Sidebar; 