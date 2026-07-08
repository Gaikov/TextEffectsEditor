declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: 'development' | 'production';
  }
}

declare module '*.module.css' {
  const classes: Record<string, string>;
  export default classes;
}

interface FontData {
  family: string;
  fullName: string;
  postscriptName: string;
  style: string;
  blob: () => Promise<Blob>;
}

interface Window {
  queryLocalFonts?: () => Promise<FontData[]>;
}
