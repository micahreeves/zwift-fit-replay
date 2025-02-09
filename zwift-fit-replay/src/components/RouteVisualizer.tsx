

'use client';

import React, { useState } from 'react';
import { Upload } from 'lucide-react';
import Image from 'next/image';

// =================================================================
// Map Configuration Types and Data
// =================================================================
interface MapConfig {
  name: string;
  bounds: number[];
}

interface Maps {
  [key: string]: MapConfig;
}

const maps: Maps = {
  watopia: {
    name: 'Watopia',
    bounds: [-11.7312459858570843, -11.5302123974889117, 166.8583004484408434, 167.0323693223594717],
  },

richmond: {
    name: 'Richmond',
    bounds: [37.5013345513645007, 37.5774847325012900, -77.4894625449863952, -77.3940746451506953],
  },
  london: {
    name: 'London',
    bounds: [51.4602057809166666, 51.5362912271761999, -0.1779572166905335, -0.0549519957274667],
  },
  newYork: {
    name: 'New York',
    bounds: [40.7405988429989705, 40.8174302365245225, -74.0230412872037959, -73.9217625436675405],
  },
  innsbruck: {
    name: 'Innsbruck',
    bounds: [47.2055101222955429, 47.2947204710438456, 11.3505176965529841, 11.4818528705013261],
  },
  bologna: {
    name: 'Bologna',
    bounds: [44.4558841598698464, 44.5297800782955662, 11.2631407831455288, 11.3694520115126387],
  },
  yorkshire: {
    name: 'Yorkshire',
    bounds: [53.9490777310150662, 54.0254658411988800, -1.6321125575047646, -1.5022952867656718],
  },
  critCity: {
    name: 'Crit City',
    bounds: [-10.4039017994063876, -10.3655699850407892, 165.7822255393468538, 165.8208579953937374],
  },
  makuriIslands: {
    name: 'Makuri Island',
    bounds: [-10.8522948255634812, -10.7374319666921050, 165.7660817581687240, 165.8821851584712022],
  },
  france: {
    name: 'France',
    bounds: [-21.7563981850795471, -21.6416256294223821, 166.1384065150539584, 166.2612071527265698],
  },
  paris: {
    name: 'Paris',
    bounds: [48.8299387612970506, 48.9054002160276724, 2.2563580440169662, 2.3720417654555086],
  },
  scotland: {
    name: 'Scotland',
    bounds: [55.6185265339680868, 55.6758953713463782, -5.2798456326195886, -5.1783887129207677],
  },
};


export default function RouteVisualizer() {
  // =================================================================
  // State Management
  // =================================================================
  const [file, setFile] = useState<File | null>(null);
  const [map, setMap] = useState<string>('london');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  // =================================================================
  // Event Handlers
  // =================================================================
  /**
   * Handles file selection from the file input.
   */
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(''); // Clear any previous errors
    }
  };

  /**
   * Handles form submission and triggers the route processing request.
   */
  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file) {
      setError('Please select a .fit file.');
      return;
    }

    setLoading(true);
    setError('');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('map', map);

    try {
      const response = await fetch('/api/process', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to process route');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      // Create a temporary <a> element to programmatically download the file
      const a = document.createElement('a');
      a.href = url;
      a.download = 'route-animation.mp4';
      document.body.appendChild(a);
      a.click();

      // Clean up
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process route');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* =================================================================
          Header Banner
          ================================================================= */}
      <div className="w-full h-[150px] bg-white fixed top-0 left-0 right-0 z-10 flex items-center justify-center">
        <Image
          src="/zwift.fit.replayv2.png"
          alt="Banner Icon"
          width={450}
          height={450}
          className="object-contain"
          priority // Add priority since this is above the fold
        />
      </div>

      {/* =================================================================
          Main Content Form
          ================================================================= */}
      <div className="max-w-md mx-auto pt-[150px] pb-[150px]">
        <form onSubmit={handleUpload} className="space-y-4">
          {/* .FIT/.GPX File Upload */}
          <div className="border-2 border-dashed rounded-lg p-4">
            <input
              type="file"
              accept=".fit,.gpx"
              onChange={handleFileChange}
              className="hidden"
              id="file-input"
            />
            <label htmlFor="file-input" className="flex flex-col items-center cursor-pointer">
              <Upload className="w-8 h-8 mb-2" />
              <span className="text-sm text-gray-600">
                {file ? file.name : 'UPLOAD FIT OR GPX FILE'}
              </span>
            </label>
          </div>

          {/* Map Selection */}
          <select
            value={map}
            onChange={(e) => setMap(e.target.value)}
            className="w-full p-2 border rounded"
          >
            {Object.entries(maps).map(([key, { name }]) => (
              <option key={key} value={key}>
                {name}
              </option>
            ))}
          </select>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || !file}
            className="w-full bg-[#32c8fc] text-white p-2 rounded disabled:bg-[#B1E7FA] disabled:cursor-not-allowed"
          >
            {loading ? 'Processing...' : 'Generate Animation'}
          </button>

          {/* Error Message */}
          {error && (
            <p className="text-red-500 text-sm text-center">
              {error}
            </p>
          )}
        </form>
      </div>

      {/* =================================================================
          Footer Banner
          ================================================================= */}
      <div className="w-full h-[150px] bg-black fixed bottom-0 left-0 right-0 z-10 flex flex-col items-center justify-center">
        <Image
          src="/zwifterscommunity.png"
          alt="Footer Icon"
          width={48}  // 12 * 4 (h-12 was the original size)
          height={48}
          className="mb-2"
        />
        <p className="text-white text-sm font-bold">
          POWERED BY ZWIFTGUY
        </p>
      </div>
    </div>
  );
}