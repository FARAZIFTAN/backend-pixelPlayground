import swaggerJsdoc from 'swagger-jsdoc';

/**
 * Swagger/OpenAPI Configuration
 * API Documentation for PixelPlayground Backend
 */

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'PixelPlayground API Documentation',
    version: '1.0.0',
    description: 'Complete API documentation for PixelPlayground - Photo Booth & Frame Creator Platform',
    contact: {
      name: 'PixelPlayground Team',
      email: 'support@pixelplayground.com',
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT',
    },
  },
  servers: [
    {
      url: 'http://localhost:3001',
      description: 'Development server',
    },
    {
      url: 'https://api.pixelplayground.com',
      description: 'Production server',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter JWT token from login/register',
      },
    },
    schemas: {
      User: {
        type: 'object',
        properties: {
          id: { type: 'string', example: '507f1f77bcf86cd799439011' },
          name: { type: 'string', example: 'John Doe' },
          email: { type: 'string', format: 'email', example: 'john@example.com' },
          role: { type: 'string', enum: ['user', 'admin'], example: 'user' },
          isPremium: { type: 'boolean', example: false },
          isEmailVerified: { type: 'boolean', example: true },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      Template: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string', example: 'Birthday Frame' },
          category: { type: 'string', example: 'celebration' },
          svgData: { type: 'string', example: '<svg>...</svg>' },
          frameCount: { type: 'number', example: 4 },
          visibility: { type: 'string', enum: ['public', 'premium'], example: 'public' },
        },
      },
      Error: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string', example: 'Error message' },
        },
      },
      Success: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'Operation successful' },
          data: { type: 'object' },
        },
      },
    },
    responses: {
      UnauthorizedError: {
        description: 'Authentication required',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error',
            },
            example: {
              success: false,
              message: 'Authentication required',
            },
          },
        },
      },
      ForbiddenError: {
        description: 'Insufficient permissions',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error',
            },
            example: {
              success: false,
              message: 'Admin access required',
            },
          },
        },
      },
      NotFoundError: {
        description: 'Resource not found',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error',
            },
            example: {
              success: false,
              message: 'Resource not found',
            },
          },
        },
      },
      ValidationError: {
        description: 'Validation error',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error',
            },
            example: {
              success: false,
              message: 'Validation failed',
            },
          },
        },
      },
    },
  },
  tags: [
    { name: 'Authentication', description: 'User authentication endpoints' },
    { name: 'Users', description: 'User management' },
    { name: 'Templates', description: 'Photo frame templates' },
    { name: 'Photos', description: 'Photo management' },
    { name: 'AI', description: 'AI-powered frame generation' },
    { name: 'Payments', description: 'Payment processing' },
    { name: 'Analytics', description: 'Analytics and statistics' },
    { name: 'Admin', description: 'Admin-only endpoints' },
  ],
};

const options = {
  swaggerDefinition,
  apis: [
    './src/app/api/**/*.ts',
    './src/app/api/**/*.js',
    './src/models/*.ts',
    './src/models/*.js',
  ],
};

export const swaggerSpec = swaggerJsdoc(options);
export default swaggerSpec;
