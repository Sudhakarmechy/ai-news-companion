import test from 'node:test';
import assert from 'node:assert/strict';
import { FeedService } from './services/feedService';

test('feed service dedupes already played items', async () => {
  const service = new FeedService();
  const data = await service.buildPersonalizedQueue(['technology', 'finance'], 'global', ['n1']);
  assert.equal(data.queue.some((item) => item.id === 'n1'), false);
});
