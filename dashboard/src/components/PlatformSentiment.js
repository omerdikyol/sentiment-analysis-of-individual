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

  // Sample data for demonstration
  const sampleData = {
    socialMedia: [
      { platform: 'X', positive: 35, neutral: 40, negative: 25, total: 121, engagement: 1200 },
    ],
    news: [
      { platform: 'CNN', positive: 20, neutral: 45, negative: 35, total: 42, engagement: 800 },
      { platform: 'BBC', positive: 25, neutral: 40, negative: 35, total: 16, engagement: 950 },
      { platform: 'Al Jazeera', positive: 30, neutral: 35, negative: 35, total: 55, engagement: 700 }
    ],
    tv: [
      { platform: 'CNN TV', positive: 25, neutral: 40, negative: 35, total: 42, engagement: 800 },
      { platform: 'BBC TV', positive: 30, neutral: 35, negative: 35, total: 16, engagement: 950 },
      { platform: 'Al Jazeera TV', positive: 35, neutral: 30, negative: 35, total: 55, engagement: 700 }
    ]
  };

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
        {renderPlatformChart(sampleData.socialMedia, 'Social Media Sentiment')}
        {renderPlatformChart(sampleData.news, 'News Sources Sentiment')}
        {renderPlatformChart(sampleData.tv, 'TV Channels Sentiment')}
      </Grid>
    </motion.div>
  );
};

export default PlatformSentiment; 