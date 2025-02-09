// src/lib/workers/frameGenerator.ts

import { Worker, isMainThread, parentPort, workerData } from 'worker_threads';
import path from 'path';
import sharp from 'sharp';
import { createSvgPath } from '../utils/svgUtils';

if (!isMainThread) {
  const { 
    baseImage, 
    coordinates, 
    currentPoint, 
    dimensions, 
    frameNumber 
  } = workerData;

  async function generateFrame() {
    const [markerX, markerY] = coordinates[currentPoint];

    const svg = `
      <svg 
        width="${dimensions.width}" 
        height="${dimensions.height}"
        xmlns="http://www.w3.org/2000/svg"
      >
        ${createSvgPath(coordinates, currentPoint)}
        <circle 
          cx="${markerX}" 
          cy="${markerY}" 
          r="10" 
          fill="#FC4C02" 
          stroke="#FFFFFF"
          stroke-width="3"
        />
      </svg>
    `;

    const frameBuffer = await sharp(baseImage)
      .composite([{ input: Buffer.from(svg), blend: 'over' }])
      .png()
      .toBuffer();

    parentPort?.postMessage(frameBuffer);
  }

  generateFrame().catch(error => {
    parentPort?.postMessage({ error: error.message });
  });
}

export class FrameGeneratorPool {
  private static readonly MAX_WORKERS = 4;
  private workers: Worker[] = [];

  constructor() {
    // Initialize worker pool
    for (let i = 0; i < FrameGeneratorPool.MAX_WORKERS; i++) {
      this.workers.push(new Worker(__filename));
    }
  }

  async generateFrame(params: FrameGenerationParams): Promise<Buffer> {
    const worker = this.getAvailableWorker();
    
    return new Promise((resolve, reject) => {
      worker.once('message', (result) => {
        if (result.error) {
          reject(new Error(result.error));
        } else {
          resolve(result);
        }
      });

      worker.postMessage(params);
    });
  }

  private getAvailableWorker(): Worker {
    // Simple round-robin worker selection
    const worker = this.workers.shift()!;
    this.workers.push(worker);
    return worker;
  }

  cleanup() {
    this.workers.forEach(worker => worker.terminate());
  }
}
