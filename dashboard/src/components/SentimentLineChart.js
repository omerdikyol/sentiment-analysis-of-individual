import React, { useState, useEffect } from 'react';
import { Card, CardContent, Typography, Box, styled, Tooltip, IconButton } from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import { motion } from 'framer-motion';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, Area, AreaChart
} from 'recharts';
import ChartModal from './ChartModal';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const StyledCard = styled(Card)(({ theme }) => ({
  height: '100%',
  cursor: 'pointer',
  transition: 'transform 0.2s ease-in-out',
  '&:hover': {
    transform: 'scale(1.02)',
  },
}));

// Helper function to format date to M/D/YYYY
const formatDate = (dateString) => {
  const date = new Date(dateString);
  return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
};

const SentimentLineChart = ({ sentimentByDate }) => {
  const [animatedData, setAnimatedData] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  useEffect(() => {
    if (sentimentByDate && sentimentByDate.length > 0) {
      // Start with empty data points
      setAnimatedData([]);
      
      // Animate data points appearing one by one
      sentimentByDate.forEach((item, index) => {
        setTimeout(() => {
          setAnimatedData(prev => [...prev, {
            ...item,
            formattedDate: formatDate(item.date) // Add formatted date
          }]);
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
  
  const handleDataPointClick = (data) => {
    if (data && data.activePayload && data.activePayload.length > 0) {
      const clickedData = data.activePayload[0].payload;
      navigate('/sentiment-data', { 
        state: { 
          dateFilter: clickedData.formattedDate // Use formatted date
        } 
      });
    }
  };

  if (!sentimentByDate || sentimentByDate.length === 0) {
    return (
      <Card sx={{ height: '100%', boxShadow: 3, borderRadius: 2 }}>
        <CardContent>
          <Typography variant="h6">
            {t('charts.sentimentOverTime')}
            <Tooltip title={t('charts.sentimentOverTimeTooltip')}>
              <IconButton size="small" sx={{ ml: 1 }}>
                <InfoIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Typography>
          <Typography variant="body2">{t('general.noData')}</Typography>
        </CardContent>
      </Card>
    );
  }

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      // Find the data point that matches the label
      const dataPoint = animatedData.find(item => item.formattedDate === label);
      
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
            {`${t('charts.averageSentiment')}: ${(payload[0].value)}%`}
          </Typography>
          {dataPoint && (
            <Box sx={{ mt: 1 }}>
              <Typography variant="body2" sx={{ color: 'rgba(75, 192, 192, 1)' }}>
                {t('sentiments.positive')}: {dataPoint.positive}
              </Typography>
              <Typography variant="body2" sx={{ color: '#2196f3' }}>
                {t('sentiments.neutral')}: {dataPoint.neutral || 0}
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255, 99, 132, 1)' }}>
                {t('sentiments.negative')}: {dataPoint.negative}
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

  const renderChart = (containerHeight = '100%', clickable = false) => (
    <ResponsiveContainer width="100%" height={containerHeight}>
      <LineChart
        data={animatedData}
        margin={{ top: 10, right: 30, left: 0, bottom: 20 }}
        onClick={clickable ? handleDataPointClick : undefined}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
        <XAxis
          dataKey="formattedDate"
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
          cursor={clickable ? { stroke: '#ccc', strokeWidth: 2 } : undefined}
        />
        <Legend formatter={(value) => {
          if (value === 'positive') return t('sentiments.positive');
          if (value === 'negative') return t('sentiments.negative');
          if (value === 'neutral') return t('sentiments.neutral');
          return value;
        }} />
        <Line
          type="monotone"
          dataKey="positive"
          stroke="#4caf50"
          strokeWidth={2}
          dot={{ r: 3 }}
          name="positive"
          activeDot={clickable ? { 
            r: 6, 
            strokeWidth: 2, 
            onClick: (e, payload) => {
              navigate('/sentiment-data', { 
                state: { 
                  dateFilter: payload.payload.formattedDate,
                  sentimentFilter: 'positive'
                } 
              });
            } 
          } : { r: 5 }}
        />
        <Line
          type="monotone"
          dataKey="negative"
          stroke="#f44336"
          strokeWidth={2}
          dot={{ r: 3 }}
          name="negative"
          activeDot={clickable ? { 
            r: 6, 
            strokeWidth: 2, 
            onClick: (e, payload) => {
              navigate('/sentiment-data', { 
                state: { 
                  dateFilter: payload.payload.formattedDate,
                  sentimentFilter: 'negative'
                } 
              });
            } 
          } : { r: 5 }}
        />
        <Line
          type="monotone"
          dataKey="neutral"
          stroke="#9e9e9e"
          strokeWidth={2}
          dot={{ r: 3 }}
          name="neutral"
          activeDot={clickable ? { 
            r: 6, 
            strokeWidth: 2, 
            onClick: (e, payload) => {
              navigate('/sentiment-data', { 
                state: { 
                  dateFilter: payload.payload.formattedDate,
                  sentimentFilter: 'neutral'
                } 
              });
            } 
          } : { r: 5 }}
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
              {t('charts.sentimentOverTime')}
              <Tooltip title={t('charts.sentimentOverTimeTooltip')}>
                <IconButton size="small" sx={{ ml: 1 }}>
                  <InfoIcon fontSize="small" />
                </IconButton>
              </Tooltip>
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
        title={t('charts.sentimentTrendsDetailed')}
        subtitle={t('charts.clickDataPointSentiment')}
      >
        {renderChart('100%', true)}
      </ChartModal>
    </>
  );
};

export default SentimentLineChart;