import { Request, Response } from 'express';

export async function getMonetizationPolicy(req: Request, res: Response) {
  const tier = req.userContext?.tier ?? 'free';
  res.json({
    tier,
    adsEnabled: tier === 'free',
    listeningLimitMinutes: tier === 'free' ? 60 : null,
    providers: ['stripe', 'razorpay'],
    plans: [
      { id: 'monthly', priceUsd: 7.99, interval: 'month' },
      { id: 'yearly', priceUsd: 69.0, interval: 'year' }
    ]
  });
}
