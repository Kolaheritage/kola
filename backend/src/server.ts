import 'dotenv/config';
import express, { Request, Response, Application } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

import config from './config/app.js';
import db from './config/database.js';
import errorHandler from './middleware/errorHandler.js';
import notFoundHandler from './middleware/notFoundHandler.js';
import routes from './routes/index.js';
import { setupSwagger } from './config/swagger.js';

// ES module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app: Application = express();

// Middleware
app.use(cors(config.corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Setup Swagger documentation
setupSwagger(app);

// Health check endpoint with database connectivity test
app.get('/health', async (req: Request, res: Response) => {
  console.log('Health check requested');

  // Test database connection
  let dbStatus = 'disconnected';
  let dbMessage = '';

  try {
    await db.testConnection();
    dbStatus = 'connected';
    dbMessage = 'Database connection healthy';
  } catch (error) {
    dbMessage = `Database connection failed: ${(error as Error).message}`;
    console.error('Health check - database error:', error);
  }

  const healthStatus = {
    status: dbStatus === 'connected' ? 'healthy' : 'unhealthy',
    message: 'Heritage Platform API',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    database: {
      status: dbStatus,
      message: dbMessage,
    },
  };

  // Return 503 if database is not connected
  const statusCode = dbStatus === 'connected' ? 200 : 503;
  res.status(statusCode).json(healthStatus);
});

// API Routes
app.use('/api', routes);

// Error handling - must be last
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
const PORT = config.port;

const startServer = async (): Promise<void> => {
  try {
    // Test database connection
    await db.testConnection();
    console.log('Database connected successfully');

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Environment: ${config.env}`);
      console.log(`Health check: http://localhost:${PORT}/health`);
      console.log(`API Base URL: http://localhost:${PORT}/api`);
      console.log(`API Documentation: http://localhost:${PORT}/api-docs`);
    });
  } catch (error) {
    console.error('Failed to start server:', (error as Error).message);
    process.exit(1);
  }
};

// Only start the server if not in test mode
if (process.env.NODE_ENV !== 'test') {
  startServer();
}

export default app;
