import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Chip,
} from '@mui/material';
import { useLocation } from 'react-router-dom';
import SentimentDataTable from './SentimentDataTable';

const SentimentDataPage = () => {
  const location = useLocation();
  const sentimentFilter = location.state?.sentimentFilter || null;
  const sourceFilter = location.state?.sourceFilter || null;
  const dateFilter = location.state?.dateFilter || null;
  const countryFilter = location.state?.countryFilter || null;
  const textFilter = location.state?.textFilter || null;
  
  useEffect(() => {
    // When the page loads with any filter, scroll to table section
    if (sentimentFilter || sourceFilter || dateFilter || countryFilter || textFilter) {
      const tableElement = document.getElementById('sentiment-data-table');
      if (tableElement) {
        tableElement.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [sentimentFilter, sourceFilter, dateFilter, countryFilter, textFilter]);
  
  // Determine the active filter for header display
  const getActiveFilterText = () => {
    if (sentimentFilter) return `${sentimentFilter} sentiment`;
    if (sourceFilter) return `source: ${sourceFilter}`;
    if (dateFilter) {
      if (typeof dateFilter === 'string') return `date: ${dateFilter}`;
      return `date range: ${dateFilter.start} - ${dateFilter.end}`;
    }
    if (countryFilter) return `country: ${countryFilter}`;
    if (textFilter) return `containing: ${textFilter}`;
    return null;
  };
  
  const getFilterColor = () => {
    if (sentimentFilter === 'positive') return 'success';
    if (sentimentFilter === 'negative') return 'error';
    if (sentimentFilter === 'neutral') return 'primary';
    if (sourceFilter) return 'info';
    if (dateFilter) return 'warning';
    if (countryFilter) return 'success';
    if (textFilter) return 'default';
    return 'primary';
  };
  
  const activeFilterText = getActiveFilterText();
  
  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 600 }}>
        Sentiment Data Analysis
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Comprehensive view of sentiment data across various sources, platforms, and time periods.
      </Typography>
      
      {activeFilterText && (
        <Box sx={{ mb: 3 }}>
          <Chip 
            label={`Filtered by ${activeFilterText}`}
            color={getFilterColor()}
            onDelete={() => window.location.href = '/sentiment-data'}
            sx={{ fontWeight: 500 }}
          />
        </Box>
      )}
      
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
            <CardContent>
              <Typography variant="h6" component="div" gutterBottom>
                Data Overview
              </Typography>
              <Typography variant="body2" color="text.secondary">
                This table displays sentiment analysis data from various sources including news papers, TV channels, and social media platforms.
                The sentiment is categorized as positive, negative, or neutral based on content analysis.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
            <CardContent>
              <Typography variant="h6" component="div" gutterBottom>
                Usage Guide
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Use the search bar to filter data by content, author, source, or platform.
                Click on column headers to sort the data.
                Adjust rows per page using the pagination controls at the bottom.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
            <CardContent>
              <Typography variant="h6" component="div" gutterBottom>
                Data Source
              </Typography>
              <Typography variant="body2" color="text.secondary">
                This dashboard integrates sentiment analysis results from multiple platforms and sources including social media, news outlets, and online publications.
                The data is continuously monitored and updated to provide the most current sentiment insights.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      <Box id="sentiment-data-table" sx={{ mb: 4 }}>
        <SentimentDataTable 
          initialSentimentFilter={sentimentFilter}
          initialSourceFilter={sourceFilter}
          initialDateFilter={dateFilter}
          initialCountryFilter={countryFilter}
          initialTextFilter={textFilter}
        />
      </Box>
    </Container>
  );
};

export default SentimentDataPage; 