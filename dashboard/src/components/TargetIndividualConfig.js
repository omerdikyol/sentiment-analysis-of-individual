import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Paper,
  TextField,
  Typography,
  Grid,
  Alert,
  CircularProgress,
  Tooltip
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon, Save as SaveIcon, Edit as EditIcon } from '@mui/icons-material';
import InfoIcon from '@mui/icons-material/Info';
import DataService from '../services/DataService';
import { useTranslation } from 'react-i18next';

const TargetIndividualConfig = () => {
  const { t } = useTranslation();
  const [targetConfig, setTargetConfig] = useState({
    individual_name: '',
    query_variations: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [newVariation, setNewVariation] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');

  // Load target individual configuration
  useEffect(() => {
    const loadTargetConfig = async () => {
      try {
        setIsLoading(true);
        const response = await DataService.getTargetIndividual();
        
        if (response.status === 'success' && response.data) {
          setTargetConfig({
            individual_name: response.data.individual_name || '',
            query_variations: response.data.query_variations || []
          });
        } else {
          setError(response.message || t('target.loadError'));
        }
      } catch (err) {
        setError(t('target.loadError'));
        console.error('Error loading target config:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadTargetConfig();
  }, [t]);

  // Handle save button click
  const handleSave = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setSuccess(null);
      
      const response = await DataService.updateTargetIndividual(targetConfig);
      
      if (response.status === 'success') {
        setSuccess(t('target.saveSuccess'));
        // Reset editing state
        setIsEditing(false);
      } else {
        setError(response.message || t('target.saveError'));
      }
    } catch (err) {
      setError(t('target.saveError'));
      console.error('Error saving target config:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle adding a new query variation
  const handleAddVariation = () => {
    if (newVariation.trim() !== '' && !targetConfig.query_variations.includes(newVariation.trim())) {
      setTargetConfig({
        ...targetConfig,
        query_variations: [...targetConfig.query_variations, newVariation.trim()]
      });
      setNewVariation('');
    }
  };

  // Handle removing a query variation
  const handleRemoveVariation = (variation) => {
    setTargetConfig({
      ...targetConfig,
      query_variations: targetConfig.query_variations.filter(v => v !== variation)
    });
  };

  // Begin editing name
  const handleEditNameClick = () => {
    setEditName(targetConfig.individual_name);
    setIsEditing(true);
  };

  // Save new name
  const handleNameSave = () => {
    if (editName.trim() !== '') {
      setTargetConfig({
        ...targetConfig,
        individual_name: editName
      });
      setIsEditing(false);
    }
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  return (
    <Card elevation={3}>
      <CardHeader 
        title={
          <Typography variant="h5" component="h1" gutterBottom>
            {t('target.title')}
            <Tooltip title={t('target.subtitle')}>
              <IconButton size="small" sx={{ ml: 1 }}>
                <InfoIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Typography>
        }
      />
      <Divider />
      <CardContent>
        {isLoading && (
          <Box display="flex" justifyContent="center" my={3}>
            <CircularProgress />
          </Box>
        )}
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}
        
        <Grid container spacing={3}>
          {/* Target Individual Name */}
          <Grid item xs={12}>
            <Paper elevation={1} sx={{ p: 2, mb: 2 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                <Typography variant="h6">{t('target.nameSection')}</Typography>
                {!isEditing && (
                  <IconButton onClick={handleEditNameClick} color="primary" size="small">
                    <EditIcon />
                  </IconButton>
                )}
              </Box>
              
              {isEditing ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <TextField
                    fullWidth
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    label={t('target.nameLabel')}
                    variant="outlined"
                    size="small"
                  />
                  <Button 
                    variant="contained" 
                    color="primary" 
                    size="small" 
                    onClick={handleNameSave}
                    startIcon={<SaveIcon />}
                  >
                    {t('common.save')}
                  </Button>
                  <Button 
                    variant="outlined" 
                    color="secondary" 
                    size="small" 
                    onClick={handleCancelEdit}
                  >
                    {t('common.cancel')}
                  </Button>
                </Box>
              ) : (
                <Typography variant="body1" sx={{ fontWeight: 'bold', py: 1 }}>
                  {targetConfig.individual_name || t('target.noNameSet')}
                </Typography>
              )}
            </Paper>
          </Grid>
          
          {/* Query Variations */}
          <Grid item xs={12}>
            <Paper elevation={1} sx={{ p: 2 }}>
              <Typography variant="h6" mb={2}>{t('target.variationsSection')}</Typography>
              
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1 }}>
                <TextField
                  fullWidth
                  value={newVariation}
                  onChange={(e) => setNewVariation(e.target.value)}
                  label={t('target.addVariationLabel')}
                  variant="outlined"
                  size="small"
                />
                <Button 
                  variant="contained" 
                  color="primary" 
                  startIcon={<AddIcon />}
                  onClick={handleAddVariation}
                  disabled={newVariation.trim() === ''}
                >
                  {t('common.add')}
                </Button>
              </Box>
              
              <List sx={{ maxHeight: '300px', overflow: 'auto', bgcolor: 'background.paper', borderRadius: 1 }}>
                {targetConfig.query_variations.length > 0 ? (
                  targetConfig.query_variations.map((variation, index) => (
                    <ListItem
                      key={index}
                      secondaryAction={
                        <IconButton edge="end" aria-label="delete" onClick={() => handleRemoveVariation(variation)}>
                          <DeleteIcon />
                        </IconButton>
                      }
                    >
                      <ListItemText primary={variation} />
                    </ListItem>
                  ))
                ) : (
                  <ListItem>
                    <ListItemText primary={t('target.noVariations')} />
                  </ListItem>
                )}
              </List>
            </Paper>
          </Grid>
        </Grid>
        
        <Box display="flex" justifyContent="flex-end" mt={3}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<SaveIcon />}
            onClick={handleSave}
            disabled={isLoading}
          >
            {isLoading ? <CircularProgress size={24} /> : t('common.saveChanges')}
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

export default TargetIndividualConfig; 