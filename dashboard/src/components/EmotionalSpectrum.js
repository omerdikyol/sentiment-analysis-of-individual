import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  useTheme,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  alpha,
  Divider,
  Tooltip,
  IconButton,
} from '@mui/material';
import {
  Info as InfoIcon,
  Timeline as TimelineIcon,
  Psychology as PsychologyIcon,
  TextFields as TextFieldsIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
  Tooltip as RechartsTooltip,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Bar,
  LineChart,
  Line,
} from 'recharts';

const EmotionalSpectrum = ({ data }) => {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [emotionData, setEmotionData] = useState({
    emotions: {},
    emotionFrequency: [],
    emotionIntensity: [],
    emotionTimeline: [],
    emotionalPlatforms: [],
    emotionalContent: []
  });
  const [timeRange, setTimeRange] = useState('all');
  const [platform, setPlatform] = useState('all');
  const [focusedEmotion, setFocusedEmotion] = useState(null);

  // Define the full emotional spectrum
  const emotionalCategories = {
    joy: ['happy', 'delighted', 'excited', 'pleased', 'proud', 'elated', 'grateful', 'satisfied', 'cheerful', 'wonderful', 'fantastic', 'amazing', 'love', 'enjoy', 'celebrate', 'success', 'win', 'victory', 'congratulations', 'thank', 'appreciation', 'positive', 'good', 'great', 'excellent', 'best'],
    
    sadness: ['sad', 'unhappy', 'miserable', 'depressed', 'heartbroken', 'disappointed', 'upset', 'devastated', 'grief', 'sorry', 'regret', 'tragic', 'despair', 'lonely', 'hopeless', 'crying', 'tears', 'mourning', 'loss', 'miss', 'failed', 'failure', 'unfortunate', 'poor', 'worse', 'worst'],
    
    fear: ['afraid', 'scared', 'frightened', 'terrified', 'anxious', 'nervous', 'worried', 'panic', 'concern', 'alarm', 'dread', 'horror', 'shock', 'threat', 'danger', 'risk', 'caution', 'warning', 'careful', 'desperate', 'uncertainty', 'doubt', 'suspicious', 'scary'],
    
    anger: ['angry', 'mad', 'furious', 'outraged', 'irritated', 'annoyed', 'frustrated', 'hostile', 'bitter', 'hatred', 'disgusted', 'insulted', 'offended', 'oppose', 'against', 'fight', 'condemn', 'blame', 'attack', 'violent', 'aggressive', 'hate', 'complaint', 'protest', 'dispute'],
    
    surprise: ['surprised', 'astonished', 'amazed', 'shocked', 'stunned', 'unexpected', 'remarkable', 'extraordinary', 'unbelievable', 'incredible', 'startled', 'wonder', 'curious', 'sudden', 'discovery', 'reveal', 'unpredictable', 'disbelief', 'bewildered', 'unusual', 'never', 'rare'],
    
    anticipation: ['expect', 'anticipate', 'await', 'forward', 'hope', 'predict', 'prospect', 'potential', 'promising', 'upcoming', 'future', 'soon', 'plan', 'prepare', 'developing', 'emerging', 'progressing', 'growing', 'improving', 'advancing', 'evolving', 'opportunity', 'possibility', 'chance'],
    
    trust: ['trust', 'believe', 'confidence', 'faith', 'reliable', 'honest', 'authentic', 'genuine', 'loyal', 'secure', 'safe', 'sure', 'protect', 'support', 'assure', 'commitment', 'dedicated', 'devoted', 'responsible', 'accountable', 'ethical', 'integrity', 'respect', 'honor'],
    
    disgust: ['disgusted', 'repulsed', 'revolted', 'sickened', 'nausea', 'unpleasant', 'offensive', 'distasteful', 'gross', 'awful', 'terrible', 'horrible', 'reject', 'refuse', 'deny', 'avoid', 'inappropriate', 'unacceptable', 'disrespectful', 'shameful', 'embarrassing', 'scandal', 'corrupt', 'abusive']
  };

  // Emotion colors
  const emotionColors = {
    joy: theme.palette.success.main,
    sadness: theme.palette.info.main,
    fear: theme.palette.warning.main,
    anger: theme.palette.error.main,
    surprise: theme.palette.purple?.main || '#9c27b0',
    anticipation: theme.palette.info.light,
    trust: theme.palette.primary.main,
    disgust: theme.palette.error.dark
  };

  useEffect(() => {
    if (!data?.rawData) return;
    setLoading(true);

    // Process data to extract emotional spectrum
    const analyzeEmotionalSpectrum = () => {
      const emotions = {};
      const emotionTimeline = {};
      const platformEmotions = {};
      const contentWithHighEmotions = [];
      
      // Initialize emotion data structure
      Object.keys(emotionalCategories).forEach(emotion => {
        emotions[emotion] = {
          count: 0,
          totalIntensity: 0,
          averageIntensity: 0
        };
      });

      // Process each document
      data.rawData.forEach(item => {
        if (!item.text) return;
        
        const text = item.text.toLowerCase();
        const date = new Date(item.date);
        const dateStr = date.toISOString().split('T')[0];
        const platform = item.platform || 'Unknown';
        const source = item.source || 'Unknown';
        
        // Detect emotions in text
        const documentEmotions = {};
        let totalEmotionScore = 0;
        
        Object.entries(emotionalCategories).forEach(([emotion, keywords]) => {
          const emotionScore = keywords.reduce((score, keyword) => {
            // Check for exact keyword match
            const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
            const matches = text.match(regex);
            if (matches) {
              return score + matches.length;
            }
            return score;
          }, 0);
          
          if (emotionScore > 0) {
            documentEmotions[emotion] = emotionScore;
            emotions[emotion].count += 1;
            emotions[emotion].totalIntensity += emotionScore;
            totalEmotionScore += emotionScore;
            
            // Track emotions over time
            if (!emotionTimeline[dateStr]) {
              emotionTimeline[dateStr] = {
                date: dateStr,
                dateObj: date
              };
              
              Object.keys(emotionalCategories).forEach(emotionType => {
                emotionTimeline[dateStr][emotionType] = 0;
              });
            }
            
            emotionTimeline[dateStr][emotion] += emotionScore;
            
            // Track emotions by platform
            if (!platformEmotions[platform]) {
              platformEmotions[platform] = {
                platform,
                total: 0
              };
              
              Object.keys(emotionalCategories).forEach(emotionType => {
                platformEmotions[platform][emotionType] = 0;
              });
            }
            
            platformEmotions[platform][emotion] += emotionScore;
            platformEmotions[platform].total += emotionScore;
          }
        });
        
        // Store content with significant emotional content
        if (totalEmotionScore > 3) {
          const dominantEmotion = Object.entries(documentEmotions)
            .sort((a, b) => b[1] - a[1])[0];
          
          if (dominantEmotion) {
            contentWithHighEmotions.push({
              text: item.text,
              date: item.date,
              platform,
              source,
              dominantEmotion: dominantEmotion[0],
              emotionScore: dominantEmotion[1],
              sentiment: parseFloat(item.sentiment_score)
            });
          }
        }
      });
      
      // Calculate average intensity for each emotion
      Object.keys(emotions).forEach(emotion => {
        emotions[emotion].averageIntensity = 
          emotions[emotion].count > 0 
            ? emotions[emotion].totalIntensity / emotions[emotion].count 
            : 0;
      });
      
      // Prepare emotion frequency data for charts
      const emotionFrequency = Object.entries(emotions).map(([emotion, data]) => ({
        name: emotion.charAt(0).toUpperCase() + emotion.slice(1),
        value: data.count,
        intensity: data.averageIntensity
      })).sort((a, b) => b.value - a.value);
      
      // Prepare emotion intensity data for radar chart
      const emotionIntensity = Object.entries(emotions).map(([emotion, data]) => ({
        emotion: emotion.charAt(0).toUpperCase() + emotion.slice(1),
        intensity: data.averageIntensity,
        frequency: data.count
      }));
      
      // Process timeline data
      const timelineData = Object.values(emotionTimeline)
        .sort((a, b) => new Date(a.date) - new Date(b.date));
      
      // Process platform data
      const platformData = Object.values(platformEmotions)
        .filter(platform => platform.total > 0)
        .sort((a, b) => b.total - a.total);
      
      // Sort content by emotion score
      const sortedContent = contentWithHighEmotions
        .sort((a, b) => b.emotionScore - a.emotionScore)
        .slice(0, 50); // Limit to top 50 emotional content
      
      return {
        emotions,
        emotionFrequency,
        emotionIntensity,
        emotionTimeline: timelineData,
        emotionalPlatforms: platformData,
        emotionalContent: sortedContent
      };
    };

    const spectrum = analyzeEmotionalSpectrum();
    setEmotionData(spectrum);
    setLoading(false);
  }, [data]);

  // Filter data based on time range
  const filteredTimelineData = React.useMemo(() => {
    if (!emotionData.emotionTimeline || emotionData.emotionTimeline.length === 0) return [];
    
    if (timeRange === 'all') return emotionData.emotionTimeline;
    
    const now = new Date();
    let cutoffDate;
    
    switch (timeRange) {
      case 'week':
        cutoffDate = new Date(now);
        cutoffDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        cutoffDate = new Date(now);
        cutoffDate.setMonth(now.getMonth() - 1);
        break;
      case 'quarter':
        cutoffDate = new Date(now);
        cutoffDate.setMonth(now.getMonth() - 3);
        break;
      default:
        return emotionData.emotionTimeline;
    }
    
    return emotionData.emotionTimeline.filter(item => new Date(item.date) >= cutoffDate);
  }, [emotionData.emotionTimeline, timeRange]);

  // Filter platform data
  const filteredPlatformData = React.useMemo(() => {
    if (!emotionData.emotionalPlatforms || emotionData.emotionalPlatforms.length === 0) return [];
    
    if (platform === 'all') return emotionData.emotionalPlatforms;
    
    return emotionData.emotionalPlatforms.filter(item => item.platform === platform);
  }, [emotionData.emotionalPlatforms, platform]);

  // Get available platforms
  const availablePlatforms = React.useMemo(() => {
    if (!emotionData.emotionalPlatforms) return [];
    
    return emotionData.emotionalPlatforms.map(item => item.platform);
  }, [emotionData.emotionalPlatforms]);

  // Filter content by emotion
  const filteredContent = React.useMemo(() => {
    if (!emotionData.emotionalContent) return [];
    
    if (!focusedEmotion) return emotionData.emotionalContent.slice(0, 5);
    
    return emotionData.emotionalContent
      .filter(item => item.dominantEmotion === focusedEmotion)
      .slice(0, 5);
  }, [emotionData.emotionalContent, focusedEmotion]);

  // Create timeline data for specific emotion or all emotions
  const emotionTimelineData = React.useMemo(() => {
    if (filteredTimelineData.length === 0) return [];
    
    if (focusedEmotion) {
      return filteredTimelineData.map(day => ({
        date: day.date,
        [focusedEmotion]: day[focusedEmotion] || 0
      }));
    }
    
    return filteredTimelineData;
  }, [filteredTimelineData, focusedEmotion]);

  // Set focused emotion when clicking on a pie slice
  const handleEmotionClick = (data) => {
    if (data && data.name) {
      const emotion = data.name.toLowerCase();
      setFocusedEmotion(focusedEmotion === emotion ? null : emotion);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <Card sx={{ p: 1, border: `1px solid ${theme.palette.divider}` }}>
          <Typography variant="subtitle2">{label || payload[0].name}</Typography>
          {payload.map((entry, index) => (
            <Typography key={index} variant="body2" style={{ color: entry.color }}>
              {entry.name}: {entry.value}
            </Typography>
          ))}
        </Card>
      );
    }
    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <PsychologyIcon sx={{ mr: 1, color: theme.palette.secondary.main }} />
            <Typography variant="h6">Emotional Spectrum Analysis</Typography>
            <Tooltip title="This analysis identifies specific emotions beyond just positive/negative sentiment, such as joy, sadness, fear, anger, surprise, anticipation, trust, and disgust">
              <IconButton size="small">
                <InfoIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <FormControl variant="outlined" size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Time Range</InputLabel>
              <Select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                label="Time Range"
              >
                <MenuItem value="all">All Time</MenuItem>
                <MenuItem value="week">Past Week</MenuItem>
                <MenuItem value="month">Past Month</MenuItem>
                <MenuItem value="quarter">Past Quarter</MenuItem>
              </Select>
            </FormControl>
            <FormControl variant="outlined" size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Platform</InputLabel>
              <Select
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                label="Platform"
              >
                <MenuItem value="all">All Platforms</MenuItem>
                {availablePlatforms.map(p => (
                  <MenuItem key={p} value={p}>{p}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </Box>

        <Grid container spacing={3}>
          {/* Emotion Distribution Pie Chart */}
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" gutterBottom>
              Emotion Distribution
            </Typography>
            <Box sx={{ height: 350 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={emotionData.emotionFrequency}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={120}
                    onClick={handleEmotionClick}
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {emotionData.emotionFrequency.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={emotionColors[entry.name.toLowerCase()]} 
                        stroke={focusedEmotion === entry.name.toLowerCase() ? theme.palette.common.white : 'none'}
                        strokeWidth={focusedEmotion === entry.name.toLowerCase() ? 2 : 0}
                      />
                    ))}
                  </Pie>
                  <RechartsTooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          </Grid>

          {/* Emotion Intensity Radar Chart */}
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" gutterBottom>
              Emotion Intensity
            </Typography>
            <Box sx={{ height: 350 }}>
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart outerRadius={120} data={emotionData.emotionIntensity}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="emotion" />
                  <PolarRadiusAxis />
                  <Radar
                    name="Intensity"
                    dataKey="intensity"
                    stroke={theme.palette.primary.main}
                    fill={theme.palette.primary.main}
                    fillOpacity={0.5}
                  />
                  <RechartsTooltip content={<CustomTooltip />} />
                </RadarChart>
              </ResponsiveContainer>
            </Box>
          </Grid>

          {/* Emotion Timeline */}
          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              <TimelineIcon sx={{ mr: 1 }} />
              Emotion Over Time
              {focusedEmotion && (
                <Chip 
                  label={focusedEmotion.charAt(0).toUpperCase() + focusedEmotion.slice(1)} 
                  size="small" 
                  sx={{ ml: 2, backgroundColor: emotionColors[focusedEmotion], color: '#fff' }}
                  onDelete={() => setFocusedEmotion(null)}
                />
              )}
            </Typography>
            <Box sx={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={emotionTimelineData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(value) => {
                      const date = new Date(value);
                      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                    }}
                  />
                  <YAxis />
                  <RechartsTooltip content={<CustomTooltip />} />
                  <Legend />
                  {focusedEmotion ? (
                    <Line
                      type="monotone"
                      dataKey={focusedEmotion}
                      stroke={emotionColors[focusedEmotion]}
                      activeDot={{ r: 8 }}
                      strokeWidth={2}
                    />
                  ) : (
                    Object.keys(emotionalCategories).map((emotion) => (
                      <Line
                        key={emotion}
                        type="monotone"
                        dataKey={emotion}
                        stroke={emotionColors[emotion]}
                        strokeWidth={1.5}
                      />
                    ))
                  )}
                </LineChart>
              </ResponsiveContainer>
            </Box>
          </Grid>

          {/* Emotion By Platform */}
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" gutterBottom>
              Emotional Expression by Platform
            </Typography>
            <Box sx={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={filteredPlatformData}
                  layout="vertical"
                  margin={{ top: 20, right: 30, left: 80, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="platform" type="category" width={80} />
                  <RechartsTooltip content={<CustomTooltip />} />
                  <Legend />
                  {(focusedEmotion ? [focusedEmotion] : Object.keys(emotionalCategories)).map((emotion) => (
                    <Bar 
                      key={emotion} 
                      dataKey={emotion} 
                      stackId="a" 
                      fill={emotionColors[emotion]} 
                      name={emotion.charAt(0).toUpperCase() + emotion.slice(1)}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Grid>

          {/* Top Emotional Content */}
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              <TextFieldsIcon sx={{ mr: 1 }} />
              Top {focusedEmotion ? `${focusedEmotion.charAt(0).toUpperCase() + focusedEmotion.slice(1)}` : 'Emotional'} Content
            </Typography>
            <Box sx={{ height: 300, overflowY: 'auto' }}>
              {filteredContent.map((item, index) => (
                <Card key={index} sx={{ mb: 2, backgroundColor: alpha(emotionColors[item.dominantEmotion], 0.1) }}>
                  <CardContent sx={{ py: 1.5, px: 2, '&:last-child': { pb: 1.5 } }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Chip 
                          label={item.dominantEmotion.charAt(0).toUpperCase() + item.dominantEmotion.slice(1)} 
                          size="small" 
                          sx={{ 
                            mr: 1, 
                            backgroundColor: emotionColors[item.dominantEmotion], 
                            color: '#fff',
                            fontWeight: 'bold'
                          }} 
                        />
                        <Typography variant="caption" color="text.secondary">
                          {item.platform} - {new Date(item.date).toLocaleDateString()}
                        </Typography>
                      </Box>
                      <Chip 
                        label={`Score: ${item.emotionScore.toFixed(1)}`} 
                        size="small" 
                        variant="outlined"
                        sx={{ bgcolor: 'background.paper' }}
                      />
                    </Box>
                    <Typography variant="body2" sx={{ 
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}>
                      {item.text}
                    </Typography>
                  </CardContent>
                </Card>
              ))}
              {filteredContent.length === 0 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                  <Typography color="text.secondary">
                    No content found with {focusedEmotion ? `${focusedEmotion} emotion` : 'significant emotions'}
                  </Typography>
                </Box>
              )}
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </motion.div>
  );
};

export default EmotionalSpectrum; 