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
  Fab
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
  Public as PublicIcon
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

// Import services
import DataService from './services/DataService';

// Create theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#1a2035',
    },
    secondary: {
      main: '#f50057',
    },
    background: {
      default: '#f8f9fa',
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
  },
});

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
  const [selectedCountry, setSelectedCountry] = useState('All Countries');
  const [filteredData, setFilteredData] = useState(null);
  
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
  
  // Apply country filter when selected country changes
  useEffect(() => {
    if (!data) return;
    
    console.log('Filtering data for country:', selectedCountry);
    
    if (selectedCountry === 'All Countries') {
      setFilteredData(data);
      return;
    }
    
    // Filter raw data by country
    const filteredRawData = DataService.filterDataByCountry(data.rawData, selectedCountry);
    console.log('Filtered raw data:', filteredRawData);
    
    // Recalculate metrics and charts with filtered data
    const metrics = DataService.calculateMetrics(filteredRawData);
    const mentionsByDate = DataService.getMentionsByDate(filteredRawData);
    const sentimentByDate = DataService.getSentimentByDate(filteredRawData);
    const topSentiment = DataService.getTopSentiment(filteredRawData, 5);
    const bottomSentiment = DataService.getBottomSentiment(filteredRawData, 5);
    const mentionsByPlatform = DataService.getMentionsByPlatform(filteredRawData);
    const mentionsByCountry = DataService.getMentionsByCountry(filteredRawData);
    
    console.log('Updated metrics:', {
      mentionsByDate,
      sentimentByDate,
      mentionsByPlatform,
      mentionsByCountry
    });
    
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
  }, [selectedCountry, data]);
  
  const handleCountryChange = (country) => {
    setSelectedCountry(country);
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
      <Layout>
        <Box sx={{ pb: 6 }} id="back-to-top-anchor">
          <Grid container spacing={3}>
            {/* Header with Country Filter */}
            <Grid item xs={12}>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mb: 3,
                  mt: 1
                }}
              >
                <Typography 
                  variant="h4" 
                  sx={{ 
                    fontWeight: 'bold',
                    color: theme.palette.text.primary
                  }}
                >
                  Dashboard Overview
                </Typography>
                <Box sx={{ width: '300px' }}>
                  <CountryFilter
                    selectedCountry={selectedCountry}
                    onCountryChange={handleCountryChange}
                    data={data}
                  />
                </Box>
              </Box>
            </Grid>

            {/* Metrics */}
            <Grid item xs={12}>
              <SectionHeader title="Key Metrics" />
              <Grid container spacing={3}>
                {filteredData?.metrics && (
                  <>
                    <Grid item xs={12} sm={6} md={3}>
                      <MetricCard
                        title="Total Mentions"
                        value={filteredData.metrics.totalMentions}
                        icon={<MessageIcon />}
                        color="#3f51b5"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <MetricCard
                        title="Positive Sentiment"
                        value={`${filteredData.metrics.positivePercentage}%`}
                        icon={<FavoriteIcon />}
                        color="#4caf50"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <MetricCard
                        title="Negative Sentiment"
                        value={`${filteredData.metrics.negativePercentage}%`}
                        icon={<ThumbDownIcon />}
                        color="#f44336"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <MetricCard
                        title="Engagement Rate"
                        value={`${filteredData.metrics.presenceScore}%`}
                        icon={<TrendingUpIcon />}
                        color="#ff9800"
                      />
                    </Grid>
                  </>
                )}
              </Grid>
            </Grid>

            {/* Charts */}
            <Grid item xs={12}>
              <SectionHeader title="Trends & Analysis" />
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 3, height: '100%' }}>
                    <MentionLineChart mentionsByDate={filteredData?.mentionsByDate} />
                  </Paper>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 3, height: '100%' }}>
                    <SentimentLineChart sentimentByDate={filteredData?.sentimentByDate} />
                  </Paper>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 3, height: '100%' }}>
                    <PlatformBarChart mentionsByPlatform={filteredData?.mentionsByPlatform} />
                  </Paper>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 3, height: '100%' }}>
                    <CountryBarChart mentionsByCountry={filteredData?.mentionsByCountry} />
                  </Paper>
                </Grid>
              </Grid>
            </Grid>

            {/* Sentiment Tables */}
            <Grid item xs={12}>
              <SectionHeader title="Detailed Sentiment Analysis" />
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 3 }}>
                    <SentimentTable 
                      data={filteredData}
                      title="Highest Sentiment Posts"
                    />
                  </Paper>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 3 }}>
                    <SentimentTable 
                      data={filteredData}
                      title="Lowest Sentiment Posts"
                    />
                  </Paper>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </Box>

        <ScrollToTop>
          <Fab color="primary" size="small" aria-label="scroll back to top">
            <KeyboardArrowUpIcon />
          </Fab>
        </ScrollToTop>
      </Layout>
    </ThemeProvider>
  );
}

export default App;
