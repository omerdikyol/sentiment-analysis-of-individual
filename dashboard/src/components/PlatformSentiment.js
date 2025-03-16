import React from 'react';
import { Box, Typography, Paper, Grid, useTheme } from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { motion } from 'framer-motion';

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
      // Determine specific social media platform
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

  // Convert to percentage and format for charts
  const formatPlatformData = (platforms) => {
    return Object.entries(platformData)
      .filter(([platform]) => platforms.includes(platform))
      .map(([platform, data]) => ({
        platform,
        positive: (data.positive / data.total) * 100,
        neutral: (data.neutral / data.total) * 100,
        negative: (data.negative / data.total) * 100,
        engagement: data.engagement,
        total: data.total
      }))
      .filter(item => item.total > 0) // Only show platforms with data
      .sort((a, b) => b.total - a.total); // Sort by total mentions
  };

  const socialMediaData = formatPlatformData(platformCategories.socialMedia);
  const newsData = formatPlatformData(platformCategories.news);
  const tvData = formatPlatformData(platformCategories.tv);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <Box
          sx={{
            backgroundColor: 'background.paper',
            p: 1.5,
            border: 1,
            borderColor: 'divider',
            borderRadius: 1,
          }}
        >
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            {label}
          </Typography>
          {payload.map((entry) => (
            <Typography
              key={entry.name}
              variant="body2"
              sx={{ color: entry.color }}
            >
              {`${entry.name}: ${Number(entry.value).toFixed(1)}%`}
            </Typography>
          ))}
          {payload[0]?.payload?.total && (
            <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>
              Total Mentions: {payload[0].payload.total}
            </Typography>
          )}
          {payload[0]?.payload?.engagement && (
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Engagement: {payload[0].payload.engagement}
            </Typography>
          )}
        </Box>
      );
    }
    return null;
  };

  const renderPlatformChart = (data, title) => (
    <Grid item xs={12} md={6} lg={4}>
      <Paper elevation={0} sx={{ p: 2 }}>
        <Typography variant="subtitle1" gutterBottom>
          {title}
        </Typography>
        <Box sx={{ width: '100%', height: 300 }}>
          <ResponsiveContainer>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="platform" />
              <YAxis domain={[0, 100]} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar
                dataKey="positive"
                name="Positive"
                stackId="a"
                fill={theme.palette.success.main}
              />
              <Bar
                dataKey="neutral"
                name="Neutral"
                stackId="a"
                fill={theme.palette.grey[400]}
              />
              <Bar
                dataKey="negative"
                name="Negative"
                stackId="a"
                fill={theme.palette.error.main}
              />
            </BarChart>
          </ResponsiveContainer>
        </Box>
      </Paper>
    </Grid>
  );

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
        {renderPlatformChart(socialMediaData, 'Social Media Sentiment')}
        {renderPlatformChart(newsData, 'News Sources Sentiment')}
        {renderPlatformChart(tvData, 'TV Channels Sentiment')}
      </Grid>
    </motion.div>
  );
};

export default PlatformSentiment; 