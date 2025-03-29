import Papa from 'papaparse';

class ComparisonService {
  async loadCSVData(filePath) {
    try {
      console.log(`Attempting to load data from ${filePath}`);
      const response = await fetch(`./${filePath}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch CSV: ${response.status} ${response.statusText}`);
      }
      
      const csvText = await response.text();
      console.log('CSV data loaded, length:', csvText.length);
      
      return new Promise((resolve, reject) => {
        Papa.parse(csvText, {
          header: true,
          skipEmptyLines: true,
          dynamicTyping: true,
          complete: (results) => {
            console.log(`Papa parse complete for ${filePath}, rows:`, results.data.length);
            if (results.errors && results.errors.length > 0) {
              console.warn('Parser errors:', results.errors);
            }
            resolve(results.data);
          },
          error: (error) => {
            console.error('Papa parse error:', error);
            reject(error);
          }
        });
      });
    } catch (error) {
      console.error(`Error loading data from ${filePath}:`, error);
      throw error;
    }
  }

  async compareDatasets() {
    try {
      const oldDataFile = 'processed_data_old.csv';
      const newDataFile = 'processed_data.csv';
      
      const [oldData, newData] = await Promise.all([
        this.loadCSVData(oldDataFile),
        this.loadCSVData(newDataFile)
      ]);

      return this.generateComparisonReport(oldData, newData);
    } catch (error) {
      console.error('Error comparing datasets:', error);
      throw error;
    }
  }

  generateComparisonReport(oldData, newData) {
    // Basic statistics
    const oldCount = oldData.length;
    const newCount = newData.length;
    const countDifference = newCount - oldCount;
    const percentChange = oldCount > 0 ? (countDifference / oldCount * 100).toFixed(2) : 'N/A';

    // Sentiment analysis comparison
    const oldSentiment = this.calculateAverageSentiment(oldData);
    const newSentiment = this.calculateAverageSentiment(newData);
    const sentimentDifference = (newSentiment - oldSentiment).toFixed(4);
    
    // Platform distribution comparison
    const oldPlatformDistribution = this.calculatePlatformDistribution(oldData);
    const newPlatformDistribution = this.calculatePlatformDistribution(newData);
    const platformComparison = this.comparePlatformDistributions(oldPlatformDistribution, newPlatformDistribution);
    
    // Country distribution comparison
    const oldCountryDistribution = this.calculateCountryDistribution(oldData);
    const newCountryDistribution = this.calculateCountryDistribution(newData);
    const countryComparison = this.compareCountryDistributions(oldCountryDistribution, newCountryDistribution);
    
    // Sentiment distribution comparison
    const oldSentimentDistribution = this.calculateSentimentDistribution(oldData);
    const newSentimentDistribution = this.calculateSentimentDistribution(newData);
    
    // Find new entries
    const newEntries = this.findNewEntries(oldData, newData);
    
    return {
      datasetInfo: {
        oldDatasetCount: oldCount,
        newDatasetCount: newCount,
        countDifference,
        percentChange
      },
      sentimentComparison: {
        oldAverageSentiment: oldSentiment,
        newAverageSentiment: newSentiment,
        difference: sentimentDifference,
        trend: sentimentDifference > 0 ? 'Improved' : sentimentDifference < 0 ? 'Declined' : 'Unchanged'
      },
      platformComparison: platformComparison,
      countryComparison: countryComparison,
      sentimentDistribution: {
        old: oldSentimentDistribution,
        new: newSentimentDistribution
      },
      newEntries: newEntries.slice(0, 100) // Limit to 100 for performance
    };
  }

  calculateAverageSentiment(data) {
    if (!data || data.length === 0) return 0;
    
    // Use numeric sentiment scores with fallback if unavailable
    const sentimentMap = {
      'positive': 1,
      'neutral': 0,
      'negative': -1
    };
    
    const sum = data.reduce((acc, row) => {
      // First try to get sentiment from label
      if (row.sentiment_label) {
        const label = row.sentiment_label.toLowerCase();
        if (sentimentMap[label] !== undefined) {
          return acc + sentimentMap[label];
        }
      }
      
      // Fallback to score if label not usable
      const sentimentScore = parseFloat(row.sentiment_score);
      return isNaN(sentimentScore) ? acc : acc + sentimentScore;
    }, 0);
    
    return (sum / data.length).toFixed(4);
  }

  calculatePlatformDistribution(data) {
    if (!data || data.length === 0) return {};
    
    const distribution = {};
    data.forEach(row => {
      const platform = row.platform || 'Unknown';
      distribution[platform] = (distribution[platform] || 0) + 1;
    });
    
    return distribution;
  }

  comparePlatformDistributions(oldDistribution, newDistribution) {
    const allPlatforms = [...new Set([...Object.keys(oldDistribution), ...Object.keys(newDistribution)])];
    
    return allPlatforms.map(platform => {
      const oldCount = oldDistribution[platform] || 0;
      const newCount = newDistribution[platform] || 0;
      const difference = newCount - oldCount;
      const percentChange = oldCount > 0 ? (difference / oldCount * 100).toFixed(2) : 'N/A';
      
      return {
        platform,
        oldCount,
        newCount,
        difference,
        percentChange
      };
    }).sort((a, b) => Math.abs(b.difference) - Math.abs(a.difference));
  }

  calculateCountryDistribution(data) {
    if (!data || data.length === 0) return {};
    
    const distribution = {};
    data.forEach(row => {
      const country = row.country || 'Unknown';
      distribution[country] = (distribution[country] || 0) + 1;
    });
    
    return distribution;
  }

  compareCountryDistributions(oldDistribution, newDistribution) {
    const allCountries = [...new Set([...Object.keys(oldDistribution), ...Object.keys(newDistribution)])];
    
    return allCountries.map(country => {
      const oldCount = oldDistribution[country] || 0;
      const newCount = newDistribution[country] || 0;
      const difference = newCount - oldCount;
      const percentChange = oldCount > 0 ? (difference / oldCount * 100).toFixed(2) : 'N/A';
      
      return {
        country,
        oldCount,
        newCount,
        difference,
        percentChange
      };
    }).sort((a, b) => Math.abs(b.difference) - Math.abs(a.difference));
  }

  calculateSentimentDistribution(data) {
    if (!data || data.length === 0) return { positive: 0, neutral: 0, negative: 0 };
    
    let positive = 0, neutral = 0, negative = 0;
    
    data.forEach(row => {
      // Determine sentiment based on sentiment_label
      if (row.sentiment_label) {
        const label = row.sentiment_label.toLowerCase();
        if (label.includes('positive')) {
          positive++;
        } else if (label.includes('negative')) {
          negative++;
        } else if (label.includes('neutral')) {
          neutral++;
        } else {
          // Fallback to sentiment_score if label doesn't match expected values
          this.categorizeBySentimentScore(row, (category) => {
            if (category === 'positive') positive++;
            else if (category === 'negative') negative++;
            else neutral++;
          });
        }
      } else {
        // Fallback to sentiment_score if label is missing
        this.categorizeBySentimentScore(row, (category) => {
          if (category === 'positive') positive++;
          else if (category === 'negative') negative++;
          else neutral++;
        });
      }
    });
    
    const total = data.length;
    
    return {
      positive: {
        count: positive,
        percentage: ((positive / total) * 100).toFixed(2)
      },
      neutral: {
        count: neutral,
        percentage: ((neutral / total) * 100).toFixed(2)
      },
      negative: {
        count: negative,
        percentage: ((negative / total) * 100).toFixed(2)
      }
    };
  }

  categorizeBySentimentScore(row, callback) {
    const sentimentScore = parseFloat(row.sentiment_score);
    if (isNaN(sentimentScore)) {
      callback('neutral');
      return;
    }
    
    if (sentimentScore > 0.2) callback('positive');
    else if (sentimentScore < -0.2) callback('negative');
    else callback('neutral');
  }

  findNewEntries(oldData, newData) {
    // Create a set of IDs from the old data for quick lookup
    const oldIds = new Set(oldData.map(item => item.id));
    
    // Filter new data to find entries not in the old data
    return newData.filter(item => !oldIds.has(item.id));
  }
}

export default new ComparisonService(); 