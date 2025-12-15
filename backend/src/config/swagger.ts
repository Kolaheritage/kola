import swaggerJsdoc from 'swagger-jsdoc';
import { Application } from 'express';
import swaggerUi from 'swagger-ui-express';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Heritage Platform API',
      version: '1.0.0',
      description:
        'API documentation for the Heritage Content Platform - A platform for managing and sharing cultural heritage content',
      contact: {
        name: 'API Support',
      },
      license: {
        name: 'ISC',
      },
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Development server',
      },
      {
        url: 'http://localhost:5000/api',
        description: 'Development API base',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter JWT token',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            message: {
              type: 'string',
              example: 'Error message',
            },
          },
        },
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              example: 1,
            },
            username: {
              type: 'string',
              example: 'johndoe',
            },
            email: {
              type: 'string',
              example: 'john@example.com',
            },
            role: {
              type: 'string',
              enum: ['user', 'admin', 'contributor'],
              example: 'user',
            },
            created_at: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        Content: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              example: 1,
            },
            title: {
              type: 'string',
              example: 'Traditional Dance',
            },
            description: {
              type: 'string',
              example: 'A traditional cultural dance',
            },
            content_type: {
              type: 'string',
              enum: ['story', 'artifact', 'tradition', 'place'],
              example: 'tradition',
            },
            status: {
              type: 'string',
              enum: ['draft', 'published', 'archived'],
              example: 'published',
            },
            author_id: {
              type: 'integer',
              example: 1,
            },
            category_id: {
              type: 'integer',
              example: 1,
            },
            created_at: {
              type: 'string',
              format: 'date-time',
            },
            updated_at: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        Category: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              example: 1,
            },
            name: {
              type: 'string',
              example: 'Cultural Practices',
            },
            description: {
              type: 'string',
              example: 'Traditional cultural practices and customs',
            },
            created_at: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./src/routes/*.ts', './src/routes/*.js'], // Path to the API routes
};

const swaggerSpec = swaggerJsdoc(options);

export const setupSwagger = (app: Application): void => {
  // Swagger UI
  app.use(
    '/api-docs',
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      explorer: true,
      customCss: '.swagger-ui .topbar { display: none }',
      customSiteTitle: 'Heritage Platform API Docs',
    })
  );

  // JSON spec endpoint
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });

  console.log('Swagger docs available at /api-docs');
};

export default swaggerSpec;
