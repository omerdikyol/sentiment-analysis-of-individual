import React from 'react';
import { 
  FormControl, 
  Select, 
  MenuItem, 
  InputLabel,
  Box,
  Typography,
  useTheme,
  alpha
} from '@mui/material';
import { Public as PublicIcon } from '@mui/icons-material';
import { motion } from 'framer-motion';

const CountryFilter = ({ selectedCountry, onCountryChange, data }) => {
  const theme = useTheme();
  const countries = React.useMemo(() => {
    if (!data?.rawData) return [];
    
    const uniqueCountries = [...new Set(data.rawData
      .map(item => item.country)
      .filter(Boolean)
    )];
    
    return ['All Countries', ...uniqueCountries.sort()];
  }, [data]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          backgroundColor: alpha(theme.palette.primary.main, 0.03),
          borderRadius: 2,
          p: 2
        }}
      >
        <PublicIcon 
          sx={{ 
            color: theme.palette.primary.main,
            fontSize: 28
          }} 
        />
        <Box sx={{ flexGrow: 1 }}>
          <Typography 
            variant="subtitle2" 
            sx={{ 
              color: theme.palette.text.secondary,
              mb: 0.5
            }}
          >
            Filter by Region
          </Typography>
          <FormControl 
            fullWidth
            size="small"
            sx={{
              minWidth: 200,
              '& .MuiOutlinedInput-root': {
                backgroundColor: theme.palette.background.paper,
                '&:hover': {
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: theme.palette.primary.main,
                  },
                },
              },
            }}
          >
            <Select
              value={selectedCountry}
              onChange={(e) => onCountryChange(e.target.value)}
              displayEmpty
              sx={{
                '& .MuiSelect-select': {
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                },
              }}
            >
              {countries.map((country) => (
                <MenuItem 
                  key={country} 
                  value={country}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                  }}
                >
                  {country}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </Box>
    </motion.div>
  );
};

export default CountryFilter;