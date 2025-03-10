import React, { useState, useEffect } from 'react';
import { Card, CardContent, Typography, Box } from '@mui/material';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const PlatformBarChart = ({ mentionsByPlatform }) => {
  const [animatedData, setAnimatedData] = useState([]);
  
  useEffect(() => {
    if (mentionsByPlatform && mentionsByPlatform.length > 0) {
      // Start with empty data
      setAnimatedData([]);
      
      // Animate bars appearing one by one
      const topPlatforms = [...mentionsByPlatform]
        .slice(0, 10)
        .sort((a, b) => b.count - a.count);
        
      topPlatforms.forEach((item, index) => {
        setTimeout(() => {
          setAnimatedData(prev => [...prev, item]);
        }, index * 100);
      });
    }
  }, [mentionsByPlatform]);

  if (!mentionsByPlatform || mentionsByPlatform.length === 0) {
    return (
      <Card sx={{ height: '100%', boxShadow: 3, borderRadius: 2 }}>
        <CardContent>
          <Typography variant="h6">Mentions by Platform</Typography>
          <Typography variant="body2">No data available</Typography>
        </CardContent>
      </Card>
    );
  }

  // Colors for bars
  const COLORS = [
    'rgba(255, 99, 132, 0.8)',
    'rgba(54, 162, 235, 0.8)',
    'rgba(255, 206, 86, 0.8)',
    'rgba(75, 192, 192, 0.8)',
    'rgba(153, 102, 255, 0.8)',
    'rgba(255, 159, 64, 0.8)',
    'rgba(199, 199, 199, 0.8)',
    'rgba(83, 102, 255, 0.8)',
    'rgba(40, 159, 64, 0.8)',
    'rgba(210, 199, 199, 0.8)'
  ];

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
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
            {label === 'unknown' ? 'Unknown' : label}
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: 'bold', color: payload[0].color }}>
            {`Mentions: ${payload[0].value.toLocaleString()}`}
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
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <Card sx={{ 
        height: '100%', 
        boxShadow: 3, 
        borderRadius: 2,
        background: 'linear-gradient(135deg, #ffffff 0%, #f5f5f5 100%)',
        transition: 'all 0.3s ease'
      }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>Mentions by Platform</Typography>
          <div style={{ height: '400px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={animatedData}
                margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
                layout="vertical"
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                <XAxis 
                  type="number"
                  tickFormatter={(value) => value.toLocaleString()}
                />
                <YAxis 
                  dataKey="platform" 
                  type="category"
                  tickFormatter={(value) => value === 'unknown' ? 'Unknown' : value}
                  width={100}
                  tick={{
                    fontSize: 12,
                    textAnchor: 'end',
                    width: 100
                  }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar 
                  dataKey="count" 
                  name="Mentions"
                  animationDuration={1000}
                  animationEasing="ease-in-out"
                  radius={[0, 4, 4, 0]}
                >
                  {animatedData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={COLORS[index % COLORS.length]} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default PlatformBarChart;