const redis = require('ioredis');

// Create a Redis client
const redisClient = redis.createClient({
    host: '127.0.0.1', // Default Redis host (adjust if necessary)
    port: 6379         // Default Redis port
});

// Handle Redis connection errors
redisClient.on('error', (err) => {
    console.error('Redis connection error:', err);
});

module.exports = redisClient