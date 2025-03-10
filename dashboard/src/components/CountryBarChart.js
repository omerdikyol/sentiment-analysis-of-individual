import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  Typography, 
  Box, 
  useTheme 
} from '@mui/material';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  Cell 
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { Public as PublicIcon } from '@mui/icons-material';

const CountryBarChart = ({ mentionsByCountry }) => {
  const theme = useTheme();
  const [animatedData, setAnimatedData] = useState([]);
  
  // Colors for the bars
  const COLORS = [
    theme.palette.primary.main,
    theme.palette.secondary.main,
    '#4caf50',
    '#ff9800',
    '#9c27b0',
    '#00acc1',
    '#f44336',
    '#3f51b5',
    '#e91e63'
  ];
  
  useEffect(() => {
    if (mentionsByCountry && mentionsByCountry.length > 0) {
      // Add a small delay to ensure component is mounted
      const timeout = setTimeout(() => {
        setAnimatedData(mentionsByCountry.slice(0, 10)); // Show top 10 countries
      }, 300);
      
      return () => clearTimeout(timeout);
    }
  }, [mentionsByCountry]);
  
  if (!mentionsByCountry || mentionsByCountry.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <Card sx={{ height: '100%', boxShadow: 3, borderRadius: 2 }}>
          <CardContent>
            <Typography variant="h6">Mentions by Country</Typography>
            <Typography variant="body2">No data available</Typography>
          </CardContent>
        </Card>
      </motion.div>
    );
  }
  
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      
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
            {data.country}
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
            {`Total Mentions: ${data.total}`}
          </Typography>
          <Box sx={{ mt: 1 }}>
            <Typography variant="body2" sx={{ color: '#4caf50' }}>
              Positive: {data.positive} ({data.positivePercentage}%)
            </Typography>
            <Typography variant="body2" sx={{ color: '#2196f3' }}>
              Neutral: {data.neutral} ({data.neutralPercentage}%)
            </Typography>
            <Typography variant="body2" sx={{ color: '#f44336' }}>
              Negative: {data.negative} ({data.negativePercentage}%)
            </Typography>
          </Box>
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
      <Card 
        sx={{ 
          height: '100%', 
          boxShadow: 3, 
          borderRadius: 2,
          background: 'linear-gradient(135deg, #ffffff 0%, #f8f9ff 100%)',
          transition: 'all 0.3s ease'
        }}
      >
        <CardContent>
          <Box display="flex" alignItems="center" mb={1}>
            <PublicIcon sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="h6">Mentions by Country</Typography>
          </Box>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
            Distribution of mentions across different countries
          </Typography>
          
          <div style={{ height: '400px', width: '100%' }}>
            <AnimatePresence>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={animatedData}
                  layout="vertical"
                  margin={{ top: 20, right: 30, left: 90, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                  <XAxis 
                    type="number"
                    tickFormatter={(value) => value.toLocaleString()}
                  />
                  <YAxis 
                    dataKey="country" 
                    type="category"
                    tickFormatter={(value) => value === 'Unknown' ? 'Unknown Country' : value}
                    width={80}
                    tick={{
                      fontSize: 12,
                      textAnchor: 'end',
                      width: 80
                    }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar 
                    dataKey="total" 
                    name="Total Mentions"
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
            </AnimatePresence>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default CountryBarChart;