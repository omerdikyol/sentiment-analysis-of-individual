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

  // Sample data for demonstration
  const sampleData = {
    sentimentByCountry: [
      {
        country: 'Qatar',
        positive: 11.9,
        neutral: 63.7,
        negative: 24.4,
        total: 265,
        engagement: 2800
      },
      {
        country: 'UAE',
        positive: 15.5,
        neutral: 58.5,
        negative: 26.0,
        total: 12,
        engagement: 1950
      },
      {
        country: 'US',
        positive: 13.2,
        neutral: 60.8,
        negative: 26.0,
        total: 48,
        engagement: 2200
      },
      {
        country: 'UK',
        positive: 12.8,
        neutral: 61.2,
        negative: 26.0,
        total: 21,
        engagement: 1650
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
  };

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
                <BarChart data={sampleData.sentimentByCountry}>
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
                <BarChart data={sampleData.sourceDistribution}>
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