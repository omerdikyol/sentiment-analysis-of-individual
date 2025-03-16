import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  useTheme,
  Card,
  CardContent,
  LinearProgress,
  Stack,
  Divider,
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

  if (!data?.rawData) {
    return (
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography variant="h6">No data available</Typography>
      </Box>
    );
  }

  // Platform categorization
  const platformCategories = {
    socialMedia: ['Twitter', 'X', 'Facebook', 'LinkedIn', 'Instagram'],
    news: ['CNN', 'BBC', 'Al Jazeera', 'Reuters', 'Associated Press', 'Bloomberg'],
    tv: ['CNN TV', 'BBC TV', 'Al Jazeera TV', 'Sky News']
  };

  // Process data for platform-specific sentiment
  const platformData = data.rawData.reduce((acc, item) => {
    const platform = item.platform || '';
    const source = item.source || '';
    const sentiment = parseFloat(item.sentiment_score);

    // Helper function to process sentiment
    const processSentiment = (targetPlatform) => {
      if (!acc[targetPlatform]) {
        acc[targetPlatform] = {
          platform: targetPlatform,
          positive: 0,
          neutral: 0,
          negative: 0,
          total: 0,
          engagement: 0
        };
      }

      acc[targetPlatform].total++;
      
      // Add engagement metrics
      const likes = parseInt(item.likes) || 0;
      const retweets = parseInt(item.retweets) || 0;
      const comments = parseInt(item.comments) || 0;
      acc[targetPlatform].engagement += likes + retweets + comments;

      // Categorize sentiment
      if (sentiment > 0.2) {
        acc[targetPlatform].positive++;
      } else if (sentiment < -0.2) {
        acc[targetPlatform].negative++;
      } else {
        acc[targetPlatform].neutral++;
      }
    };

    // Process social media platforms
    if (platformCategories.socialMedia.some(p => 
      platform.toLowerCase().includes(p.toLowerCase()) || 
      source.toLowerCase().includes(p.toLowerCase())
    )) {
      const socialPlatform = platformCategories.socialMedia.find(p => 
        platform.toLowerCase().includes(p.toLowerCase()) || 
        source.toLowerCase().includes(p.toLowerCase())
      );
      processSentiment(socialPlatform === 'X' ? 'Twitter' : socialPlatform);
    }

    // Process news sources
    if (platformCategories.news.some(p => 
      platform.toLowerCase().includes(p.toLowerCase()) || 
      source.toLowerCase().includes(p.toLowerCase())
    )) {
      const newsSource = platformCategories.news.find(p => 
        platform.toLowerCase().includes(p.toLowerCase()) || 
        source.toLowerCase().includes(p.toLowerCase())
      );
      processSentiment(newsSource);
    }

    // Process TV channels
    if (platformCategories.tv.some(p => 
      platform.toLowerCase().includes(p.toLowerCase()) || 
      source.toLowerCase().includes(p.toLowerCase())
    )) {
      const tvChannel = platformCategories.tv.find(p => 
        platform.toLowerCase().includes(p.toLowerCase()) || 
        source.toLowerCase().includes(p.toLowerCase())
      );
      processSentiment(tvChannel);
    }

    return acc;
  }, {});

  const getPlatformIcon = (platform) => {
    switch (platform.toLowerCase()) {
      case 'twitter':
        return <TwitterIcon />;
      case 'facebook':
        return <FacebookIcon />;
      case 'linkedin':
        return <LinkedInIcon />;
      case 'instagram':
        return <InstagramIcon />;
      default:
        return platform.toLowerCase().includes('tv') ? <TvIcon /> : <NewsIcon />;
    }
  };

  // Convert to array and sort by total mentions
  const platformStats = Object.entries(platformData)
    .map(([platform, data]) => ({
      platform,
      ...data,
      positivePercent: (data.positive / data.total) * 100,
      neutralPercent: (data.neutral / data.total) * 100,
      negativePercent: (data.negative / data.total) * 100,
    }))
    .sort((a, b) => b.total - a.total);

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
                  <Typography variant="h6" component="div">
                    {platform.platform}
                  </Typography>
                </Box>

                <Stack spacing={1.5}>
                  <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Positive ({platform.positive} mentions)
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
                      Neutral ({platform.neutral} mentions)
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
                      Negative ({platform.negative} mentions)
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
                    Total Mentions: {platform.total}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Engagement: {platform.engagement}
                  </Typography>
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