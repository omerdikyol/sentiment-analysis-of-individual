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
  Cell,
  PieChart,
  Pie,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';
import { motion } from 'framer-motion';
import { alpha } from '@mui/material/styles';

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
    total: data.total,
  }));

  // Format data for source distribution
  const sourceDistribution = Object.entries(countryData).map(([country, data]) => ({
    country,
    'Social Media': Math.round((data.sources['Social Media'].total / data.total) * 100),
    'News': Math.round((data.sources['News'].total / data.total) * 100),
    'TV': Math.round((data.sources['TV'].total / data.total) * 100),
    'Other': Math.round((data.sources['Other'].total / data.total) * 100),
  }));

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

  const COLORS = [
    theme.palette.primary.main,
    theme.palette.secondary.main,
    theme.palette.success.main,
    theme.palette.error.main,
    theme.palette.info.main,
    theme.palette.warning.main,
    theme.palette.primary.light,
    theme.palette.secondary.light,
    theme.palette.success.light,
    theme.palette.error.light,
    theme.palette.info.light,
    theme.palette.warning.light,
    theme.palette.primary.dark,
    theme.palette.secondary.dark,
    theme.palette.success.dark,
    theme.palette.error.dark,
    theme.palette.info.dark,
    theme.palette.warning.dark,
    alpha(theme.palette.primary.main, 0.7),
    alpha(theme.palette.secondary.main, 0.7),
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
              {`${entry.name}: ${Number(entry.value).toLocaleString()}`}
            </Typography>
          ))}
        </Box>
      );
    }
    return null;
  };

  const renderTopicChart = (country) => {
    const data = countryData[country]?.topics || {};
    return (
      <Box sx={{ width: '100%', height: 200 }}>
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={Object.entries(data).map(([topic, value]) => ({
                name: topic,
                value,
              }))}
              cx="50%"
              cy="50%"
              innerRadius={40}
              outerRadius={80}
              fill="#8884d8"
              paddingAngle={2}
              dataKey="value"
            >
              {Object.entries(data).map(([topic, value], index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <Box
                      sx={{
                        bgcolor: 'background.paper',
                        p: 1.5,
                        border: 1,
                        borderColor: 'divider',
                        borderRadius: 1,
                      }}
                    >
                      <Typography variant="body2">
                        {`${payload[0].name}: ${payload[0].value}%`}
                      </Typography>
                    </Box>
                  );
                }
                return null;
              }}
            />
            <Legend
              layout="vertical"
              align="right"
              verticalAlign="middle"
              wrapperStyle={{ paddingLeft: '10px' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </Box>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Typography variant="h6" gutterBottom>
        Geographical Distribution & Impact
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
                <PieChart>
                  <Pie
                    data={sentimentByCountry}
                    dataKey="total"
                    nameKey="country"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={(entry) => entry.country}
                  >
                    {sentimentByCountry.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        {/* Source Distribution */}
        <Grid item xs={12} md={6}>
          <Paper elevation={0} sx={{ p: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Source Distribution by Country
            </Typography>
            <Box sx={{ width: '100%', height: 300 }}>
              <ResponsiveContainer>
                <BarChart
                  data={sourceDistribution}
                  layout="vertical"
                  margin={{ top: 20, right: 30, left: 30, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" domain={[0, 100]} />
                  <YAxis 
                    dataKey="country" 
                    type="category" 
                    tick={{ fontSize: 12 }}
                    width={35}
                  />
                  <Tooltip
                    formatter={(value) => `${value}%`}
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <Box
                            sx={{
                              bgcolor: 'background.paper',
                              p: 1.5,
                              border: 1,
                              borderColor: 'divider',
                              borderRadius: 1,
                            }}
                          >
                            <Typography variant="subtitle2" gutterBottom>
                              {label}
                            </Typography>
                            {payload.map((entry) => (
                              <Typography
                                key={entry.name}
                                variant="body2"
                                sx={{
                                  color: entry.color,
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  gap: 2,
                                }}
                              >
                                <span>{entry.name}:</span>
                                <span>{entry.value}%</span>
                              </Typography>
                            ))}
                          </Box>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend />
                  <Bar
                    dataKey="Social Media"
                    stackId="a"
                    fill={theme.palette.primary.main}
                  />
                  <Bar
                    dataKey="News"
                    stackId="a"
                    fill={theme.palette.secondary.main}
                  />
                  <Bar
                    dataKey="TV"
                    stackId="a"
                    fill={theme.palette.success.main}
                  />
                  <Bar
                    dataKey="Other"
                    stackId="a"
                    fill={theme.palette.grey[400]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        {/* Top Topics by Country */}
        <Grid item xs={12}>
          <Paper
            sx={{
              p: 3,
              backgroundColor: 'background.paper',
              borderRadius: 2,
              boxShadow: 3,
            }}
          >
            <Typography variant="h6" gutterBottom>
              Top Topics by Country
            </Typography>
            <Grid container spacing={2} sx={{ flexWrap: 'nowrap', overflowX: 'auto', pb: 2 }}>
              {Object.keys(countryData).map((country) => (
                <Grid item xs={12} sm={6} md={3} key={country} sx={{ flex: '0 0 auto' }}>
                  <Paper
                    sx={{
                      p: 2,
                      backgroundColor: 'background.default',
                      borderRadius: 1,
                      minWidth: '250px',
                    }}
                  >
                    <Typography variant="subtitle1" gutterBottom>
                      {country}
                    </Typography>
                    {renderTopicChart(country)}
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </motion.div>
  );
};

export default GeographicalInsights; 