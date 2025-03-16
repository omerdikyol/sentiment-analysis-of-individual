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

  // Sample data for demonstration
  const chartData = [
    {
      source: 'Social Media',
      positive: 35,
      neutral: 40,
      negative: 25
    },
    {
      source: 'Newspapers',
      positive: 25,
      neutral: 45,
      negative: 30
    },
    {
      source: 'TV',
      positive: 30,
      neutral: 35,
      negative: 35
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
    </motion.div>
  );
};

export default SentimentBySource; 