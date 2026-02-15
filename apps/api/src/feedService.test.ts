import test from 'node:test';
import assert from 'node:assert/strict';
import { FeedService } from './services/feedService';

test('feed service dedupes already played items', async () => {
  const service = new FeedService();
  const data = await service.buildPersonalizedQueue(['technology', 'finance'], 'global', ['n1']);
  assert.equal(data.queue.some((item) => item.id === 'n1'), false);
});

test('feed service accepts injected repository implementation', async () => {
  const service = new FeedService({
    getByPreferences: async () => [
      {
        id: 'n1',
        title: 'A',
        summary: 'B',
        category: 'technology',
        region: 'global',
        publishedAt: new Date().toISOString()
      }
    ],
    getTrending: async () => []
  } as any);

  const data = await service.buildPersonalizedQueue(['technology'], 'global', []);
  assert.equal(data.queue.length, 1);
  assert.equal(data.queue[0]?.id, 'n1');
});
