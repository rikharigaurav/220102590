import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import mongoose from 'mongoose';
import rateLimit from 'express-rate-limit';
import Url from './models/url.js';
import { logEvent, createLogger } from '../logging-middleware/logger.js';

const logger = createLogger('backend', 'handler');

const app = express();
const PORT = process.env.PORT || 3001;
const NODE_ENV = process.env.NODE_ENV || 'development';
const MONGODB_URI = process.env.MONGODB_URI;


mongoose.connect(MONGODB_URI, {
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  family: 4
}).then(() => {
  console.log('Connected to MongoDB');
  logger.info('MongoDB connected successfully');
}).catch(err => {
  console.error('MongoDB connection error:', err);
  logger.error(`MongoDB failed: ${err.message}`);
});
// 
// const limiter = rateLimit({
//   windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000,
//   max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
//   message: 'Too many requests from this IP, please try again later.'
// });

// app.use('/api/', limiter);

// CORS configuration
const corsOptions = {
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

const logFormat = process.env.LOG_FORMAT || (NODE_ENV === 'production' ? 'combined' : ':method :url :status :res[content-length] - :response-time ms :remote-addr :user-agent');

// app.use(morgan(logFormat));

// Custom logging middleware for API requests
// app.use('/api', (req, res, next) => {
//   const timestamp = new Date().toISOString();
//   const logData = {
//     timestamp,
//     method: req.method,
//     url: req.url,
//     ip: req.ip || req.connection.remoteAddress,
//     userAgent: req.get('User-Agent'),
//     body: req.method !== 'GET' ? req.body : undefined
//   };
  
//   //console.log(`[API REQUEST] ${timestamp}`, JSON.stringify(logData, null, 2));
  
//   // Log to AffordMed evaluation service (keep message under 48 chars)
//   logEvent('backend', 'info', 'handler', `${req.method} ${req.url} from ${logData.ip}`);
  
//   // Log response
//   const originalSend = res.send;
//   res.send = function(data) {
//     const responseTime = Date.now() - new Date(timestamp).getTime();
//     //console.log(`[API RESPONSE] ${timestamp}`, {
//     //   status: res.statusCode,
//     //   responseTime,
//     //   responseSize: data ? data.length : 0
//     // });
    
//     // Log response to evaluation service (keep message under 48 chars)
//     const logLevel = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info';
//     logEvent('backend', logLevel, 'handler', `${req.method} ${req.url} ${res.statusCode} ${responseTime}ms`);
    
//     originalSend.call(this, data);
//   };
  
//   next();
// });

// Application configuration
const config = {
  defaultValidity: parseInt(process.env.DEFAULT_VALIDITY_MINUTES) || 30,
  maxUrlsPerRequest: parseInt(process.env.MAX_URLS_PER_REQUEST) || 5,
  shortcodeLength: parseInt(process.env.SHORTCODE_LENGTH) || 6,
  maxShortcodeLength: parseInt(process.env.MAX_SHORTCODE_LENGTH) || 10,
  minShortcodeLength: parseInt(process.env.MIN_SHORTCODE_LENGTH) || 3
};

// Utility functions
function generateShortcode(length = config.shortcodeLength) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function isValidUrl(string) {
  try {
    const url = new URL(string);
    return ['http:', 'https:'].includes(url.protocol);
  } catch (_) {
    return false;
  }
}

function isValidShortcode(shortcode) {
  const regex = new RegExp(`^[a-zA-Z0-9]{${config.minShortcodeLength},${config.maxShortcodeLength}}$`);
  return regex.test(shortcode);
}

function getClientInfo(req) {
  return {
    ip: req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'] || 'unknown',
    userAgent: req.get('User-Agent') || 'unknown',
    referrer: req.get('Referrer') || req.get('Referer') || 'direct'
  };
}

function createSuccessResponse(data, message = 'Success') {
  return {
    success: true,
    message,
    data,
    timestamp: new Date().toISOString()
  };
}

function createErrorResponse(error, statusCode = 500) {
  return {
    success: false,
    error: typeof error === 'string' ? error : error.message,
    statusCode,
    timestamp: new Date().toISOString()
  };
}

// // Health check endpoint
// app.get('/health', (req, res) => {
//   try {
//     const healthData = {
//       status: 'OK',
//       uptime: process.uptime(),
//       timestamp: new Date().toISOString(),
//       environment: NODE_ENV,
//       memory: process.memoryUsage(),
//       version: process.version
//     };
    
//     //console.log('[HEALTH CHECK]', healthData);
//     logger.info('Health check performed');
//     res.json(createSuccessResponse(healthData, 'Service is healthy'));
//   } catch (error) {
//     console.error('[HEALTH CHECK ERROR]', error);
//     logger.error(`Health check failed: ${error.message}`);
//     res.status(500).json(createErrorResponse('Health check failed', 500));
//   }
// });

// API Routes

// Create short URLs
app.post('/api/shorten', async (req, res) => {
  try {
    //console.log('[CREATE URLS] Request body:', req.body);
    logger.info(`Shortening ${req.body?.urls?.length || 0} URLs`);
    
    const { urls, validity = config.defaultValidity, shortcode } = req.body;
    
    //console.log('[CREATE URLS] Parsed:', { urlsCount: urls?.length, validity, shortcode });
    
    // Validation
    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      //console.log('[CREATE URLS] Validation failed: URLs array is required');
      logger.warn('URLs array required');
      return res.status(400).json(createErrorResponse('URLs array is required', 400));
    }
    
    if (urls.length > config.maxUrlsPerRequest) {
      //console.log('[CREATE URLS] Validation failed: Too many URLs');
      logger.warn(`Too many URLs: ${urls.length}>${config.maxUrlsPerRequest}`);
      return res.status(400).json(createErrorResponse(`Maximum ${config.maxUrlsPerRequest} URLs allowed`, 400));
    }
    
    const results = [];
    const createdAt = new Date();
    const expiresAt = new Date(createdAt.getTime() + validity * 60 * 1000);
    
    for (let i = 0; i < urls.length; i++) {
      const url = urls[i];
      
      if (!isValidUrl(url)) {
        //console.log('[CREATE URLS] Invalid URL:', url);
        logger.warn(`Invalid URL: ${url}`);
        return res.status(400).json(createErrorResponse(`Invalid URL: ${url}`, 400));
      }
      
      let finalShortcode;
      
      if (shortcode) {
        if (!isValidShortcode(shortcode)) {
          //console.log('[CREATE URLS] Invalid shortcode:', shortcode);
          logger.warn(`Invalid shortcode: ${shortcode}`);
          return res.status(400).json(createErrorResponse(
            `Shortcode must be ${config.minShortcodeLength}-${config.maxShortcodeLength} alphanumeric characters`, 
            400
          ));
        }
        
        finalShortcode = urls.length === 1 ? shortcode : `${shortcode}${i + 1}`;
        
        const existingUrl = await Url.findOne({ shortcode: finalShortcode });
        if (existingUrl) {
          //console.log('[CREATE URLS] Shortcode already exists:', finalShortcode);
          logger.warn(`Shortcode exists: ${finalShortcode}`);
          return res.status(400).json(createErrorResponse(`The shortcode '${finalShortcode}' is already in use. Please try another one or leave it blank to assign a random shortcode.`, 400));
        }
      } else {
        do {
          finalShortcode = generateShortcode();
        } while (await Url.findOne({ shortcode: finalShortcode }));
      }
      
      const urlDoc = await Url.create({
        shortcode: finalShortcode,
        originalUrl: url,
        createdAt,
        expiresAt,
        clicks: []
      });
      
      results.push(urlDoc);
      
      //console.log('[URL CREATED]', { shortcode: finalShortcode, originalUrl: url, expiresAt: expiresAt.toISOString() });
      logger.info(`URL shortened: ${finalShortcode}`);
    }
    
    //console.log('[CREATE URLS] Success:', results.length, 'URLs created');
    logger.info(`Created ${results.length} URLs`);
    res.json(createSuccessResponse({ urls: results }, `${results.length} URL(s) created successfully`));
  } catch (error) {
    console.error('[CREATE URLS ERROR]', error);
    logger.error(`Creation failed: ${error.message}`);
    res.status(500).json(createErrorResponse('Internal server error', 500));
  }
});

// Get all URLs with stats
app.get('/api/shorturls', async (req, res) => {
  try {
    const urls = await Url.find().lean();
    const urlsWithStats = urls.map(url => ({
      ...url,
      clickCount: url.clicks.length,
      isExpired: new Date() > new Date(url.expiresAt),
      lastClicked: url.clicks.length > 0 ? url.clicks[url.clicks.length - 1].timestamp : null
    }));
    
    //console.log('[GET URLS]', { 
    //   totalUrls: urlsWithStats.length, 
    //   activeUrls: urlsWithStats.filter(u => !u.isExpired).length 
    // });
    
    res.json(createSuccessResponse({ urls: urlsWithStats }, `Retrieved ${urlsWithStats.length} URL(s)`));
  } catch (error) {
    console.error('[GET ALL URLS ERROR]', error);
    next(error);
  }
});

// Get specific URL stats
app.get('/api/stats/:shortcode', async (req, res) => {
  try {
    const { shortcode } = req.params;
    const urlData = await Url.findOne({ shortcode }).lean();
    
    if (!urlData) {
      return res.status(404).json(createErrorResponse('Short URL not found', 404));
    }
    
    const stats = {
      ...urlData,
      clickCount: urlData.clicks.length,
      isExpired: new Date() > new Date(urlData.expiresAt),
      clicksByHour: {},
      clicksByReferrer: {},
      recentClicks: urlData.clicks.slice(-10)
    };
    
    // Aggregate click statistics
    urlData.clicks.forEach(click => {
      const hour = new Date(click.timestamp).getHours();
      stats.clicksByHour[hour] = (stats.clicksByHour[hour] || 0) + 1;
      stats.clicksByReferrer[click.referrer] = (stats.clicksByReferrer[click.referrer] || 0) + 1;
    });
    
    res.json(createSuccessResponse(stats, 'URL statistics retrieved'));
  } catch (error) {
    console.error('[GET URL STATS ERROR]', error);
    logger.error(`Stats failed: ${error.message}`);
    res.status(500).json(createErrorResponse('Internal server error', 500));
  }
});

// Redirect route with enhanced tracking
app.get('/:shortcode', async (req, res, next) => {
  try {
    const { shortcode } = req.params;
    const urlData = await Url.findOne({ shortcode });
    const clientInfo = getClientInfo(req);
    
    //console.log('[REDIRECT REQUEST]', { shortcode, ...clientInfo });
    logger.info(`Redirect: ${shortcode} from ${clientInfo.ip}`);
    
    if (!urlData) {
      //console.log('[REDIRECT ERROR] URL not found:', shortcode);
      logger.warn(`Not found: ${shortcode}`);
      return res.status(404).json(createErrorResponse('Short URL not found', 404));
    }
    
    await urlData.checkExpiry();
    
    if (urlData.isExpired) {
      //console.log('[REDIRECT ERROR] URL expired:', shortcode);
      logger.warn(`Expired: ${shortcode}`);
      return res.status(410).json(createErrorResponse('Short URL has expired', 410));
    }
    
    // Track click
    await urlData.addClick(clientInfo);
    
    //console.log('[CLICK TRACKED]', { 
    //   shortcode, 
    //   originalUrl: urlData.originalUrl, 
    //   totalClicks: urlData.clicks.length,
    //   ...clientInfo 
    // });
    
    logger.info(`Click: ${shortcode} total:${urlData.clicks.length}`);
    
    res.redirect(urlData.originalUrl);
  } catch (error) {
    console.error('[REDIRECT ERROR]', error);
    logger.error(`Redirect failed: ${error.message}`);
    res.status(500).json(createErrorResponse('Internal server error', 500));
  }
});

// Delete URL endpoint
app.delete('/api/shorturls/:shortcode', async (req, res) => {
  try {
    const { shortcode } = req.params;
    
    const result = await Url.deleteOne({ shortcode });
    if (result.deletedCount === 0) {
      return res.status(404).json(createErrorResponse('Short URL not found', 404));
    }
    
    //console.log('[URL DELETED]', { shortcode });
    
    res.json(createSuccessResponse(null, 'URL deleted successfully'));
  } catch (error) {
    console.error('[DELETE URL ERROR]', error);
    res.status(500).json(createErrorResponse('Internal server error', 500));
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('[GLOBAL ERROR HANDLER]', err);
  const statusCode = err.statusCode || 500;
  let message = err.message || 'An unexpected error occurred';

  // Check if the error is a Mongoose duplicate key error
  if (err.code === 11000) {
    message = 'Duplicate key error: A record with this key already exists.';
    // You might want to parse err.keyValue to give more specific feedback
    if (err.keyValue && err.keyValue.shortcode) {
      message = `The shortcode '${err.keyValue.shortcode}' is already in use. Please try another one or leave it blank to assign a random shortcode.`;
    }
    res.status(409).json(createErrorResponse(message, 409)); // 409 Conflict
  } else {
    res.status(statusCode).json(createErrorResponse(message, statusCode));
  }
});

// 404 handler
app.use('*', (req, res) => {
  //console.log('[404 ERROR]', { url: req.originalUrl, method: req.method });
  res.status(404).json(createErrorResponse('Endpoint not found', 404));
});

// Graceful shutdown
process.on('SIGTERM', () => {
  //console.log('[SHUTDOWN] SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  //console.log('[SHUTDOWN] SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Start server
app.listen(PORT, () => {
  //console.log(`[SERVER START] Server running on port ${PORT} in ${NODE_ENV} mode`);
  //console.log(`[CONFIG]`, config);
});