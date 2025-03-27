import React, { useState, useMemo } from 'react';
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

  // Process raw data to get sentiment distribution by source
  const processSourceData = useMemo(() => {
    if (!data || !data.rawData || !Array.isArray(data.rawData) || data.rawData.length === 0) {
      console.log("No raw data available", data);
      return [];
    }

    console.log("Processing raw data for sentiment by source", data.rawData.length, "items");

    // Group data by source
    const sourceStats = data.rawData.reduce((acc, post) => {
      // Get source name
      const source = post.source || post.platform || 'Unknown';
      
      // Get sentiment value for average calculation
      let sentiment = null;
      if (typeof post.sentiment_score === 'number') {
        sentiment = post.sentiment_score;
      } else if (typeof post.sentiment === 'number') {
        sentiment = post.sentiment;
      } else if (typeof post.score === 'number') {
        sentiment = post.score;
      } else {
        // Try parsing string values
        const sentimentStr = post.sentiment_score || post.sentiment || post.score;
        if (sentimentStr) {
          sentiment = parseFloat(sentimentStr);
        }
      }

      // Get sentiment label
      const sentimentLabel = (post.sentiment_label || '').toLowerCase();

      // Skip if no valid sentiment value
      if (sentiment === null || isNaN(sentiment)) {
        console.log("Skipping post due to invalid sentiment:", post);
        return acc;
      }

      // Initialize source stats if needed
      if (!acc[source]) {
        acc[source] = {
          total: 0,
          positive: 0,
          neutral: 0,
          negative: 0,
          sentimentSum: 0,
          // Add arrays to store actual values for debugging
          values: []
        };
      }

      // Store the value for debugging
      acc[source].values.push(sentiment);

      // Update stats
      acc[source].total++;
      acc[source].sentimentSum += sentiment;

      // Categorize sentiment based on sentiment_label
      if (sentimentLabel && sentimentLabel.includes('positive')) {
        acc[source].positive++;
      } else if (sentimentLabel && sentimentLabel.includes('negative')) {
        acc[source].negative++;
      } else if (sentimentLabel && sentimentLabel.includes('neutral')) {
        acc[source].neutral++;
      } else {
        // Fallback to score-based categorization if label is unclear
        if (sentiment > 0.2) {
          acc[source].positive++;
        } else if (sentiment < -0.2) {
          acc[source].negative++;
        } else {
          acc[source].neutral++;
        }
      }

      return acc;
    }, {});

    // Debug: Log raw stats before percentage calculation
    Object.entries(sourceStats).forEach(([source, stats]) => {
      console.log(`\nSource: ${source}`);
      console.log(`Total mentions: ${stats.total}`);
      console.log(`Positive count: ${stats.positive}`);
      console.log(`Neutral count: ${stats.neutral}`);
      console.log(`Negative count: ${stats.negative}`);
      console.log(`Average sentiment: ${stats.sentimentSum / stats.total}`);
      console.log(`Sample values: ${stats.values.slice(0, 5).join(', ')}`);
      
      // Verify counts add up
      const totalCounts = stats.positive + stats.neutral + stats.negative;
      if (totalCounts !== stats.total) {
        console.error(`Count mismatch for ${source}: sum=${totalCounts}, total=${stats.total}`);
      }
    });

    // Convert to percentages and format for chart
    const results = Object.entries(sourceStats)
      .filter(([_, stats]) => stats.total >= minMentions) // Filter by min mentions
      .map(([source, stats]) => {
        // Calculate percentages
        const total = stats.total;
        const positive = (stats.positive / total) * 100;
        const negative = (stats.negative / total) * 100;
        const neutral = (stats.neutral / total) * 100;

        // Debug: Log percentage calculations
        console.log(`\nPercentage calculation for ${source}:`);
        console.log(`Positive: ${stats.positive}/${total} = ${positive}%`);
        console.log(`Neutral: ${stats.neutral}/${total} = ${neutral}%`);
        console.log(`Negative: ${stats.negative}/${total} = ${negative}%`);
        console.log(`Total: ${positive + neutral + negative}%`);

        return {
          source,
          positive: parseFloat(positive.toFixed(1)),
          neutral: parseFloat(neutral.toFixed(1)),
          negative: parseFloat(negative.toFixed(1)),
          avgSentiment: parseFloat((stats.sentimentSum / total).toFixed(2)),
          total,
          // Include raw counts
          positiveCount: stats.positive,
          neutralCount: stats.neutral,
          negativeCount: stats.negative,
          // Include sample values for verification
          sampleValues: stats.values.slice(0, 3)
        };
      })
      .sort((a, b) => b.total - a.total);

    console.log("Final processed data:", results);
    return results;
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
              {payload.map((entry) => {
                // Only show percentage for the stacked bars (not for avgSentiment line)
                if (entry.dataKey === 'avgSentiment') return null;
                
                // Get the raw count from the matching fields
                const countField = `${entry.dataKey}Count`;
                const count = data[countField];
                
                return (
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
                      {`${entry.name}: ${Number(entry.value).toFixed(1)}% (${count}/${data.total})`}
                    </Typography>
                  </Box>
                );
              })}
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

          {processSourceData.length > 0 ? (
            <Box sx={{ width: '100%', height: 400 }}>
              <ResponsiveContainer>
                <ComposedChart
                  data={processSourceData}
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
                    domain={[-1, 1]}
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