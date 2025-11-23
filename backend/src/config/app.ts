interface CorsOptions {
  origin: string;
  credentials: boolean;
  optionsSuccessStatus: number;
}

interface JwtConfig {
  secret: string;
  expiresIn: string;
}

interface UploadConfig {
  maxFileSize: number;
  uploadPath: string;
  allowedImageTypes: string[];
  allowedVideoTypes: string[];
  allowedAudioTypes: string[];
}

interface AppConfig {
  env: string;
  port: number;
  corsOptions: CorsOptions;
  jwt: JwtConfig;
  upload: UploadConfig;
}

const config: AppConfig = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5000'),

  // CORS configuration
  corsOptions: {
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
    optionsSuccessStatus: 200,
  },

  // JWT configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },

  // File upload configuration
  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '104857600'), // 100MB
    uploadPath: process.env.UPLOAD_PATH || './uploads',
    allowedImageTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    allowedVideoTypes: ['video/mp4', 'video/webm', 'video/quicktime'],
    allowedAudioTypes: ['audio/mpeg', 'audio/wav', 'audio/ogg'],
  },
};

export default config;
