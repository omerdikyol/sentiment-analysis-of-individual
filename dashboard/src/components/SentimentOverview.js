import React from 'react';
import { Box, Typography, useTheme } from '@mui/material';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { motion } from 'framer-motion';

const SentimentOverview = ({ data }) => {
  const theme = useTheme();

  // Sample data for demonstration
  const sampleMetrics = {
    positivePercentage: 14.2,
    neutralPercentage: 74.2,
    negativePercentage: 11.6
  };

  const sentimentData = [
    {
      name: 'Positive',
      value: Number(sampleMetrics.positivePercentage || 0),
      color: theme.palette.success.main,
    },
    {
      name: 'Neutral',
      value: Number(sampleMetrics.neutralPercentage || 0),
      color: theme.palette.grey[400],
    },
    {
      name: 'Negative',
      value: Number(sampleMetrics.negativePercentage || 0),
      color: theme.palette.error.main,
    },
  ];

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const value = Number(payload[0].value);
      return (
        <Box
          sx={{
            backgroundColor: 'background.paper',
            p: 1.5,
            border: 1,
            borderColor: 'divider',
            borderRadius: 1,
            minWidth: 120,
            boxShadow: 2,
            '& .MuiTypography-root': {
              whiteSpace: 'nowrap',
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }
          }}
        >
          <Typography 
            variant="body2" 
            sx={{ 
              color: payload[0].payload.color,
              fontWeight: 'medium'
            }}
          >
            <Box 
              component="span" 
              sx={{ 
                width: 8, 
                height: 8, 
                borderRadius: '50%', 
                backgroundColor: payload[0].payload.color,
                display: 'inline-block'
              }} 
            />
            {`${payload[0].name}: ${isNaN(value) ? '0.0' : value.toFixed(1)}%`}
          </Typography>
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
        Sentiment Overview
      </Typography>
      <Box sx={{ width: '100%', height: 300, position: 'relative' }}>
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={sentimentData}
              cx="50%"
              cy="40%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={2}
              dataKey="value"
            >
              {sentimentData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.color}
                  strokeWidth={1}
                />
              ))}
            </Pie>
            <Tooltip 
              content={<CustomTooltip />}
              wrapperStyle={{ outline: 'none' }}
            />
          </PieChart>
        </ResponsiveContainer>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            gap: 3,
            mt: 2,
            position: 'absolute',
            bottom: 20,
            left: 0,
            right: 0,
          }}
        >
          {sentimentData.map((item) => (
            <Box
              key={item.name}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
              }}
            >
              <Box
                sx={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  backgroundColor: item.color,
                }}
              />
              <Typography variant="body2">
                {`${item.name}: ${isNaN(item.value) ? '0.0' : item.value.toFixed(1)}%`}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>
    </motion.div>
  );
};

export default SentimentOverview; 