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

  // Define colors for the charts
  const COLORS = [
    '#2196F3', // blue
    '#4CAF50', // green
    '#FF9800', // orange
    '#E91E63', // pink
    '#9C27B0', // purple
    '#00BCD4', // cyan
    '#FFEB3B', // yellow
    '#FF5722', // deep orange
    '#3F51B5', // indigo
    '#009688'  // teal
  ];

  const SENTIMENT_COLORS = {
    positive: '#4CAF50',  // green
    neutral: '#FF9800',   // orange
    negative: '#E91E63'   // pink
  };

  const SOURCE_COLORS = {
    'Social Media': '#2196F3', // blue
    'News': '#4CAF50',        // green
    'TV': '#FF9800',          // orange
    'Other': '#9C27B0'        // purple
  };

  // Sample data for countries and their topics
  const sampleCountryData = {
    'Qatar': {
      topics: {
        'Sports': 50,
        'Business': 33,
        'Technology': 23,
        'Infrastructure': 17,
        'Education': 8
      },
      sources: {
        'Social Media': { total: 66 },
        'News': { total: 33 },
        'TV': { total: 26 },
        'Other': { total: 6 }
      },
      positive: 59,
      neutral: 46,
      negative: 26,
      total: 131,
      engagement: 3175
    },
    'US': {
      topics: {
        'Technology': 27,
        'Economy': 21,
        'Politics': 15,
        'Innovation': 8,
        'Trade': 5
      },
      sources: {
        'Social Media': { total: 38 },
        'News': { total: 19 },
        'TV': { total: 13 },
        'Other': { total: 6 }
      },
      positive: 34,
      neutral: 27,
      negative: 15,
      total: 76,
      engagement: 1500
    },
    'UAE': {
      topics: {
        'Business': 3,
        'Technology': 1,
        'Innovation': 1,
        'Trade': 0,
        'Infrastructure': 0
      },
      sources: {
        'Social Media': { total: 3 },
        'News': { total: 1 },
        'TV': { total: 1 },
        'Other': { total: 0 }
      },
      positive: 2,
      neutral: 2,
      negative: 1,
      total: 5,
      engagement: 85
    },
    'UK': {
      topics: {
        'Finance': 5,
        'Technology': 3,
        'Business': 1,
        'Economy': 2,
        'Innovation': 0
      },
      sources: {
        'Social Media': { total: 6 },
        'News': { total: 3 },
        'TV': { total: 2 },
        'Other': { total: 1 }
      },
      positive: 3,
      neutral: 2,
      negative: 2,
      total: 12,
      engagement: 150
    }
  };

  // Process the data
  const countryData = data?.sentimentByCountry ? data.sentimentByCountry.reduce((acc, item) => {
    const country = item.country;
    if (!acc[country]) {
      acc[country] = {
        topics: item.topics || {},
        sources: item.sources || {},
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
    positive: (data.positive / data.total) * 100,
    neutral: (data.neutral / data.total) * 100,
    negative: (data.negative / data.total) * 100,
    total: data.total,
  }));

  // Format data for source distribution
  const sourceDistribution = Object.entries(countryData).map(([country, data]) => {
    // If sources data is not available, provide default distribution
    const sources = data.sources || {
      'Social Media': { total: data.total * 0.4 },
      'News': { total: data.total * 0.3 },
      'TV': { total: data.total * 0.2 },
      'Other': { total: data.total * 0.1 }
    };

    return {
      country,
      'Social Media': Math.round((sources['Social Media']?.total || 0) / (data.total || 1) * 100),
      'News': Math.round((sources['News']?.total || 0) / (data.total || 1) * 100),
      'TV': Math.round((sources['TV']?.total || 0) / (data.total || 1) * 100),
      'Other': Math.round((sources['Other']?.total || 0) / (data.total || 1) * 100),
    };
  });

  // Format data for media sentiment chart
  const mediaSentimentData = [
    {
      name: 'Social Media',
      positive: 35,
      neutral: 45,
      negative: 20,
      total: 100
    },
    {
      name: 'News',
      positive: 30,
      neutral: 50,
      negative: 20,
      total: 100
    },
    {
      name: 'TV',
      positive: 40,
      neutral: 40,
      negative: 20,
      total: 100
    },
    {
      name: 'Other',
      positive: 25,
      neutral: 55,
      negative: 20,
      total: 100
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
      <Box sx={{ width: '100%', height: 200 }}>
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={topTopics}
              cx="50%"
              cy="50%"
              innerRadius={40}
              outerRadius={60}
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
                        p: 1,
                        border: 1,
                        borderColor: 'divider',
                        borderRadius: 1,
                      }}
                    >
                      <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
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
              wrapperStyle={{
                fontSize: '0.75rem',
                paddingLeft: '10px'
              }}
              formatter={(value, entry) => (
                <Typography variant="body2" sx={{ 
                  color: 'text.primary',
                  fontSize: '0.75rem',
                  lineHeight: '1.2'
                }}>
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

        {/* Media Sentiment Distribution */}
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
                    fill="#1565C0"
                  />
                  <Bar
                    dataKey="News"
                    stackId="a"
                    fill="#2E7D32"
                  />
                  <Bar
                    dataKey="TV"
                    stackId="a"
                    fill="#EF6C00"
                  />
                  <Bar
                    dataKey="Other"
                    stackId="a"
                    fill="#C2185B"
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
              p: 2,
              backgroundColor: 'background.paper',
              borderRadius: 2,
              boxShadow: 3,
            }}
          >
            <Typography variant="h6" gutterBottom sx={{ fontSize: '1rem' }}>
              Top Topics by Country
            </Typography>
            <Grid container spacing={2} sx={{ flexWrap: 'nowrap', overflowX: 'auto', pb: 2 }}>
              {Object.keys(countryData).map((country) => (
                <Grid item xs={12} sm={6} md={3} key={country} sx={{ flex: '0 0 auto' }}>
                  <Paper
                    sx={{
                      p: 1.5,
                      backgroundColor: 'background.default',
                      borderRadius: 1,
                      minWidth: '220px',
                    }}
                  >
                    <Typography variant="subtitle1" gutterBottom sx={{ fontSize: '0.875rem' }}>
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