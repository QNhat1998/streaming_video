export interface VideoStreamResponse {
  headers: {
    'Content-Range'?: string;
    'Accept-Ranges'?: string;
    'Content-Length': string;
    'Content-Type': string;
  };
  videoBuffer: Buffer;
}

export interface VideoUploadResponse {
  message: string;
  url: string;
}

export interface VideoInfo {
  name: string;
  originalName: string;
  url: string;
  format: string;
  size: number;
  duration: number;
  createdAt: Date;
}
