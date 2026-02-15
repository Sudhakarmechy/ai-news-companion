import { Request, Response } from 'express';
import { FeedService } from '../services/feedService';
import { UserRepository } from '../repositories/userRepository';

const feedService = new FeedService();
const userRepository = new UserRepository();

export async function getFeed(req: Request, res: Response) {
  const userId = req.userContext!.userId;
  const prefs = await userRepository.getPreferences(userId);
  const playback = await userRepository.getPlayback(userId);

  const result = await feedService.buildPersonalizedQueue(prefs.categories, prefs.region, playback.playedNewsIds);

  res.json(result);
}

export async function getReels(req: Request, res: Response) {
  const userId = req.userContext!.userId;
  const prefs = await userRepository.getPreferences(userId);
  const playback = await userRepository.getPlayback(userId);
  const result = await feedService.buildPersonalizedQueue(prefs.categories, prefs.region, playback.playedNewsIds);
  res.json({ reels: feedService.toReels(result.queue) });
}
