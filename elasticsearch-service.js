const { Client } = require('@elastic/elasticsearch');

class ElasticsearchService {
  constructor() {
    this.client = new Client({
      node: 'http://localhost:9200',
      requestTimeout: 30000,
      maxRetries: 3,
      resurrectStrategy: 'ping'
    });
    this.isConnected = false;
    this.indexName = 'sf-crimes';
  }

  async connect() {
    try {
      const response = await this.client.ping();
      this.isConnected = true;
      console.log('✅ Connected to Elasticsearch');
      return true;
    } catch (error) {
      console.log('❌ Elasticsearch not available, using fallback');
      this.isConnected = false;
      return false;
    }
  }

  async createIndex() {
    if (!this.isConnected) return false;

    try {
      const exists = await this.client.indices.exists({ index: this.indexName });
      if (exists) {
        console.log('📦 Crime index already exists');
        return true;
      }

      const mapping = {
        mappings: {
          properties: {
            location: {
              type: 'geo_point'
            },
            incident_category: {
              type: 'keyword'
            },
            incident_datetime: {
              type: 'date'
            },
            incident_description: {
              type: 'text'
            },
            latitude: {
              type: 'float'
            },
            longitude: {
              type: 'float'
            }
          }
        }
      };

      await this.client.indices.create({
        index: this.indexName,
        body: mapping
      });

      console.log('📦 Created crime index with geo-point mapping');
      return true;
    } catch (error) {
      console.error('Error creating index:', error.message);
      return false;
    }
  }

  async indexCrimeData(incidents) {
    if (!this.isConnected) return false;

    try {
      console.log(`🔄 Indexing ${incidents.length} crime incidents...`);
      
      const body = [];
      for (const incident of incidents) {
        if (incident.latitude && incident.longitude) {
          body.push({
            index: {
              _index: this.indexName,
              _id: incident.incident_id || incident.row_id
            }
          });
          
          body.push({
            ...incident,
            location: {
              lat: parseFloat(incident.latitude),
              lon: parseFloat(incident.longitude)
            }
          });
        }
      }

      if (body.length > 0) {
        await this.client.bulk({ body });
        console.log(`✅ Indexed ${body.length / 2} crime incidents`);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error indexing data:', error.message);
      return false;
    }
  }

  async searchNearbyCrimes(lat, lon, radiusMiles = 0.5) {
    if (!this.isConnected) {
      throw new Error('Elasticsearch not connected');
    }

    try {
      const response = await this.client.search({
        index: this.indexName,
        body: {
          query: {
            geo_distance: {
              distance: `${radiusMiles}mi`,
              location: {
                lat: lat,
                lon: lon
              }
            }
          },
          size: 1000 // Limit results
        }
      });

      return response.body.hits.hits.map(hit => hit._source);
    } catch (error) {
      console.error('Error searching crimes:', error.message);
      throw error;
    }
  }

  // Fallback method that mimics Elasticsearch behavior
  async searchNearbyCrimesFallback(incidents, lat, lon, radiusMiles = 0.5) {
    console.log('🔄 Using fallback filtering (JavaScript loops)');
    
    const nearbyIncidents = incidents.filter(incident => {
      if (!incident.latitude || !incident.longitude) return false;
      const distance = this.getDistance(lat, lon, parseFloat(incident.latitude), parseFloat(incident.longitude));
      return distance <= radiusMiles;
    });

    return nearbyIncidents;
  }

  // Haversine formula for distance calculation
  getDistance(lat1, lon1, lat2, lon2) {
    const R = 3959; // Earth's radius in miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }
}

module.exports = ElasticsearchService;
