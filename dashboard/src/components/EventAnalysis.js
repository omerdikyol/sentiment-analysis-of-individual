import React from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Grid, 
  useTheme,
  Card,
  CardContent,
  Chip,
  Divider,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Event as EventIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Timeline as TimelineIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
  Label,
  BarChart,
  Bar,
  Cell,
} from 'recharts';

const EventAnalysis = ({ data }) => {
  const theme = useTheme();

  // Placeholder data for key events
  const keyEvents = [
    {
      date: '2024-03-15',
      type: 'Diplomatic',
      title: 'GCC Summit',
      description: 'Annual Gulf Cooperation Council Summit in Doha',
      beforeSentiment: 0.65,
      afterSentiment: 0.82,
      impact: 'positive',
      mentions: 1200
    },
    {
      date: '2024-02-20',
      type: 'Sports',
      title: 'Asian Cup Final',
      description: 'Qatar hosts major sporting event',
      beforeSentiment: 0.70,
      afterSentiment: 0.85,
      impact: 'positive',
      mentions: 2500
    },
    {
      date: '2024-01-10',
      type: 'Economic',
      title: 'Investment Forum',
      description: 'International Investment Conference',
      beforeSentiment: 0.60,
      afterSentiment: 0.75,
      impact: 'positive',
      mentions: 800
    }
  ];

  // Placeholder data for crisis response
  const crisisEvents = [
    {
      date: '2024-03-01',
      title: 'Policy Controversy',
      initialSentiment: 0.45,
      responseEffectiveness: 0.75,
      recoveryTime: '48 hours',
      timeline: [
        { time: '0h', sentiment: 0.45 },
        { time: '24h', sentiment: 0.55 },
        { time: '48h', sentiment: 0.75 },
        { time: '72h', sentiment: 0.80 }
      ]
    },
    {
      date: '2024-02-15',
      title: 'Media Criticism',
      initialSentiment: 0.40,
      responseEffectiveness: 0.70,
      recoveryTime: '72 hours',
      timeline: [
        { time: '0h', sentiment: 0.40 },
        { time: '24h', sentiment: 0.50 },
        { time: '48h', sentiment: 0.65 },
        { time: '72h', sentiment: 0.70 }
      ]
    }
  ];

  // Calculate sentiment changes for events
  const eventImpacts = keyEvents.map(event => ({
    name: event.title,
    before: event.beforeSentiment * 100,
    after: event.afterSentiment * 100,
    change: ((event.afterSentiment - event.beforeSentiment) * 100).toFixed(1)
  }));

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <Box
          sx={{
            backgroundColor: 'background.paper',
            p: 1.5,
            border: 1,
            borderColor: 'divider',
            borderRadius: 1,
          }}
        >
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            {label}
          </Typography>
          {payload.map((entry) => (
            <Typography
              key={entry.name}
              variant="body2"
              sx={{ color: entry.color }}
            >
              {`${entry.name}: ${Number(entry.value).toFixed(1)}%`}
            </Typography>
          ))}
        </Box>
      );
    }
    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Typography variant="h6" gutterBottom>
        Event-Based Sentiment Analysis
      </Typography>
      <Grid container spacing={3}>
        {/* Key Events Impact */}
        <Grid item xs={12}>
          <Paper elevation={0} sx={{ p: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Impact of Key Events
            </Typography>
            <Grid container spacing={2}>
              {keyEvents.map((event, index) => (
                <Grid item xs={12} md={4} key={index}>
                  <Card variant="outlined">
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <EventIcon color="primary" />
                          <Typography variant="subtitle2">
                            {event.title}
                          </Typography>
                        </Box>
                        <Chip 
                          label={event.type}
                          size="small"
                          color={
                            event.type === 'Diplomatic' ? 'primary' :
                            event.type === 'Sports' ? 'success' : 'info'
                          }
                        />
                      </Box>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        {event.description}
                      </Typography>
                      <Box sx={{ mt: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body2">Before</Typography>
                          <Typography variant="body2">After</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="h6">
                            {(event.beforeSentiment * 100).toFixed(1)}%
                          </Typography>
                          <TrendingUpIcon 
                            sx={{ 
                              color: event.impact === 'positive' ? 'success.main' : 'error.main',
                              transform: 'rotate(45deg)',
                              mx: 1
                            }} 
                          />
                          <Typography variant="h6">
                            {(event.afterSentiment * 100).toFixed(1)}%
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>

        {/* Before vs After Comparison */}
        <Grid item xs={12} md={6}>
          <Paper elevation={0} sx={{ p: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Before vs. After Event Impact
            </Typography>
            <Box sx={{ width: '100%', height: 300 }}>
              <ResponsiveContainer>
                <BarChart
                  data={eventImpacts}
                  layout="vertical"
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" domain={[0, 100]} />
                  <YAxis dataKey="name" type="category" />
                  <RechartsTooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar dataKey="before" name="Before Event" fill={theme.palette.grey[400]} />
                  <Bar dataKey="after" name="After Event" fill={theme.palette.primary.main} />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        {/* Crisis Response Analysis */}
        <Grid item xs={12} md={6}>
          <Paper elevation={0} sx={{ p: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Crisis Response Analysis
            </Typography>
            {crisisEvents.map((crisis, index) => (
              <Card variant="outlined" key={index} sx={{ mb: 2 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <WarningIcon color="error" />
                      <Typography variant="subtitle2">
                        {crisis.title}
                      </Typography>
                    </Box>
                    <Chip 
                      icon={<CheckCircleIcon />}
                      label={`Recovery: ${crisis.recoveryTime}`}
                      color="success"
                      size="small"
                    />
                  </Box>
                  <Box sx={{ width: '100%', height: 150 }}>
                    <ResponsiveContainer>
                      <LineChart data={crisis.timeline}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="time" />
                        <YAxis domain={[0, 1]} tickFormatter={(value) => `${(value * 100).toFixed(0)}%`} />
                        <RechartsTooltip content={<CustomTooltip />} />
                        <Line
                          type="monotone"
                          dataKey="sentiment"
                          stroke={theme.palette.primary.main}
                          strokeWidth={2}
                        />
                        <ReferenceLine
                          y={crisis.initialSentiment}
                          stroke={theme.palette.error.main}
                          strokeDasharray="3 3"
                          label={{ value: 'Initial', position: 'right' }}
                        />
                        <ReferenceLine
                          y={crisis.responseEffectiveness}
                          stroke={theme.palette.success.main}
                          strokeDasharray="3 3"
                          label={{ value: 'Target', position: 'right' }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Paper>
        </Grid>
      </Grid>
    </motion.div>
  );
};

export default EventAnalysis; 