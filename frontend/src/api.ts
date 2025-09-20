import axios from 'axios';
import { CreateUrlRequest, CreateUrlResponse, UrlData } from './types';
import { createLogger } from './logger';

// Initialize logger for API calls
const logger = createLogger('api');

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for logging
api.interceptors.request.use(
  (config) => {
    //console.log(`[API REQUEST] ${config.method?.toUpperCase()} ${config.url}`, config.data);
    logger.info(`${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('[API REQUEST ERROR]', error);
    logger.error(`Request failed: ${error.message}`);
    return Promise.reject(error);
  }
);

// Response interceptor for logging and error handling
api.interceptors.response.use(
  (response) => {
    //console.log(`[API RESPONSE] ${response.status}`, response.data);
    logger.info(`${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    logger.error(`${error.response?.status || 'Network'} ${error.message}`);
    return Promise.reject(error);
  }
);
export const createShortUrls = async (data: CreateUrlRequest): Promise<CreateUrlResponse> => {
  try {
    const response = await api.post('/api/shorten', data);
    return response.data.data;
  } catch (error: any) {
    const errorMessage = error.response?.data?.error || 'Failed to create short URLs';
    const newError = new Error(errorMessage);
    newError.name = 'APIError';
    // console.error('Error being thrown from api.ts:', newError);
    throw newError;
  }
};

export const fetchUrls = async (): Promise<{ urls: UrlData[] }> => {
  try {
    const response = await api.get('/api/shorturls');
    return response.data.data;
  } catch (error: any) {
    const errorMessage = error.response?.data?.error || 'Failed to fetch URLs';
    const newError = new Error(errorMessage);
    newError.name = 'APIError';
    // console.error('Error being thrown from api.ts:', newError);
    throw newError;
  }
};

export const fetchUrlStats = async (shortcode: string): Promise<UrlData> => {
  try {
    const response = await api.get(`/api/stats/${shortcode}`);
    return response.data.data;
  } catch (error: any) {
    const errorMessage = error.response?.data?.error || 'Failed to fetch URL statistics';
    const newError = new Error(errorMessage);
    newError.name = 'APIError';
    console.error('Error being thrown from api.ts:', newError);
    throw newError;
  }
};

export const deleteUrl = async (shortcode: string): Promise<void> => {
  try {
    await api.delete(`/api/shorturls/${shortcode}`);
  } catch (error: any) {
    const errorMessage = error.response?.data?.error || 'Failed to delete URL';
    const newError = new Error(errorMessage);
    newError.name = 'APIError';
    console.error('Error being thrown from api.ts:', newError);
    throw newError;
  }
};

// export const checkHealth = async (): Promise<any> => {
//   try {
//     const response = await api.get('/health');
//     return response.data.data;
//   } catch (error: any) {
//     const errorMessage = error.response?.data?.error || 'Health check failed';
//     const newError = new Error(errorMessage);
//     newError.name = 'APIError';
//     console.error('Error being thrown from api.ts:', newError);
//     throw newError;
//   }
// };

export const getShortUrl = (shortcode: string): string => {
  return `${API_BASE_URL}/${shortcode}`;
};