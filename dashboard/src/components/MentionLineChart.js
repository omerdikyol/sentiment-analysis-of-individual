import React, { useState, useEffect } from 'react';
import { Card, CardContent, Typography, Box } from '@mui/material';
import { motion } from 'framer-motion';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart
} from 'recharts';

const MentionLineChart = ({ mentionsByDate }) => {
  const [animatedData, setAnimatedData] = useState([]);
  
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

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
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
          <Typography variant="body1" sx={{ fontWeight: 'bold', color: payload[0].color }}>
            {`Mentions: ${payload[0].value}`}
          </Typography>
        </Box>
      );
    }
    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <Card sx={{ 
        height: '100%', 
        boxShadow: 3, 
        borderRadius: 2,
        background: 'linear-gradient(135deg, #ffffff 0%, #f0f7ff 100%)',
        transition: 'all 0.3s ease'
      }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>Mentions Over Time</Typography>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={animatedData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <defs>
                  <linearGradient id="mentionColorGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="rgba(75, 192, 192, 0.8)" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="rgba(75, 192, 192, 0.2)" stopOpacity={0.2} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis 
                  dataKey="date"
                  tickFormatter={(date) => new Date(date).toLocaleDateString()}
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  tickFormatter={(value) => value.toLocaleString()}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ paddingTop: '10px' }} />
                <Area 
                  type="monotone" 
                  dataKey="count"
                  stroke="rgba(75, 192, 192, 1)"
                  strokeWidth={3}
                  fill="url(#mentionColorGradient)"
                  activeDot={{ 
                    r: 6, 
                    stroke: '#fff',
                    strokeWidth: 2,
                    fill: 'rgba(75, 192, 192, 1)'
                  }}
                  name="Mentions" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default MentionLineChart;