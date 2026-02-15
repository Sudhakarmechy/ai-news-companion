import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(4000),
  REDIS_URL: z.string().default('redis://localhost:6379'),
  NEWS_REGION_FALLBACK: z.string().default('global')
});

export const env = schema.parse(process.env);
