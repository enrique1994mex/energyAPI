import redis from '../config/redis.js';
import logger from '../config/logger.js';

const TTL_SECONDS = 24 * 60 * 60;

function buildKey(recordId, kwhNonSummer, kwhSummer, tariffType, city) {
  return `billing:sim:${recordId}:${kwhNonSummer}:${kwhSummer}:${tariffType}:${city ?? 'no-city'}`;
}

export async function getCachedSimulation(recordId, kwhNonSummer, kwhSummer, tariffType, city) {
  if (!redis.isReady) return null;
  try {
    const key = buildKey(recordId, kwhNonSummer, kwhSummer, tariffType, city);
    const hit = await redis.get(key);
    if (hit) {
      logger.debug({ event: 'billing_cache_hit', recordId }, 'cache');
      return JSON.parse(hit);
    }
    return null;
  } catch (err) {
    logger.warn({ err, recordId }, 'billing cache get failed');
    return null;
  }
}

export async function setCachedSimulation(recordId, kwhNonSummer, kwhSummer, tariffType, city, result) {
  if (!redis.isReady) return;
  try {
    const key = buildKey(recordId, kwhNonSummer, kwhSummer, tariffType, city);
    await redis.set(key, JSON.stringify(result), { EX: TTL_SECONDS });
    logger.debug({ event: 'billing_cache_set', recordId }, 'cache');
  } catch (err) {
    logger.warn({ err, recordId }, 'billing cache set failed');
  }
}
