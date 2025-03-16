import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Grid, 
  Box, 
  Typography, 
  CircularProgress,
  CssBaseline,
  ThemeProvider,
  createTheme,
  AppBar,
  Toolbar,
  Paper,
  useScrollTrigger,
  Zoom,
  Fab,
  IconButton,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  styled,
  Drawer
} from '@mui/material';
import {
  BarChart as BarChartIcon,
  TrendingUp as TrendingUpIcon,
  Message as MessageIcon,
  Favorite as FavoriteIcon,
  ThumbDown as ThumbDownIcon,
  StackedLineChart as StackedLineChartIcon,
  Dashboard as DashboardIcon,
  KeyboardArrowUp as KeyboardArrowUpIcon,
  Public as PublicIcon,
  Settings as SettingsIcon,
  Add as AddIcon,
  Language as LanguageIcon,
  Analytics as AnalyticsIcon,
  ChevronLeft as ChevronLeftIcon,
  Menu as MenuIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';

// Import components
import Layout from './components/layout/Layout';
import MetricCard from './components/MetricCard';
import MentionLineChart from './components/MentionLineChart';
import SentimentLineChart from './components/SentimentLineChart';
import PlatformBarChart from './components/PlatformBarChart';
import SentimentTable from './components/SentimentTable';
import SentimentData from './components/SentimentData';
import CountryFilter from './components/CountryFilter';
import CountryBarChart from './components/CountryBarChart';
import SentimentOverview from './components/SentimentOverview';
import SentimentBySource from './components/SentimentBySource';
import GeographicalInsights from './components/GeographicalInsights';

// Import services
import DataService from './services/DataService';

const DRAWER_WIDTH = 240;
const COLLAPSED_DRAWER_WIDTH = 72;

// Create theme
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1a2035',
    },
    secondary: {
      main: '#f50057',
    },
    background: {
      default: '#f4f6f8',
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: "'Inter', 'Roboto', 'Helvetica', 'Arial', sans-serif",
    h4: {
      fontWeight: 700,
    },
    h5: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
    },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          boxShadow: '0 2px 12px 0 rgba(0,0,0,0.05)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: '12px',
          boxShadow: '0 2px 12px 0 rgba(0,0,0,0.05)',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#1a2035',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: '#1a2035',
          color: '#ffffff',
          width: DRAWER_WIDTH,
          borderRight: 'none',
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          '&.Mui-selected': {
            backgroundColor: 'rgba(255, 255, 255, 0.08)',
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.12)',
            },
          },
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.04)',
          },
        },
      },
    },
  },
});

const StyledToolbar = styled(Toolbar)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: theme.spacing(0, 3),
}));

const FilterContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(2),
  backgroundColor: '#fff',
  borderBottom: '1px solid #e0e0e0',
}));

const ContentContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(3),
}));

const MainContent = styled('main', { shouldForwardProp: (prop) => prop !== 'open' })(
  ({ theme, open }) => ({
    flexGrow: 1,
    minHeight: '100vh',
    backgroundColor: theme.palette.background.default,
    transition: theme.transitions.create(['margin', 'width'], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
  }),
);

const Sidebar = styled(Drawer, { shouldForwardProp: (prop) => prop !== 'open' })(
  ({ theme, open }) => ({
    width: open ? DRAWER_WIDTH : COLLAPSED_DRAWER_WIDTH,
    flexShrink: 0,
    whiteSpace: 'nowrap',
    '& .MuiDrawer-paper': {
      width: open ? DRAWER_WIDTH : COLLAPSED_DRAWER_WIDTH,
      transition: theme.transitions.create('width', {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.enteringScreen,
      }),
      boxSizing: 'border-box',
      backgroundColor: '#1a2035',
      color: '#ffffff',
      overflowX: 'hidden',
    },
  }),
);

const SidebarContent = styled(Box)(({ theme }) => ({
  padding: theme.spacing(3, 2),
  '& .MuiListItemIcon-root': {
    color: '#ffffff',
    minWidth: 40,
  },
  '& .MuiListItemText-primary': {
    color: '#ffffff',
  },
}));

const DrawerHeader = styled(Box)(({ theme }) => ({
  height: 64,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: theme.spacing(0, 1),
}));

const menuItems = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
  { text: 'Sentiment Analysis', icon: <TrendingUpIcon />, path: '/sentiment' },
  { text: 'Geographic Data', icon: <LanguageIcon />, path: '/geographic' },
  { text: 'Analytics', icon: <AnalyticsIcon />, path: '/analytics' },
  { text: 'Settings', icon: <SettingsIcon />, path: '/settings' },
];

// Scroll to top button
function ScrollToTop(props) {
  const { children } = props;
  const trigger = useScrollTrigger({
    disableHysteresis: true,
    threshold: 100,
  });

  const handleClick = (event) => {
    const anchor = (event.target.ownerDocument || document).querySelector(
      '#back-to-top-anchor',
    );

    if (anchor) {
      anchor.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  };

  return (
    <Zoom in={trigger}>
      <Box
        onClick={handleClick}
        role="presentation"
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
      >
        {children}
      </Box>
    </Zoom>
  );
}

// Section header component
const SectionHeader = ({ title }) => (
  <motion.div
    initial={{ opacity: 0, y: -20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay: 0.1 }}
  >
    <Box sx={{ mb: 3 }}>
      <Typography variant="h5" gutterBottom>
        {title}
      </Typography>
    </Box>
  </motion.div>
);

// Loading spinner animation
const LoadingAnimation = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ 
      opacity: 1,
      scale: [1, 1.2, 1],
      rotate: [0, 360]
    }}
    transition={{ 
      duration: 2,
      repeat: Infinity,
      repeatType: "loop"
    }}
  >
    <CircularProgress size={60} />
  </motion.div>
);

function App() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [selectedCountry, setSelectedCountry] = useState('all');
  const [filteredData, setFilteredData] = useState(null);
  const [timeRange, setTimeRange] = useState('30');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const result = await DataService.loadData();
        console.log('Data loaded:', result);
        setData(result);
        setFilteredData(result);
        
        // Add a small delay to ensure animations are seen
        setTimeout(() => {
          setLoading(false);
        }, 1000);
      } catch (error) {
        console.error('Error loading data:', error);
        setError('Failed to load data. Please try again later.');
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  // Apply filters when selected country or time range changes
  useEffect(() => {
    if (!data) return;
    
    console.log('Filtering data for country:', selectedCountry, 'and time range:', timeRange);
    
    // First filter by country
    let filteredRawData = selectedCountry === 'all' 
      ? data.rawData 
      : DataService.filterDataByCountry(data.rawData, selectedCountry);

    // Then filter by time range
    filteredRawData = DataService.filterDataByTimeRange(filteredRawData, timeRange);
    
    console.log('Filtered raw data:', filteredRawData);
    
    // Recalculate metrics and charts with filtered data
    const metrics = DataService.calculateMetrics(filteredRawData);
    const mentionsByDate = DataService.getMentionsByDate(filteredRawData);
    const sentimentByDate = DataService.getSentimentByDate(filteredRawData);
    const topSentiment = DataService.getTopSentiment(filteredRawData, 5);
    const bottomSentiment = DataService.getBottomSentiment(filteredRawData, 5);
    const mentionsByPlatform = DataService.getMentionsByPlatform(filteredRawData);
    const mentionsByCountry = DataService.getMentionsByCountry(filteredRawData);
    
    setFilteredData({
      ...data,
      rawData: filteredRawData,
      metrics,
      mentionsByDate,
      sentimentByDate,
      topSentiment,
      bottomSentiment,
      mentionsByPlatform,
      mentionsByCountry
    });
  }, [selectedCountry, timeRange, data]);
  
  const handleCountryChange = (country) => {
    setSelectedCountry(country.toLowerCase());
  };

  const handleTimeRangeChange = (event) => {
    setTimeRange(event.target.value);
  };

  const handleDrawerToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };
  
  if (loading) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box 
          sx={{ 
            display: 'flex', 
            flexDirection: 'column',
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '100vh',
            background: theme.palette.background.default
          }}
        >
          <LoadingAnimation />
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <Typography variant="h6" sx={{ mt: 2 }}>
              Loading dashboard...
            </Typography>
          </motion.div>
        </Box>
      </ThemeProvider>
    );
  }
  
  if (error) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box 
          sx={{ 
            display: 'flex', 
            flexDirection: 'column',
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '100vh',
            background: theme.palette.background.default
          }}
        >
          <Typography color="error" variant="h6">
            {error}
          </Typography>
        </Box>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex' }}>
        <Sidebar variant="permanent" open={sidebarOpen}>
          <DrawerHeader>
            {sidebarOpen ? (
              <>
                <Typography variant="h6" noWrap component="div" sx={{ ml: 2 }}>
                  Sentiment Analysis
                </Typography>
                <IconButton onClick={handleDrawerToggle} sx={{ color: 'white' }}>
                  <ChevronLeftIcon />
                </IconButton>
              </>
            ) : (
              <IconButton onClick={handleDrawerToggle} sx={{ mx: 'auto', color: 'white' }}>
                <MenuIcon />
              </IconButton>
            )}
          </DrawerHeader>
          <SidebarContent>
            {menuItems.map((item) => (
              <Box
                key={item.text}
                sx={{
                  mb: 1,
                  px: 1,
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    cursor: 'pointer',
                    p: 1,
                    borderRadius: 1,
                    whiteSpace: 'nowrap',
                    minHeight: 48,
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.08)',
                    },
                  }}
                >
                  {item.icon}
                  {sidebarOpen && <Typography>{item.text}</Typography>}
                </Box>
              </Box>
            ))}
          </SidebarContent>
        </Sidebar>
        <MainContent open={sidebarOpen}>
          <AppBar 
            position="fixed" 
            elevation={0} 
            sx={{ 
              ml: sidebarOpen ? `${DRAWER_WIDTH}px` : `${COLLAPSED_DRAWER_WIDTH}px`,
              width: `calc(100% - ${sidebarOpen ? DRAWER_WIDTH : COLLAPSED_DRAWER_WIDTH}px)`,
              transition: theme.transitions.create(['width', 'margin'], {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.enteringScreen,
              }),
            }}
          >
            <StyledToolbar>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography variant="h6" component="div">
                  Dashboard Overview
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <IconButton color="inherit" size="large">
                  <AddIcon />
                </IconButton>
                <IconButton color="inherit" size="large">
                  <SettingsIcon />
                </IconButton>
              </Box>
            </StyledToolbar>
          </AppBar>
          <Box sx={{ mt: '64px' }}>
            <FilterContainer>
              <CountryFilter
                data={data}
                selectedCountry={selectedCountry}
                onCountryChange={handleCountryChange}
              />
              <FormControl sx={{ minWidth: 120 }}>
                <InputLabel>Time Range</InputLabel>
                <Select
                  value={timeRange}
                  label="Time Range"
                  onChange={handleTimeRangeChange}
                  size="small"
                >
                  <MenuItem value="7">Last 7 days</MenuItem>
                  <MenuItem value="30">Last 30 days</MenuItem>
                  <MenuItem value="90">Last 90 days</MenuItem>
                  <MenuItem value="all">All time</MenuItem>
                </Select>
              </FormControl>
            </FilterContainer>
            <ContentContainer>
              <Grid container spacing={3}>
                <Grid item xs={12} md={3}>
                  <MetricCard
                    title="Total Mentions"
                    value={filteredData?.metrics?.totalMentions || 0}
                    trend={+5.2}
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <MetricCard
                    title="Positive Sentiment"
                    value={`${filteredData?.metrics?.positivePercentage || 0}%`}
                    trend={+2.1}
                    color="success"
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <MetricCard
                    title="Negative Sentiment"
                    value={`${filteredData?.metrics?.negativePercentage || 0}%`}
                    trend={-1.5}
                    color="error"
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <MetricCard
                    title="Engagement Rate"
                    value={`${filteredData?.metrics?.presenceScore || 0}%`}
                    trend={+3.7}
                    color="info"
                  />
                </Grid>
                <Grid item xs={12}>
                  <Paper elevation={0} sx={{ p: 2 }}>
                    <GeographicalInsights data={filteredData} />
                  </Paper>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Paper elevation={0} sx={{ p: 2, height: '100%' }}>
                    <SentimentOverview data={filteredData} />
                  </Paper>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Paper elevation={0} sx={{ p: 2, height: '100%' }}>
                    <SentimentBySource data={filteredData} />
                  </Paper>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Paper elevation={0} sx={{ p: 2, height: '100%' }}>
                    <MentionLineChart mentionsByDate={filteredData?.mentionsByDate} />
                  </Paper>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Paper elevation={0} sx={{ p: 2, height: '100%' }}>
                    <SentimentLineChart sentimentByDate={filteredData?.sentimentByDate} />
                  </Paper>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Paper elevation={0} sx={{ p: 2, height: '100%' }}>
                    <PlatformBarChart mentionsByPlatform={filteredData?.mentionsByPlatform} />
                  </Paper>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Paper elevation={0} sx={{ p: 2, height: '100%' }}>
                    <CountryBarChart mentionsByCountry={filteredData?.mentionsByCountry} />
                  </Paper>
                </Grid>
                <Grid item xs={12}>
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                      <Paper elevation={0} sx={{ p: 2 }}>
                        <SentimentTable
                          data={filteredData}
                          title="Highest Sentiment Posts"
                          type="top"
                        />
                      </Paper>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Paper elevation={0} sx={{ p: 2 }}>
                        <SentimentTable
                          data={filteredData}
                          title="Lowest Sentiment Posts"
                          type="bottom"
                        />
                      </Paper>
                    </Grid>
                  </Grid>
                </Grid>
              </Grid>
            </ContentContainer>
          </Box>
        </MainContent>
      </Box>
    </ThemeProvider>
  );
}

export default App;
