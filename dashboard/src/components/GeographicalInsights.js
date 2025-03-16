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

const GeographicalInsights = ({ data }) => {
  const theme = useTheme();

  if (!data?.rawData) {
    return (
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography variant="h6">No data available</Typography>
      </Box>
    );
  }

  // Helper function to extract topics from text
  const extractTopics = (text) => {
    const commonTopics = [
      'Politics', 'Economy', 'Sports', 'Culture', 'Technology',
      'Education', 'Healthcare', 'Business', 'Entertainment'
    ];
    
    return commonTopics.filter(topic => 
      text.toLowerCase().includes(topic.toLowerCase())
    );
  };

  // Helper function to categorize source type
  const categorizeSource = (platform, source) => {
    const socialMediaPlatforms = ['Twitter', 'Facebook', 'Instagram', 'LinkedIn', 'X'];
    const newsPlatforms = ['News', 'Newspaper', 'Magazine', 'Blog'];
    const tvPlatforms = ['TV', 'Television', 'Broadcast'];

    platform = (platform || '').toLowerCase();
    source = (source || '').toLowerCase();

    if (socialMediaPlatforms.some(p => platform.includes(p.toLowerCase()) || source.includes(p.toLowerCase()))) {
      return 'Social Media';
    }
    if (newsPlatforms.some(p => platform.includes(p.toLowerCase()) || source.includes(p.toLowerCase()))) {
      return 'News';
    }
    if (tvPlatforms.some(p => platform.includes(p.toLowerCase()) || source.includes(p.toLowerCase()))) {
      return 'TV';
    }
    return 'Other';
  };

  // Process data for sentiment by country and source
  const countryData = data.rawData.reduce((acc, item) => {
    // Convert country names to standardized format
    let country = item.country ? item.country.trim().toUpperCase() : 'UNKNOWN';
    if (country === 'QATAR') country = 'QAT';
    if (country === 'UNITED STATES' || country === 'USA') country = 'US';
    if (country === 'UNITED KINGDOM' || country === 'GREAT BRITAIN') country = 'UK';
    if (country === 'UNITED ARAB EMIRATES') country = 'UAE';

    if (!['US', 'UK', 'UAE', 'QAT'].includes(country)) {
      return acc;
    }

    if (!acc[country]) {
      acc[country] = {
        positive: 0,
        neutral: 0,
        negative: 0,
        total: 0,
        topics: {},
        engagement: 0,
        sources: {
          'Social Media': { positive: 0, neutral: 0, negative: 0, total: 0 },
          'News': { positive: 0, neutral: 0, negative: 0, total: 0 },
          'TV': { positive: 0, neutral: 0, negative: 0, total: 0 },
          'Other': { positive: 0, neutral: 0, negative: 0, total: 0 }
        }
      };
    }

    // Count sentiments
    const sentiment = parseFloat(item.sentiment_score);
    acc[country].total++;

    // Calculate engagement (using likes, retweets, and comments if available)
    const likes = parseInt(item.likes) || 0;
    const retweets = parseInt(item.retweets) || 0;
    const comments = parseInt(item.comments) || 0;
    acc[country].engagement += likes + retweets + comments;

    // Determine sentiment category
    let sentimentCategory;
    if (sentiment > 0.2) {
      sentimentCategory = 'positive';
      acc[country].positive++;
    } else if (sentiment < -0.2) {
      sentimentCategory = 'negative';
      acc[country].negative++;
    } else {
      sentimentCategory = 'neutral';
      acc[country].neutral++;
    }

    // Track source-based sentiments
    const sourceType = categorizeSource(item.platform, item.source);
    acc[country].sources[sourceType].total++;
    acc[country].sources[sourceType][sentimentCategory]++;

    // Track topics from text content
    const text = item.text || '';
    const topics = extractTopics(text);
    topics.forEach(topic => {
      if (!acc[country].topics[topic]) {
        acc[country].topics[topic] = 0;
      }
      acc[country].topics[topic]++;
    });

    return acc;
  }, {});

  // Format data for sentiment by country chart
  const sentimentByCountry = Object.entries(countryData).map(([country, data]) => ({
    country,
    positive: (data.positive / data.total) * 100,
    neutral: (data.neutral / data.total) * 100,
    negative: (data.negative / data.total) * 100,
  }));

  // Format data for regional hotspots
  const regionalHotspots = Object.entries(countryData).map(([country, data]) => ({
    country,
    mentions: data.total,
    engagementRate: (data.engagement / data.total) || 0,
  }));

  // Format data for source distribution
  const sourceDistribution = ['Social Media', 'News', 'TV', 'Other'].map(sourceType => {
    const sourceData = {
      source: sourceType,
    };

    let totalMentions = 0;
    let positiveMentions = 0;
    let neutralMentions = 0;
    let negativeMentions = 0;

    // Sum up mentions across all countries for this source type
    Object.values(countryData).forEach(data => {
      const sourceStats = data.sources[sourceType];
      totalMentions += sourceStats.total;
      positiveMentions += sourceStats.positive;
      neutralMentions += sourceStats.neutral;
      negativeMentions += sourceStats.negative;
    });

    // Calculate percentages only if there are mentions
    if (totalMentions > 0) {
      sourceData.positive = (positiveMentions / totalMentions) * 100;
      sourceData.neutral = (neutralMentions / totalMentions) * 100;
      sourceData.negative = (negativeMentions / totalMentions) * 100;
    } else {
      sourceData.positive = 0;
      sourceData.neutral = 0;
      sourceData.negative = 0;
    }

    return sourceData;
  });

  // Format data for topic heatmap
  const allTopics = new Set();
  Object.values(countryData).forEach(countryData => {
    Object.keys(countryData.topics).forEach(topic => allTopics.add(topic));
  });

  const topicHeatmap = Array.from(allTopics)
    .filter(topic => {
      const totalMentions = Object.values(countryData).reduce((sum, country) => 
        sum + (country.topics[topic] || 0), 0);
      return totalMentions > 5;
    })
    .map(topic => {
      const topicData = {
        topic,
      };
      Object.keys(countryData).forEach(country => {
        if (countryData[country]) {
          topicData[country] = (countryData[country].topics[topic] || 0) / countryData[country].total * 100;
        } else {
          topicData[country] = 0;
        }
      });
      return topicData;
    })
    .sort((a, b) => {
      const sumA = Object.values(a).reduce((sum, val) => 
        typeof val === 'number' ? sum + val : sum, 0);
      const sumB = Object.values(b).reduce((sum, val) => 
        typeof val === 'number' ? sum + val : sum, 0);
      return sumB - sumA;
    })
    .slice(0, 10);

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
              {`${entry.name}: ${Number(entry.value).toFixed(1)}${entry.unit || '%'}`}
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
        Geographical Insights
      </Typography>
      <Grid container spacing={3}>
        {/* Sentiment by Country */}
        <Grid item xs={12} md={6}>
          <Paper elevation={0} sx={{ p: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Sentiment by Country
            </Typography>
            <Box sx={{ width: '100%', height: 300 }}>
              <ResponsiveContainer>
                <BarChart data={sentimentByCountry}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="country" />
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

        {/* Source Distribution */}
        <Grid item xs={12} md={6}>
          <Paper elevation={0} sx={{ p: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Sentiment Distribution by Source
            </Typography>
            <Box sx={{ width: '100%', height: 300 }}>
              <ResponsiveContainer>
                <BarChart data={sourceDistribution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="source" />
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

        {/* Regional Hotspots */}
        <Grid item xs={12} md={6}>
          <Paper elevation={0} sx={{ p: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Regional Activity & Engagement
            </Typography>
            <Box sx={{ width: '100%', height: 300 }}>
              <ResponsiveContainer>
                <BarChart data={regionalHotspots}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="country" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar
                    yAxisId="left"
                    dataKey="mentions"
                    name="Total Mentions"
                    fill={theme.palette.primary.main}
                  />
                  <Bar
                    yAxisId="right"
                    dataKey="engagementRate"
                    name="Avg. Engagement"
                    fill={theme.palette.secondary.main}
                  />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        {/* Topic Distribution */}
        <Grid item xs={12} md={6}>
          <Paper elevation={0} sx={{ p: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Top Topics by Country
            </Typography>
            <Box sx={{ width: '100%', height: 300 }}>
              <ResponsiveContainer>
                <BarChart data={topicHeatmap} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" unit="%" />
                  <YAxis dataKey="topic" type="category" width={150} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar dataKey="US" name="US" fill={theme.palette.info.main} />
                  <Bar dataKey="UK" name="UK" fill={theme.palette.warning.main} />
                  <Bar dataKey="UAE" name="UAE" fill={theme.palette.success.main} />
                  <Bar dataKey="QAT" name="Qatar" fill={theme.palette.secondary.main} />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </motion.div>
  );
};

export default GeographicalInsights; 