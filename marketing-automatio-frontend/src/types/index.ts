// Platform types
export type Platform = 'instagram' | 'linkedin' | 'facebook' | 'instagram-feed' | 'instagram-reels';
export type ConnectionStatus = 'connected' | 'disconnected' | 'error' | 'pending';
export type PostStatus = 'draft' | 'scheduled' | 'published' | 'failed' | 'review';
export type ContentType = 'text' | 'article' | 'carousel' | 'video' | 'image';
export type ToneStyle = 'professional' | 'casual' | 'friendly' | 'formal' | 'creative' | 'humorous';

// User & Auth types
export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  company?: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupCredentials extends LoginCredentials {
  firstName: string;
  lastName: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

// Connection types
export interface Connection {
  id: string;
  platform: Platform;
  status: ConnectionStatus;
  accountName?: string;
  accountId?: string;
  connectedAt?: string;
  lastSync?: string;
  accessToken?: string;
  expiresAt?: string;
  errorMessage?: string;
}

export interface InstagramConnectionForm {
  appId: string;
  appSecret: string;
  businessAccountId: string;
  facebookPageId: string;
  accessToken: string;
}

export interface LinkedInConnectionForm {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  organizationId: string;
  accessToken: string;
}

// Post types
export interface Post {
  id: string;
  userId: string;
  title: string;
  content: string;
  platforms: Platform[];
  status: PostStatus;
  scheduledAt?: string;
  publishedAt?: string;
  imageUrls?: string[];
  videoUrl?: string;
  contentType: ContentType;
  tone?: ToneStyle;
  topic?: string;
  imagePrompt?: string;
  metadata?: PostMetadata;
  createdAt: string;
  updatedAt: string;
}

export interface PostMetadata {
  characterCount: number;
  wordCount: number;
  estimatedReach?: string;
  hashtags?: string[];
  mentions?: string[];
}

export interface CreatePostInput {
  topic: string;
  platforms: Platform[];
  contentType: ContentType;
  tone: ToneStyle;
  imagePrompt?: string;
  scheduledAt?: string;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface ApiError {
  success: false;
  error: string;
  message: string;
  statusCode: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Metrics types
export interface DashboardMetrics {
  scheduledPosts: number;
  pendingApprovals: number;
  totalReach: string;
  engagementRate?: string;
}

export interface AnalyticsData {
  views: number;
  likes: number;
  shares: number;
  comments: number;
  clickThroughRate?: number;
  impressions?: number;
}
