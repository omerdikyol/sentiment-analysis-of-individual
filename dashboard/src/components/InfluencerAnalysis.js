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

const InfluencerAnalysis = ({ data }) => {
  const theme = useTheme();

  // Helper function to get sentiment info
  const getSentimentInfo = (sentiment) => {
    if (sentiment >= 0.7) return { text: 'Very Positive', color: theme.palette.success.dark, icon: '😄' };
    if (sentiment >= 0.3) return { text: 'Positive', color: theme.palette.success.main, icon: '🙂' };
    if (sentiment > -0.3) return { text: 'Neutral', color: theme.palette.grey[600], icon: '😐' };
    if (sentiment > -0.7) return { text: 'Negative', color: theme.palette.error.main, icon: '🙁' };
    return { text: 'Very Negative', color: theme.palette.error.dark, icon: '😞' };
  };

  // Process influencer data
  const topInfluencers = Object.values(data?.influencers || {
    '@ahmedinsights': {
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
    '@drsharma': {
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
    '@ajtechnology': {
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
    '@gulftoday': {
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
    '@khaleejtimes': {
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
  })
  .map(inf => ({
    ...inf,
    averageSentiment: (inf.sentiment.positive - inf.sentiment.negative) / 100,
    engagementRate: (inf.engagement / inf.posts / inf.followers * 100).toFixed(2),
    sentimentInfo: getSentimentInfo((inf.sentiment.positive - inf.sentiment.negative) / 100)
  }))
  .sort((a, b) => b.engagement - a.engagement)
  .slice(0, 5);

  // Process media sentiment
  const mediaSentiment = data.rawData.reduce((acc, item) => {
    const mediaOutlets = ['news', 'times', 'post', 'herald', 'journal', 'daily'];
    const isMediaPost = mediaOutlets.some(outlet => 
      item.author?.toLowerCase().includes(outlet) || 
      item.source?.toLowerCase().includes(outlet)
    );

    if (isMediaPost) {
      const sentiment = parseFloat(item.sentiment_score) || 0;
      if (sentiment > 0) acc.positive++;
      else if (sentiment < 0) acc.negative++;
      else acc.neutral++;
    }

    return acc;
  }, { positive: 0, negative: 0, neutral: 0 });

  // Calculate virality scores
  const viralPosts = data.rawData
    .map(item => ({
      text: item.text,
      author: item.author,
      engagement: (parseInt(item.likes) || 0) + 
                 (parseInt(item.retweets) || 0) * 2 + // Weight retweets more
                 (parseInt(item.comments) || 0) * 1.5, // Weight comments
      sentiment: parseFloat(item.sentiment_score) || 0,
      likes: parseInt(item.likes) || 0,
      retweets: parseInt(item.retweets) || 0,
      comments: parseInt(item.comments) || 0,
      viralityScore: (
        (parseInt(item.likes) || 0) + 
        (parseInt(item.retweets) || 0) * 2 + 
        (parseInt(item.comments) || 0) * 1.5
      ) / 10  // Normalize to a 0-10 scale
    }))
    .sort((a, b) => b.engagement - a.engagement)
    .slice(0, 5);

  // Format media sentiment for chart
  const mediaSentimentData = [
    { name: 'Positive', value: mediaSentiment.positive },
    { name: 'Negative', value: mediaSentiment.negative },
    { name: 'Neutral', value: mediaSentiment.neutral }
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
        {/* Top Influencers */}
        {topInfluencers.map((influencer, index) => (
          <Grid item xs={12} md={6} key={index}>
            <Paper elevation={0} sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
                  {influencer.avatar || <PersonIcon />}
                </Avatar>
                <Box sx={{ ml: 2, flex: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="subtitle1">
                      {influencer.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {influencer.handle}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                    <Chip
                      label={influencer.platform}
                      size="small"
                      sx={{ mr: 1 }}
                    />
                    <Chip
                      icon={<TrendingUpIcon />}
                      label={`${influencer.engagementRate}% Engagement`}
                      size="small"
                      color="primary"
                    />
                  </Box>
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 0.5,
                    color: influencer.sentimentInfo.color,
                    mt: 1
                  }}>
                    <Typography variant="body2">
                      {influencer.sentimentInfo.icon} {influencer.sentimentInfo.text}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      ({(influencer.averageSentiment * 100).toFixed(1)}%)
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Topics: {influencer.topics.join(', ')}
                  </Typography>
                </Box>
              </Box>
            </Paper>
          </Grid>
        ))}

  

        {/* Viral Posts */}
        <Grid item xs={12}>
          <Paper elevation={0} sx={{ p: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Most Viral Content
            </Typography>
            <Grid container spacing={2}>
              {viralPosts.map((post, index) => (
                <Grid item xs={12} key={index}>
                  <Card variant="outlined">
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                        <Typography variant="subtitle2" color="text.secondary">
                          {post.author}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Tooltip title="Likes">
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <FavoriteIcon color="error" sx={{ fontSize: 16, mr: 0.5 }} />
                              <Typography variant="body2">{post.likes}</Typography>
                            </Box>
                          </Tooltip>
                          <Tooltip title="Retweets">
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <ShareIcon color="primary" sx={{ fontSize: 16, mr: 0.5 }} />
                              <Typography variant="body2">{post.retweets}</Typography>
                            </Box>
                          </Tooltip>
                          <Tooltip title="Comments">
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <CommentIcon color="action" sx={{ fontSize: 16, mr: 0.5 }} />
                              <Typography variant="body2">{post.comments}</Typography>
                            </Box>
                          </Tooltip>
                        </Box>
                      </Box>
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        {post.text}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <TrendingUpIcon 
                          sx={{ 
                            color: post.sentiment > 0 ? 'success.main' : 'error.main',
                            fontSize: 16 
                          }} 
                        />
                        <Typography variant="body2" color="text.secondary">
                          Virality Score: {post.viralityScore.toFixed(1)}
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </motion.div>
  );
};

export default InfluencerAnalysis; 