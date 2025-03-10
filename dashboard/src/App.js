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
  KeyboardArrowUp as KeyboardArrowUpIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';

// Import components
import MetricCard from './components/MetricCard';
import MentionLineChart from './components/MentionLineChart';
import SentimentLineChart from './components/SentimentLineChart';
import PlatformBarChart from './components/PlatformBarChart';
import SentimentTable from './components/SentimentTable';
import SentimentData from './components/SentimentData';

// Import services
import DataService from './services/DataService';

// Create theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#3f51b5',
    },
    secondary: {
      main: '#f50057',
    },
    background: {
      default: '#f5f7fa',
    },
  },
  typography: {
    fontFamily: "'Roboto', 'Helvetica', 'Arial', sans-serif",
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
    <Paper 
      elevation={0} 
      sx={{ 
        p: 2, 
        mb: 3, 
        backgroundColor: 'transparent',
        borderRadius: '8px',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      <Box sx={{ 
        position: 'absolute', 
        left: 0, 
        top: 0, 
        bottom: 0, 
        width: '4px', 
        bgcolor: 'primary.main' 
      }} />
      <Typography variant="h5" gutterBottom>
        {title}
      </Typography>
    </Paper>
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
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const result = await DataService.loadData();
        setData(result);
        
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
            background: 'linear-gradient(135deg, #f5f7fa 0%, #e4e9f2 100%)'
          }}
        >
          <LoadingAnimation />
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <Typography variant="h5" sx={{ mt: 3, fontWeight: 'medium' }}>
              Loading Sentiment Analysis...
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
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '100vh',
            flexDirection: 'column',
            background: 'linear-gradient(135deg, #f5f7fa 0%, #ffe0e0 100%)'
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Typography variant="h4" color="error" gutterBottom>Error</Typography>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Typography variant="body1">{error}</Typography>
          </motion.div>
        </Box>
      </ThemeProvider>
    );
  }

  // Animation variants for staggered animations
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };
  
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.5 }
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ flexGrow: 1, background: 'linear-gradient(135deg, #f5f7fa 0%, #eef1f5 100%)' }}>
        <AppBar 
          position="fixed" 
          color="primary" 
          elevation={2}
          sx={{
            background: 'linear-gradient(90deg, #3f51b5 0%, #5c6bc0 100%)'
          }}
        >
          <Toolbar>
            <motion.div
              initial={{ rotate: -10, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <DashboardIcon sx={{ mr: 2, fontSize: 30 }} />
            </motion.div>
            <Typography 
              variant="h6" 
              component="div" 
              sx={{ 
                flexGrow: 1,
                fontWeight: 'bold',
                letterSpacing: '0.5px'
              }}
            >
              Sentiment Analysis Dashboard
            </Typography>
          </Toolbar>
        </AppBar>
        <Toolbar id="back-to-top-anchor" />
        
        <Container maxWidth="xl" sx={{ mt: 4, mb: 4, pt: 4 }}>
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Metrics Overview */}
            <motion.div variants={itemVariants}>
              <SectionHeader title="Overview" />
            </motion.div>
            
            <Grid container spacing={3}>
              {/* Key Metrics */}
              <Grid item xs={12} sm={6} md={3}>
                <motion.div variants={itemVariants}>
                  <MetricCard 
                    title="Total Mentions" 
                    value={data?.metrics?.totalMentions || 0} 
                    icon={<MessageIcon />} 
                    color="#3f51b5"
                  />
                </motion.div>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <motion.div variants={itemVariants}>
                  <MetricCard 
                    title="Positive Mentions" 
                    value={data?.metrics?.positiveMentions || 0} 
                    icon={<FavoriteIcon />} 
                    color="#4caf50"
                  />
                </motion.div>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <motion.div variants={itemVariants}>
                  <MetricCard 
                    title="Negative Mentions" 
                    value={data?.metrics?.negativeMentions || 0} 
                    icon={<ThumbDownIcon />} 
                    color="#f44336"
                  />
                </motion.div>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <motion.div variants={itemVariants}>
                  <MetricCard 
                    title="Presence Score" 
                    value={`${data?.metrics?.presenceScore || 0}%`} 
                    icon={<StackedLineChartIcon />} 
                    color="#ff9800"
                  />
                </motion.div>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <motion.div variants={itemVariants}>
                  <MetricCard 
                    title="Positive Sentiment" 
                    value={`${data?.metrics?.positivePercentage || 0}%`} 
                    color="#4caf50"
                  />
                </motion.div>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <motion.div variants={itemVariants}>
                  <MetricCard 
                    title="Neutral Sentiment" 
                    value={`${data?.metrics?.neutralPercentage || 0}%`} 
                    color="#2196f3"
                  />
                </motion.div>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <motion.div variants={itemVariants}>
                  <MetricCard 
                    title="Negative Sentiment" 
                    value={`${data?.metrics?.negativePercentage || 0}%`} 
                    color="#f44336"
                  />
                </motion.div>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <motion.div variants={itemVariants}>
                  <MetricCard 
                    title="Social Media Mentions" 
                    value={data?.metrics?.socialMediaMentions || 0} 
                    color="#9c27b0"
                  />
                </motion.div>
              </Grid>
              
              {/* Charts Section */}
              <Grid item xs={12}>
                <motion.div variants={itemVariants}>
                  <SectionHeader title="Trend Analysis" />
                </motion.div>
              </Grid>
              
              {/* Mentions Line Chart */}
              <Grid item xs={12} md={6}>
                <motion.div variants={itemVariants}>
                  <MentionLineChart mentionsByDate={data?.mentionsByDate || []} />
                </motion.div>
              </Grid>
              
              {/* Sentiment Line Chart */}
              <Grid item xs={12} md={6}>
                <motion.div variants={itemVariants}>
                  <SentimentLineChart sentimentByDate={data?.sentimentByDate || []} />
                </motion.div>
              </Grid>
              
              {/* Platform Bar Chart */}
              <Grid item xs={12}>
                <motion.div variants={itemVariants}>
                  <PlatformBarChart mentionsByPlatform={data?.mentionsByPlatform || []} />
                </motion.div>
              </Grid>
              
              {/* Top and Bottom Sentiment */}
              <Grid item xs={12}>
                <motion.div variants={itemVariants}>
                  <SectionHeader title="Sentiment Highlights" />
                </motion.div>
              </Grid>
              
              {/* Top 5 Sentiment */}
              <Grid item xs={12} md={6}>
                <motion.div variants={itemVariants}>
                  <SentimentTable 
                    topSentiment={data?.topSentiment || []} 
                    bottomSentiment={data?.bottomSentiment || []}
                    title="Highest Sentiment Posts"
                  />
                </motion.div>
              </Grid>
              
              {/* Bottom 5 Sentiment */}
              <Grid item xs={12} md={6}>
                <motion.div variants={itemVariants}>
                  <SentimentTable 
                    topSentiment={data?.topSentiment || []} 
                    bottomSentiment={data?.bottomSentiment || []}
                    title="Lowest Sentiment Posts"
                  />
                </motion.div>
              </Grid>
            </Grid>
            
            {/* Footer */}
            <motion.div 
              variants={itemVariants}
              style={{ marginTop: '32px' }}
            >
              <Box sx={{ pt: 4, pb: 2 }}>
                <Typography variant="body2" color="text.secondary" align="center">
                  Sentiment Analysis Dashboard © {new Date().getFullYear()}
                </Typography>
              </Box>
            </motion.div>
          </motion.div>
        </Container>
      </Box>
      
      {/* Scroll to top button */}
      <ScrollToTop>
        <Fab color="primary" size="small" aria-label="scroll back to top">
          <KeyboardArrowUpIcon />
        </Fab>
      </ScrollToTop>
    </ThemeProvider>
  );
}

export default App;
