import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Typography,
  Chip,
  CircularProgress,
  TextField,
  InputAdornment,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  Divider,
  Avatar,
  Link,
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterListIcon,
  Close as CloseIcon,
  CalendarToday as CalendarIcon,
  Source as SourceIcon,
  Person as PersonIcon,
  Language as LanguageIcon,
  LocationOn as LocationIcon,
} from '@mui/icons-material';
import Papa from 'papaparse';

const SentimentDataTable = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredData, setFilteredData] = useState([]);
  const [selectedRow, setSelectedRow] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/processed_data.csv');
        const csvText = await response.text();
        
        Papa.parse(csvText, {
          header: true,
          complete: (results) => {
            console.log('CSV parsing complete, rows:', results.data.length);
            
            const processedData = results.data
              // Remove empty rows or rows without essential data
              .filter(row => {
                // Check if the row has any meaningful content
                return row.text || row.content || row.description;
              })
              .map(row => {
                // Process location data
                let country = row.country;
                const text = (row.text || '').toLowerCase();
                const source = (row.source || '').toLowerCase();
                
                // If country is missing or unknown, try to determine it
                if (!country || country === 'unknown') {
                  if (text.includes('qatar') || source.includes('qatar') || 
                      text.includes('doha') || text.includes('al wakrah') || 
                      text.includes('lusail')) {
                    country = 'Qatar';
                  } else if (text.includes('uae') || text.includes('emirates') || 
                            text.includes('dubai') || text.includes('abu dhabi')) {
                    country = 'UAE';
                  } else if (text.includes('uk') || text.includes('britain') || 
                            text.includes('london') || text.includes('manchester') ||
                            source.includes('bbc')) {
                    country = 'UK';
                  } else if (text.includes('us') || text.includes('united states') || 
                            text.includes('america') || source.includes('cnn') ||
                            source.includes('fox')) {
                    country = 'US';
                  }
                }

                return {
                  date: formatDate(row.published_date || row.date),
                  source: row.source_name || row.source || 'Unknown',
                  platform: row.platform || 'Unknown',
                  sentiment: row.sentiment_label || 'Unknown',
                  content: row.content || row.text || row.description || '',
                  author: row.user_name || row.user_handle || 'Unknown',
                  sentimentScore: parseFloat(row.sentiment_score) || 0,
                  location: country || 'Qatar', // Use determined country
                  country: country || 'Qatar',
                  // Store original data for detailed view
                  originalData: { ...row }
                };
              });
            
            console.log('Processed data rows:', processedData.length);
            setData(processedData);
            setFilteredData(processedData);
            setLoading(false);
          },
          error: (error) => {
            console.error('Error parsing CSV:', error);
            setLoading(false);
          }
        });
      } catch (error) {
        console.error('Error fetching data:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Helper function to format date
  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    
    try {
      const date = new Date(dateString);
      // Check if date is valid
      if (isNaN(date.getTime())) return dateString;
      return date.toLocaleDateString();
    } catch (e) {
      return dateString;
    }
  };

  useEffect(() => {
    if (searchTerm) {
      const filtered = data.filter(item => 
        (item.content && item.content.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.author && item.author.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.source && item.source.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.platform && item.platform.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredData(filtered);
      setPage(0);
    } else {
      setFilteredData(data);
    }
  }, [searchTerm, data]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const getSentimentColor = (sentiment) => {
    if (!sentiment) return { bg: '#f5f5f5', color: '#757575' };
    
    switch (sentiment.toLowerCase()) {
      case 'positive':
        return { bg: '#e6f7e9', color: '#2e7d32' };
      case 'negative':
        return { bg: '#fdecea', color: '#d32f2f' };
      case 'neutral':
        return { bg: '#e3f2fd', color: '#1976d2' };
      default:
        return { bg: '#f5f5f5', color: '#757575' };
    }
  };

  const handleRowClick = (row) => {
    setSelectedRow(row);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" component="div" sx={{ fontWeight: 500 }}>
          Sentiment Data {filteredData.length > 0 && `(${filteredData.length} records)`}
        </Typography>
        <TextField
          size="small"
          placeholder="Search..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                <IconButton size="small">
                  <FilterListIcon fontSize="small" />
                </IconButton>
              </InputAdornment>
            ),
          }}
          sx={{ width: '300px' }}
        />
      </Box>
      <Paper sx={{ width: '100%', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
        <TableContainer sx={{ maxHeight: 'calc(100vh - 250px)' }}>
          <Table stickyHeader aria-label="sentiment data table">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>Date</TableCell>
                <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>Source</TableCell>
                <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>Platform</TableCell>
                <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>Sentiment</TableCell>
                <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>Content</TableCell>
                <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>Source/User</TableCell>
                <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>Location</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredData.length > 0 ? (
                filteredData
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((row, index) => {
                    const sentimentStyle = getSentimentColor(row.sentiment);
                    return (
                      <TableRow 
                        hover 
                        key={index} 
                        onClick={() => handleRowClick(row)}
                        sx={{ cursor: 'pointer' }}
                      >
                        <TableCell>{row.date}</TableCell>
                        <TableCell>{row.source}</TableCell>
                        <TableCell>{row.platform}</TableCell>
                        <TableCell>
                          <Chip 
                            label={row.sentiment} 
                            size="small"
                            sx={{ 
                              backgroundColor: sentimentStyle.bg, 
                              color: sentimentStyle.color,
                              fontWeight: 500
                            }} 
                          />
                        </TableCell>
                        <TableCell>
                          <Typography
                            variant="body2"
                            sx={{
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              maxWidth: '400px'
                            }}
                          >
                            {row.content}
                          </Typography>
                        </TableCell>
                        <TableCell>{row.author}</TableCell>
                        <TableCell>{row.location || 'Unknown Location'}</TableCell>
                      </TableRow>
                    );
                  })
              ) : (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                    No data found. Please check the CSV file format or try adjusting the filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[10, 25, 50, 100]}
          component="div"
          count={filteredData.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>

      {/* Detail Dialog */}
      <Dialog 
        open={dialogOpen} 
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        {selectedRow && (
          <>
            <DialogTitle sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              borderBottom: '1px solid #e0e0e0',
              pb: 2
            }}>
              <Typography variant="h6">Sentiment Data Details</Typography>
              <IconButton onClick={handleCloseDialog} size="small">
                <CloseIcon />
              </IconButton>
            </DialogTitle>
            <DialogContent sx={{ py: 3 }}>
              <Grid container spacing={3}>
                {/* Header Information */}
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar 
                      sx={{ 
                        bgcolor: getSentimentColor(selectedRow.sentiment).bg,
                        color: getSentimentColor(selectedRow.sentiment).color,
                        width: 56,
                        height: 56,
                        mr: 2
                      }}
                    >
                      {selectedRow.sentiment.charAt(0).toUpperCase()}
                    </Avatar>
                    <Box>
                      <Typography variant="h6" gutterBottom>
                        {selectedRow.author}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Chip 
                          label={selectedRow.sentiment} 
                          size="small"
                          sx={{ 
                            backgroundColor: getSentimentColor(selectedRow.sentiment).bg, 
                            color: getSentimentColor(selectedRow.sentiment).color,
                            fontWeight: 500
                          }} 
                        />
                        <Typography variant="body2" color="text.secondary">
                          Sentiment Score: {selectedRow.sentimentScore.toFixed(2)}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </Grid>

                {/* Content */}
                <Grid item xs={12}>
                  <Paper variant="outlined" sx={{ p: 2, mb: 3, backgroundColor: '#f9f9f9' }}>
                    <Typography variant="body1">
                      {selectedRow.content}
                    </Typography>
                  </Paper>
                </Grid>

                {/* Metadata */}
                <Grid item xs={12} md={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <CalendarIcon sx={{ mr: 1, color: 'text.secondary' }} />
                    <Typography variant="body2">
                      <strong>Date:</strong> {selectedRow.date}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <SourceIcon sx={{ mr: 1, color: 'text.secondary' }} />
                    <Typography variant="body2">
                      <strong>Source:</strong> {selectedRow.source}
                    </Typography>
                  </Box>
                  {selectedRow.originalData.url && (
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                      <LanguageIcon sx={{ mr: 1, mt: 0.5, color: 'text.secondary' }} />
                      <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
                        <strong>URL:</strong> {selectedRow.originalData.url}
                      </Typography>
                    </Box>
                  )}
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <LanguageIcon sx={{ mr: 1, color: 'text.secondary' }} />
                    <Typography variant="body2">
                      <strong>Platform:</strong> {selectedRow.platform}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <PersonIcon sx={{ mr: 1, color: 'text.secondary' }} />
                    <Typography variant="body2">
                      <strong>Author:</strong> {selectedRow.author}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <LocationIcon sx={{ mr: 1, color: 'text.secondary' }} />
                    <Typography variant="body2">
                      <strong>Location:</strong> {selectedRow.location}
                    </Typography>
                  </Box>
                </Grid>

                {/* Additional Data */}
                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="subtitle1" gutterBottom>
                    Additional Information
                  </Typography>
                  <Grid container spacing={2}>
                    {Object.entries(selectedRow.originalData)
                      .filter(([key, value]) => 
                        value && 
                        typeof value === 'string' && 
                        !['content', 'text', 'description', 'published_date', 'date', 'source', 'platform', 'sentiment_label', 'user_name', 'user_handle'].includes(key)
                      )
                      .slice(0, 8) // Limit to 8 additional fields
                      .map(([key, value]) => (
                        <Grid item xs={12} sm={6} md={3} key={key}>
                          <Typography variant="caption" color="text.secondary" component="div">
                            {key.replace(/_/g, ' ').toUpperCase()}
                          </Typography>
                          <Typography variant="body2" noWrap>
                            {value}
                          </Typography>
                        </Grid>
                      ))
                    }
                  </Grid>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid #e0e0e0' }}>
              {selectedRow.originalData.url && (
                <Button 
                  href={selectedRow.originalData.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  color="primary"
                >
                  View Original Source
                </Button>
              )}
              <Button onClick={handleCloseDialog} color="primary" variant="contained">
                Close
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default SentimentDataTable; 