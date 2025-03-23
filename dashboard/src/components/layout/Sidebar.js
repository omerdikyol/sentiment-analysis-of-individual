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
  Divider,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  TableChart as TableChartIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  AutoAwesome as AutoAwesomeIcon,
  Psychology as PsychologyIcon,
  Share as ShareIcon,
  Summarize as SummarizeIcon,
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

// Update the menu items to include AI-powered features
const menuItems = [
  { text: 'Dashboard', icon: <DashboardIcon sx={{ color: 'white' }} />, path: '/' },
  { text: 'Sentiment Data', icon: <TableChartIcon sx={{ color: 'white' }} />, path: '/sentiment-data' },
];

// Add the new AI-powered menu items
const aiMenuItems = [
  { text: 'AI Summary', icon: <SummarizeIcon sx={{ color: 'white' }} />, path: '/#auto-summary' },
  { text: 'Entity Relationships', icon: <ShareIcon sx={{ color: 'white' }} />, path: '/#entity-relationship' },
  { text: 'Contextual Sentiment', icon: <AutoAwesomeIcon sx={{ color: 'white' }} />, path: '/#contextual-sentiment' },
  { text: 'Emotional Spectrum', icon: <PsychologyIcon sx={{ color: 'white' }} />, path: '/#emotional-spectrum' },
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
        
        {/* Divider for AI Features */}
        <Box sx={{ px: isOpen ? 2 : 0, my: 2 }}>
          {isOpen ? (
            <Box>
              <Divider sx={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }} />
              <Typography 
                variant="caption" 
                sx={{ 
                  display: 'block', 
                  color: 'rgba(255, 255, 255, 0.5)', 
                  mt: 1, 
                  mb: 1,
                  fontSize: '0.7rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}
              >
                Advanced AI Features
              </Typography>
            </Box>
          ) : (
            <Divider sx={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }} />
          )}
        </Box>
        
        {/* AI Feature Menu Items */}
        {aiMenuItems.map((item) => (
          <StyledListItem key={item.text} disablePadding>
            <Tooltip 
              title={!isOpen ? item.text : ''} 
              placement="right"
              arrow
            >
              <ListItemButton 
                component="a"
                href={item.path}
                selected={location.hash === item.path.substring(1)}
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
                onClick={(e) => {
                  e.preventDefault();
                  const targetId = item.path.split('#')[1];
                  const targetElement = document.getElementById(targetId);
                  if (targetElement) {
                    targetElement.scrollIntoView({ behavior: 'smooth' });
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