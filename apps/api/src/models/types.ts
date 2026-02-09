import { NewsItem, PlaybackState, Subscription, UserPreferences } from '@anc/shared';

export interface UserContext {
  userId: string;
  tier: Subscription['tier'];
}

export interface UserProfile {
  preferences: UserPreferences;
  playback: PlaybackState;
}

export interface FeedResponse {
  queue: NewsItem[];
  insertedBreaking?: NewsItem[];
}
