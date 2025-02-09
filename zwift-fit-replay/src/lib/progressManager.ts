// src/lib/progressManager.ts
import { ProgressStatus } from '@/types/progress';

export class ProgressManager {
  private static instance: ProgressManager;
  private progressMap = new Map<string, ProgressStatus>();

  private constructor() {}

  static getInstance(): ProgressManager {
    if (!this.instance) {
      this.instance = new ProgressManager();
    }
    return this.instance;
  }

  updateProgress(id: string, currentFrame: number, totalFrames: number): void {
    if (!id) throw new Error('Progress ID is required');
    
    this.progressMap.set(id, {
      stage: 'generating',
      progress: currentFrame,
      total: totalFrames
    });
  }

  getProgress(id: string): ProgressStatus | null {
    if (!id) return null;
    return this.progressMap.get(id) || null;
  }

  clearProgress(id: string): void {
    if (!id) return;
    this.progressMap.delete(id);
  }
}

export const progressManager = ProgressManager.getInstance();