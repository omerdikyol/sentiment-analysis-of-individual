import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  useTheme,
  Card,
  CardContent,
  Divider,
  Chip,
  CircularProgress,
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  LinearProgress,
  Alert,
  alpha,
  IconButton,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  TrendingFlat as TrendingFlatIcon,
  InsertChart as InsertChartIcon,
  Lightbulb as LightbulbIcon,
  ErrorOutline as ErrorOutlineIcon,
  ThumbUp as ThumbUpIcon,
  ThumbDown as ThumbDownIcon,
  Timeline as TimelineIcon,
  AutoAwesome as AutoAwesomeIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';

// Fallback colors in case theme is not available
const fallbackColors = {
  primary: {
    main: '#1976d2',
    light: '#42a5f5',
  },
  secondary: {
    main: '#9c27b0',
    light: '#ba68c8',
  },
  error: {
    main: '#d32f2f',
    light: '#ef5350',
  },
  warning: {
    main: '#ed6c02',
    light: '#ff9800',
  },
  info: {
    main: '#0288d1',
    light: '#03a9f4',
  },
  success: {
    main: '#2e7d32',
    light: '#4caf50',
  },
  grey: {
    200: '#eeeeee',
    500: '#9e9e9e',
  },
};

const AutoSummary = ({ data }) => {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [summaryData, setSummaryData] = useState({
    overallSummary: '',
    keyTrends: [],
    topPositiveThemes: [],
    topNegativeThemes: [],
    insightsAndRecommendations: [],
    recentChanges: []
  });
  const [refreshing, setRefreshing] = useState(false);

  // Helper function to safely get a color from theme or fallback
  const getColor = (path) => {
    try {
      // Split path like 'success.main' into parts
      const parts = path.split('.');
      let result = theme && theme.palette;
      
      // Navigate through the path
      for (const part of parts) {
        if (!result || !result[part]) {
          throw new Error('Path not found in theme');
        }
        result = result[part];
      }
      
      return result;
    } catch (error) {
      // If any part of the path doesn't exist, use fallback
      const parts = path.split('.');
      let fallback = fallbackColors;
      
      for (const part of parts) {
        fallback = fallback[part];
      }
      
      return fallback;
    }
  };

  useEffect(() => {
    if (!data?.rawData) return;
    setLoading(true);

    // Generate AI-like summaries from the data
    const generateSummaries = () => {
      const summaries = {
        overallSummary: '',
        keyTrends: [],
        topPositiveThemes: [],
        topNegativeThemes: [],
        insightsAndRecommendations: [],
        recentChanges: []
      };

      // Process data to extract insights
      if (data.rawData && data.rawData.length > 0) {
        // Count sentiment distribution
        const sentimentCounts = {
          positive: data.rawData.filter(item => parseFloat(item.sentiment_score) > 0.2).length,
          neutral: data.rawData.filter(item => parseFloat(item.sentiment_score) >= -0.2 && parseFloat(item.sentiment_score) <= 0.2).length,
          negative: data.rawData.filter(item => parseFloat(item.sentiment_score) < -0.2).length
        };
        
        const totalItems = data.rawData.length;
        const positivePercentage = (sentimentCounts.positive / totalItems * 100).toFixed(1);
        const negativePercentage = (sentimentCounts.negative / totalItems * 100).toFixed(1);
        const neutralPercentage = (sentimentCounts.neutral / totalItems * 100).toFixed(1);
        
        // Average sentiment
        const averageSentiment = data.rawData.reduce((sum, item) => sum + parseFloat(item.sentiment_score || 0), 0) / totalItems;
        
        // Generate overall summary
        let sentimentTrend;
        if (averageSentiment > 0.1) {
          sentimentTrend = "positive";
        } else if (averageSentiment < -0.1) {
          sentimentTrend = "negative";
        } else {
          sentimentTrend = "mixed";
        }
        
        summaries.overallSummary = `Analysis of ${totalItems} content items reveals an overall ${sentimentTrend} sentiment trend with an average score of ${averageSentiment.toFixed(2)}. The sentiment distribution shows ${positivePercentage}% positive, ${neutralPercentage}% neutral, and ${negativePercentage}% negative sentiment across all sources and platforms.`;
        
        // Extract common themes and topics using word frequency
        const wordFrequency = {};
        const excludedWords = new Set(['and', 'the', 'to', 'a', 'of', 'in', 'for', 'on', 'with', 'at', 'from', 'by', 'about', 'as', 'is', 'are', 'was', 'were', 'be', 'have', 'has', 'had', 'do', 'does', 'did', 'that', 'this', 'these', 'those', 'it', 'they', 'them', 'their', 'not', 'but', 'or', 'if', 'because', 'while', 'when', 'where', 'who', 'what', 'why', 'how']);
        
        data.rawData.forEach(item => {
          if (!item.text) return;
          
          const words = item.text.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').split(' ');
          const sentiment = parseFloat(item.sentiment_score);
          
          words.forEach(word => {
            if (word.length < 3 || excludedWords.has(word)) return;
            
            if (!wordFrequency[word]) {
              wordFrequency[word] = {
                count: 0,
                positiveCount: 0,
                negativeCount: 0,
                neutralCount: 0,
                totalSentiment: 0
              };
            }
            
            wordFrequency[word].count += 1;
            wordFrequency[word].totalSentiment += sentiment;
            
            if (sentiment > 0.2) {
              wordFrequency[word].positiveCount += 1;
            } else if (sentiment < -0.2) {
              wordFrequency[word].negativeCount += 1;
            } else {
              wordFrequency[word].neutralCount += 1;
            }
          });
        });
        
        // Calculate average sentiment for each word
        Object.keys(wordFrequency).forEach(word => {
          wordFrequency[word].averageSentiment = wordFrequency[word].totalSentiment / wordFrequency[word].count;
        });
        
        // Extract top themes by word frequency
        const topWords = Object.entries(wordFrequency)
          .filter(([_, stats]) => stats.count >= 5) // Only words that appear at least 5 times
          .sort((a, b) => b[1].count - a[1].count)
          .slice(0, 30);
        
        // Extract positive themes
        const positiveThemes = Object.entries(wordFrequency)
          .filter(([_, stats]) => stats.count >= 3 && stats.averageSentiment > 0.3)
          .sort((a, b) => b[1].averageSentiment - a[1].averageSentiment)
          .slice(0, 10);
        
        // Extract negative themes
        const negativeThemes = Object.entries(wordFrequency)
          .filter(([_, stats]) => stats.count >= 3 && stats.averageSentiment < -0.3)
          .sort((a, b) => a[1].averageSentiment - b[1].averageSentiment)
          .slice(0, 10);
        
        // Group by date to analyze trends
        const dateGroups = {};
        data.rawData.forEach(item => {
          if (!item.date) return;
          
          const dateString = typeof item.date === 'string' 
            ? item.date.split(' ')[0] // Extract date part if it includes time
            : new Date(item.date).toISOString().split('T')[0];
          
          if (!dateGroups[dateString]) {
            dateGroups[dateString] = {
              count: 0,
              sentimentSum: 0,
              items: []
            };
          }
          
          dateGroups[dateString].count += 1;
          dateGroups[dateString].sentimentSum += parseFloat(item.sentiment_score || 0);
          dateGroups[dateString].items.push(item);
        });
        
        // Calculate average sentiment per day
        const dailySentiment = Object.entries(dateGroups).map(([date, stats]) => ({
          date,
          count: stats.count,
          averageSentiment: stats.sentimentSum / stats.count,
          items: stats.items
        })).sort((a, b) => new Date(a.date) - new Date(b.date));
        
        // Detect recent sentiment changes
        if (dailySentiment.length >= 2) {
          const lastIndex = dailySentiment.length - 1;
          const lastDay = dailySentiment[lastIndex];
          const previousDay = dailySentiment[lastIndex - 1];
          
          if (lastDay && previousDay) {
            const sentimentChange = lastDay.averageSentiment - previousDay.averageSentiment;
            const changeDescription = Math.abs(sentimentChange) < 0.1 
              ? "remains stable" 
              : sentimentChange > 0 
                ? "has improved" 
                : "has declined";
            
            summaries.recentChanges.push({
              title: `Recent Sentiment ${changeDescription.charAt(0).toUpperCase() + changeDescription.slice(1)}`,
              description: `Sentiment ${changeDescription} by ${Math.abs(sentimentChange).toFixed(2)} points compared to the previous period.`,
              trend: sentimentChange > 0.1 ? "up" : sentimentChange < -0.1 ? "down" : "flat"
            });
          }
        }
        
        // Identify sentiment by platform
        const platformSentiment = {};
        data.rawData.forEach(item => {
          if (!item.platform) return;
          
          if (!platformSentiment[item.platform]) {
            platformSentiment[item.platform] = {
              count: 0,
              sentimentSum: 0
            };
          }
          
          platformSentiment[item.platform].count += 1;
          platformSentiment[item.platform].sentimentSum += parseFloat(item.sentiment_score || 0);
        });
        
        // Calculate average sentiment per platform
        Object.keys(platformSentiment).forEach(platform => {
          platformSentiment[platform].averageSentiment = 
            platformSentiment[platform].sentimentSum / platformSentiment[platform].count;
        });
        
        // Find platform with highest and lowest sentiment
        const platforms = Object.entries(platformSentiment)
          .filter(([_, stats]) => stats.count >= 3)
          .map(([platform, stats]) => ({
            platform,
            averageSentiment: stats.averageSentiment,
            count: stats.count
          }));
        
        if (platforms.length > 0) {
          const bestPlatform = platforms.reduce((best, current) => 
            current.averageSentiment > best.averageSentiment ? current : best, platforms[0]);
          
          const worstPlatform = platforms.reduce((worst, current) => 
            current.averageSentiment < worst.averageSentiment ? current : worst, platforms[0]);
          
          if (bestPlatform.averageSentiment > 0.1) {
            summaries.keyTrends.push({
              title: `${bestPlatform.platform} Shows Most Positive Sentiment`,
              description: `Content on ${bestPlatform.platform} demonstrates the highest average sentiment (${bestPlatform.averageSentiment.toFixed(2)}) across all platforms analyzed.`,
              trend: "up"
            });
          }
          
          if (worstPlatform.averageSentiment < -0.1) {
            summaries.keyTrends.push({
              title: `${worstPlatform.platform} Shows Most Negative Sentiment`,
              description: `Content on ${worstPlatform.platform} demonstrates the lowest average sentiment (${worstPlatform.averageSentiment.toFixed(2)}) across all platforms analyzed.`,
              trend: "down"
            });
          }
        }
        
        // Generate key trends from top themes
        topWords.slice(0, 5).forEach(([word, stats]) => {
          const sentimentDescription = stats.averageSentiment > 0.2 
            ? "positive" 
            : stats.averageSentiment < -0.2 
              ? "negative" 
              : "neutral";
          
          summaries.keyTrends.push({
            title: `High Frequency of "${word.charAt(0).toUpperCase() + word.slice(1)}" Mentions`,
            description: `The term "${word}" appears ${stats.count} times with predominantly ${sentimentDescription} sentiment (${stats.averageSentiment.toFixed(2)}).`,
            trend: stats.averageSentiment > 0.2 
              ? "up" 
              : stats.averageSentiment < -0.2 
                ? "down" 
                : "flat"
          });
        });
        
        // Generate positive themes
        positiveThemes.forEach(([word, stats]) => {
          summaries.topPositiveThemes.push({
            term: word,
            sentimentScore: stats.averageSentiment.toFixed(2),
            frequency: stats.count,
            description: `The term "${word}" is associated with positive sentiment in ${stats.positiveCount} out of ${stats.count} mentions.`
          });
        });
        
        // Generate negative themes
        negativeThemes.forEach(([word, stats]) => {
          summaries.topNegativeThemes.push({
            term: word,
            sentimentScore: stats.averageSentiment.toFixed(2),
            frequency: stats.count,
            description: `The term "${word}" is associated with negative sentiment in ${stats.negativeCount} out of ${stats.count} mentions.`
          });
        });
        
        // Generate insights and recommendations
        const generateInsight = (type, title, description) => ({
          type,
          title,
          description
        });
        
        // Add general insights based on the data
        if (positivePercentage > 60) {
          summaries.insightsAndRecommendations.push(
            generateInsight(
              "strength",
              "Strong Positive Sentiment Overall",
              "The high percentage of positive content (${positivePercentage}%) indicates a favorable perception. Capitalize on this positive momentum in future communications."
            )
          );
        } else if (negativePercentage > 40) {
          summaries.insightsAndRecommendations.push(
            generateInsight(
              "concern",
              "Significant Negative Sentiment Detected",
              `The elevated negative sentiment (${negativePercentage}%) suggests areas for improvement. Address the negative themes identified in this analysis.`
            )
          );
        }
        
        // Add platform-specific insights
        if (platforms.length > 1) {
          const platformDifference = platforms.reduce((max, current) => {
            const diffScore = platforms.reduce((diff, other) => {
              if (current.platform === other.platform) return diff;
              return Math.max(diff, Math.abs(current.averageSentiment - other.averageSentiment));
            }, 0);
            
            return diffScore > max.diffScore ? { platform: current.platform, diffScore } : max;
          }, { platform: null, diffScore: 0 });
          
          if (platformDifference.diffScore > 0.3) {
            summaries.insightsAndRecommendations.push(
              generateInsight(
                "opportunity",
                "Platform Sentiment Discrepancy",
                `There's a significant difference in sentiment across platforms, with ${platformDifference.platform} showing the largest variance. Consider platform-specific content strategies to address these differences.`
              )
            );
          }
        }
        
        // Add top positive/negative theme insights
        if (positiveThemes.length > 0) {
          const topPositive = positiveThemes[0];
          summaries.insightsAndRecommendations.push(
            generateInsight(
              "strength",
              `Strong Association with "${topPositive[0]}"`,
              `The term "${topPositive[0]}" consistently generates positive sentiment (${topPositive[1].averageSentiment.toFixed(2)}). Consider emphasizing this theme in future communications.`
            )
          );
        }
        
        if (negativeThemes.length > 0) {
          const topNegative = negativeThemes[0];
          summaries.insightsAndRecommendations.push(
            generateInsight(
              "concern",
              `Negative Association with "${topNegative[0]}"`,
              `The term "${topNegative[0]}" consistently generates negative sentiment (${topNegative[1].averageSentiment.toFixed(2)}). Consider addressing concerns related to this theme.`
            )
          );
        }
        
        // Add time-based insights
        if (dailySentiment.length > 3) {
          const recentDays = dailySentiment.slice(-3);
          const recentTrend = recentDays[recentDays.length - 1].averageSentiment - recentDays[0].averageSentiment;
          
          if (Math.abs(recentTrend) > 0.15) {
            summaries.insightsAndRecommendations.push(
              generateInsight(
                recentTrend > 0 ? "opportunity" : "concern",
                `${recentTrend > 0 ? "Improving" : "Declining"} Sentiment Trend`,
                `Recent data shows a ${recentTrend > 0 ? "positive" : "negative"} sentiment trend over the last few days. ${
                  recentTrend > 0 
                  ? "Identify the successful elements contributing to this improvement for future strategies." 
                  : "Consider immediate corrective actions to address this decline."
                }`
              )
            );
          } else {
            summaries.insightsAndRecommendations.push(
              generateInsight(
                "insight",
                "Stable Sentiment Trend",
                "Sentiment has remained relatively stable over the recent period. This stability provides a solid foundation for consistent messaging."
              )
            );
          }
        }
      }
      
      return summaries;
    };

    // Simulate AI processing time
    setTimeout(() => {
      const summaries = generateSummaries();
      setSummaryData(summaries);
      setLoading(false);
    }, 1000);
  }, [data]);

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1500);
  };

  const renderTrendIcon = (trend) => {
    if (trend === "up") {
      return <TrendingUpIcon sx={{ color: getColor('success.main') }} />;
    } else if (trend === "down") {
      return <TrendingDownIcon sx={{ color: getColor('error.main') }} />;
    } else {
      return <TrendingFlatIcon sx={{ color: getColor('grey.500') }} />;
    }
  };

  const renderInsightIcon = (type) => {
    switch (type) {
      case "strength":
        return <ThumbUpIcon sx={{ color: getColor('success.main') }} />;
      case "concern":
        return <ThumbDownIcon sx={{ color: getColor('error.main') }} />;
      case "opportunity":
        return <LightbulbIcon sx={{ color: getColor('warning.main') }} />;
      case "insight":
        return <InsertChartIcon sx={{ color: getColor('info.main') }} />;
      default:
        return <ErrorOutlineIcon sx={{ color: getColor('grey.500') }} />;
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>Generating AI Summary...</Typography>
        <Box sx={{ width: '100%', mt: 4 }}>
          <LinearProgress />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Analyzing {data?.rawData?.length || 0} data points for insights
          </Typography>
        </Box>
      </Box>
    );
  }

  // Helper function for alpha color with fallback
  const getAlphaColor = (colorPath, alphaValue) => {
    const color = getColor(colorPath);
    // If alpha function is available and theme exists, use it, otherwise do simple opacity
    if (theme && theme.palette && alpha) {
      return alpha(color, alphaValue);
    }
    return color;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <AutoAwesomeIcon sx={{ mr: 1, color: getColor('primary.main') }} />
            <Typography variant="h6">AI-Generated Sentiment Summary</Typography>
          </Box>
          <IconButton onClick={handleRefresh} size="small" disabled={refreshing}>
            {refreshing ? <CircularProgress size={20} /> : <RefreshIcon />}
          </IconButton>
        </Box>

        <Grid container spacing={3}>
          {/* Overall Summary */}
          <Grid item xs={12}>
            <Card sx={{ backgroundColor: getAlphaColor('primary.light', 0.05) }}>
              <CardContent>
                <Typography variant="body1" paragraph>
                  {summaryData.overallSummary}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Key Trends */}
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" gutterBottom>
              <TimelineIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
              Key Trends
            </Typography>
            <List>
              {summaryData.keyTrends.map((trend, index) => (
                <ListItem 
                  key={index}
                  sx={{ 
                    mb: 1,
                    backgroundColor: getAlphaColor(
                      trend.trend === 'up' 
                        ? 'success.light' 
                        : trend.trend === 'down' 
                          ? 'error.light' 
                          : 'grey.200',
                      0.1
                    ),
                    borderRadius: 1
                  }}
                >
                  <ListItemIcon>
                    {renderTrendIcon(trend.trend)}
                  </ListItemIcon>
                  <ListItemText 
                    primary={trend.title}
                    secondary={trend.description}
                    primaryTypographyProps={{ fontWeight: 500 }}
                  />
                </ListItem>
              ))}
            </List>
          </Grid>

          {/* Insights and Recommendations */}
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" gutterBottom>
              <LightbulbIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
              Insights & Recommendations
            </Typography>
            <List>
              {summaryData.insightsAndRecommendations.map((insight, index) => (
                <ListItem 
                  key={index}
                  sx={{ 
                    mb: 1,
                    backgroundColor: getAlphaColor(
                      insight.type === 'strength' 
                        ? 'success.light' 
                        : insight.type === 'concern' 
                          ? 'error.light' 
                          : insight.type === 'opportunity'
                            ? 'warning.light'
                            : 'info.light',
                      0.1
                    ),
                    borderRadius: 1
                  }}
                >
                  <ListItemIcon>
                    {renderInsightIcon(insight.type)}
                  </ListItemIcon>
                  <ListItemText 
                    primary={insight.title}
                    secondary={insight.description}
                    primaryTypographyProps={{ fontWeight: 500 }}
                  />
                </ListItem>
              ))}
            </List>
          </Grid>

          {/* Positive Themes */}
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              <ThumbUpIcon sx={{ mr: 1, color: getColor('success.main') }} />
              Top Positive Themes
            </Typography>
            <Grid container spacing={1}>
              {summaryData.topPositiveThemes.slice(0, 6).map((theme, index) => (
                <Grid item xs={12} sm={6} key={index}>
                  <Card sx={{ backgroundColor: getAlphaColor('success.light', 0.05 + (0.1 * (1 - index/6))) }}>
                    <CardContent sx={{ py: 1.5, px: 2, '&:last-child': { pb: 1.5 } }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="subtitle2" fontWeight={600}>
                          {theme.term}
                        </Typography>
                        <Chip 
                          size="small" 
                          label={theme.sentimentScore} 
                          sx={{ 
                            backgroundColor: getColor('success.main'),
                            color: 'white',
                            fontSize: '0.7rem',
                            height: 20
                          }}
                        />
                      </Box>
                      <Typography variant="caption" color="text.secondary">
                        {theme.description}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Grid>

          {/* Negative Themes */}
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              <ThumbDownIcon sx={{ mr: 1, color: getColor('error.main') }} />
              Top Negative Themes
            </Typography>
            <Grid container spacing={1}>
              {summaryData.topNegativeThemes.slice(0, 6).map((theme, index) => (
                <Grid item xs={12} sm={6} key={index}>
                  <Card sx={{ backgroundColor: getAlphaColor('error.light', 0.05 + (0.1 * (1 - index/6))) }}>
                    <CardContent sx={{ py: 1.5, px: 2, '&:last-child': { pb: 1.5 } }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="subtitle2" fontWeight={600}>
                          {theme.term}
                        </Typography>
                        <Chip 
                          size="small" 
                          label={theme.sentimentScore} 
                          sx={{ 
                            backgroundColor: getColor('error.main'),
                            color: 'white',
                            fontSize: '0.7rem',
                            height: 20
                          }}
                        />
                      </Box>
                      <Typography variant="caption" color="text.secondary">
                        {theme.description}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Grid>

          {/* Recent Changes */}
          {summaryData.recentChanges.length > 0 && (
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle1" gutterBottom>
                Recent Changes
              </Typography>
              <Grid container spacing={2}>
                {summaryData.recentChanges.map((change, index) => (
                  <Grid item xs={12} md={4} key={index}>
                    <Alert 
                      severity={
                        change.trend === 'up' ? 'success' : 
                        change.trend === 'down' ? 'error' : 
                        'info'
                      }
                      icon={renderTrendIcon(change.trend)}
                      sx={{ '& .MuiAlert-message': { width: '100%' } }}
                    >
                      <Typography variant="subtitle2">{change.title}</Typography>
                      <Typography variant="body2">{change.description}</Typography>
                    </Alert>
                  </Grid>
                ))}
              </Grid>
            </Grid>
          )}
        </Grid>
      </Paper>
    </motion.div>
  );
};

export default AutoSummary; 