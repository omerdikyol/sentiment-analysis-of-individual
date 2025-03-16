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
  ScatterChart,
  Scatter,
  ZAxis,
} from 'recharts';
import { motion } from 'framer-motion';

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
    ],
    sourceDistribution: [
      {
        source: 'Social Media',
        positive: 13.5,
        neutral: 61.8,
        negative: 24.7,
        total: 253
      },
      {
        source: 'News',
        positive: 12.8,
        neutral: 62.5,
        negative: 24.7,
        total: 121
      },
      {
        source: 'TV',
        positive: 14.2,
        neutral: 60.3,
        negative: 25.5,
        total: 19
      }
    ],
    regionalActivity: [
      {
        name: 'Qatar',
        mentions: 120,
        engagement: 2800,
        engagementRate: 23.3
      },
      {
        name: 'UAE',
        mentions: 85,
        engagement: 1950,
        engagementRate: 22.9
      },
      {
        name: 'US',
        mentions: 95,
        engagement: 2200,
        engagementRate: 23.2
      },
      {
        name: 'UK',
        mentions: 75,
        engagement: 1650,
        engagementRate: 22.0
      }
    ],
    topicsByCountry: {
      'Qatar': [
        { name: 'Education', value: 45, sentiment: 0.6 },
        { name: 'Technology', value: 38, sentiment: 0.4 },
        { name: 'Economy', value: 35, sentiment: 0.3 },
        { name: 'Sports', value: 32, sentiment: 0.5 },
        { name: 'Culture', value: 28, sentiment: 0.7 }
      ],
      'UAE': [
        { name: 'Innovation', value: 42, sentiment: 0.5 },
        { name: 'Business', value: 38, sentiment: 0.4 },
        { name: 'Tourism', value: 35, sentiment: 0.6 },
        { name: 'Technology', value: 30, sentiment: 0.3 },
        { name: 'Finance', value: 25, sentiment: 0.4 }
      ],
      'US': [
        { name: 'Politics', value: 48, sentiment: -0.2 },
        { name: 'Economy', value: 40, sentiment: 0.1 },
        { name: 'Technology', value: 35, sentiment: 0.4 },
        { name: 'Healthcare', value: 30, sentiment: 0.2 },
        { name: 'Education', value: 25, sentiment: 0.3 }
      ],
      'UK': [
        { name: 'Economy', value: 45, sentiment: 0.1 },
        { name: 'Politics', value: 38, sentiment: -0.1 },
        { name: 'Culture', value: 32, sentiment: 0.5 },
        { name: 'Education', value: 28, sentiment: 0.4 },
        { name: 'Healthcare', value: 25, sentiment: 0.2 }
      ]
    }
  };

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

  const TopicsTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
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
          <Typography variant="subtitle2" gutterBottom>
            {data.name}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Mentions: {data.value}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Sentiment: {(data.sentiment * 100).toFixed(1)}%
          </Typography>
        </Box>
      );
    }
    return null;
  };

  const renderTopicChart = (country) => {
    const data = sampleData.topicsByCountry[country].map(topic => ({
      ...topic,
      sentimentPercentage: topic.sentiment * 100,
    }));

    return (
      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={data}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 60
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="name"
            angle={-45}
            textAnchor="end"
            interval={0}
            height={60}
          />
          <YAxis
            yAxisId="left"
            orientation="left"
            label={{ value: 'Mentions', angle: -90, position: 'insideLeft' }}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            domain={[-100, 100]}
            label={{ value: 'Sentiment %', angle: 90, position: 'insideRight' }}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                return (
                  <Box
                    sx={{
                      backgroundColor: 'background.paper',
                      p: 1.5,
                      border: 1,
                      borderColor: 'divider',
                      borderRadius: 1,
                      boxShadow: 3,
                    }}
                  >
                    <Typography variant="subtitle2" gutterBottom>
                      {payload[0].payload.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Mentions: {payload[0].payload.value}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Sentiment: {payload[0].payload.sentimentPercentage.toFixed(1)}%
                    </Typography>
                  </Box>
                );
              }
              return null;
            }}
          />
          <Legend />
          <Bar
            yAxisId="left"
            dataKey="value"
            name="Mentions"
            fill={theme.palette.primary.main}
          />
          <Bar
            yAxisId="right"
            dataKey="sentimentPercentage"
            name="Sentiment %"
            fill={theme.palette.secondary.main}
          />
        </BarChart>
      </ResponsiveContainer>
    );
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

        {/* Regional Activity & Engagement */}
        <Grid item xs={12} md={6}>
          <Paper elevation={0} sx={{ p: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Regional Activity & Engagement
            </Typography>
            <Box sx={{ width: '100%', height: 300 }}>
              <ResponsiveContainer>
                <BarChart data={sampleData.regionalActivity}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis yAxisId="left" orientation="left" label={{ value: 'Mentions', angle: -90, position: 'insideLeft' }} />
                  <YAxis yAxisId="right" orientation="right" label={{ value: 'Engagement', angle: 90, position: 'insideRight' }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar
                    yAxisId="left"
                    dataKey="mentions"
                    name="Mentions"
                    fill={theme.palette.primary.main}
                  />
                  <Bar
                    yAxisId="right"
                    dataKey="engagement"
                    name="Engagement"
                    fill={theme.palette.secondary.main}
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
              {Object.keys(sampleData.topicsByCountry).map((country) => (
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