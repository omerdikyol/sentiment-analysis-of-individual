import React from 'react';
import { Box, Typography, useTheme } from '@mui/material';
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

const SentimentBySource = ({ data }) => {
  const theme = useTheme();

  if (!data?.rawData) {
    return (
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography variant="h6">No data available</Typography>
      </Box>
    );
  }

  // Process data to get sentiment distribution by source
  const sourceData = data.rawData.reduce((acc, item) => {
    let source = 'Other';
    
    // Determine source based on platform or other indicators
    if (['Twitter', 'Facebook', 'Instagram', 'LinkedIn'].includes(item.platform)) {
      source = 'Social Media';
    } else if (item.platform === 'News' || item.platform.includes('News')) {
      source = 'Newspapers';
    } else if (item.platform === 'TV' || item.platform.includes('TV')) {
      source = 'TV';
    }

    if (!acc[source]) {
      acc[source] = {
        positive: 0,
        neutral: 0,
        negative: 0,
        total: 0,
      };
    }

    const sentiment = parseFloat(item.sentiment_score);
    acc[source].total++;

    if (sentiment > 0.2) {
      acc[source].positive++;
    } else if (sentiment < -0.2) {
      acc[source].negative++;
    } else {
      acc[source].neutral++;
    }

    return acc;
  }, {});

  // Convert to percentage and format for chart
  const chartData = Object.entries(sourceData).map(([source, counts]) => ({
    source,
    positive: (counts.positive / counts.total) * 100,
    neutral: (counts.neutral / counts.total) * 100,
    negative: (counts.negative / counts.total) * 100,
  }));

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
              {`${entry.name}: ${entry.value.toFixed(1)}%`}
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
        Sentiment Distribution by Source
      </Typography>
      <Box sx={{ width: '100%', height: 300 }}>
        <ResponsiveContainer>
          <BarChart
            data={chartData}
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="source" />
            <YAxis />
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
    </motion.div>
  );
};

export default SentimentBySource; 