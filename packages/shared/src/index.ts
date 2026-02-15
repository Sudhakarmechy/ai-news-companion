export type Tier = 'free' | 'premium';

export interface UserPreferences {
  userId: string;
  locales: string[];
  timezone: string;
  categories: string[];
  region: string;
  mode: 'brief' | 'detailed';
  conversationMode: 'continuous' | 'conversational';
  voice: {
    id: string;
    accent: string;
  };
}

export interface NewsItem {
  id: string;
  title: string;
  summary: string;
  category: string;
  region: string;
  publishedAt: string;
  imageUrl?: string;
  isBreaking?: boolean;
}

export interface PlaybackState {
  currentNewsId?: string;
  playedNewsIds: string[];
  lastActiveAt: string;
  listeningSeconds: number;
}

export interface Subscription {
  userId: string;
  tier: Tier;
  provider?: 'stripe' | 'razorpay';
  status: 'active' | 'trialing' | 'canceled' | 'past_due';
}

export interface StreamPacket {
  type: 'narration' | 'ad' | 'assistant' | 'system';
  text: string;
  newsId?: string;
  audioUrl?: string;
  sequence: number;
}
