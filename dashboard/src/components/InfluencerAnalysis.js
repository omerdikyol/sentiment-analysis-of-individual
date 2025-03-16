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

  if (!data?.rawData) {
    return (
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography variant="h6">No data available</Typography>
      </Box>
    );
  }

  // Process influencer data
  const influencerData = data.rawData.reduce((acc, item) => {
    const author = item.author || '';
    const influencerTypes = {
      'Politician': ['minister', 'senator', 'mp', 'congressman', 'official', 'governor'],
      'Journalist': ['journalist', 'reporter', 'editor', 'correspondent', 'news'],
      'Thought Leader': ['professor', 'expert', 'analyst', 'researcher', 'advisor'],
      'Media Outlet': ['news', 'times', 'post', 'herald', 'journal', 'daily']
    };

    // Skip if no author or engagement metrics
    if (!author || (!item.likes && !item.retweets && !item.comments)) return acc;

    if (!acc[author]) {
      let type = 'Other';
      Object.entries(influencerTypes).forEach(([category, keywords]) => {
        if (keywords.some(keyword => 
          item.text?.toLowerCase().includes(keyword) || 
          author.toLowerCase().includes(keyword)
        )) {
          type = category;
        }
      });

      acc[author] = {
        name: author,
        type: type,
        posts: 0,
        engagement: 0,
        sentiment: 0,
        verified: Math.random() > 0.7, // Simulated verified status
        recentPost: '',
        followers: Math.floor(Math.random() * 900000) + 100000 // Simulated follower count
      };
    }

    acc[author].posts++;
    acc[author].engagement += (parseInt(item.likes) || 0) + 
                            (parseInt(item.retweets) || 0) + 
                            (parseInt(item.comments) || 0);
    acc[author].sentiment += parseFloat(item.sentiment_score) || 0;
    if (!acc[author].recentPost) {
      acc[author].recentPost = item.text;
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

  // Format top influencers
  const topInfluencers = Object.values(influencerData)
    .map(inf => ({
      ...inf,
      averageSentiment: inf.sentiment / inf.posts,
      engagementRate: (inf.engagement / inf.posts / inf.followers * 100).toFixed(2)
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
              {`${entry.name}: ${Number(entry.value).toFixed(0)}`}
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
        Influencer & Media Impact
      </Typography>
      <Grid container spacing={3}>
        {/* Top Influencers */}
        <Grid item xs={12} md={6}>
          <Paper elevation={0} sx={{ p: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Top Influencers
            </Typography>
            <List>
              {topInfluencers.map((influencer, index) => (
                <ListItem
                  key={index}
                  sx={{
                    mb: 1,
                    backgroundColor: 'background.default',
                    borderRadius: 1,
                    '&:hover': {
                      backgroundColor: 'action.hover',
                    },
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
                      <Box>
                        <Chip
                          label={influencer.type}
                          size="small"
                          sx={{ mr: 1 }}
                        />
                        <Chip
                          label={`${influencer.engagementRate}% Engagement`}
                          size="small"
                          color="primary"
                        />
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
              ))}
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </motion.div>
  );
};

export default InfluencerAnalysis; 