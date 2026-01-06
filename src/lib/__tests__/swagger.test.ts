import { describe, it, expect } from '@jest/globals';
import { swaggerSpec } from '../swagger';

describe('Swagger Configuration', () => {
  describe('Swagger Spec', () => {
    it('should have valid swagger spec object', () => {
      expect(swaggerSpec).toBeDefined();
      expect(typeof swaggerSpec).toBe('object');
    });

    it('should have openapi 3.0.0 version', () => {
      expect(swaggerSpec.openapi).toBe('3.0.0');
    });

    it('should have API info section', () => {
      expect(swaggerSpec.info).toBeDefined();
      expect(swaggerSpec.info.title).toBe('PixelPlayground API Documentation');
      expect(swaggerSpec.info.version).toBe('1.0.0');
      expect(swaggerSpec.info.description).toContain('PixelPlayground');
    });

    it('should have contact information', () => {
      expect(swaggerSpec.info.contact).toBeDefined();
      expect(swaggerSpec.info.contact.name).toBe('PixelPlayground Team');
      expect(swaggerSpec.info.contact.email).toContain('@');
    });

    it('should have license information', () => {
      expect(swaggerSpec.info.license).toBeDefined();
      expect(swaggerSpec.info.license.name).toBe('MIT');
      expect(swaggerSpec.info.license.url).toBeTruthy();
    });

    it('should have servers configuration', () => {
      expect(swaggerSpec.servers).toBeDefined();
      expect(Array.isArray(swaggerSpec.servers)).toBe(true);
      expect(swaggerSpec.servers.length).toBeGreaterThan(0);
    });

    it('should have development server', () => {
      const devServer = swaggerSpec.servers.find((s: any) => 
        s.description?.includes('Development')
      );
      expect(devServer).toBeDefined();
      expect(devServer?.url).toContain('localhost');
    });

    it('should have production server', () => {
      const prodServer = swaggerSpec.servers.find((s: any) => 
        s.description?.includes('Production')
      );
      expect(prodServer).toBeDefined();
    });

    it('should have components section', () => {
      expect(swaggerSpec.components).toBeDefined();
      expect(typeof swaggerSpec.components).toBe('object');
    });

    it('should have security schemes', () => {
      expect(swaggerSpec.components.securitySchemes).toBeDefined();
      expect(swaggerSpec.components.securitySchemes.bearerAuth).toBeDefined();
    });

    it('should have bearerAuth configured as JWT', () => {
      const bearerAuth = swaggerSpec.components.securitySchemes.bearerAuth;
      expect(bearerAuth.type).toBe('http');
      expect(bearerAuth.scheme).toBe('bearer');
      expect(bearerAuth.bearerFormat).toBe('JWT');
    });

    it('should have schemas defined', () => {
      expect(swaggerSpec.components.schemas).toBeDefined();
      expect(typeof swaggerSpec.components.schemas).toBe('object');
    });

    it('should have User schema', () => {
      expect(swaggerSpec.components.schemas.User).toBeDefined();
      expect(swaggerSpec.components.schemas.User.type).toBe('object');
      expect(swaggerSpec.components.schemas.User.properties).toBeDefined();
    });

    it('should have Template schema', () => {
      expect(swaggerSpec.components.schemas.Template).toBeDefined();
      expect(swaggerSpec.components.schemas.Template.type).toBe('object');
    });

    it('should have Error schema', () => {
      expect(swaggerSpec.components.schemas.Error).toBeDefined();
      expect(swaggerSpec.components.schemas.Error.properties).toBeDefined();
      expect(swaggerSpec.components.schemas.Error.properties.success).toBeDefined();
      expect(swaggerSpec.components.schemas.Error.properties.message).toBeDefined();
    });

    it('should have Success schema', () => {
      expect(swaggerSpec.components.schemas.Success).toBeDefined();
      expect(swaggerSpec.components.schemas.Success.properties.success).toBeDefined();
    });

    it('should have responses section', () => {
      expect(swaggerSpec.components.responses).toBeDefined();
    });

    it('should have UnauthorizedError response', () => {
      expect(swaggerSpec.components.responses.UnauthorizedError).toBeDefined();
      expect(swaggerSpec.components.responses.UnauthorizedError.description).toContain('Authentication');
    });

    it('should have ForbiddenError response', () => {
      expect(swaggerSpec.components.responses.ForbiddenError).toBeDefined();
      expect(swaggerSpec.components.responses.ForbiddenError.description).toContain('permissions');
    });

    it('should have NotFoundError response', () => {
      expect(swaggerSpec.components.responses.NotFoundError).toBeDefined();
      expect(swaggerSpec.components.responses.NotFoundError.description).toContain('not found');
    });

    it('should have ValidationError response', () => {
      expect(swaggerSpec.components.responses.ValidationError).toBeDefined();
      expect(swaggerSpec.components.responses.ValidationError.description).toContain('Validation');
    });

    it('should have tags section', () => {
      expect(swaggerSpec.tags).toBeDefined();
      expect(Array.isArray(swaggerSpec.tags)).toBe(true);
      expect(swaggerSpec.tags.length).toBeGreaterThan(0);
    });

    it('should have Authentication tag', () => {
      const authTag = swaggerSpec.tags.find((t: any) => t.name === 'Authentication');
      expect(authTag).toBeDefined();
      expect(authTag?.description).toContain('authentication');
    });

    it('should have Users tag', () => {
      const usersTag = swaggerSpec.tags.find((t: any) => t.name === 'Users');
      expect(usersTag).toBeDefined();
    });

    it('should have Templates tag', () => {
      const templatesTag = swaggerSpec.tags.find((t: any) => t.name === 'Templates');
      expect(templatesTag).toBeDefined();
    });

    it('should have Photos tag', () => {
      const photosTag = swaggerSpec.tags.find((t: any) => t.name === 'Photos');
      expect(photosTag).toBeDefined();
    });

    it('should have AI tag', () => {
      const aiTag = swaggerSpec.tags.find((t: any) => t.name === 'AI');
      expect(aiTag).toBeDefined();
      expect(aiTag?.description).toContain('AI');
    });

    it('should have Payments tag', () => {
      const paymentsTag = swaggerSpec.tags.find((t: any) => t.name === 'Payments');
      expect(paymentsTag).toBeDefined();
    });

    it('should have Analytics tag', () => {
      const analyticsTag = swaggerSpec.tags.find((t: any) => t.name === 'Analytics');
      expect(analyticsTag).toBeDefined();
    });

    it('should have Admin tag', () => {
      const adminTag = swaggerSpec.tags.find((t: any) => t.name === 'Admin');
      expect(adminTag).toBeDefined();
      expect(adminTag?.description).toContain('Admin');
    });

    it('should have paths section', () => {
      // Swagger-jsdoc generates paths from API annotations
      expect(swaggerSpec.paths).toBeDefined();
    });
  });
});
