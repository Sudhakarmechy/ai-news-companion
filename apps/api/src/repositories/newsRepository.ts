import { NewsItem } from '@anc/shared';

const seed: NewsItem[] = [
  {
    id: 'n1',
    title: 'Global AI regulation coalition expands in EU and APAC',
    summary: 'Regulators coordinate baseline AI transparency standards across markets.',
    category: 'technology',
    region: 'global',
    publishedAt: new Date().toISOString(),
    isBreaking: true,
    imageUrl: 'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b'
  },
  {
    id: 'n2',
    title: 'Energy transition investment hits record quarterly high',
    summary: 'Green infrastructure investments accelerate amid new policy incentives.',
    category: 'finance',
    region: 'global',
    publishedAt: new Date().toISOString()
  }
];

export class NewsRepository {
  async getByPreferences(categories: string[], region: string): Promise<NewsItem[]> {
    return seed.filter((item) => categories.includes(item.category) && (item.region === region || item.region === 'global'));
  }

  async getTrending(region: string): Promise<NewsItem[]> {
    return seed.filter((item) => item.isBreaking && (item.region === region || item.region === 'global'));
  }
}
