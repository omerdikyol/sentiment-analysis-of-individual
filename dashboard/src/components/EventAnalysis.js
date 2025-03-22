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
  Message as MessageIcon,
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
import { alpha } from '@mui/material/styles';

const EventAnalysis = ({ data }) => {
  const theme = useTheme();

  // Helper function to format sentiment change
  const formatSentimentChange = (change) => {
    const numChange = parseFloat(change);
    const isPositive = numChange > 0;
    return {
      text: `${Math.abs(numChange * 100).toFixed(1)}%`,
      direction: isPositive ? 'Improved' : 'Declined',
      color: isPositive ? theme.palette.success.main : theme.palette.error.main,
      icon: isPositive ? '📈' : '📉'
    };
  };

  // Helper function to get sentiment description and color
  const getSentimentInfo = (value) => {
    if (value >= 0.7) return { text: 'Very Positive', color: theme.palette.success.dark };
    if (value >= 0.3) return { text: 'Positive', color: theme.palette.success.main };
    if (value > -0.3) return { text: 'Neutral', color: theme.palette.grey[600] };
    if (value > -0.7) return { text: 'Negative', color: theme.palette.error.main };
    return { text: 'Very Negative', color: theme.palette.error.dark };
  };

  // Placeholder data for key events
  const keyEvents = [
    {
      date: '2024-03-15',
      type: 'Diplomatic',
      title: 'GCC Summit',
      description: 'Annual Gulf Cooperation Council Summit in Doha',
      location: 'Doha, Qatar',
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
      location: 'Al Wakrah, Qatar',
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
      location: 'Dubai, UAE',
      beforeSentiment: 0.60,
      afterSentiment: 0.75,
      impact: 'positive',
      mentions: 800
    }
  ];

  // Calculate sentiment changes for events
  const eventImpacts = keyEvents.map(event => {
    const change = event.afterSentiment - event.beforeSentiment;
    const changeInfo = formatSentimentChange(change);
    return {
      name: event.title,
      before: event.beforeSentiment * 100,
      after: event.afterSentiment * 100,
      change: parseFloat(((event.afterSentiment - event.beforeSentiment) * 100).toFixed(1)),
      impact: change > 0 ? 'Positive' : 'Negative'
    };
  });

  // Placeholder data for crisis response
  const crisisEvents = [
    {
      date: '2024-03-01',
      title: 'Policy Controversy',
      initialSentiment: 0.45,
      responseEffectiveness: 0.75,
      recoveryTime: '48 hours',
      reputationImpact: -15, // percentage drop in reputation
      recoveryRate: 85, // percentage of recovery achieved
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
      reputationImpact: -25,
      recoveryRate: 75,
      timeline: [
        { time: '0h', sentiment: 0.40 },
        { time: '24h', sentiment: 0.50 },
        { time: '48h', sentiment: 0.65 },
        { time: '72h', sentiment: 0.70 }
      ]
    }
  ];

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
              {keyEvents.map((event, index) => {
                const change = event.afterSentiment - event.beforeSentiment;
                const impactInfo = formatSentimentChange(change);
                const beforeInfo = getSentimentInfo(event.beforeSentiment);
                const afterInfo = getSentimentInfo(event.afterSentiment);

                return (
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

                        {/* Impact Visualization */}
                        <Box sx={{ 
                          mt: 2,
                          p: 2,
                          bgcolor: 'background.default',
                          borderRadius: 1,
                          border: 1,
                          borderColor: 'divider'
                        }}>
                          <Typography variant="subtitle2" gutterBottom>
                            Sentiment Impact {impactInfo.icon}
                          </Typography>
                          
                          {/* Before State */}
                          <Box sx={{ mb: 2 }}>
                            <Typography variant="caption" color="text.secondary">
                              Before Event:
                            </Typography>
                            <Box sx={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'space-between',
                              mt: 0.5,
                              p: 1,
                              bgcolor: 'background.paper',
                              borderRadius: 1
                            }}>
                              <Typography variant="body2" sx={{ color: beforeInfo.color, fontWeight: 'medium' }}>
                                {beforeInfo.text}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {(event.beforeSentiment * 100).toFixed(1)}%
                              </Typography>
                            </Box>
                          </Box>

                          {/* After State */}
                          <Box>
                            <Typography variant="caption" color="text.secondary">
                              After Event:
                            </Typography>
                            <Box sx={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'space-between',
                              mt: 0.5,
                              p: 1,
                              bgcolor: 'background.paper',
                              borderRadius: 1
                            }}>
                              <Typography variant="body2" sx={{ color: afterInfo.color, fontWeight: 'medium' }}>
                                {afterInfo.text}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {(event.afterSentiment * 100).toFixed(1)}%
                              </Typography>
                            </Box>
                          </Box>

                          {/* Impact Summary */}
                          <Box sx={{ 
                            mt: 2,
                            p: 1,
                            bgcolor: alpha(impactInfo.color, 0.1),
                            borderRadius: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 1
                          }}>
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                color: impactInfo.color,
                                fontWeight: 'bold'
                              }}
                            >
                              Sentiment {impactInfo.direction} by {impactInfo.text}
                            </Typography>
                          </Box>
                        </Box>

                        <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                          <MessageIcon sx={{ fontSize: 'small', color: 'text.secondary' }} />
                          <Typography variant="body2" color="text.secondary">
                            {event.mentions.toLocaleString()} mentions
                          </Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
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
                  margin={{ top: 20, right: 160, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    type="number" 
                    domain={[0, 100]}
                    tickFormatter={(value) => `${value}%`}
                  />
                  <YAxis 
                    dataKey="name" 
                    type="category"
                    width={120}
                    tickFormatter={(value) => `${value} ${eventImpacts.find(e => e.name === value).change > 0 ? '📈' : '📉'}`}
                  />
                  <RechartsTooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        const changeColor = data.change > 0 ? theme.palette.success.main : theme.palette.error.main;
                        return (
                          <Box
                            sx={{
                              bgcolor: 'background.paper',
                              p: 1.5,
                              border: 1,
                              borderColor: 'divider',
                              borderRadius: 1,
                              minWidth: 200
                            }}
                          >
                            <Typography variant="subtitle2" gutterBottom>
                              {data.name} {data.change > 0 ? '📈' : '📉'}
                            </Typography>
                            <Divider sx={{ my: 1 }} />
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                              <Typography variant="body2" color="text.secondary">
                                Before: {data.before.toFixed(1)}%
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                After: {data.after.toFixed(1)}%
                              </Typography>
                              <Box sx={{ 
                                mt: 0.5,
                                p: 0.5,
                                bgcolor: alpha(changeColor, 0.1),
                                borderRadius: 1,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}>
                                <Typography 
                                  variant="body2" 
                                  sx={{ 
                                    color: changeColor,
                                    fontWeight: 'bold'
                                  }}
                                >
                                  {data.change > 0 ? 'Improved by ' : 'Declined by '}
                                  {Math.abs(data.change)}%
                                </Typography>
                              </Box>
                            </Box>
                          </Box>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend 
                    verticalAlign="middle"
                    align="right"
                    layout="vertical"
                    wrapperStyle={{
                      paddingLeft: 20
                    }}
                  />
                  <Bar 
                    dataKey="before" 
                    name="Before Event" 
                    fill={theme.palette.grey[400]}
                    radius={[4, 0, 0, 4]}
                  />
                  <Bar 
                    dataKey="after" 
                    name="After Event" 
                    fill={theme.palette.primary.main}
                    radius={[0, 4, 4, 0]}
                  >
                    {eventImpacts.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`}
                        fill={entry.change > 0 ? theme.palette.success.main : theme.palette.error.main}
                      />
                    ))}
                    {/* Add labels showing the change percentage and direction */}
                    {eventImpacts.map((entry, index) => (
                      <Label
                        key={`label-${index}`}
                        position="right"
                        content={({ x, y, width, height }) => {
                          const isPositive = entry.change > 0;
                          const color = isPositive ? theme.palette.success.main : theme.palette.error.main;
                          return (
                            <g>
                              <rect
                                x={x + width + 10}
                                y={y + height/2 - 10}
                                width={70}
                                height={20}
                                fill={alpha(color, 0.1)}
                                rx={4}
                              />
                              <text
                                x={x + width + 45}
                                y={y + height/2}
                                fill={color}
                                textAnchor="middle"
                                dominantBaseline="central"
                                style={{
                                  fontWeight: 'bold',
                                  fontSize: '12px'
                                }}
                              >
                                {isPositive ? '+' : ''}{entry.change}%
                              </text>
                            </g>
                          );
                        }}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Box>
            {/* Legend for Impact Indicators */}
            <Box sx={{ mt: 2, display: 'flex', gap: 3, justifyContent: 'center' }}>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1,
                p: 1,
                bgcolor: alpha(theme.palette.success.main, 0.1),
                borderRadius: 1
              }}>
                <Typography variant="body2" sx={{ color: theme.palette.success.main }}>
                  📈 Positive Impact
                </Typography>
              </Box>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1,
                p: 1,
                bgcolor: alpha(theme.palette.error.main, 0.1),
                borderRadius: 1
              }}>
                <Typography variant="body2" sx={{ color: theme.palette.error.main }}>
                  📉 Negative Impact
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>

        {/* Crisis Response Analysis */}
        <Grid item xs={12}>
          <Paper elevation={0} sx={{ p: 2 }}>
            <Typography variant="subtitle1" gutterBottom sx={{ mb: 3 }}>
              Crisis Response & Recovery Analysis
            </Typography>
            {crisisEvents.map((crisis, index) => (
              <Card variant="outlined" key={index} sx={{ mb: 2 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box sx={{ width: '100%' }}>
                      {/* Event Header */}
                      <Box sx={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        mb: 2 
                      }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Typography variant="subtitle2">
                            {crisis.title}
                          </Typography>
                          <Chip
                            icon={crisis.reputationImpact < 0 ? <TrendingDownIcon /> : <TrendingUpIcon />}
                            label={`${crisis.reputationImpact < 0 ? '' : '+'}${crisis.reputationImpact}% Impact`}
                            color={crisis.reputationImpact < 0 ? 'error' : 'success'}
                            size="small"
                          />
                        </Box>
                        <Chip
                          icon={<CheckCircleIcon />}
                          label={`${crisis.recoveryRate}% Recovery`}
                          color={crisis.recoveryRate >= 80 ? 'success' : 'warning'}
                          size="small"
                        />
                      </Box>

                      {/* Impact Metrics */}
                      <Box sx={{ 
                        display: 'flex', 
                        gap: 2,
                        p: 2,
                        bgcolor: alpha(theme.palette.background.default, 0.6),
                        borderRadius: 1,
                        mb: 2
                      }}>
                        <Box sx={{ 
                          flex: 1,
                          p: 1.5,
                          bgcolor: alpha(theme.palette.error.main, 0.1),
                          borderRadius: 1
                        }}>
                          <Typography variant="caption" color="text.secondary" display="block">
                            Initial Impact
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <WarningIcon sx={{ color: theme.palette.error.main, fontSize: 20 }} />
                            <Typography variant="body2" sx={{ color: theme.palette.error.main, fontWeight: 'medium' }}>
                              {getSentimentInfo(crisis.initialSentiment).text}
                              <Typography component="span" variant="caption" sx={{ ml: 1 }}>
                                ({(crisis.initialSentiment * 100).toFixed(1)}%)
                              </Typography>
                            </Typography>
                          </Box>
                        </Box>

                        <Box sx={{ 
                          flex: 1,
                          p: 1.5,
                          bgcolor: alpha(theme.palette.success.main, 0.1),
                          borderRadius: 1
                        }}>
                          <Typography variant="caption" color="text.secondary" display="block">
                            Recovery Target
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <CheckCircleIcon sx={{ color: theme.palette.success.main, fontSize: 20 }} />
                            <Typography variant="body2" sx={{ color: theme.palette.success.main, fontWeight: 'medium' }}>
                              {getSentimentInfo(crisis.responseEffectiveness).text}
                              <Typography component="span" variant="caption" sx={{ ml: 1 }}>
                                ({(crisis.responseEffectiveness * 100).toFixed(1)}%)
                              </Typography>
                            </Typography>
                          </Box>
                        </Box>

                        <Box sx={{ 
                          flex: 1,
                          p: 1.5,
                          bgcolor: alpha(theme.palette.info.main, 0.1),
                          borderRadius: 1
                        }}>
                          <Typography variant="caption" color="text.secondary" display="block">
                            Recovery Time
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <TimelineIcon sx={{ color: theme.palette.info.main, fontSize: 20 }} />
                            <Typography variant="body2" sx={{ color: theme.palette.info.main, fontWeight: 'medium' }}>
                              {crisis.recoveryTime}
                            </Typography>
                          </Box>
                        </Box>
                      </Box>

                      {/* Recovery Timeline Chart */}
                      <Box sx={{ width: '100%', height: 150 }}>
                        <ResponsiveContainer>
                          <LineChart data={crisis.timeline}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="time" />
                            <YAxis 
                              domain={[0, 1]} 
                              tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}
                              label={{ 
                                value: 'Sentiment Score', 
                                angle: -90, 
                                position: 'insideLeft',
                                style: { textAnchor: 'middle' }
                              }}
                            />
                            <RechartsTooltip 
                              content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                  const data = payload[0].payload;
                                  const sentimentInfo = getSentimentInfo(data.sentiment);
                                  return (
                                    <Box sx={{ 
                                      bgcolor: 'background.paper', 
                                      p: 1.5, 
                                      border: 1,
                                      borderColor: 'divider',
                                      borderRadius: 1
                                    }}>
                                      <Typography variant="body2" gutterBottom>
                                        Time: {data.time}
                                      </Typography>
                                      <Typography 
                                        variant="body2" 
                                        sx={{ 
                                          color: sentimentInfo.color,
                                          fontWeight: 'medium'
                                        }}
                                      >
                                        {sentimentInfo.text} ({(data.sentiment * 100).toFixed(1)}%)
                                      </Typography>
                                    </Box>
                                  );
                                }
                                return null;
                              }}
                            />
                            <Line
                              type="monotone"
                              dataKey="sentiment"
                              stroke={theme.palette.primary.main}
                              strokeWidth={2}
                              dot={{
                                fill: theme.palette.background.paper,
                                stroke: theme.palette.primary.main,
                                strokeWidth: 2
                              }}
                            />
                            <ReferenceLine
                              y={crisis.initialSentiment}
                              stroke={theme.palette.error.main}
                              strokeDasharray="3 3"
                              label={{ 
                                value: 'Initial Impact', 
                                position: 'right',
                                fill: theme.palette.error.main
                              }}
                            />
                            <ReferenceLine
                              y={crisis.responseEffectiveness}
                              stroke={theme.palette.success.main}
                              strokeDasharray="3 3"
                              label={{ 
                                value: 'Recovery Target', 
                                position: 'right',
                                fill: theme.palette.success.main
                              }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </Box>
                    </Box>
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