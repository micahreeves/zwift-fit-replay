// src/app/api/progress/route.ts
import { NextResponse } from 'next/server';
import { progressManager } from '@/lib/progressManager';

export async function GET(request: Request) {
  // Get ID from URL search params
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Progress ID is required' }, { status: 400 });
  }

  const encoder = new TextEncoder();

  return new NextResponse(
    new ReadableStream({
      start(controller) {
        let isActive = true;

        const sendProgress = () => {
          if (!isActive) return;

          const status = progressManager.getProgress(id);
          
          if (status) {
            const data = `data: ${JSON.stringify(status)}\n\n`;
            controller.enqueue(encoder.encode(data));

            // Check if we're done
            if (status.progress === status.total) {
              progressManager.clearProgress(id);
              controller.close();
              isActive = false;
              return;
            }
          }

          // Continue sending updates
          setTimeout(sendProgress, 500);
        };

        // Start sending updates
        sendProgress();

        // Cleanup function
        return () => {
          isActive = false;
        };
      }
    }),
    {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    }
  );
}