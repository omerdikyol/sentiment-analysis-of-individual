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
  Pie
} from 'recharts';
import { motion } from 'framer-motion';
import { alpha } from '@mui/material/styles';

const GeographicalInsights = ({ data }) => {
  const theme = useTheme();

  // Define colors for the charts
  const COLORS = [
    theme.palette.primary.main,
    theme.palette.secondary.main,
    theme.palette.success.main,
    theme.palette.info.main,
    theme.palette.warning.main,
    alpha(theme.palette.primary.main, 0.7),
    alpha(theme.palette.secondary.main, 0.7),
    alpha(theme.palette.success.main, 0.7),
    alpha(theme.palette.info.main, 0.7),
    alpha(theme.palette.warning.main, 0.7)
  ];

  // Sample data for countries and their topics
  const sampleCountryData = {
    'Qatar': {
      topics: {
        'Sports': 85,
        'Business': 52,
        'Technology': 38,
        'Infrastructure': 20,
        'Education': 15
      },
      positive: 45.2,
      neutral: 35.5,
      negative: 19.3,
      total: 210,
      engagement: 4800
    },
    'US': {
      topics: {
        'Technology': 65,
        'Economy': 45,
        'Politics': 32,
        'Innovation': 20,
        'Trade': 10
      },
      positive: 42.8,
      neutral: 38.5,
      negative: 18.7,
      total: 172,
      engagement: 3900
    },
    'UK': {
      topics: {
        'Finance': 3,
        'Technology': 2,
        'Business': 1,
        'Economy': 1
      },
      positive: 43.5,
      neutral: 42.2,
      negative: 14.3,
      total: 7,
      engagement: 250
    }
  };

  // Process the data
  const countryData = data?.sentimentByCountry ? data.sentimentByCountry.reduce((acc, item) => {
    const country = item.country;
    if (!acc[country]) {
      acc[country] = {
        topics: item.topics || {},
        positive: item.positive,
        neutral: item.neutral,
        negative: item.negative,
        total: item.total,
        engagement: item.engagement
      };
    }
    return acc;
  }, {}) : sampleCountryData;

  // Format data for sentiment by country chart
  const sentimentByCountry = Object.entries(countryData).map(([country, data]) => ({
    country,
    positive: data.positive,
    neutral: data.neutral,
    negative: data.negative,
    total: data.total,
    engagement: data.engagement
  }));

  // Format data for source distribution
  const sourceDistribution = ['Social Media', 'News', 'TV', 'Other'].map(sourceType => {
    const sourceData = {
      source: sourceType,
      positive: 0,
      neutral: 0,
      negative: 0,
      total: 0
    };

    let totalMentions = 0;
    let positiveMentions = 0;
    let neutralMentions = 0;
    let negativeMentions = 0;

    // Sum up mentions across all countries for this source type
    Object.values(countryData).forEach(countryData => {
      if (countryData.sources?.[sourceType]) {
        const sourceStats = countryData.sources[sourceType];
        totalMentions += sourceStats.total || 0;
        positiveMentions += sourceStats.positive || 0;
        neutralMentions += sourceStats.neutral || 0;
        negativeMentions += sourceStats.negative || 0;
      }
    });

    // Calculate percentages only if there are mentions
    if (totalMentions > 0) {
      sourceData.positive = (positiveMentions / totalMentions) * 100;
      sourceData.neutral = (neutralMentions / totalMentions) * 100;
      sourceData.negative = (negativeMentions / totalMentions) * 100;
      sourceData.total = totalMentions;
    }

    return sourceData;
  });

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
  const renderTopicChart = (country) => {
    const data = countryData[country]?.topics || {};
    const topTopics = Object.entries(data)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([topic, value]) => ({
        name: topic,
        value: value
      }));

    return (
      <Box sx={{ width: '100%', height: 250 }}>
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={topTopics}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              fill="#8884d8"
              paddingAngle={2}
              dataKey="value"
            >
              {topTopics.map((entry, index) => (
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
                        {`${payload[0].name}: ${payload[0].value} mentions`}
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
              formatter={(value, entry) => (
                <Typography variant="body2" sx={{ color: 'text.primary' }}>
                  {value}
                </Typography>
              )}
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

        {/* Media Sentiment Distribution */}
        <Grid item xs={12} md={6}>
          <Paper elevation={0} sx={{ p: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Media Sentiment Distribution
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
            <Grid container spacing={2}>
              {Object.keys(countryData).map((country) => (
                <Grid item xs={12} md={6} key={country}>
                  <Paper
                    sx={{
                      p: 2,
                      backgroundColor: 'background.default',
                      borderRadius: 1,
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