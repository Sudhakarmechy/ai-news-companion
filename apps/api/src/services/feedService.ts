import { NewsItem } from '@anc/shared';
import { FeedResponse } from '../models/types';
import { NewsRepository } from '../repositories/newsRepository';

export class FeedService {
  constructor(private readonly newsRepository = new NewsRepository()) {}

  async buildPersonalizedQueue(categories: string[], region: string, playedIds: string[]): Promise<FeedResponse> {
    const base = await this.newsRepository.getByPreferences(categories, region);
    const queue = base.filter((item) => !playedIds.includes(item.id));

    const trending = await this.newsRepository.getTrending(region);
    const insertedBreaking = trending.filter((item) => !queue.some((q) => q.id === item.id)).slice(0, 2);

    return {
      queue: [...insertedBreaking, ...queue],
      insertedBreaking
    };
  }

  toReels(items: NewsItem[]) {
    return items.map((item) => ({
      id: item.id,
      headline: item.title,
      thumbnail: item.imageUrl,
      audioSnippetText: item.summary
    }));
  }
}
