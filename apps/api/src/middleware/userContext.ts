import { NextFunction, Request, Response } from 'express';
import { UserContext } from '../models/types';

declare global {
  namespace Express {
    interface Request {
      userContext?: UserContext;
    }
  }
}

export function userContextMiddleware(req: Request, _res: Response, next: NextFunction) {
  req.userContext = {
    userId: req.header('x-user-id') ?? 'demo-user',
    tier: req.header('x-tier') === 'premium' ? 'premium' : 'free'
  };
  next();
}
