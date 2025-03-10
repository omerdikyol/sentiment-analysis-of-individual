import React from 'react';
import { Box, Grid, Paper, Typography, useTheme } from '@mui/material';
import { useQuery } from 'react-query';
import axios from 'axios';
import { ResponsiveLine } from '@nivo/line';
import { ResponsivePie } from '@nivo/pie';
import { format } from 'date-fns';
import { useWebSocket } from '../contexts/WebSocketContext';
import ControlPanel from './ControlPanel';

const API_BASE_URL = 'http://localhost:8000';

const fetchMetrics = async () => {
  const { data } = await axios.get(`${API_BASE_URL}/metrics`);
  return data.data;
};

const Dashboard: React.FC = () => {
  const theme = useTheme();
  const { lastMessage, isConnected } = useWebSocket();
  const { data: metrics, isLoading } = useQuery('metrics', fetchMetrics, {
    refetchInterval: 60000, // Refetch every minute
  });

  if (isLoading) {
    return <Typography>Loading...</Typography>;
  }

  const sentimentTrends = metrics?.sentiment_trends || [];
  const latestMetrics = sentimentTrends[sentimentTrends.length - 1] || {};

  const lineData = [
    {
      id: 'Average Sentiment',
      data: sentimentTrends.map((metric: any) => ({
        x: format(new Date(metric.timestamp), 'MM/dd HH:mm'),
        y: metric.average_sentiment_score,
      })),
    },
  ];

  const pieData = latestMetrics.sentiment_distribution
    ? Object.entries(latestMetrics.sentiment_distribution).map(([key, value]) => ({
        id: key,
        label: key,
        value: value as number,
      }))
    : [];

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Grid container spacing={3}>
        {/* Connection Status */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2, display: 'flex', alignItems: 'center' }}>
            <Box
              sx={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                bgcolor: isConnected ? 'success.main' : 'error.main',
                mr: 1,
              }}
            />
            <Typography>
              {isConnected ? 'Connected to real-time updates' : 'Disconnected'}
            </Typography>
          </Paper>
        </Grid>

        {/* Control Panel */}
        <Grid item xs={12}>
          <ControlPanel />
        </Grid>

        {/* Metrics Overview */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Overview
            </Typography>
            <Typography>
              Total Records: {latestMetrics.total_records || 0}
            </Typography>
            <Typography>
              Average Sentiment: {(latestMetrics.average_sentiment_score || 0).toFixed(2)}
            </Typography>
          </Paper>
        </Grid>

        {/* Sentiment Distribution */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2, height: 400 }}>
            <Typography variant="h6" gutterBottom>
              Sentiment Distribution
            </Typography>
            <Box sx={{ height: 350 }}>
              <ResponsivePie
                data={pieData}
                margin={{ top: 40, right: 80, bottom: 80, left: 80 }}
                innerRadius={0.5}
                padAngle={0.7}
                cornerRadius={3}
                activeOuterRadiusOffset={8}
                colors={{ scheme: 'nivo' }}
                borderWidth={1}
                borderColor={{ from: 'color', modifiers: [['darker', 0.2]] }}
                arcLinkLabelsSkipAngle={10}
                arcLinkLabelsTextColor={theme.palette.text.primary}
                arcLinkLabelsThickness={2}
                arcLinkLabelsColor={{ from: 'color' }}
                arcLabelsSkipAngle={10}
                arcLabelsTextColor={{ from: 'color', modifiers: [['darker', 2]] }}
              />
            </Box>
          </Paper>
        </Grid>

        {/* Sentiment Trends */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2, height: 400 }}>
            <Typography variant="h6" gutterBottom>
              Sentiment Trends
            </Typography>
            <Box sx={{ height: 350 }}>
              <ResponsiveLine
                data={lineData}
                margin={{ top: 50, right: 110, bottom: 50, left: 60 }}
                xScale={{ type: 'point' }}
                yScale={{
                  type: 'linear',
                  min: 'auto',
                  max: 'auto',
                  stacked: false,
                  reverse: false,
                }}
                axisTop={null}
                axisRight={null}
                axisBottom={{
                  tickSize: 5,
                  tickPadding: 5,
                  tickRotation: -45,
                  legend: 'Time',
                  legendOffset: 36,
                  legendPosition: 'middle',
                }}
                axisLeft={{
                  tickSize: 5,
                  tickPadding: 5,
                  tickRotation: 0,
                  legend: 'Sentiment Score',
                  legendOffset: -40,
                  legendPosition: 'middle',
                }}
                pointSize={10}
                pointColor={{ theme: 'background' }}
                pointBorderWidth={2}
                pointBorderColor={{ from: 'serieColor' }}
                pointLabelYOffset={-12}
                useMesh={true}
                legends={[
                  {
                    anchor: 'bottom-right',
                    direction: 'column',
                    justify: false,
                    translateX: 100,
                    translateY: 0,
                    itemsSpacing: 0,
                    itemDirection: 'left-to-right',
                    itemWidth: 80,
                    itemHeight: 20,
                    itemOpacity: 0.75,
                    symbolSize: 12,
                    symbolShape: 'circle',
                    symbolBorderColor: 'rgba(0, 0, 0, .5)',
                    effects: [
                      {
                        on: 'hover',
                        style: {
                          itemBackground: 'rgba(0, 0, 0, .03)',
                          itemOpacity: 1,
                        },
                      },
                    ],
                  },
                ]}
              />
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard; 