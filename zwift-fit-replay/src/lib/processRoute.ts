// src/lib/processRoute.ts
import FitParser from 'fit-file-parser';
import sharp from 'sharp';
import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import fs from 'fs/promises';
import { XMLParser } from 'fast-xml-parser';

// Core data interfaces
interface FitRecord {
  position_lat: number;
  position_long: number;
  power?: number;
  speed?: number;
}

export interface FitData {
  records: FitRecord[];
}

interface Dimensions {
  width: number;
  height: number;
}

interface MapConfig {
  bounds: [number, number, number, number];
  image: string;
}

interface Coord {
  lat: number;
  lon: number;
}

// Map configurations
const mapConfigs: Record<string, MapConfig> = {
  watopia: {
    bounds: [-11.7312459858570843, -11.5302123974889117, 166.8583004484408434, 167.0323693223594717],
    image: 'maps/watopia.png'
  },
  richmond: {
    bounds: [37.5013345513645007, 37.5774847325012900, -77.4894625449863952, -77.3940746451506953],
    image: 'maps/richmond.png'
  },
  london: {
    bounds: [51.4602057809166666, 51.5362912271761999, -0.1779572166905335, -0.0549519957274667],
    image: 'maps/london.png'
  },
  newYork: {
    bounds: [40.7405988429989705, 40.8174302365245225, -74.0230412872037959, -73.9217625436675405],
    image: 'maps/newyork.png'
  },
  innsbruck: {
    bounds: [47.2055101222955429, 47.2947204710438456, 11.3505176965529841, 11.4818528705013261],
    image: 'maps/innsbruck.png'
  },
  bologna: {
    bounds: [44.4558841598698464, 44.5297800782955662, 11.2631407831455288, 11.3694520115126387],
    image: 'maps/bologna.png'
  },
  yorkshire: {
    bounds: [53.9490777310150662, 54.0254658411988800, -1.6321125575047646, -1.5022952867656718],
    image: 'maps/yorkshire.png'
  },
  critCity: {
    bounds: [-10.4039017994063876, -10.3655699850407892, 165.7822255393468538, 165.8208579953937374],
    image: 'maps/critcity.png'
  },
  makuriIslands: {
    bounds: [-10.8522948255634812, -10.7374319666921050, 165.7660817581687240, 165.8821851584712022],
    image: 'maps/makuriislands.png'
  },
  france: {
    bounds: [-21.7563981850795471, -21.6416256294223821, 166.1384065150539584, 166.2612071527265698],
    image: 'maps/france.png'
  },
  paris: {
    bounds: [48.8299387612970506, 48.9054002160276724, 2.2563580440169662, 2.3720417654555086],
    image: 'maps/paris.png'
  },
  scotland: {
    bounds: [55.6185265339680868, 55.6758953713463782, -5.2798456326195886, -5.1783887129207677],
    image: 'maps/scotland.png'
  }
};
// Utility Functions
function geoToImageCoords(
  lat: number,
  lon: number,
  [minLat, maxLat, minLon, maxLon]: [number, number, number, number],
  imgWidth: number,
  imgHeight: number
): [number, number] {
  const x = ((lon - minLon) / (maxLon - minLon)) * imgWidth;
  const y = (1 - (lat - minLat) / (maxLat - minLat)) * imgHeight;
  return [Math.round(x), Math.round(y)];
}

function createSvgPath(
  coordinates: [number, number][],
  currentPoint: number
): string {
  let pathString = '<path d="';
  
  for (let i = 0; i <= currentPoint; i++) {
    const [x, y] = coordinates[i];
    pathString += `${i === 0 ? 'M' : 'L'} ${x} ${y} `;
  }
  
  pathString += '" stroke="#FC4C02" stroke-width="3" fill="none" ' +
               'stroke-opacity="0.9" stroke-linecap="round" stroke-linejoin="round"/>';
  
  return pathString;
}

// Frame Generation
async function createFrame(
  baseImage: Buffer,
  coordinates: [number, number][],
  currentPoint: number,
  dimensions: Dimensions,
  frameNumber: number,
  framesDir: string,
  mapName: string
): Promise<void> {
  const resizeWidth = mapName === 'watopia' ? 1024 : 1280;
  
  const resizedBase = await sharp(baseImage)
    .resize({ width: resizeWidth, fit: 'inside', withoutEnlargement: true })
    .toBuffer();

  const resizedDimensions = await sharp(resizedBase).metadata();
  const scaleX = (resizedDimensions.width ?? 0) / dimensions.width;
  const scaleY = (resizedDimensions.height ?? 0) / dimensions.height;

  const scaledCoords = coordinates.map(([x, y]) => 
    [x * scaleX, y * scaleY] as [number, number]
  );

  const [markerX, markerY] = scaledCoords[currentPoint];

  const svg = `
    <svg 
      width="${resizedDimensions.width}" 
      height="${resizedDimensions.height}"
      xmlns="http://www.w3.org/2000/svg"
    >
      ${createSvgPath(scaledCoords, currentPoint)}
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

  const frameBuffer = await sharp(resizedBase)
    .composite([{ input: Buffer.from(svg), blend: 'over' }])
    .toBuffer();

  const framePath = path.resolve(
    framesDir, 
    `frame_${String(frameNumber).padStart(4, '0')}.png`
  );

  await sharp(frameBuffer)
    .png({ quality: 100 })
    .toFile(framePath);
}
// File Processing Functions
async function parseGpxFile(fileBuffer: Buffer): Promise<Coord[]> {
  const xmlText = fileBuffer.toString('utf8');
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_"
  });
  
  const gpx = parser.parse(xmlText);
  const trackpoints = gpx.gpx.trk.trkseg.trkpt;

  if (!Array.isArray(trackpoints)) {
    throw new Error('No valid trackpoints found in GPX file');
  }

  return trackpoints.map(point => ({
    lat: parseFloat(point['@_lat']),
    lon: parseFloat(point['@_lon'])
  }));
}

async function parseFitFile(fileBuffer: Buffer): Promise<FitData> {
  return new Promise((resolve, reject) => {
    const parser = new FitParser({
      force: true,
      speedUnit: 'km/h',
      lengthUnit: 'km',
      temperatureUnit: 'celsius',
    });

    parser.parse(fileBuffer, (error: Error | null, data: any) => {
      if (error) return reject(error);

      const records = data.records?.filter((r: any) => 
        typeof r.position_lat !== 'undefined' &&
        typeof r.position_long !== 'undefined'
      ).map((r: any) => ({
        position_lat: r.position_lat,
        position_long: r.position_long,
        speed: r.speed
      })) ?? [];

      resolve({ records });
    });
  });
}

async function prepareFramesDirectory(): Promise<string> {
  const tempDir = path.resolve(process.cwd(), 'temp');
  const framesDir = path.resolve(tempDir, 'frames');

  await fs.mkdir(framesDir, { recursive: true });
  const existingFrames = await fs.readdir(framesDir);
  await Promise.all(
    existingFrames.map(frame => fs.unlink(path.resolve(framesDir, frame)))
  );

  return framesDir;
}

function createVideoFromFrames(
  framesDir: string, 
  outputPath: string
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    ffmpeg()
      .input(path.resolve(framesDir, 'frame_%04d.png'))
      .inputFPS(60)
      .output(outputPath)
      .videoCodec('libx264')
      .outputOptions(['-pix_fmt yuv420p', '-crf 23', '-preset slow'])
      .on('end', async () => {
        try {
          const videoBuffer = await fs.readFile(outputPath);
          await fs.rm(path.resolve(process.cwd(), 'temp'), { recursive: true, force: true });
          resolve(videoBuffer);
        } catch (error) {
          reject(error);
        }
      })
      .on('error', reject)
      .run();
  });
}
export async function processRoute(
  fileBuffer: Buffer, 
  mapName: string,
  fileType: string
): Promise<Buffer> {
  try {
    console.log('Starting route processing...');

    // Parse input file
    let coordinates: Coord[];
    
    if (fileType === 'fit') {
      const fitData = await parseFitFile(fileBuffer);
      if (!fitData || !Array.isArray(fitData.records)) {
        throw new Error('Invalid FIT data');
      }
      coordinates = fitData.records.map(r => ({
        lat: r.position_lat,
        lon: r.position_long
      }));
    } else if (fileType === 'gpx') {
      coordinates = await parseGpxFile(fileBuffer);
    } else {
      throw new Error('Unsupported file type');
    }

    console.log(`Parsed ${coordinates.length} coordinates from ${fileType} file`);

    const mapConfig = mapConfigs[mapName];
    if (!mapConfig) {
      throw new Error(`Invalid map name: "${mapName}"`);
    }

    const mapPath = path.resolve(process.cwd(), 'public', mapConfig.image);
    const baseImageBuffer = await sharp(mapPath).toBuffer();
    const metadata = await sharp(baseImageBuffer).metadata();
    if (!metadata.width || !metadata.height) {
      throw new Error('Unable to read map image metadata.');
    }

    const step = Math.max(1, Math.floor(coordinates.length / 800));
    const imageCoords = coordinates
      .filter((_, i) => i % step === 0)
      .map(({ lat, lon }) =>
        geoToImageCoords(
          lat,
          lon,
          mapConfig.bounds,
          metadata.width!,
          metadata.height!
        )
      );

    console.log(`Total frames to generate: ${imageCoords.length}`);

    const framesDir = await prepareFramesDirectory();

    for (let i = 0; i < imageCoords.length; i++) {
      if (i % 30 === 0) {
        console.log(`Generating frame ${i + 1} of ${imageCoords.length}`);
      }
      await createFrame(
        baseImageBuffer,
        imageCoords,
        i,
        { width: metadata.width, height: metadata.height },
        i,
        framesDir,
        mapName
      );
    }

    const outputPath = path.resolve(process.cwd(), 'temp', 'output.mp4');
    const videoBuffer = await createVideoFromFrames(framesDir, outputPath);

    console.log('Video creation successful. Returning video buffer.');
    return videoBuffer;
  } catch (error) {
    console.error('Route processing failed:', error);
    throw error;
  }
}
// Type exports
export type {
  FitRecord,

  Dimensions,
  MapConfig,
  Coord
};

// Function exports
export {
  geoToImageCoords,
  createSvgPath,
  parseGpxFile,
  parseFitFile,
  createFrame,
  prepareFramesDirectory,
  createVideoFromFrames,
  processRoute as default
};