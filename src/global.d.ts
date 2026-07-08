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
  showSaveFilePicker?: (options?: SaveFilePickerOptions) => Promise<FileSystemFileHandle>;
}

interface FilePickerAcceptType {
  description?: string;
  accept: Record<string, string[]>;
}

interface SaveFilePickerOptions {
  suggestedName?: string;
  types?: FilePickerAcceptType[];
}

interface FileSystemWritableFileStream extends WritableStream {
  write: (data: Blob | BufferSource | string) => Promise<void>;
  close: () => Promise<void>;
}

interface FileSystemFileHandle {
  createWritable: () => Promise<FileSystemWritableFileStream>;
}
