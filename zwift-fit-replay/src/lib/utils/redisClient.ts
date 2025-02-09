// src/lib/utils/redisClient.ts

import { Redis } from 'ioredis';
import { ProgressStatus } from '@/types/progress';

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

export class ProgressTracker {
  private static readonly EXPIRY_TIME = 3600; // 1 hour in seconds

  static async updateProgress(
    id: string, 
    status: ProgressStatus
  ): Promise<void> {
    await redis.setex(
      `progress:${id}`,
      this.EXPIRY_TIME,
      JSON.stringify(status)
    );
  }

  static async getProgress(id: string): Promise<ProgressStatus | null> {
    const data = await redis.get(`progress:${id}`);
    return data ? JSON.parse(data) : null;
  }

  static async clearProgress(id: string): Promise<void> {
    await redis.del(`progress:${id}`);
  }
}
