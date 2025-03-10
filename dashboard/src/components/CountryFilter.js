import React from 'react';
import { 
  Box, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem,  
  Card, 
  CardContent,
  Typography,
  useTheme,
  Chip,
  Avatar
} from '@mui/material';
import { 
  Public as PublicIcon,
  Flag as USFlag,
  EmojiFlags as UKFlag,
  Mosque as QatarIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';

const CountryFilter = ({ countries, selectedCountry, onCountryChange }) => {
  const theme = useTheme();
  
  const handleChange = (event) => {
    onCountryChange(event.target.value);
  };

  // Get the appropriate icon for a country
  const getCountryIcon = (country) => {
    switch(country) {
      case 'US':
        return <USFlag sx={{ color: '#0a3161' }} />;
      case 'UK':
        return <UKFlag sx={{ color: '#012169' }} />;
      case 'Qatar':
        return <QatarIcon sx={{ color: '#8a1538' }} />;
      default:
        return <PublicIcon />;
    }
  };
  
  // Get the appropriate background color for a country menu item
  const getCountryBgColor = (country) => {
    switch(country) {
      case 'US':
        return '#f3f4f6';
      case 'UK':
        return '#f5f5f5';
      case 'Qatar':
        return '#f9f2f3';
      default:
        return 'transparent';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card
        sx={{
          boxShadow: 3,
          borderRadius: 2,
          background: 'linear-gradient(135deg, #ffffff 0%, #f5f7ff 100%)',
          transition: 'all 0.3s ease',
          mb: 3,
          maxWidth: { xs: '100%', sm: 450, md: 350 }, // Set maximum width based on screen size
          mx: 'auto' // Center the card if smaller than container
        }}
      >
        <CardContent>
          <Box display="flex" alignItems="center" mb={2}>
            <PublicIcon sx={{ mr: 1, color: 'primary.main', fontSize: 28 }} />
            <Typography variant="h6" component="div" fontWeight="500">
              Filter by Country
            </Typography>
          </Box>
          
          <FormControl 
            fullWidth 
            variant="outlined" 
            size="small"
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '8px',
                '&:hover fieldset': {
                  borderColor: theme.palette.primary.main,
                },
              }
            }}
          >
            <InputLabel 
              id="country-filter-label"
              sx={{ 
                fontWeight: 500, 
                color: theme.palette.text.primary 
              }}
            >
              Select Country
            </InputLabel>
            <Select
              labelId="country-filter-label"
              id="country-filter"
              value={selectedCountry}
              onChange={handleChange}
              label="Select Country"
              sx={{
                boxShadow: '0 2px 5px rgba(0,0,0,0.08)',
                '& .MuiSelect-select': {
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }
              }}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {selected === 'All Countries' ? 
                    <PublicIcon color="primary" /> : 
                    getCountryIcon(selected)
                  }
                  <Typography fontWeight="500">
                    {selected}
                  </Typography>
                </Box>
              )}
              MenuProps={{
                PaperProps: {
                  sx: {
                    borderRadius: 2,
                    boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                    maxHeight: 300,
                  }
                }
              }}
            >
              <MenuItem 
                value="All Countries"
                sx={{ 
                  borderRadius: 1,
                  m: 0.5,
                  '&:hover': {
                    backgroundColor: 'rgba(63, 81, 181, 0.08)',
                  },
                  '&.Mui-selected': {
                    backgroundColor: 'rgba(63, 81, 181, 0.12)',
                    '&:hover': {
                      backgroundColor: 'rgba(63, 81, 181, 0.16)',
                    }
                  }
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Avatar sx={{ width: 24, height: 24, bgcolor: theme.palette.primary.main }}>
                    <PublicIcon sx={{ fontSize: 16 }} />
                  </Avatar>
                  <Typography fontWeight="500">All Countries</Typography>
                </Box>
              </MenuItem>
              
              {countries.map((country) => (
                <MenuItem 
                  key={country} 
                  value={country}
                  sx={{ 
                    borderRadius: 1,
                    m: 0.5,
                    bgcolor: getCountryBgColor(country),
                    '&:hover': {
                      backgroundColor: 'rgba(63, 81, 181, 0.08)',
                    },
                    '&.Mui-selected': {
                      backgroundColor: 'rgba(63, 81, 181, 0.12)',
                      '&:hover': {
                        backgroundColor: 'rgba(63, 81, 181, 0.16)',
                      }
                    }
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip
                      avatar={<Avatar>{getCountryIcon(country)}</Avatar>}
                      label={country}
                      size="small"
                      variant="filled"
                      sx={{ 
                        fontWeight: 'medium',
                        bgcolor: country === 'US' ? '#e3f2fd' : 
                                country === 'UK' ? '#e8f5e9' : 
                                country === 'Qatar' ? '#fbe9e7' : 'default',
                        '& .MuiChip-avatar': {
                          bgcolor: country === 'US' ? '#bbdefb' : 
                                  country === 'UK' ? '#c8e6c9' : 
                                  country === 'Qatar' ? '#ffccbc' : 'default',
                        }
                      }}
                    />
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          {selectedCountry !== 'All Countries' && (
            <Box mt={2} sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography 
                variant="body2" 
                color="text.secondary"
                sx={{ fontStyle: 'italic' }}
              >
                Currently filtering by: 
                <Chip
                  size="small"
                  label={selectedCountry}
                  icon={getCountryIcon(selectedCountry)} 
                  sx={{ ml: 1 }}
                  color={
                    selectedCountry === 'US' ? 'primary' : 
                    selectedCountry === 'UK' ? 'success' : 
                    selectedCountry === 'Qatar' ? 'error' : 'default'
                  }
                  variant="outlined"
                />
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default CountryFilter;