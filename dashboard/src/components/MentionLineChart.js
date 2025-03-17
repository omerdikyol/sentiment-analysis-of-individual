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

const MentionLineChart = ({ mentionsByDate }) => {
  const [animatedData, setAnimatedData] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  useEffect(() => {
    if (mentionsByDate && mentionsByDate.length > 0) {
      // Start with empty data points
      setAnimatedData([]);
      
      // Animate data points appearing one by one
      mentionsByDate.forEach((item, index) => {
        setTimeout(() => {
          setAnimatedData(prev => [...prev, item]);
        }, index * 50);
      });
    }
  }, [mentionsByDate]);

  const handleCardClick = () => {
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
  };

  const renderChart = (containerHeight = '100%') => (
    <ResponsiveContainer width="100%" height={containerHeight}>
      <AreaChart
        data={animatedData}
        margin={{
          top: 10,
          right: 30,
          left: 0,
          bottom: 30
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          dataKey="date"
          tickFormatter={(date) => new Date(date).toLocaleDateString()}
          angle={-60}
          textAnchor="end"
          height={60}
        />
        <YAxis />
        <Tooltip
          contentStyle={{
            backgroundColor: '#fff',
            border: 'none',
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          }}
        />
        <Area
          type="monotone"
          dataKey="count"
          stroke="#8884d8"
          fill="#8884d8"
          fillOpacity={0.3}
          strokeWidth={2}
        />
      </AreaChart>
    </ResponsiveContainer>
  );

  if (!mentionsByDate || mentionsByDate.length === 0) {
    return (
      <Card sx={{ height: '100%', boxShadow: 3, borderRadius: 2 }}>
        <CardContent>
          <Typography variant="h6">Mentions Over Time</Typography>
          <Typography variant="body2">No data available</Typography>
        </CardContent>
      </Card>
    );
  }

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
              Mentions Over Time
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
        title="Mentions Over Time - Detailed View"
      >
        {renderChart('100%')}
      </ChartModal>
    </>
  );
};

export default MentionLineChart;