import { Request, Response } from 'express';
import { UserPreferences } from '@anc/shared';
import { PersonalizationService } from '../services/personalizationService';

const personalizationService = new PersonalizationService();

export async function getPreferences(req: Request, res: Response) {
  const prefs = await personalizationService.getPreferences(req.userContext!.userId);
  res.json(prefs);
}

export async function putPreferences(req: Request, res: Response) {
  const payload = req.body as UserPreferences;
  await personalizationService.updatePreferences({ ...payload, userId: req.userContext!.userId });
  res.status(204).send();
}
