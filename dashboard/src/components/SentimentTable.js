import React, { useState } from 'react';
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
  Chip,
  Avatar,
  Stack,
  Tooltip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Link,
  Divider,
  Grid,
  styled
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Public as PublicIcon,
  Twitter as TwitterIcon,
  Forum as ForumIcon,
  Newspaper as NewsIcon,
  Person as PersonIcon,
  ContentCopy as ContentCopyIcon,
  Launch as LaunchIcon,
  CalendarToday as CalendarIcon,
  Language as LanguageIcon,
  LocationOn as LocationIcon
} from '@mui/icons-material';

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  borderBottom: `1px solid ${theme.palette.divider}`,
  padding: theme.spacing(2),
  '&.MuiTableCell-head': {
    backgroundColor: theme.palette.background.paper,
    fontWeight: 600,
    position: 'sticky',
    top: 0,
    zIndex: 1,
  },
  '& .source-info': {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
    maxWidth: '200px',
    '& .MuiChip-root': {
      maxWidth: '100%',
      '& .MuiChip-label': {
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        display: 'block'
      }
    }
  }
}));

const StyledTableContainer = styled(TableContainer)(({ theme }) => ({
  maxHeight: 400,
  overflow: 'auto',
  '&::-webkit-scrollbar': {
    width: '8px',
    height: '8px',
  },
  '&::-webkit-scrollbar-track': {
    background: theme.palette.background.default,
    borderRadius: '4px',
  },
  '&::-webkit-scrollbar-thumb': {
    background: theme.palette.grey[300],
    borderRadius: '4px',
    '&:hover': {
      background: theme.palette.grey[400],
    },
  },
}));

const SentimentBadge = styled(Box)(({ theme, sentiment }) => {
  const getColor = () => {
    if (sentiment >= 0.6) return '#4caf50';
    if (sentiment >= 0.3) return '#8bc34a';
    if (sentiment >= 0) return '#ffeb3b';
    if (sentiment >= -0.3) return '#ff9800';
    return '#f44336';
  };

  return {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '4px 8px',
    borderRadius: '4px',
    backgroundColor: `${getColor()}20`,
    color: getColor(),
    fontWeight: 600,
    fontSize: '0.875rem',
  };
});

const SentimentTable = ({ data, title = "Sentiment Analysis", type = 'top' }) => {
  const [selectedItem, setSelectedItem] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);

  const handleRowClick = (item) => {
    setSelectedItem(item);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedItem(null);
  };

  const getSourceIcon = (source) => {
    const sourceLower = (source || '').toLowerCase();
    if (sourceLower.includes('x') || sourceLower.includes('twitter')) return <TwitterIcon />;
    if (sourceLower.includes('news')) return <NewsIcon />;
    if (sourceLower.includes('social')) return <ForumIcon />;
    return <PublicIcon />;
  };

  const getSourceColor = (source) => {
    const sourceLower = (source || '').toLowerCase();
    if (sourceLower.includes('x') || sourceLower.includes('twitter')) return '#1DA1F2';
    if (sourceLower.includes('news')) return '#2196F3';
    if (sourceLower.includes('social')) return '#9C27B0';
    return '#757575';
  };

  const renderSentiment = (sentiment) => {
    let color = 'primary';
    if (sentiment === 'positive') color = 'success';
    if (sentiment === 'negative') color = 'error';
    
    return (
      <Chip 
        label={sentiment.charAt(0).toUpperCase() + sentiment.slice(1)} 
        color={color} 
        size="small"
        sx={{ 
          fontWeight: 'bold',
          minWidth: '90px'
        }}
      />
    );
  };

  const handleCopyText = (text) => {
    navigator.clipboard.writeText(text);
  };

  const renderSourceInfo = (item) => {
    const sourceLower = (item.source || '').toLowerCase();
    const isUserContent = sourceLower.includes('x') || sourceLower.includes('twitter') || sourceLower.includes('social');
    
    return (
      <Stack direction="column" spacing={1} className="source-info">
        <Chip
          icon={getSourceIcon(item.source)}
          label={
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center',
              maxWidth: '100%',
              '& > *': { minWidth: 0 }
            }}>
              <Typography 
                variant="caption" 
                sx={{ 
                  fontWeight: 'bold',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
              >
                {item.source || 'Unknown Source'}
                {item.author && ` • ${item.author}`}
              </Typography>
            </Box>
          }
          sx={{
            backgroundColor: `${getSourceColor(item.source)}15`,
            color: getSourceColor(item.source),
            '& .MuiChip-icon': {
              color: getSourceColor(item.source)
            },
            height: 'auto',
            '& .MuiChip-label': {
              display: 'block',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              py: 0.5
            }
          }}
        />
        {item.date && (
          <Typography 
            variant="caption" 
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 0.5, 
              color: 'text.secondary'
            }}
          >
            <CalendarIcon fontSize="small" />
            {formatDate(item.date)}
          </Typography>
        )}
      </Stack>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const DetailRow = ({ icon, label, value, isLink }) => (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
      {icon}
      <Box>
        <Typography variant="caption" color="text.secondary">
          {label}
        </Typography>
        {isLink ? (
          <Link 
            href={value} 
            target="_blank" 
            rel="noopener noreferrer"
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 0.5,
              color: 'primary.main',
              textDecoration: 'none',
              '&:hover': { textDecoration: 'underline' }
            }}
          >
            {value}
            <LaunchIcon sx={{ fontSize: 14 }} />
          </Link>
        ) : (
          <Typography variant="body2">
            {value}
          </Typography>
        )}
      </Box>
    </Box>
  );

  const renderDetailDialog = () => (
    <Dialog 
      open={openDialog} 
      onClose={handleCloseDialog}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          boxShadow: 3
        }
      }}
    >
      {selectedItem && (
        <>
          <DialogTitle 
            sx={{ 
              pb: 1,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start'
            }}
          >
            <Box>
              <Typography variant="h6" component="div" sx={{ fontWeight: 'bold', mb: 1 }}>
                Mention Details
              </Typography>
              {renderSentiment(selectedItem.sentiment_label)}
            </Box>
            <Box 
              sx={{ 
                backgroundColor: selectedItem.sentiment_label === 'positive' ? 'rgba(76, 175, 80, 0.1)' : 
                                selectedItem.sentiment_label === 'negative' ? 'rgba(244, 67, 54, 0.1)' : 
                                'rgba(33, 150, 243, 0.1)',
                px: 2,
                py: 1,
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}
            >
              <Typography variant="subtitle2" color="text.secondary">
                Sentiment Score
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                {(parseFloat(selectedItem.sentiment_score) * 100).toFixed(1)}
              </Typography>
            </Box>
          </DialogTitle>
          <DialogContent dividers>
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Content
              </Typography>
              <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                {selectedItem.text}
              </Typography>
            </Box>
            
            <Divider sx={{ my: 2 }} />
            
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <DetailRow 
                  icon={getSourceIcon(selectedItem.source)} 
                  label="Source"
                  value={selectedItem.source || 'Unknown'}
                />
                {selectedItem.username && (
                  <DetailRow 
                    icon={<PersonIcon color="primary" />} 
                    label="Username"
                    value={selectedItem.username}
                  />
                )}
                <DetailRow 
                  icon={<CalendarIcon color="primary" />} 
                  label="Date"
                  value={formatDate(selectedItem.date)}
                />
                {selectedItem.location && (
                  <DetailRow 
                    icon={<LocationIcon color="primary" />} 
                    label="Location"
                    value={selectedItem.location}
                  />
                )}
              </Grid>
              <Grid item xs={12} md={6}>
                {selectedItem.url && (
                  <DetailRow 
                    icon={<LanguageIcon color="primary" />} 
                    label="URL"
                    value={selectedItem.url}
                    isLink
                  />
                )}
                {selectedItem.country && (
                  <DetailRow 
                    icon={<PublicIcon color="primary" />} 
                    label="Country"
                    value={selectedItem.country}
                  />
                )}
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button 
              onClick={() => handleCopyText(selectedItem.text)}
              startIcon={<ContentCopyIcon />}
            >
              Copy Text
            </Button>
            {selectedItem.url && (
              <Button
                href={selectedItem.url}
                target="_blank"
                rel="noopener noreferrer"
                startIcon={<LaunchIcon />}
              >
                Open Source
              </Button>
            )}
            <Button 
              onClick={handleCloseDialog}
              variant="contained"
            >
              Close
            </Button>
          </DialogActions>
        </>
      )}
    </Dialog>
  );

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
        onClick={() => handleRowClick(item)}
        sx={{ 
          '&:last-child td, &:last-child th': { border: 0 },
          '&:nth-of-type(odd)': {
            backgroundColor: 'rgba(0, 0, 0, 0.02)',
          },
          '&:hover': {
            backgroundColor: 'rgba(0, 0, 0, 0.04) !important',
            transition: 'all 0.2s ease-in-out',
            cursor: 'pointer'
          }
        }}
      >
        <TableCell sx={{ width: '120px' }}>
          {renderSentiment(item.sentiment_label)}
        </TableCell>
        <TableCell sx={{ width: '100px' }}>
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
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Stack spacing={1} sx={{ flex: 1 }}>
              <Tooltip 
                title={item.text || 'N/A'} 
                placement="top-start"
                sx={{ maxWidth: 'none' }}
                componentsProps={{
                  tooltip: {
                    sx: {
                      bgcolor: 'background.paper',
                      color: 'text.primary',
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 1,
                      p: 1.5,
                      maxWidth: '500px',
                      '& .MuiTooltip-arrow': {
                        color: 'background.paper',
                      },
                    },
                  },
                }}
              >
                <Typography 
                  sx={{ 
                    maxWidth: '100%',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    lineHeight: '1.4em',
                    minHeight: '2.8em',
                    cursor: 'pointer'
                  }}
                >
                  {item.text || 'N/A'}
                </Typography>
              </Tooltip>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <PersonIcon fontSize="small" />
                {item.author || 'Unknown Author'}
                {item.location && item.location !== 'Unknown Location' && (
                  <>
                    <LocationIcon fontSize="small" sx={{ ml: 1 }} />
                    {item.location}
                  </>
                )}
              </Typography>
            </Stack>
            <Tooltip title="Copy text">
              <IconButton 
                size="small" 
                onClick={(e) => {
                  e.stopPropagation();
                  handleCopyText(item.text);
                }}
                sx={{ 
                  opacity: 0.6,
                  '&:hover': { opacity: 1 }
                }}
              >
                <ContentCopyIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </TableCell>
        <TableCell sx={{ width: '200px' }}>
          {renderSourceInfo(item)}
        </TableCell>
      </motion.tr>
    ));
  };

  const posts = type === 'top' ? data?.topSentiment : data?.bottomSentiment;

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
              alignItems: 'center',
              fontWeight: 'bold'
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
          <StyledTableContainer>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <StyledTableCell sx={{ width: '120px' }}>Sentiment</StyledTableCell>
                  <StyledTableCell sx={{ width: '100px' }}>Score</StyledTableCell>
                  <StyledTableCell>Content</StyledTableCell>
                  <StyledTableCell sx={{ width: '200px' }}>Source</StyledTableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <AnimatePresence>
                  {renderTableData(posts)}
                </AnimatePresence>
              </TableBody>
            </Table>
          </StyledTableContainer>
        </CardContent>
      </Card>
      {renderDetailDialog()}
    </motion.div>
  );
};

export default SentimentTable;