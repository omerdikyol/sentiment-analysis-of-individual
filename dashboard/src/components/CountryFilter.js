import React, { useMemo } from 'react';
import {
  FormControl,
  Select,
  MenuItem,
  InputLabel,
  Box,
} from '@mui/material';
import DataService from '../services/DataService';

const CountryFilter = ({ selectedCountry, onCountryChange, data }) => {
  const countries = useMemo(() => {
    // Get available countries from DataService
    const availableCountries = DataService.getAvailableCountries();
    return ['all', ...availableCountries];
  }, []);

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