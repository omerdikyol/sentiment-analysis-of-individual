import React, { useMemo } from 'react';
import {
  FormControl,
  Select,
  MenuItem,
  InputLabel,
  Box,
} from '@mui/material';

const CountryFilter = ({ selectedCountry, onCountryChange, data }) => {
  const countries = useMemo(() => {
    if (!data?.rawData) return [];
    
    // Get unique countries from the data
    const uniqueCountries = [...new Set(data.rawData.map(item => item.country || 'Qatar'))];
    
    // Sort countries alphabetically
    return ['all', ...uniqueCountries.sort()];
  }, [data]);

  return (
    <Box sx={{ minWidth: 200 }}>
      <FormControl fullWidth>
        <InputLabel id="country-filter-label">Filter by Country</InputLabel>
        <Select
          labelId="country-filter-label"
          id="country-filter"
          value={selectedCountry.toLowerCase()}
          label="Filter by Country"
          onChange={(e) => onCountryChange(e.target.value)}
        >
          <MenuItem value="all">All Countries</MenuItem>
          {countries.filter(country => country !== 'all').map((country) => (
            <MenuItem key={country} value={country.toLowerCase()}>
              {country}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
};

export default CountryFilter;