import React from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Grid, 
  useTheme, 
  Avatar, 
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Chip,
  LinearProgress,
  Card,
  CardContent,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Person as PersonIcon,
  Verified as VerifiedIcon,
  TrendingUp as TrendingUpIcon,
  Share as ShareIcon,
  Comment as CommentIcon,
  Favorite as FavoriteIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend,
  Cell
} from 'recharts';

const InfluencerAnalysis = () => {
  const theme = useTheme();

  // Sample data for top influencers
  const topInfluencers = [
    {
      name: 'Ahmed Al-Mansouri',
      handle: '@ahmedinsights',
      platform: 'Twitter',
      followers: 125000,
      engagement: 3200,
      posts: 42,
      sentiment: {
        positive: 45.5,
        neutral: 35.2,
        negative: 19.3
      },
      topics: ['Politics', 'Economy', 'Technology'],
      avatar: '👤'
    },
    {
      name: 'Dr. Priya Sharma',
      handle: '@drsharma',
      platform: 'LinkedIn',
      followers: 98000,
      engagement: 2800,
      posts: 38,
      sentiment: {
        positive: 52.3,
        neutral: 32.5,
        negative: 15.2
      },
      topics: ['Business', 'Innovation', 'Leadership'],
      avatar: '👤'
    },
    {
      name: 'Al Jazeera Tech',
      handle: '@ajtechnology',
      platform: 'News',
      followers: 185000,
      engagement: 4500,
      posts: 65,
      sentiment: {
        positive: 38.7,
        neutral: 42.1,
        negative: 19.2
      },
      topics: ['Technology', 'Innovation', 'Digital'],
      avatar: '📰'
    },
    {
      name: 'Gulf Today',
      handle: '@gulftoday',
      platform: 'TV',
      followers: 250000,
      engagement: 5800,
      posts: 78,
      sentiment: {
        positive: 41.2,
        neutral: 38.5,
        negative: 20.3
      },
      topics: ['World News', 'Politics', 'Economy'],
      avatar: '📺'
    },
    {
      name: 'Khaleej Times',
      handle: '@khaleejtimes',
      platform: 'News',
      followers: 165000,
      engagement: 3900,
      posts: 55,
      sentiment: {
        positive: 43.8,
        neutral: 36.4,
        negative: 19.8
      },
      topics: ['Finance', 'Markets', 'Economy'],
      avatar: '📊'
    }
  ];

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
        </Box>
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
      <Typography variant="h6" gutterBottom>
        Top Influencers
      </Typography>
      <Grid container spacing={3}>
        {topInfluencers.map((influencer, index) => (
          <Grid item xs={12} md={6} key={index}>
            <Paper elevation={0} sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: '50%',
                    backgroundColor: theme.palette.primary.light,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '24px',
                    mr: 2
                  }}
                >
                  {influencer.avatar}
                </Box>
                <Box>
                  <Typography variant="subtitle1">
                    {influencer.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {influencer.handle} • {influencer.platform}
                  </Typography>
                </Box>
              </Box>
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={4}>
                  <Typography variant="body2" color="text.secondary">
                    Followers
                  </Typography>
                  <Typography variant="subtitle2">
                    {influencer.followers.toLocaleString()}
                  </Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography variant="body2" color="text.secondary">
                    Engagement
                  </Typography>
                  <Typography variant="subtitle2">
                    {influencer.engagement.toLocaleString()}
                  </Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography variant="body2" color="text.secondary">
                    Posts
                  </Typography>
                  <Typography variant="subtitle2">
                    {influencer.posts}
                  </Typography>
                </Grid>
              </Grid>
              <Box sx={{ width: '100%', height: 100 }}>
                <ResponsiveContainer>
                  <BarChart data={[influencer.sentiment]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis tick={false} />
                    <YAxis domain={[0, 100]} />
                    <Tooltip content={<CustomTooltip />} />
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
              <Box sx={{ mt: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Top Topics: {influencer.topics.join(', ')}
                </Typography>
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </motion.div>
  );
};

export default InfluencerAnalysis; 