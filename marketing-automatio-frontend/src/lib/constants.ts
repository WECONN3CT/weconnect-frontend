export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const APP_NAME = 'WeConnect';
export const APP_DESCRIPTION = 'AI-powered social media automation platform';

// API Endpoints
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    SIGNUP: '/auth/signup',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    ME: '/auth/me',
  },
  POSTS: {
    LIST: '/posts',
    CREATE: '/posts',
    UPDATE: (id: string) => `/posts/${id}`,
    DELETE: (id: string) => `/posts/${id}`,
    PUBLISH: (id: string) => `/posts/${id}/publish`,
  },
  CONNECTIONS: {
    LIST: '/connections',
    CREATE: '/connections',
    UPDATE: (id: string) => `/connections/${id}`,
    DELETE: (id: string) => `/connections/${id}`,
    RECONNECT: (id: string) => `/connections/${id}/reconnect`,
  },
  ANALYTICS: {
    DASHBOARD: '/analytics/dashboard',
    POST: (id: string) => `/analytics/posts/${id}`,
  },
  UPLOAD: {
    IMAGES: '/upload/images',
  },
} as const;

// Platform Configuration
export const PLATFORM_CONFIG = {
  instagram: {
    name: 'Instagram Business',
    icon: '📸',
    color: 'from-purple-500 to-pink-500',
    bgColor: 'bg-gradient-to-br from-purple-50 to-pink-50',
    borderColor: 'border-purple-200',
    maxCharacters: 2200,
    supportsImages: true,
    supportsVideo: true,
    supportsCarousel: true,
  },
  linkedin: {
    name: 'LinkedIn',
    icon: '💼',
    color: 'from-blue-600 to-blue-700',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    maxCharacters: 3000,
    supportsImages: true,
    supportsVideo: true,
    supportsCarousel: true,
  },
  facebook: {
    name: 'Facebook Page',
    icon: '👥',
    color: 'from-blue-700 to-blue-800',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    maxCharacters: 63206,
    supportsImages: true,
    supportsVideo: true,
    supportsCarousel: false,
  },
} as const;

// Local Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  USER: 'user',
  THEME: 'theme',
} as const;

// Query Keys for React Query
export const QUERY_KEYS = {
  USER: 'user',
  POSTS: 'posts',
  CONNECTIONS: 'connections',
  ANALYTICS: 'analytics',
  DASHBOARD_METRICS: 'dashboard_metrics',
} as const;

// Toast/Notification durations
export const TOAST_DURATION = {
  SUCCESS: 3000,
  ERROR: 5000,
  INFO: 3000,
} as const;

// Validation Rules
export const VALIDATION = {
  PASSWORD_MIN_LENGTH: 8,
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  POST_MIN_LENGTH: 10,
  POST_MAX_LENGTH: 5000,
} as const;
