import { createClient } from 'redis';
import logger from './logger.js';

const client = createClient({ url: process.env.REDIS_URL });

client.on('error', (err) => logger.warn({ err }, 'redis error'));
client.on('connect', () => logger.info('redis connected'));

client.connect().catch((err) => logger.warn({ err }, 'redis unavailable - cache disabled'));

export default client;
