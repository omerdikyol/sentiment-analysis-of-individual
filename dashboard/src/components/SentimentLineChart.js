import React, { useState, useEffect } from 'react';
import { Card, CardContent, Typography, Box, styled } from '@mui/material';
import { motion } from 'framer-motion';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart
} from 'recharts';
import ChartModal from './ChartModal';

const StyledCard = styled(Card)(({ theme }) => ({
  height: '100%',
  cursor: 'pointer',
  transition: 'transform 0.2s ease-in-out',
  '&:hover': {
    transform: 'scale(1.02)',
  },
}));

const SentimentLineChart = ({ sentimentByDate }) => {
  const [animatedData, setAnimatedData] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
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

  const handleCardClick = () => {
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
  };

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

  const renderChart = (containerHeight = '100%') => (
    <ResponsiveContainer width="100%" height={containerHeight}>
      <LineChart
        data={animatedData}
        margin={{ top: 10, right: 30, left: 0, bottom: 20 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
        <XAxis
          dataKey="date"
          angle={-45}
          textAnchor="end"
          height={60}
          tick={{ fontSize: 12 }}
        />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip
          contentStyle={{
            backgroundColor: '#fff',
            border: 'none',
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          }}
        />
        <Legend />
        <Line
          type="monotone"
          dataKey="positive"
          stroke="#4caf50"
          strokeWidth={2}
          dot={{ r: 3 }}
          activeDot={{ r: 5 }}
        />
        <Line
          type="monotone"
          dataKey="negative"
          stroke="#f44336"
          strokeWidth={2}
          dot={{ r: 3 }}
          activeDot={{ r: 5 }}
        />
        <Line
          type="monotone"
          dataKey="neutral"
          stroke="#9e9e9e"
          strokeWidth={2}
          dot={{ r: 3 }}
          activeDot={{ r: 5 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <StyledCard onClick={handleCardClick}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Sentiment Trends
            </Typography>
            <Box sx={{ height: 300, mt: 2 }}>
              {renderChart('100%')}
            </Box>
          </CardContent>
        </StyledCard>
      </motion.div>

      <ChartModal
        open={isModalOpen}
        onClose={handleModalClose}
        title="Sentiment Trends - Detailed View"
      >
        {renderChart('100%')}
      </ChartModal>
    </>
  );
};

export default SentimentLineChart;