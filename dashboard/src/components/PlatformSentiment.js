import React from 'react';
import {
  Box,
  Typography,
  Grid,
  useTheme,
  Card,
  CardContent,
  LinearProgress,
  Stack,
  Divider,
  Tooltip,
} from '@mui/material';
import {
  Twitter as TwitterIcon,
  Facebook as FacebookIcon,
  LinkedIn as LinkedInIcon,
  Tv as TvIcon,
  Article as NewsIcon,
  Instagram as InstagramIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { alpha } from '@mui/material/styles';

const PlatformSentiment = ({ data }) => {
  const theme = useTheme();

  const getPlatformIcon = (platform) => {
    const platformLower = platform.toLowerCase();
    switch (platformLower) {
      case 'twitter':
      case 'x':
        return <TwitterIcon />;
      case 'facebook':
        return <FacebookIcon />;
      case 'linkedin':
        return <LinkedInIcon />;
      case 'instagram':
        return <InstagramIcon />;
      default:
        return platformLower.includes('tv') ? <TvIcon /> : <NewsIcon />;
    }
  };

  // Process raw data to get platform statistics
  const processPlatformStats = (rawData) => {
    if (!rawData || !Array.isArray(rawData)) return [];

    // List of sources to exclude
    const excludedSources = new Set([
      'us', 'US', 'usa', 'USA',
      'uk', 'UK',
      'qa', 'QA',
      'ae', 'AE',
      'gb', 'GB',
      'fr', 'FR',
      'de', 'DE',
      'it', 'IT',
      'es', 'ES'
    ]);

    // Helper function to validate platform name
    const isValidPlatform = (platform) => {
      if (!platform) return false;
      
      const platformLower = platform.toLowerCase().trim();
      
      if (excludedSources.has(platformLower)) return false;
      if (platformLower.length <= 3 && !/^(bbc|cnn|sky|itv)$/i.test(platformLower)) return false;
      
      return true;
    };

    // Group mentions by platform
    const platformMap = rawData.reduce((acc, mention) => {
      const platform = mention.platform || mention.source;
      
      if (!isValidPlatform(platform)) return acc;

      if (!acc[platform]) {
        acc[platform] = {
          platform,
          positive: 0,
          neutral: 0,
          negative: 0,
          total: 0,
          engagement: 0,
          sentiments: []
        };
      }

      const sentimentScore = parseFloat(mention.sentiment_score);
      if (!isNaN(sentimentScore)) {
        acc[platform].sentiments.push(sentimentScore);
        
        if (sentimentScore > 0.2) {
          acc[platform].positive += 1;
        } else if (sentimentScore < -0.2) {
          acc[platform].negative += 1;
        } else {
          acc[platform].neutral += 1;
        }
        
        acc[platform].total += 1;
      }
      
      const likes = parseInt(mention.likes) || 0;
      const shares = parseInt(mention.shares) || 0;
      const comments = parseInt(mention.comments) || 0;
      acc[platform].engagement += likes + shares + comments;

      return acc;
    }, {});

    // Process platforms and combine single-mention sources
    const processedPlatforms = Object.values(platformMap)
      .filter(platform => platform.total > 0)
      .reduce((acc, platform) => {
        if (platform.total === 1) {
          // Add to "Other Sources"
          if (!acc.other) {
            acc.other = {
              platform: 'Other Sources',
              positive: 0,
              neutral: 0,
              negative: 0,
              total: 0,
              engagement: 0,
              sentiments: [],
              sources: [] // Keep track of individual sources
            };
          }
          acc.other.positive += platform.positive;
          acc.other.neutral += platform.neutral;
          acc.other.negative += platform.negative;
          acc.other.total += platform.total;
          acc.other.engagement += platform.engagement;
          acc.other.sentiments.push(...platform.sentiments);
          acc.other.sources.push(platform.platform);
        } else {
          // Keep platforms with more than one mention
          acc[platform.platform] = platform;
        }
        return acc;
      }, {});

    // Convert to array and calculate percentages
    return Object.values(processedPlatforms)
      .map(platform => {
        const total = platform.total || 1;
        return {
          ...platform,
          positivePercent: (platform.positive / total) * 100,
          neutralPercent: (platform.neutral / total) * 100,
          negativePercent: (platform.negative / total) * 100,
          averageSentiment: platform.sentiments.reduce((sum, score) => sum + score, 0) / platform.sentiments.length
        };
      })
      .sort((a, b) => b.total - a.total);
  };

  const platformStats = processPlatformStats(data?.rawData);

  // Log for debugging
  console.log('Platform Stats:', platformStats);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Typography variant="h6" gutterBottom>
        Platform-Specific Sentiment Analysis
      </Typography>
      <Grid container spacing={3}>
        {platformStats.map((platform) => (
          <Grid item xs={12} sm={6} md={4} key={platform.platform}>
            <Card variant="outlined">
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1 }}>
                  {getPlatformIcon(platform.platform)}
                  <Tooltip title={platform.sources ? `Including: ${platform.sources.join(', ')}` : ''}>
                    <Typography variant="h6" component="div">
                      {platform.platform}
                      {platform.sources && (
                        <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                          ({platform.sources.length} sources)
                        </Typography>
                      )}
                    </Typography>
                  </Tooltip>
                </Box>

                <Stack spacing={1.5}>
                  <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Positive ({Math.round(platform.positivePercent)}%)
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={platform.positivePercent}
                      sx={{
                        height: 8,
                        borderRadius: 1,
                        backgroundColor: alpha(theme.palette.success.main, 0.1),
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: theme.palette.success.main,
                        },
                      }}
                    />
                  </Box>

                  <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Neutral ({Math.round(platform.neutralPercent)}%)
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={platform.neutralPercent}
                      sx={{
                        height: 8,
                        borderRadius: 1,
                        backgroundColor: alpha(theme.palette.grey[500], 0.1),
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: theme.palette.grey[500],
                        },
                      }}
                    />
                  </Box>

                  <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Negative ({Math.round(platform.negativePercent)}%)
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={platform.negativePercent}
                      sx={{
                        height: 8,
                        borderRadius: 1,
                        backgroundColor: alpha(theme.palette.error.main, 0.1),
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: theme.palette.error.main,
                        },
                      }}
                    />
                  </Box>
                </Stack>

                <Divider sx={{ my: 2 }} />

                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">
                    Total: {platform.total}
                  </Typography>
                  {platform.engagement > 0 && (
                    <Typography variant="body2" color="text.secondary">
                      Engagement: {platform.engagement.toLocaleString()}
                    </Typography>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </motion.div>
  );
};

export default PlatformSentiment; 