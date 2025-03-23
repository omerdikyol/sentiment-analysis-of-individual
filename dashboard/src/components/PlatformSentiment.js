import React from 'react';
import {
  Box,
  Typography,
  Grid,
  useTheme,
  Card,
  CardContent,
  LinearProgress,
  Stack,
  Divider,
} from '@mui/material';
import {
  Twitter as TwitterIcon,
  Facebook as FacebookIcon,
  LinkedIn as LinkedInIcon,
  Tv as TvIcon,
  Article as NewsIcon,
  Instagram as InstagramIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { alpha } from '@mui/material/styles';

const PlatformSentiment = ({ data }) => {
  const theme = useTheme();

  const getPlatformIcon = (platform) => {
    switch (platform.toLowerCase()) {
      case 'twitter':
        return <TwitterIcon />;
      case 'facebook':
        return <FacebookIcon />;
      case 'linkedin':
        return <LinkedInIcon />;
      case 'instagram':
        return <InstagramIcon />;
      default:
        return platform.toLowerCase().includes('tv') ? <TvIcon /> : <NewsIcon />;
    }
  };

  // Placeholder data
  const platformStats = [
    {
      platform: 'Twitter',
      positive: 80,
      neutral: 35,
      negative: 21,
      total: 136,
      engagement: 1250,
      positivePercent: 59.7,
      neutralPercent: 24.9,
      negativePercent: 15.4
    },
    {
      platform: 'Reuters',
      positive: 2,
      neutral: 2,
      negative: 1,
      total: 5,
      engagement: 85,
      positivePercent: 40,
      neutralPercent: 40,
      negativePercent: 20
    },
    {
      platform: 'CNN',
      positive: 1,
      neutral: 1,
      negative: 0,
      total: 2,
      engagement: 45,
      positivePercent: 50,
      neutralPercent: 50,
      negativePercent: 0
    },
    {
      platform: 'Al Jazeera',
      positive: 1,
      neutral: 0,
      negative: 1,
      total: 2,
      engagement: 32,
      positivePercent: 50,
      neutralPercent: 0,
      negativePercent: 50
    },
    {
      platform: 'Sky News',
      positive: 0,
      neutral: 1,
      negative: 0,
      total: 1,
      engagement: 15,
      positivePercent: 0,
      neutralPercent: 100,
      negativePercent: 0
    },
    {
      platform: 'Associated Press',
      positive: 1,
      neutral: 0,
      negative: 0,
      total: 1,
      engagement: 28,
      positivePercent: 100,
      neutralPercent: 0,
      negativePercent: 0
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Typography variant="h6" gutterBottom>
        Platform-Specific Sentiment Analysis
      </Typography>
      <Grid container spacing={3}>
        {platformStats.map((platform) => (
          <Grid item xs={12} sm={6} md={4} key={platform.platform}>
            <Card variant="outlined">
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1 }}>
                  {getPlatformIcon(platform.platform)}
                  <Typography variant="h6" component="div">
                    {platform.platform}
                  </Typography>
                </Box>

                <Stack spacing={1.5}>
                  <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Positive ({platform.positive} mentions)
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={platform.positivePercent}
                      sx={{
                        height: 8,
                        borderRadius: 1,
                        backgroundColor: alpha(theme.palette.success.main, 0.1),
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: theme.palette.success.main,
                        },
                      }}
                    />
                  </Box>

                  <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Neutral ({platform.neutral} mentions)
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={platform.neutralPercent}
                      sx={{
                        height: 8,
                        borderRadius: 1,
                        backgroundColor: alpha(theme.palette.grey[500], 0.1),
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: theme.palette.grey[500],
                        },
                      }}
                    />
                  </Box>

                  <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Negative ({platform.negative} mentions)
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={platform.negativePercent}
                      sx={{
                        height: 8,
                        borderRadius: 1,
                        backgroundColor: alpha(theme.palette.error.main, 0.1),
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: theme.palette.error.main,
                        },
                      }}
                    />
                  </Box>
                </Stack>

                <Divider sx={{ my: 2 }} />

                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">
                    Total Mentions: {platform.total}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Engagement: {platform.engagement}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </motion.div>
  );
};

export default PlatformSentiment; 