declare module 'fit-file-parser' {
  interface FitParserOptions {
    force?: boolean;
    speedUnit?: 'm/s' | 'mph' | 'km/h';
    lengthUnit?: 'm' | 'mi' | 'km';
    temperatureUnit?: 'kelvin' | 'fahrenheit' | 'celsius';
    elapsedRecordFix?: boolean;
    // add more options as needed
  }

  interface FitData {
    sessions?: any[];
    records?: any[];
    // define shape if you know it
  }

  type FitParserCallback = (error: Error | null, data: FitData) => void;

  export default class FitParser {
    constructor(options?: FitParserOptions);
    parse(buffer: Buffer | Uint8Array | string, callback: FitParserCallback): void;
  }
}