import Papa from 'papaparse';

class DataService {
  async loadData() {
    try {
      console.log('Attempting to load data from processed_data.csv');
      const response = await fetch('/processed_data.csv');
      
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
            console.log('Papa parse complete, rows:', results.data.length);
            if (results.errors && results.errors.length > 0) {
              console.warn('Parser errors:', results.errors);
            }
            resolve(this.processData(results.data));
          },
          error: (error) => {
            console.error('Papa parse error:', error);
            reject(error);
          }
        });
      });
    } catch (error) {
      console.error('Error loading data:', error);
      throw error;
    }
  }

  processData(data) {
    console.log('Processing data, initial records:', data.length);
    
    // Filter out rows with missing essential data
    const filteredData = data.filter(item => 
      item && item.source && 
      item.sentiment_label && 
      item.sentiment_score !== undefined && 
      item.sentiment_score !== null && 
      item.date
    );
    
    console.log('After filtering, remaining records:', filteredData.length);

    // Add country data to entries based on keywords
    this.addCountryData(filteredData);

    // Convert sentiment_score to number and parse dates
    filteredData.forEach(item => {
      // Make sure sentiment_score is treated as a number
      if (typeof item.sentiment_score === 'string') {
        item.sentiment_score = parseFloat(item.sentiment_score);
      }
      
      // Handle date parsing
      try {
        if (typeof item.date === 'string') {
          item.date = new Date(item.date);
          
          // Check if date is valid
          if (isNaN(item.date.getTime())) {
            // Try to fix common date format issues
            const dateParts = item.date.split('-');
            if (dateParts.length === 3) {
              item.date = new Date(`${dateParts[0]}-${dateParts[1].padStart(2, '0')}-${dateParts[2].padStart(2, '0')}`);
            }
            
            // If still invalid, use a fallback date
            if (isNaN(item.date.getTime())) {
              console.warn('Invalid date found, using fallback:', item.date);
              item.date = new Date('2025-01-01');
            }
          }
        }
      } catch (e) {
        console.warn('Error parsing date:', item.date, e);
        item.date = new Date('2025-01-01');
      }
    });

    // Calculate metrics
    const metrics = this.calculateMetrics(filteredData);
    
    // Get mentions by date
    const mentionsByDate = this.getMentionsByDate(filteredData);
    
    // Get sentiment by date
    const sentimentByDate = this.getSentimentByDate(filteredData);
    
    // Get top and bottom sentiment posts
    const topSentiment = this.getTopSentiment(filteredData, 5);
    const bottomSentiment = this.getBottomSentiment(filteredData, 5);
    
    // Get mentions by platform
    const mentionsByPlatform = this.getMentionsByPlatform(filteredData);
    
    // Get available countries
    const availableCountries = this.getAvailableCountries(filteredData);
    
    // Get mentions by country
    const mentionsByCountry = this.getMentionsByCountry(filteredData);

    return {
      rawData: filteredData,
      metrics,
      mentionsByDate,
      sentimentByDate,
      topSentiment,
      bottomSentiment,
      mentionsByPlatform,
      availableCountries,
      mentionsByCountry
    };
  }

  // Add function to assign countries based on keywords
  addCountryData(data) {
    // Keywords that indicate a country
    const usKeywords = ['us', 'usa', 'united states', 'america', 'american', 'washington', 'new york', 'california', 'trump'];
    const ukKeywords = ['uk', 'united kingdom', 'britain', 'british', 'london', 'england', 'scotland', 'wales'];
    
    data.forEach(item => {
      // Use text content to determine country if available
      const text = (item.text || '').toLowerCase();
      const source = (item.source || '').toLowerCase();
      const platform = (item.platform || '').toLowerCase();

      // Qatar-specific keywords
      const qatarKeywords = [
        'qatar', 'doha', 'qatari', 'al thani', 'emir', 'lusail', 'al wakrah', 'al khor',
        'education city', 'katara', 'the pearl', 'west bay', 'aspire', 'hamad', 'khalifa',
        'corniche', 'souq waqif', 'msheireb', 'al sadd', 'gulf', 'middle east', 'arabian'
      ];

      // Check for Qatar content first (since this is Qatar-focused)
      if (qatarKeywords.some(keyword => text.includes(keyword))) {
        item.country = 'Qatar';
      }
      // Check for UK content
      else if (ukKeywords.some(keyword => text.includes(keyword))) {
        item.country = 'UK';
      } 
      // Check for US content
      else if (usKeywords.some(keyword => text.includes(keyword))) {
        item.country = 'US';
      }
      // Default if no match
      else {
        // Use source to guess if possible
        if (['cnn', 'fox', 'nbc', 'cbs', 'usa today', 'new york times', 'washington post', 'newsweek', 'huffpost'].some(s => source.includes(s) || platform.includes(s))) {
          item.country = 'US';
        }
        else if (['bbc', 'guardian', 'telegraph', 'independent', 'daily mail'].some(s => source.includes(s) || platform.includes(s))) {
          item.country = 'UK';
        }
        else if ([
          'al jazeera', 'gulf times', 'peninsula', 'qatar tribune', 'qna',
          'doha news', 'lusail news', 'al-sharq', 'raya', 'al-watan',
          'qatar living', 'iloveqatar', 'marhaba', 'qatar observer',
          'qatar gazette', 'qatar chronicle'
        ].some(s => source.includes(s) || platform.includes(s))) {
          item.country = 'Qatar';
        }
        else {
          // If still no match, make an educated guess based on domain if URL exists
          const url = item.url || '';
          if (url.includes('.uk') || url.includes('.co.uk')) {
            item.country = 'UK';
          }
          else if (url.includes('.us') || url.includes('.gov') || url.includes('.edu')) {
            item.country = 'US';
          }
          else if (url.includes('.qa') || url.includes('qatar') || url.includes('doha') || 
                   url.includes('gulf-times') || url.includes('aljazeera')) {
            item.country = 'Qatar';
          }
          else {
            // Default to Qatar since this is a Qatar-focused dataset
            item.country = 'Qatar';
          }
        }
      }
    });
    
    console.log('Countries assigned to data entries');
  }

  calculateMetrics(data) {
    const totalMentions = data.length;
    
    const positiveMentions = data.filter(item => item.sentiment_label === 'positive').length;
    const negativeMentions = data.filter(item => item.sentiment_label === 'negative').length;
    const neutralMentions = data.filter(item => item.sentiment_label === 'neutral').length;
    
    const positivePercentage = totalMentions > 0 ? (positiveMentions / totalMentions * 100).toFixed(1) : '0.0';
    const negativePercentage = totalMentions > 0 ? (negativeMentions / totalMentions * 100).toFixed(1) : '0.0';
    const neutralPercentage = totalMentions > 0 ? (neutralMentions / totalMentions * 100).toFixed(1) : '0.0';
    
    const socialMediaMentions = data.filter(item => 
      item.source === 'X' || 
      item.source === 'Social Media'
    ).length;
    
    const newsMentions = data.filter(item => item.source === 'News').length;
    const mentionMentions = data.filter(item => item.source === 'Mention').length;
    
    // Calculate average sentiment score as a presence score (0-100)
    const avgSentiment = totalMentions > 0 ? 
      data.reduce((sum, item) => sum + (item.sentiment_score || 0), 0) / totalMentions : 0;
    const presenceScore = (avgSentiment * 100).toFixed(1);

    return {
      totalMentions,
      positiveMentions,
      negativeMentions,
      neutralMentions,
      positivePercentage,
      negativePercentage,
      neutralPercentage,
      socialMediaMentions,
      newsMentions,
      mentionMentions,
      presenceScore
    };
  }

  getMentionsByDate(data) {
    const mentionsByDate = {};
    
    data.forEach(item => {
      if (!item.date) return;
      
      try {
        // Ensure date is valid before trying to get ISO string
        if (item.date instanceof Date && !isNaN(item.date.getTime())) {
          const dateStr = item.date.toISOString().split('T')[0];
          
          if (!mentionsByDate[dateStr]) {
            mentionsByDate[dateStr] = 0;
          }
          
          mentionsByDate[dateStr]++;
        } else {
          console.warn('Invalid date object:', item.date);
        }
      } catch (e) {
        console.warn('Error processing date:', item.date, e);
      }
    });
    
    // Convert to array and sort by date
    return Object.entries(mentionsByDate)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  }

  getSentimentByDate(data) {
    const sentimentByDate = {};
    
    data.forEach(item => {
      if (!item.date || !item.sentiment_label) return;
      
      try {
        // Ensure date is valid before trying to get ISO string
        if (item.date instanceof Date && !isNaN(item.date.getTime())) {
          const dateStr = item.date.toISOString().split('T')[0];
          
          if (!sentimentByDate[dateStr]) {
            sentimentByDate[dateStr] = {
              positive: 0,
              neutral: 0,
              negative: 0,
              total: 0,
              score: 0
            };
          }
          
          if (item.sentiment_label in sentimentByDate[dateStr]) {
            sentimentByDate[dateStr][item.sentiment_label]++;
          }
          
          sentimentByDate[dateStr].total++;
          sentimentByDate[dateStr].score += (item.sentiment_score || 0);
        } else {
          console.warn('Invalid date object in getSentimentByDate:', item.date);
        }
      } catch (e) {
        console.warn('Error processing date in getSentimentByDate:', item.date, e);
      }
    });
    
    // Calculate average sentiment score for each date
    Object.keys(sentimentByDate).forEach(date => {
      sentimentByDate[date].avgScore = sentimentByDate[date].total > 0 ? 
        sentimentByDate[date].score / sentimentByDate[date].total : 0;
    });
    
    // Convert to array and sort by date
    return Object.entries(sentimentByDate)
      .map(([date, data]) => ({ 
        date, 
        ...data 
      }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  }

  getTopSentiment(data, count) {
    return [...data]
      .filter(item => item.sentiment_score !== undefined && item.sentiment_score !== null)
      .sort((a, b) => b.sentiment_score - a.sentiment_score)
      .slice(0, count);
  }

  getBottomSentiment(data, count) {
    return [...data]
      .filter(item => item.sentiment_score !== undefined && item.sentiment_score !== null)
      .sort((a, b) => a.sentiment_score - b.sentiment_score)
      .slice(0, count);
  }

  getMentionsByPlatform(data) {
    const platforms = {};
    
    data.forEach(item => {
      const platform = item.platform || item.source || 'unknown';
      
      if (!platforms[platform]) {
        platforms[platform] = 0;
      }
      
      platforms[platform]++;
    });
    
    // Convert to array and sort by count
    return Object.entries(platforms)
      .map(([platform, count]) => ({ platform, count }))
      .sort((a, b) => b.count - a.count);
  }

  getAvailableCountries(data) {
    // For this specific dataset, we know these are the four countries mentioned
    return ['US', 'UK', 'Qatar', 'UAE'];
  }
  
  getMentionsByCountry(data) {
    const countries = {
      'US': { total: 0, positive: 0, neutral: 0, negative: 0 },
      'UK': { total: 0, positive: 0, neutral: 0, negative: 0 },
      'Qatar': { total: 0, positive: 0, neutral: 0, negative: 0 },
      'UAE': { total: 0, positive: 0, neutral: 0, negative: 0 }
    };
    
    data.forEach(item => {
      const country = item.country || 'Qatar'; // Default to Qatar for this dataset
      
      if (!countries[country]) {
        countries[country] = {
          total: 0,
          positive: 0,
          neutral: 0,
          negative: 0
        };
      }
      
      countries[country].total++;
      
      if (item.sentiment_label) {
        countries[country][item.sentiment_label]++;
      }
    });
    
    // Convert to array and add percentages
    return Object.entries(countries)
      .map(([country, stats]) => ({ 
        country, 
        ...stats,
        positivePercentage: stats.total > 0 ? (stats.positive / stats.total * 100).toFixed(1) : '0.0',
        negativePercentage: stats.total > 0 ? (stats.negative / stats.total * 100).toFixed(1) : '0.0',
        neutralPercentage: stats.total > 0 ? (stats.neutral / stats.total * 100).toFixed(1) : '0.0',
      }))
      .sort((a, b) => b.total - a.total);
  }
  
  filterDataByCountry(data, country) {
    if (!country || country === 'All Countries') {
      return data;
    }
    
    return data.filter(item => (item.country || 'Qatar') === country);
  }
}

export default new DataService();