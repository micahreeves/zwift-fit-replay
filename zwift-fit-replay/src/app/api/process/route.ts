// src/app/api/process/route.ts

import { NextResponse } from 'next/server';
import { processRoute } from '@/lib/processRoute';
import { FileValidator } from '@/lib/utils/fileValidation';
import { TempFileManager } from '@/lib/utils/tempFileManager';

export async function POST(request: Request) {
  const tempManager = new TempFileManager();
  
  try {
    await tempManager.init();

    const data = await request.formData();
    const file = data.get('file') as File;
    const mapName = data.get('map') as string;

    // Validate inputs
    if (!file || !mapName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate file
    await FileValidator.validateFile(file);

    // Convert File to Buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Process route
    const videoBuffer = await processRoute(
      buffer,
      mapName,
      file.name.split('.').pop()?.toLowerCase() || '',
      tempManager
    );

    return new NextResponse(videoBuffer, {
      headers: {
        'Content-Type': 'video/mp4',
        'Content-Disposition': 'attachment; filename="route-animation.mp4"',
      },
    });
  } catch (error) {
    console.error('Error processing route:', error);
    
    return NextResponse.json(
      { 
        error: error instanceof Error 
          ? error.message 
          : 'An unexpected error occurred'
      },
      { status: error instanceof Error && error.message.includes('Invalid') ? 400 : 500 }
    );
  } finally {
    await tempManager.cleanup();
  }
}
