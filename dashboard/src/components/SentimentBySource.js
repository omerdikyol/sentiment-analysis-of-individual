import React, { useState } from 'react';
import {
  Box,
  Typography,
  useTheme,
  Card,
  CardContent,
  FormControl,
  Select,
  MenuItem,
  InputLabel,
  Stack,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import InfoIcon from '@mui/icons-material/Info';

const SentimentBySource = ({ data }) => {
  const theme = useTheme();
  const [minMentions, setMinMentions] = useState(5);

  // Filter data based on minimum mentions
  const processedData = React.useMemo(() => {
    if (!data?.sourceSentimentData) return [];
    return data.sourceSentimentData.filter(item => item.total >= minMentions);
  }, [data, minMentions]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <Card sx={{ maxWidth: 300, boxShadow: theme.shadows[3] }}>
          <CardContent>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              {label}
            </Typography>
            <Stack spacing={1}>
              {payload.map((entry) => (
                <Box key={entry.name} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box
                    sx={{
                      width: 12,
                      height: 12,
                      backgroundColor: entry.color,
                      borderRadius: '50%'
                    }}
                  />
                  <Typography variant="body2">
                    {`${entry.name}: ${Number(entry.value).toFixed(1)}%`}
                  </Typography>
                </Box>
              ))}
              <Typography
                variant="body2"
                sx={{
                  mt: 1,
                  pt: 1,
                  borderTop: `1px solid ${theme.palette.divider}`
                }}
              >
                Average Sentiment: {data.avgSentiment}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Mentions: {data.total}
              </Typography>
            </Stack>
          </CardContent>
        </Card>
      );
    }
    return null;
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={minMentions}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.5 }}
      >
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" component="h2">
              Sentiment Distribution by Source
              <Tooltip title="Shows the distribution of positive, neutral, and negative sentiments across different sources">
                <IconButton size="small" sx={{ ml: 1 }}>
                  <InfoIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Typography>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Min. Mentions</InputLabel>
              <Select
                value={minMentions}
                label="Min. Mentions"
                onChange={(e) => setMinMentions(e.target.value)}
              >
                <MenuItem value={1}>≥ 1</MenuItem>
                <MenuItem value={5}>≥ 5</MenuItem>
                <MenuItem value={10}>≥ 10</MenuItem>
                <MenuItem value={20}>≥ 20</MenuItem>
              </Select>
            </FormControl>
          </Box>

          {processedData.length > 0 ? (
            <Box sx={{ width: '100%', height: 400 }}>
              <ResponsiveContainer>
                <ComposedChart
                  data={processedData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
                >
                  <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                  <XAxis
                    dataKey="source"
                    tick={{ fontSize: 12 }}
                    interval={0}
                    angle={-45}
                    textAnchor="end"
                    height={70}
                  />
                  <YAxis
                    yAxisId="left"
                    domain={[0, 100]}
                    tickFormatter={(value) => `${value}%`}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    domain={[0, 1]}
                    tickFormatter={(value) => value.toFixed(2)}
                  />
                  <RechartsTooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar
                    yAxisId="left"
                    dataKey="positive"
                    name="Positive"
                    stackId="a"
                    fill={theme.palette.success.main}
                  />
                  <Bar
                    yAxisId="left"
                    dataKey="neutral"
                    name="Neutral"
                    stackId="a"
                    fill={theme.palette.grey[400]}
                  />
                  <Bar
                    yAxisId="left"
                    dataKey="negative"
                    name="Negative"
                    stackId="a"
                    fill={theme.palette.error.main}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="avgSentiment"
                    name="Avg. Sentiment"
                    stroke={theme.palette.primary.main}
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </Box>
          ) : (
            <Card sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No Data Available
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Try adjusting the minimum mentions filter or check if data is properly loaded.
              </Typography>
            </Card>
          )}
        </Box>
      </motion.div>
    </AnimatePresence>
  );
};

export default SentimentBySource; 