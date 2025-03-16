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
    return acc;
  }, {});

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
      comments: parseInt(item.comments) || 0
    }))
    .sort((a, b) => b.engagement - a.engagement)
    .slice(0, 5);

  // Helper function to get sentiment info
  const getSentimentInfo = (sentiment) => {
    if (sentiment >= 0.7) return { text: 'Very Positive', color: theme.palette.success.dark, icon: '😄' };
    if (sentiment >= 0.3) return { text: 'Positive', color: theme.palette.success.main, icon: '🙂' };
    if (sentiment > -0.3) return { text: 'Neutral', color: theme.palette.grey[600], icon: '😐' };
    if (sentiment > -0.7) return { text: 'Negative', color: theme.palette.error.main, icon: '🙁' };
    return { text: 'Very Negative', color: theme.palette.error.dark, icon: '😞' };
  };

  // Format top influencers
  const topInfluencers = Object.values(influencerData)
    .map(inf => ({
      ...inf,
      averageSentiment: inf.sentiment / inf.posts,
      engagementRate: (inf.engagement / inf.posts / inf.followers * 100).toFixed(2),
      sentimentInfo: getSentimentInfo(inf.sentiment / inf.posts)
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
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
                      <PersonIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {influencer.name}
                        {influencer.verified && (
                          <Tooltip title="Verified">
                            <VerifiedIcon color="primary" sx={{ fontSize: 16 }} />
                          </Tooltip>
                        )}
                      </Box>
                    }
                    secondary={
                      <Box sx={{ mt: 0.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                          <Chip
                            label={influencer.type}
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
                          mt: 0.5
                        }}>
                          <Typography 
                            variant="body2" 
                            component="span"
                            sx={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: 0.5,
                              fontWeight: 'medium'
                            }}
                          >
                            {influencer.sentimentInfo.icon}
                            {influencer.sentimentInfo.text}
                          </Typography>
                          <Typography 
                            variant="caption" 
                            component="span"
                            sx={{ 
                              color: 'text.secondary',
                              ml: 0.5
                            }}
                          >
                            ({(influencer.averageSentiment * 100).toFixed(1)}%)
                          </Typography>
                        </Box>
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>

        {/* Media Sentiment */}
        <Grid item xs={12} md={6}>
          <Paper elevation={0} sx={{ p: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Media Sentiment Distribution
            </Typography>
            <Box sx={{ width: '100%', height: 300 }}>
              <ResponsiveContainer>
                <BarChart data={mediaSentimentData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <RechartsTooltip content={<CustomTooltip />} />
                  <Bar dataKey="value" name="Articles">
                    {mediaSentimentData.map((entry, index) => (
                      <Cell
                        key={index}
                        fill={
                          entry.name === 'Positive'
                            ? theme.palette.success.main
                            : entry.name === 'Negative'
                            ? theme.palette.error.main
                            : theme.palette.grey[400]
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

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
                          Virality Score: {post.engagement.toLocaleString()}
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
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