import React, { useState, useEffect } from 'react';
import { Card, CardContent, Typography, Box } from '@mui/material';
import { motion } from 'framer-motion';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart
} from 'recharts';

const SentimentLineChart = ({ sentimentByDate }) => {
  const [animatedData, setAnimatedData] = useState([]);
  
  useEffect(() => {
    if (sentimentByDate && sentimentByDate.length > 0) {
      // Start with empty data points
      setAnimatedData([]);
      
      // Animate data points appearing one by one
      sentimentByDate.forEach((item, index) => {
        setTimeout(() => {
          setAnimatedData(prev => [...prev, item]);
        }, index * 50);
      });
    }
  }, [sentimentByDate]);

  if (!sentimentByDate || sentimentByDate.length === 0) {
    return (
      <Card sx={{ height: '100%', boxShadow: 3, borderRadius: 2 }}>
        <CardContent>
          <Typography variant="h6">Sentiment Over Time</Typography>
          <Typography variant="body2">No data available</Typography>
        </CardContent>
      </Card>
    );
  }

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      // Find the data point that matches the label
      const dataPoint = sentimentByDate.find(item => new Date(item.date).toLocaleDateString() === label);
      
      return (
        <Box
          sx={{
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            p: 2,
            border: '1px solid #ccc',
            borderRadius: 1,
            boxShadow: 3
          }}
        >
          <Typography variant="subtitle2" color="textSecondary">
            {label}
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: 'bold', color: 'rgba(54, 162, 235, 1)' }}>
            {`Average Sentiment: ${(payload[0].value)}%`}
          </Typography>
          {dataPoint && (
            <Box sx={{ mt: 1 }}>
              <Typography variant="body2" sx={{ color: 'rgba(75, 192, 192, 1)' }}>
                Positive: {dataPoint.positive}
              </Typography>
              <Typography variant="body2" sx={{ color: '#2196f3' }}>
                Neutral: {dataPoint.neutral || 0}
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255, 99, 132, 1)' }}>
                Negative: {dataPoint.negative}
              </Typography>
            </Box>
          )}
        </Box>
      );
    }
    return null;
  };

  // Prepare the data for visualization
  const chartData = animatedData.map(item => ({
    ...item,
    avgScorePercent: (item.avgScore * 100).toFixed(1)
  }));

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay: 0.1 }}
    >
      <Card sx={{ 
        height: '100%', 
        boxShadow: 3, 
        borderRadius: 2,
        background: 'linear-gradient(135deg, #ffffff 0%, #f0f8ff 100%)',
        transition: 'all 0.3s ease'
      }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>Sentiment Analysis Over Time</Typography>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <defs>
                  <linearGradient id="avgScoreGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="rgba(54, 162, 235, 0.8)" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="rgba(54, 162, 235, 0.2)" stopOpacity={0.2} />
                  </linearGradient>
                  <linearGradient id="positiveGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="rgba(75, 192, 192, 0.8)" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="rgba(75, 192, 192, 0.2)" stopOpacity={0.2} />
                  </linearGradient>
                  <linearGradient id="negativeGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="rgba(255, 99, 132, 0.8)" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="rgba(255, 99, 132, 0.2)" stopOpacity={0.2} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis 
                  dataKey="date"
                  tickFormatter={(date) => new Date(date).toLocaleDateString()}
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  tickFormatter={(value) => `${value}${typeof value === 'number' ? '%' : ''}`}
                  tick={{ fontSize: 12 }}
                  domain={[0, 100]}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ paddingTop: '10px' }} />
                
                <Area 
                  type="monotone" 
                  dataKey="avgScorePercent"
                  stroke="rgba(54, 162, 235, 1)"
                  strokeWidth={3}
                  fill="url(#avgScoreGradient)"
                  activeDot={{ 
                    r: 6, 
                    stroke: '#fff',
                    strokeWidth: 2,
                    fill: 'rgba(54, 162, 235, 1)'
                  }}
                  name="Average Sentiment Score (%)" 
                />
                
                <Line 
                  type="monotone" 
                  dataKey="positive"
                  stroke="rgba(75, 192, 192, 1)"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                  name="Positive Mentions" 
                  connectNulls={true}
                  hide={true}
                />
                
                <Line 
                  type="monotone" 
                  dataKey="negative"
                  stroke="rgba(255, 99, 132, 1)"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                  name="Negative Mentions" 
                  connectNulls={true}
                  hide={true}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default SentimentLineChart;