import React from 'react';
import { 
  Card, 
  CardContent, 
  Typography, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  Paper,
  Box,
  Chip
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';

const SentimentTable = ({ topSentiment, bottomSentiment, title }) => {
  const renderSentiment = (sentiment) => {
    let color = 'primary';
    if (sentiment === 'positive') color = 'success';
    if (sentiment === 'negative') color = 'error';
    
    return (
      <Chip 
        label={sentiment.charAt(0).toUpperCase() + sentiment.slice(1)} 
        color={color} 
        size="small"
        sx={{ fontWeight: 'bold' }}
      />
    );
  };

  const renderTableData = (data) => {
    if (!data || data.length === 0) {
      return (
        <TableRow>
          <TableCell colSpan={4}>No data available</TableCell>
        </TableRow>
      );
    }

    return data.map((item, index) => (
      <motion.tr
        component={TableRow}
        key={index}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: index * 0.1 }}
        sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
        whileHover={{ 
          backgroundColor: 'rgba(0, 0, 0, 0.04)',
          transition: { duration: 0.2 }
        }}
      >
        <TableCell>
          {renderSentiment(item.sentiment_label)}
        </TableCell>
        <TableCell>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
          >
            <Box 
              sx={{ 
                backgroundColor: item.sentiment_label === 'positive' ? 'rgba(76, 175, 80, 0.1)' : 
                                  item.sentiment_label === 'negative' ? 'rgba(244, 67, 54, 0.1)' : 
                                  'rgba(33, 150, 243, 0.1)',
                borderRadius: 2,
                p: 1,
                textAlign: 'center',
                fontWeight: 'bold'
              }}
            >
              {(parseFloat(item.sentiment_score) * 100).toFixed(1)}
            </Box>
          </motion.div>
        </TableCell>
        <TableCell>
          <Typography 
            noWrap 
            sx={{ 
              maxWidth: 300,
              textOverflow: 'ellipsis',
              overflow: 'hidden'
            }}
          >
            {item.text ? item.text.substring(0, 100) + (item.text.length > 100 ? '...' : '') : 'N/A'}
          </Typography>
        </TableCell>
        <TableCell>
          <Chip 
            label={item.source || 'Unknown'} 
            variant="outlined" 
            size="small"
          />
        </TableCell>
      </motion.tr>
    ));
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay: 0.3 }}
    >
      <Card 
        sx={{ 
          height: '100%', 
          boxShadow: 3, 
          borderRadius: 2,
          background: title.includes('Highest') 
            ? 'linear-gradient(135deg, #ffffff 0%, #e8f5e9 100%)' 
            : 'linear-gradient(135deg, #ffffff 0%, #ffebee 100%)',
          transition: 'all 0.3s ease-in-out'
        }}
      >
        <CardContent>
          <Typography 
            variant="h6" 
            sx={{ 
              mb: 2,
              display: 'flex',
              alignItems: 'center'
            }}
          >
            {title}
            <motion.div
              animate={{ rotate: [0, 5, 0, -5, 0] }}
              transition={{ repeat: Infinity, duration: 5, repeatDelay: 3 }}
              style={{ display: 'inline-block', marginLeft: '8px' }}
            >
              {title.includes('Highest') ? '🔝' : '🔻'}
            </motion.div>
          </Typography>
          <TableContainer 
            component={Paper} 
            sx={{ 
              maxHeight: 400, 
              overflow: 'auto', 
              boxShadow: 1,
              borderRadius: 2 
            }}
          >
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>Sentiment</TableCell>
                  <TableCell>Score</TableCell>
                  <TableCell>Text</TableCell>
                  <TableCell>Source</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <AnimatePresence>
                  {renderTableData(title.includes('Highest') ? topSentiment : bottomSentiment)}
                </AnimatePresence>
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default SentimentTable;