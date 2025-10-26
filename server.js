const express = require('express');
const path = require('path');
const https = require('https');
const fs = require('fs');
const axios = require('axios');
const Anthropic = require('@anthropic-ai/sdk');
require('dotenv').config();
const { initializeFirebaseAdmin } = require('./firebase-config');

const app = express();
const PORT = 3000;

// Initialize Firebase Admin (optional - for server-side operations)
initializeFirebaseAdmin();

// Currents API Configuration
const CURRENTS_API_KEY = process.env.CURRENTS_API_KEY || '';

// Claude API Configuration
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || '';
const anthropic = new Anthropic({
  apiKey: ANTHROPIC_API_KEY,
});

// Cache for real-time news incidents
let newsIncidentsCache = null;
let newsTimestamp = null;
const NEWS_CACHE_DURATION = 1000 * 60 * 2; // 2 minutes

// Cache for crime data
let crimeDataCache = null;
let cacheTimestamp = null;
const CACHE_DURATION = 1000 * 60 * 60 * 24; // 24 hours
const CACHE_FILE = path.join(__dirname, 'crime-data-cache.json');

// Serve static files from public directory
app.use(express.static('public'));

// Parse JSON bodies
app.use(express.json());

// Function to load crime data with file caching
async function loadCrimeData() {
  return new Promise((resolve, reject) => {
    // Check if cache file exists and is fresh
    if (fs.existsSync(CACHE_FILE)) {
      try {
        const cacheStats = fs.statSync(CACHE_FILE);
        const cacheAge = Date.now() - cacheStats.mtimeMs;
        
        if (cacheAge < CACHE_DURATION) {
          console.log('📦 Loading crime data from cache file...');
          const cachedData = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
          crimeDataCache = cachedData.incidents;
          cacheTimestamp = cachedData.timestamp;
          console.log(`✅ Loaded ${crimeDataCache.length} incidents from cache (${Math.round(cacheAge / 1000 / 60)} minutes old)`);
          return resolve(crimeDataCache);
        } else {
          console.log('⏰ Cache expired, fetching fresh data...');
        }
      } catch (error) {
        console.log('⚠️ Error reading cache file, fetching fresh data:', error.message);
      }
    } else {
      console.log('📥 No cache file found, downloading crime data for the first time...');
    }

    // Fetch fresh data from API
    console.log('🔄 Fetching crime data from SF Open Data API (last 6 months)...');
    
    // Calculate date 180 days ago (6 months)
    const date180DaysAgo = new Date();
    date180DaysAgo.setDate(date180DaysAgo.getDate() - 180);
    const dateString = date180DaysAgo.toISOString().split('T')[0];
    
    const url = `https://data.sfgov.org/resource/wg3w-h783.json?$where=incident_datetime>='${dateString}'&$limit=50000`;
    
    https.get(url, (apiRes) => {
      let data = '';
      
      apiRes.on('data', (chunk) => {
        data += chunk;
      });
      
      apiRes.on('end', () => {
        try {
          const incidents = JSON.parse(data);
          crimeDataCache = incidents;
          cacheTimestamp = Date.now();
          
          // Save to cache file
          const cacheData = {
            incidents: incidents,
            timestamp: cacheTimestamp,
            downloadDate: new Date().toISOString()
          };
          
          fs.writeFileSync(CACHE_FILE, JSON.stringify(cacheData), 'utf8');
          console.log(`✅ Crime data loaded: ${incidents.length} incidents (saved to cache)`);
          
          resolve(incidents);
        } catch (error) {
          console.error('❌ Error parsing crime data:', error);
          reject(error);
        }
      });
    }).on('error', (error) => {
      console.error('❌ Error fetching crime data:', error);
      reject(error);
    });
  });
}

// Main route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API endpoint to fetch SF crime data (legacy - returns all data)
app.get('/api/crime-data', async (req, res) => {
  try {
    // If cache is available, return it
    if (crimeDataCache) {
      console.log('📦 Returning cached crime data');
      return res.json(crimeDataCache);
    }

    // Otherwise, load it
    console.log('⏳ Loading crime data...');
    const data = await loadCrimeData();
    res.json(data);
    
  } catch (error) {
    console.error('Error in /api/crime-data:', error);
    res.status(500).json({ error: 'Failed to load crime data' });
  }
});

// Helper function to calculate distance between two points (Haversine formula)
function getDistance(lat1, lon1, lat2, lon2) {
  const R = 3959; // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// API endpoint for location-based crime queries
app.get('/api/crimes-nearby', async (req, res) => {
  try {
    const { lat, lon, radius = 0.5 } = req.query;
    
    if (!lat || !lon) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lon);
    const radiusMiles = parseFloat(radius);

    console.log(`🔍 Searching crimes near (${latitude}, ${longitude}) within ${radiusMiles} miles`);

    if (!crimeDataCache) {
      return res.status(503).json({ error: 'Crime data not yet loaded. Please wait a moment.' });
    }

    // Filter crimes within radius using JavaScript
    const nearbyCrimes = crimeDataCache.filter(incident => {
      if (!incident.latitude || !incident.longitude) return false;
      const distance = getDistance(
        latitude, 
        longitude, 
        parseFloat(incident.latitude), 
        parseFloat(incident.longitude)
      );
      return distance <= radiusMiles;
    });

    console.log(`✅ Found ${nearbyCrimes.length} crimes within ${radiusMiles} miles`);

    res.json({
      crimes: nearbyCrimes,
      count: nearbyCrimes.length,
      location: { lat: latitude, lon: longitude },
      radius: radiusMiles,
      source: 'javascript'
    });

  } catch (error) {
    console.error('Error in /api/crimes-nearby:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Real-time news incidents endpoint
app.get('/api/news-incidents', async (req, res) => {
  try {
    // Return cached data if available and fresh
    if (newsIncidentsCache && newsTimestamp && (Date.now() - newsTimestamp < NEWS_CACHE_DURATION)) {
      console.log('📦 Returning cached news incidents');
      return res.json(newsIncidentsCache);
    }

    if (!CURRENTS_API_KEY) {
      console.log('⚠️  Currents API key not configured, returning empty response');
      return res.json({
        incidents: [],
        lastChecked: Date.now(),
        hoursChecked: 24,
        enabled: false
      });
    }

    console.log('📰 Fetching real-time crime news from Currents API...');
    
    // Simplified query for better API response
    const response = await axios.get('https://api.currentsapi.services/v1/search', {
      params: {
        keywords: 'San Francisco crime',
        language: 'en',
        apiKey: CURRENTS_API_KEY
      },
      timeout: 30000
    });

    const articles = response.data.news || [];
    
    // Parse articles into incidents
    const incidents = articles.slice(0, 10).map((article, index) => {
      const text = `${article.title} ${article.description}`.toLowerCase();
      let neighborhood = 'San Francisco';
      
      // Check for neighborhood mentions
      const neighborhoods = ['tenderloin', 'fisherman\'s wharf', 'presidio heights', 'mission', 'castro', 'haight', 'richmond', 'sunset'];
      for (const hood of neighborhoods) {
        if (text.includes(hood)) {
          neighborhood = hood.charAt(0).toUpperCase() + hood.slice(1);
          break;
        }
      }
      
      return {
        id: `news-${index}`,
        type: 'news',
        title: article.title,
        description: article.description,
        source: article.author || 'Currents',
        url: article.url,
        publishedAt: article.published,
        timestamp: new Date(article.published).getTime(),
        neighborhood: neighborhood
      };
    });

    console.log(`✅ Fetched ${incidents.length} news incidents from Currents`);
    
    const result = {
      incidents: incidents,
      lastChecked: Date.now(),
      hoursChecked: 24,
      enabled: true
    };
    
    newsIncidentsCache = result;
    newsTimestamp = Date.now();
    
    res.json(result);
  } catch (error) {
    console.error('Error fetching news incidents:', error.message);
    res.json({
      incidents: [],
      lastChecked: Date.now(),
      hoursChecked: 24,
      enabled: true,
      error: error.message
    });
  }
});

// Claude Chat API endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { message, userLocation, familyLocations } = req.body;

    if (!ANTHROPIC_API_KEY) {
      return res.json({ 
        response: "Sorry, I'm taking a coffee break right now ☕ (API not configured)" 
      });
    }

    // Build context from your data
    const context = {
      userLocation: userLocation || "San Francisco",
      familyLocations: familyLocations || [],
      currentTime: new Date().toLocaleTimeString(),
      crimeDataAvailable: crimeDataCache ? crimeDataCache.length : 0,
      recentNews: newsIncidentsCache ? newsIncidentsCache.incidents.length : 0
    };

    // Witty system prompt for concise, humorous responses
    const systemPrompt = `You're a professional San Francisco safety advisor who gives ONE-SENTENCE responses with subtle humor (2% more than normal). 
    You have access to ${context.crimeDataAvailable} crime incidents and ${context.recentNews} recent news items.
    Be helpful, informative, and slightly more engaging than typical safety advice. Examples:
    - "Union Square is generally safe during the day, but exercise extra caution after dark"
    - "The Tenderloin has higher crime rates, especially at night - consider alternative routes"
    - "Your family appears to be in relatively safe areas based on recent data"`;

    const response = await anthropic.messages.create({
      model: "claude-3-haiku-20240307", // Fastest, cheapest model
      max_tokens: 100, // Keep responses short
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: `Context: ${JSON.stringify(context)}\n\nUser question: ${message}`
        }
      ]
    });

    res.json({ 
      response: response.content[0].text,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Claude API error:', error.message);
    res.json({ 
      response: "Oops, I'm having a brain freeze 🧠❄️ (API error - try again in a sec)",
      error: error.message 
    });
  }
});

// Helper function to get nearby crimes
function getNearbyCrimes(lat, lon, radiusMiles) {
  if (!crimeDataCache) return [];
  
  return crimeDataCache.filter(incident => {
    if (!incident.latitude || !incident.longitude) return false;
    const distance = getDistance(lat, lon, parseFloat(incident.latitude), parseFloat(incident.longitude));
    return distance <= radiusMiles;
  });
}

// Helper function to analyze crime patterns
function analyzeCrimePatterns(crimes) {
  if (!crimes || crimes.length === 0) {
    return { totalCrimes: 0, crimeTypes: {}, recentCrimes: 0 };
  }
  
  const crimeTypes = {};
  let recentCrimes = 0;
  const now = Date.now();
  const sevenDaysAgo = now - (7 * 24 * 60 * 60 * 1000);
  
  crimes.forEach(crime => {
    const category = crime.incident_category || 'Other';
    crimeTypes[category] = (crimeTypes[category] || 0) + 1;
    
    const crimeDate = new Date(crime.incident_datetime).getTime();
    if (crimeDate > sevenDaysAgo) {
      recentCrimes++;
    }
  });
  
  return {
    totalCrimes: crimes.length,
    crimeTypes: crimeTypes,
    recentCrimes: recentCrimes,
    topCrimeType: Object.keys(crimeTypes).reduce((a, b) => crimeTypes[a] > crimeTypes[b] ? a : b, 'Other')
  };
}

// Helper function to get relevant news
function getRelevantNews(location) {
  if (!newsIncidentsCache || !newsIncidentsCache.incidents) return [];
  
  const locationLower = location.toLowerCase();
  return newsIncidentsCache.incidents.filter(incident => {
    const title = (incident.title || '').toLowerCase();
    const description = (incident.description || '').toLowerCase();
    return title.includes(locationLower) || description.includes(locationLower);
  });
}

// Danger level explanation endpoint
app.post('/api/explain-danger', async (req, res) => {
  try {
    const { location, dangerLevel, lat, lon } = req.body;

    if (!ANTHROPIC_API_KEY) {
      return res.json({ 
        explanation: "Unable to generate explanation at this time (API not configured)" 
      });
    }

    // Get nearby crimes within 0.5 mile radius
    const nearbyCrimes = getNearbyCrimes(lat, lon, 0.5);
    
    // Analyze crime patterns
    const crimeAnalysis = analyzeCrimePatterns(nearbyCrimes);
    
    // Get relevant news incidents
    const relevantNews = getRelevantNews(location);
    
    // Get crime data timestamp for context
    const cacheTimestamp = crimeDataCache && crimeDataCache.timestamp ? new Date(crimeDataCache.timestamp) : null;
    const dataAge = cacheTimestamp ? Math.floor((Date.now() - cacheTimestamp.getTime()) / (1000 * 60 * 60)) : null;
    
    // Build context for Claude
    const context = {
      location: location,
      dangerLevel: dangerLevel,
      crimeStats: crimeAnalysis,
      recentNews: relevantNews,
      currentTime: new Date().toLocaleTimeString(),
      totalCrimes: nearbyCrimes.length,
      dataTimeframe: dataAge ? `${dataAge} hours old data` : 'current data',
      crimeTimeSpan: '12-month period (2023-2024)',
      recentTimeSpan: 'last 7 days'
    };

    const systemPrompt = `You are a professional safety advisor. Provide a danger explanation in bullet points format. Start by stating: "Based on the crime data provided, [location] has a [danger level] danger level for the following reasons:" Then list the reasons in bullet points.`;

    // Format crime types for better readability
    const crimeTypesList = Object.entries(crimeAnalysis.crimeTypes || {})
      .sort((a, b) => b[1] - a[1])
      .map(([type, count]) => `${type}: ${count} cases`)
      .join('\n');

    const response = await anthropic.messages.create({
      model: "claude-3-haiku-20240307",
      max_tokens: 300,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: `Location: ${location}\nDanger Level: ${dangerLevel}\n\nCrime data for 12-month period (2023-2024):\nTotal crimes within 0.5-mile radius: ${nearbyCrimes.length}\nCrimes in last 7 days: ${crimeAnalysis.recentCrimes}\nTop crime category: ${crimeAnalysis.topCrimeType || 'N/A'}\n\nCrime breakdown:\n${crimeTypesList}\n\nProvide a detailed danger explanation with specific numbers and crime types.`
        }
      ]
    });

    res.json({ 
      explanation: response.content[0].text,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Danger explanation error:', error.message);
    res.json({ 
      explanation: "Unable to generate explanation at this time. Please try again later.",
      error: error.message 
    });
  }
});

app.listen(PORT, async () => {
  console.log(`🚀 FamilyCircle running on http://localhost:${PORT}`);
  console.log(`📱 Login at: http://localhost:${PORT}/auth.html`);
  console.log(`🗺️  Main app: http://localhost:${PORT}/index.html`);
  console.log(`📊 Crime data endpoint: /api/crime-data`);
  console.log(`📰 News incidents endpoint: /api/news-incidents`);
  console.log(`⚠️ Danger explanation endpoint: /api/explain-danger`);
  console.log(`🤖 Chat endpoint: /api/chat`);
  console.log('\n✨ Firebase authentication and real-time tracking enabled!');
  console.log(`\n⚙️  Configuration:`);
  console.log(`   - Currents API: ${CURRENTS_API_KEY ? '✅ Configured' : '❌ Not configured'}`);
  console.log(`   - Claude API: ${ANTHROPIC_API_KEY ? '✅ Configured' : '❌ Not configured'}`);
  if (!CURRENTS_API_KEY || !ANTHROPIC_API_KEY) {
    console.log(`\n⚠️  To enable all features, check your .env file`);
  }
  console.log('');
  
  // Load crime data on startup
  try {
    await loadCrimeData();
    console.log('✅ Server ready! Crime data loaded and cached.\n');
  } catch (error) {
    console.error('⚠️ Warning: Could not load crime data on startup:', error.message);
    console.log('   Crime data will be loaded on first request.\n');
  }
});

