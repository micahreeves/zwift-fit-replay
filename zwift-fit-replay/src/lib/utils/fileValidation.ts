// src/lib/utils/fileValidation.ts

import { Magic, MAGIC_MIME_TYPE } from 'mmmagic'; // We'll need to add this dependency

const ALLOWED_MIME_TYPES = ['application/octet-stream', 'application/xml'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export class FileValidator {
  static async validateFile(file: File): Promise<void> {
    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      throw new Error('File size exceeds 10MB limit');
    }

    // Check file extension
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (!extension || !['fit', 'gpx'].includes(extension)) {
      throw new Error('Invalid file type. Only .fit and .gpx files are supported');
    }

    // Additional MIME type validation could be added here
    // Note: Browser File API doesn't give reliable MIME types for .fit files
  }
}
