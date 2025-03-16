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
      'Social Media': Math.round((sources['Social Media'].total / data.total) * 100),
      'News': Math.round((sources['News'].total / data.total) * 100),
      'TV': Math.round((sources['TV'].total / data.total) * 100),
      'Other': Math.round((sources['Other'].total / data.total) * 100),
    };
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