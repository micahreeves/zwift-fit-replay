// First, let's create a new utility file: src/lib/utils/tempFileManager.ts

import os from 'os';
import path from 'path';
import fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid'; // We'll need to add this to dependencies

export class TempFileManager {
  private tempDir: string;
  private createdPaths: Set<string> = new Set();

  constructor() {
    // Create a unique directory for this session
    this.tempDir = path.join(os.tmpdir(), 'zwift-viz-' + uuidv4());
  }

  async init() {
    await fs.mkdir(this.tempDir, { recursive: true });
  }

  async createTempDir(name: string): Promise<string> {
    const dirPath = path.join(this.tempDir, name);
    await fs.mkdir(dirPath, { recursive: true });
    this.createdPaths.add(dirPath);
    return dirPath;
  }

  async cleanup() {
    try {
      await fs.rm(this.tempDir, { recursive: true, force: true });
    } catch (error) {
      console.error('Error cleaning up temp files:', error);
    }
  }
}
