import { PlaybackState, UserPreferences } from '@anc/shared';

const preferencesStore = new Map<string, UserPreferences>();
const playbackStore = new Map<string, PlaybackState>();

export class UserRepository {
  async getPreferences(userId: string): Promise<UserPreferences> {
    return (
      preferencesStore.get(userId) ?? {
        userId,
        locales: ['en-US'],
        timezone: 'UTC',
        categories: ['technology', 'finance', 'world'],
        region: 'global',
        mode: 'brief',
        conversationMode: 'continuous',
        voice: { id: 'alloy', accent: 'global' }
      }
    );
  }

  async savePreferences(prefs: UserPreferences): Promise<void> {
    preferencesStore.set(prefs.userId, prefs);
  }

  async getPlayback(userId: string): Promise<PlaybackState> {
    return playbackStore.get(userId) ?? {
      playedNewsIds: [],
      lastActiveAt: new Date().toISOString(),
      listeningSeconds: 0
    };
  }

  async savePlayback(userId: string, state: PlaybackState): Promise<void> {
    playbackStore.set(userId, state);
  }
}
