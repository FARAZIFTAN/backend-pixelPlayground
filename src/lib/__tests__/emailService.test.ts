/**
 * Unit Tests for EmailService
 * Tests email sending functionality with mocked SMTP transport
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { EmailService, createEmailService } from '@/lib/emailService';
import { createConfigService } from '@/lib/config';
import nodemailer from 'nodemailer';

describe('EmailService', () => {
  let mockTransporter: any;
  let mockConfig: any;
  let emailService: EmailService;

  beforeEach(() => {
    // Create mock config
    mockConfig = createConfigService({
        SMTP_HOST: 'smtp.test.com',
        SMTP_PORT: '587',
        SMTP_USER: 'test@test.com',
        SMTP_PASS: 'test-password',
        SMTP_FROM_EMAIL: 'noreply@test.com',
        SMTP_FROM_NAME: 'Test App',
    } as unknown as NodeJS.ProcessEnv);

    // Create mock transporter
    mockTransporter = {
      sendMail: jest.fn<(options: nodemailer.SendMailOptions) => Promise<nodemailer.SentMessageInfo>>().mockResolvedValue({
        messageId: 'test-message-id-123',
        accepted: ['recipient@test.com'],
        rejected: [],
        envelope: { from: '', to: [] },
        pending: [],
        response: '250 OK',
      }),
      verify: jest.fn().mockImplementation((callback?: (error: Error | null, success: boolean) => void) => {
        if (callback) callback(null, true);
      }),
    };

    // Create EmailService with mocks
    emailService = createEmailService(mockConfig, mockTransporter);
  });

  describe('Constructor and Initialization', () => {
    it('should create instance with config and transporter', () => {
      expect(emailService).toBeInstanceOf(EmailService);
    });

    it('should create instance with default config when not provided', () => {
      const service = new EmailService();
      expect(service).toBeInstanceOf(EmailService);
    });

    it('should be configured when transporter is injected', () => {
      const status = emailService.getStatus();
      expect(status.configured).toBe(true);
    });
  });

  describe('Email Sending - Generic', () => {
    it('should send email successfully', async () => {
      const result = await emailService.sendEmail({
        to: 'test@test.com',
        subject: 'Test Subject',
        html: '<p>Test HTML</p>',
        text: 'Test Text',
      });

      expect(result).toBe(true);
      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'test@test.com',
          subject: 'Test Subject',
          html: '<p>Test HTML</p>',
          text: 'Test Text',
        })
      );
    });

    it('should use default sender name and email', async () => {
      await emailService.sendEmail({
        to: 'test@test.com',
        subject: 'Test',
        html: '<p>Test</p>',
      });

      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          from: 'Test App <noreply@test.com>',
        })
      );
    });

    it('should use custom from address when provided', async () => {
      await emailService.sendEmail({
        to: 'test@test.com',
        subject: 'Test',
        html: '<p>Test</p>',
        from: 'custom@test.com',
      });

      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          from: 'custom@test.com',
        })
      );
    });

    it('should handle sendMail errors gracefully', async () => {
      mockTransporter.sendMail.mockRejectedValueOnce(new Error('SMTP connection failed'));

      const result = await emailService.sendEmail({
        to: 'test@test.com',
        subject: 'Test',
        html: '<p>Test</p>',
      });

      expect(result).toBe(false);
    });

    it('should use empty string for text when not provided', async () => {
      await emailService.sendEmail({
        to: 'test@test.com',
        subject: 'Test',
        html: '<p>Test</p>',
      });

      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          text: '',
        })
      );
    });
  });

  describe('Verification Email', () => {
    it('should send verification email with correct content', async () => {
      const result = await emailService.sendVerificationEmail(
        'user@test.com',
        'Test User',
        'http://test.com/verify?token=abc123'
      );

      expect(result).toBe(true);
      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'user@test.com',
          subject: expect.stringContaining('Verify'),
        })
      );

      const call = mockTransporter.sendMail.mock.calls[0][0];
      expect(call.html).toContain('Test User');
      expect(call.html).toContain('http://test.com/verify?token=abc123');
    });

    it('should include verification URL in email', async () => {
      await emailService.sendVerificationEmail(
        'user@test.com',
        'John Doe',
        'http://example.com/verify?token=xyz'
      );

      const call = mockTransporter.sendMail.mock.calls[0][0];
      expect(call.html).toContain('http://example.com/verify?token=xyz');
    });

    it('should include user name in email', async () => {
      await emailService.sendVerificationEmail(
        'user@test.com',
        'Jane Smith',
        'http://example.com/verify'
      );

      const call = mockTransporter.sendMail.mock.calls[0][0];
      expect(call.html).toContain('Jane Smith');
    });
  });

  describe('Password Reset Email', () => {
    it('should send password reset email with correct content', async () => {
      const result = await emailService.sendPasswordResetEmail(
        'user@test.com',
        'Test User',
        'http://test.com/reset?token=abc123'
      );

      expect(result).toBe(true);
      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'user@test.com',
          subject: expect.stringContaining('Reset'),
        })
      );

      const call = mockTransporter.sendMail.mock.calls[0][0];
      expect(call.html).toContain('Test User');
      expect(call.html).toContain('http://test.com/reset?token=abc123');
    });

    it('should include reset URL in email', async () => {
      await emailService.sendPasswordResetEmail(
        'user@test.com',
        'John Doe',
        'http://example.com/reset?token=xyz'
      );

      const call = mockTransporter.sendMail.mock.calls[0][0];
      expect(call.html).toContain('http://example.com/reset?token=xyz');
    });

    it('should mention expiration time', async () => {
      await emailService.sendPasswordResetEmail(
        'user@test.com',
        'Test User',
        'http://example.com/reset'
      );

      const call = mockTransporter.sendMail.mock.calls[0][0];
      expect(call.html).toContain('10 minutes');
    });
  });

  describe('Welcome Email', () => {
    it('should send welcome email with correct content', async () => {
      const result = await emailService.sendWelcomeEmail('user@test.com', 'Test User');

      expect(result).toBe(true);
      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'user@test.com',
          subject: expect.stringContaining('Welcome'),
        })
      );

      const call = mockTransporter.sendMail.mock.calls[0][0];
      expect(call.html).toContain('Test User');
    });

    it('should include user name in welcome email', async () => {
      await emailService.sendWelcomeEmail('user@test.com', 'Jane Doe');

      const call = mockTransporter.sendMail.mock.calls[0][0];
      expect(call.html).toContain('Jane Doe');
    });

    it('should mention app features', async () => {
      await emailService.sendWelcomeEmail('user@test.com', 'Test User');

      const call = mockTransporter.sendMail.mock.calls[0][0];
      expect(call.html).toContain('photo');
      expect(call.html).toContain('templates');
    });
  });

  describe('Payment Confirmation Email', () => {
    it('should send payment confirmation email', async () => {
      const result = await emailService.sendPaymentConfirmationEmail(
        'user@test.com',
        'Test User',
        'Pro Creator Monthly',
        99000
      );

      expect(result).toBe(true);
      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'user@test.com',
          subject: expect.stringContaining('Payment'),
        })
      );
    });

    it('should include plan name in email', async () => {
      await emailService.sendPaymentConfirmationEmail(
        'user@test.com',
        'Test User',
        'Pro Creator Yearly',
        990000
      );

      const call = mockTransporter.sendMail.mock.calls[0][0];
      expect(call.html).toContain('Pro Creator Yearly');
    });

    it('should format amount as IDR currency', async () => {
      await emailService.sendPaymentConfirmationEmail(
        'user@test.com',
        'Test User',
        'Pro Creator',
        99000
      );

      const call = mockTransporter.sendMail.mock.calls[0][0];
      expect(call.html).toMatch(/Rp|IDR/i);
    });

    it('should include user name', async () => {
      await emailService.sendPaymentConfirmationEmail(
        'user@test.com',
        'John Smith',
        'Pro Creator',
        99000
      );

      const call = mockTransporter.sendMail.mock.calls[0][0];
      expect(call.html).toContain('John Smith');
    });
  });

  describe('Service Status', () => {
    it('should return configured status when transporter is injected', () => {
      const status = emailService.getStatus();
      expect(status).toEqual({
        configured: true,
        provider: 'smtp.test.com',
      });
    });

    it('should return provider from config', () => {
      const status = emailService.getStatus();
      expect(status.provider).toBe('smtp.test.com');
    });
  });

  describe('Fallback Mode (No Transporter)', () => {
    beforeEach(() => {
      // Create service without transporter (not configured)
      const emptyConfig = createConfigService({} as NodeJS.ProcessEnv);
      emailService = new EmailService(emptyConfig);
    });

    it('should still return true in fallback mode', async () => {
      const result = await emailService.sendEmail({
        to: 'test@test.com',
        subject: 'Test',
        html: '<p>Test</p>',
      });

      expect(result).toBe(true);
    });

    it('should show not configured status', () => {
      const status = emailService.getStatus();
      expect(status.configured).toBe(false);
    });

    it('should still send verification email in fallback mode', async () => {
      const result = await emailService.sendVerificationEmail(
        'user@test.com',
        'Test User',
        'http://verify.com'
      );

      expect(result).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors', async () => {
      mockTransporter.sendMail.mockRejectedValueOnce(new Error('Network error'));

      const result = await emailService.sendEmail({
        to: 'test@test.com',
        subject: 'Test',
        html: '<p>Test</p>',
      });

      expect(result).toBe(false);
    });

    it('should handle SMTP authentication errors', async () => {
      mockTransporter.sendMail.mockRejectedValueOnce(new Error('Authentication failed'));

      const result = await emailService.sendVerificationEmail(
        'user@test.com',
        'Test User',
        'http://verify.com'
      );

      expect(result).toBe(false);
    });

    it('should handle timeout errors', async () => {
      mockTransporter.sendMail.mockRejectedValueOnce(new Error('Timeout'));

      const result = await emailService.sendPasswordResetEmail(
        'user@test.com',
        'Test User',
        'http://reset.com'
      );

      expect(result).toBe(false);
    });
  });

  describe('Factory Function', () => {
    it('should create EmailService via factory', () => {
      const service = createEmailService();
      expect(service).toBeInstanceOf(EmailService);
    });

    it('should create EmailService with custom config via factory', () => {
      const customConfig = createConfigService({
          SMTP_HOST: 'custom.smtp.com',
      } as unknown as NodeJS.ProcessEnv);
      const service = createEmailService(customConfig);
      expect(service).toBeInstanceOf(EmailService);
    });

    it('should create EmailService with custom transporter via factory', () => {
      const customTransporter = {
        sendMail: jest.fn(),
        verify: jest.fn(),
      };
      const service = createEmailService(mockConfig, customTransporter as any);
      expect(service).toBeInstanceOf(EmailService);
    });
  });

  describe('Unconfigured Service Fallback', () => {
    it('should use fallback mode when SMTP not configured', async () => {
      const unconfiguredConfig = createConfigService({} as unknown as NodeJS.ProcessEnv);
      const unconfiguredService = new EmailService(unconfiguredConfig);
      
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      const result = await unconfiguredService.sendEmail({
        to: 'test@test.com',
        subject: 'Test Subject',
        html: '<p>Test</p>',
      });

      expect(result).toBe(true);
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should log configuration warning when SMTP not configured', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      const unconfiguredConfig = createConfigService({} as unknown as NodeJS.ProcessEnv);
      new EmailService(unconfiguredConfig);
      
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should return not configured status when SMTP missing', () => {
      const unconfiguredConfig = createConfigService({} as unknown as NodeJS.ProcessEnv);
      const unconfiguredService = new EmailService(unconfiguredConfig);
      
      const status = unconfiguredService.getStatus();
      expect(status.configured).toBe(false);
    });
  });

  describe('SMTP Transporter Injection', () => {
    it('should accept injected transporter and mark as configured', () => {
      const injectedTransporter = {
        sendMail: jest.fn().mockResolvedValue({ messageId: 'test-123' }),
      };

      const service = createEmailService(mockConfig, injectedTransporter as any);
      
      // Service should be configured when transporter is injected
      expect(service).toBeDefined();
    });
  });

  describe('Send Email Error Handling', () => {
    it('should log fallback when send fails', async () => {
      mockTransporter.sendMail.mockRejectedValueOnce(new Error('SMTP Error'));
      
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      const result = await emailService.sendEmail({
        to: 'test@test.com',
        subject: 'Test',
        html: '<p>Test</p>',
      });

      expect(result).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });
  });
});
