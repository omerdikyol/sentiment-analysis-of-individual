import React from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
} from '@mui/material';
import SentimentDataTable from './SentimentDataTable';

const SentimentDataPage = () => {
  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 600 }}>
        Sentiment Data Analysis
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Comprehensive view of sentiment data across various sources, platforms, and time periods.
      </Typography>
      
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
      
      <Box sx={{ mb: 4 }}>
        <SentimentDataTable />
      </Box>
    </Container>
  );
};

export default SentimentDataPage; 