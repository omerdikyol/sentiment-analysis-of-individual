import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  Typography, 
  Box, 
  styled
} from '@mui/material';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Cell 
} from 'recharts';
import { motion } from 'framer-motion';
import ChartModal from './ChartModal';
import { useNavigate } from 'react-router-dom';

const StyledCard = styled(Card)(({ theme }) => ({
  height: '100%',
  cursor: 'pointer',
  transition: 'transform 0.2s ease-in-out',
  '&:hover': {
    transform: 'scale(1.02)',
  },
}));

// Colors for bars
const COLORS = [
  '#8884d8', // Purple
  '#82ca9d', // Green
  '#ffc658', // Yellow
  '#ff7300', // Orange
  '#0088fe', // Blue
  '#00C49F', // Teal
  '#FFBB28', // Gold
  '#FF8042', // Coral
  '#a4de6c', // Light Green
  '#d0ed57'  // Lime
];

const CountryBarChart = ({ mentionsByCountry }) => {
  const [animatedData, setAnimatedData] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();
  
  useEffect(() => {
    if (mentionsByCountry && mentionsByCountry.length > 0) {
      const timeout = setTimeout(() => {
        const topCountries = [...mentionsByCountry]
          .sort((a, b) => b.total - a.total)
          .slice(0, 10);
        setAnimatedData(topCountries);
      }, 300);
      
      return () => clearTimeout(timeout);
    }
  }, [mentionsByCountry]);
  
  if (!mentionsByCountry || mentionsByCountry.length === 0) {
    return (
      <Card sx={{ height: '100%', boxShadow: 3, borderRadius: 2 }}>
        <CardContent>
          <Typography variant="h6">Mentions by Country</Typography>
          <Typography variant="body2">No data available</Typography>
        </CardContent>
      </Card>
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
            border: 'none',
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          }}
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
            {data.country}
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: 'bold', color: payload[0].color }}>
            {`Total Mentions: ${data.total.toLocaleString()}`}
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
  
  const handleCardClick = () => {
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
  };
  
  const handleBarClick = (data) => {
    // Navigate to sentiment data page with country filter
    if (data && data.country) {
      navigate('/sentiment-data', { 
        state: { 
          countryFilter: data.country 
        } 
      });
    }
  };

  const renderChart = (containerHeight = '100%', clickable = false) => (
    <ResponsiveContainer width="100%" height={containerHeight}>
      <BarChart
        data={animatedData}
        margin={{ top: 10, right: 30, left: 0, bottom: 60 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
        <XAxis
          dataKey="country"
          angle={-45}
          textAnchor="end"
          height={60}
          interval={0}
          tick={{ fontSize: 12 }}
        />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip content={CustomTooltip} />
        <Bar 
          dataKey="total" 
          radius={[4, 4, 0, 0]}
          cursor={clickable ? 'pointer' : 'default'}
          onClick={clickable ? handleBarClick : null}
        >
          {animatedData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
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
              Mentions by Country
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
        title="Country Distribution - Detailed View"
        subtitle="Click on any bar to see mentions for that country"
      >
        {renderChart('100%', true)}
      </ChartModal>
    </>
  );
};

export default CountryBarChart;