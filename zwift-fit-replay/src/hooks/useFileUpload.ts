// src/hooks/useFileUpload.ts

import { useState, useCallback } from 'react';
import { FILE_LIMITS } from '@/config/maps';

interface UploadState {
  loading: boolean;
  error: string | null;
  progress: number;
}

export function useFileUpload() {
  const [state, setState] = useState<UploadState>({
    loading: false,
    error: null,
    progress: 0
  });

  const upload = useCallback(async (file: File, mapName: string) => {
    setState({ loading: true, error: null, progress: 0 });

    try {
      // Validate file
      if (file.size > FILE_LIMITS.maxSize) {
        throw new Error(`File size must be less than ${FILE_LIMITS.maxSize / 1024 / 1024}MB`);
      }

      const extension = file.name.split('.').pop()?.toLowerCase();
      if (!extension || !FILE_LIMITS.allowedTypes.includes(extension as any)) {
        throw new Error('Invalid file type');
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('map', mapName);

      // Start progress monitoring
      const id = Math.random().toString(36).slice(2);
      const progressMonitor = new EventSource(`/api/progress?id=${id}`);
      
      progressMonitor.onmessage = (event) => {
        const data = JSON.parse(event.data);
        setState(prev => ({ ...prev, progress: (data.progress / data.total) * 100 }));
      };

      // Upload file
      const response = await fetch('/api/process', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to process route');
      }

      const blob = await response.blob();
      return URL.createObjectURL(blob);
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }));
      throw error;
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  }, []);

  return { ...state, upload };
}
