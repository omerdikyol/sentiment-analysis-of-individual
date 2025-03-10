import React from 'react';
import { Card, CardContent, Typography, Box } from '@mui/material';
import { motion } from 'framer-motion';
import CountUp from 'react-countup';

const MetricCard = ({ title, value, icon, color }) => {
  const isNumber = !isNaN(parseFloat(value)) && isFinite(value);
  const numericValue = isNumber ? parseFloat(value) : 0;
  const hasPercentage = isNumber && String(value).includes('%');
  const displayValue = hasPercentage ? numericValue : value;
  
  return (
    <motion.div
      whileHover={{ 
        scale: 1.03,
        transition: { duration: 0.2 }
      }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card 
        sx={{ 
          height: '100%', 
          boxShadow: 3, 
          borderRadius: 2,
          background: `linear-gradient(135deg, #ffffff 0%, ${color ? color + '10' : '#f5f5f5'} 100%)`,
          transition: 'all 0.3s ease-in-out'
        }}
      >
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            {icon && (
              <motion.div
                initial={{ rotate: -10, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                <Box sx={{ 
                  mr: 1, 
                  display: 'flex', 
                  alignItems: 'center', 
                  color: color || 'primary.main' 
                }}>
                  {icon}
                </Box>
              </motion.div>
            )}
            <Typography variant="h6" component="div" sx={{ color: 'text.secondary' }}>
              {title}
            </Typography>
          </Box>
          <Typography variant="h4" component="div" sx={{ fontWeight: 'bold', color: color || 'text.primary' }}>
            {isNumber ? (
              <>
                <CountUp 
                  end={numericValue} 
                  duration={2.5}
                  decimals={hasPercentage ? 1 : 0}
                />
                {hasPercentage && '%'}
              </>
            ) : (
              value
            )}
          </Typography>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default MetricCard;