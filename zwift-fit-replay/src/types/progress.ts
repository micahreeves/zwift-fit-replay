// src/types/progress.ts

// Define possible stages for frame generation
export type GenerationStage = 'generating';

// Define the structure of our progress status
export interface ProgressStatus {
  stage: GenerationStage;
  progress: number;  // Current frame number
  total: number;     // Total frames to generate
}

// Error types for better error handling
export class ProgressError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ProgressError';
  }
}

// Validation functions
export const isValidProgress = (progress: number, total: number): boolean => {
  return progress >= 0 && progress <= total && total > 0;
};