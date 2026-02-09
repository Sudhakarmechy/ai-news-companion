import http from 'http';
import pino from 'pino';
import { createApp } from './app';
import { env } from './config/env';
import { attachSocketServer } from './ws/socketServer';

const logger = pino({ name: 'anc-api' });
const app = createApp();
const server = http.createServer(app);

attachSocketServer(server);

server.listen(env.PORT, () => {
  logger.info(`API listening on port ${env.PORT}`);
});
