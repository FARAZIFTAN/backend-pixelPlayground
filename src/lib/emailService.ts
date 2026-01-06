import nodemailer from 'nodemailer';
import { logError, logInfo } from './errorHandler';
import { ConfigService, configService } from './config';

/**
 * Real Email Service using Nodemailer with SMTP
 * Supports Gmail, SendGrid, AWS SES, and other SMTP providers
 * Now supports Dependency Injection for better testability
 */

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
}

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

interface SMTPCredentials {
  host: string;
  port: number;
  user: string;
  pass: string;
}

// Email template styling constants
const EMAIL_STYLES = {
  BASE: `
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    line-height: 1.6;
    color: #333;
    max-width: 600px;
    margin: 0 auto;
    padding: 20px;
  `,
  GRADIENT_PURPLE: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  GRADIENT_PINK: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  GRADIENT_GOLD: 'linear-gradient(135deg, #f6d365 0%, #fda085 100%)',
} as const;

class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private isConfigured: boolean = false;
  private readonly fromEmail: string;
  private readonly fromName: string;
  private readonly config: ConfigService;

  constructor(
    config: ConfigService = configService,
    transporter?: nodemailer.Transporter
  ) {
    this.config = config;
    this.fromEmail = config.get('smtp').fromEmail;
    this.fromName = config.get('smtp').fromName;
    
    if (transporter) {
      // Injected transporter (for testing)
      this.transporter = transporter;
      this.isConfigured = true;
    } else {
      // Initialize from config
      this.initialize();
    }
  }

  /**
   * Get SMTP credentials from config service
   */
  private getSMTPCredentials(): SMTPCredentials | null {
    const smtp = this.config.get('smtp');

    if (!smtp.host || !smtp.user || !smtp.pass) {
      return null;
    }

    return {
      host: smtp.host,
      port: smtp.port,
      user: smtp.user,
      pass: smtp.pass,
    };
  }

  /**
   * Log SMTP configuration warning
   */
  private logConfigurationWarning(): void {
    console.warn('⚠️  SMTP not configured. Email service will use fallback mode.');
    console.warn('📧 Add SMTP credentials to .env file:');
    console.warn('   SMTP_HOST=smtp.gmail.com');
    console.warn('   SMTP_PORT=587');
    console.warn('   SMTP_USER=your-email@gmail.com');
    console.warn('   SMTP_PASS=your-app-password');
    console.warn('   SMTP_FROM_EMAIL=noreply@pixelplayground.com');
    console.warn('   SMTP_FROM_NAME=PixelPlayground');
  }

  /**
   * Initialize SMTP transporter
   */
  private initialize(): void {
    const credentials = this.getSMTPCredentials();

    if (!credentials) {
      this.logConfigurationWarning();
      this.isConfigured = false;
      return;
    }

    try {
      const config: EmailConfig = {
        host: credentials.host,
        port: credentials.port,
        secure: credentials.port === 465,
        auth: {
          user: credentials.user,
          pass: credentials.pass,
        },
      };

      this.transporter = nodemailer.createTransport(config);
      this.isConfigured = true;

      // Verify connection configuration
      this.transporter.verify((error) => {
        if (error) {
          console.error('❌ SMTP connection failed:', error.message);
          logError(new Error('SMTP connection failed'), { error: error.message });
          this.isConfigured = false;
        } else {
          console.log('✅ SMTP server ready to send emails');
          logInfo('SMTP server connected successfully');
        }
      });
    } catch (error) {
      console.error('❌ Error initializing SMTP:', (error as Error).message);
      logError(error as Error, { context: 'Email service initialization' });
      this.isConfigured = false;
    }
  }

  /**
   * Send email using SMTP
   */
  async sendEmail(options: EmailOptions): Promise<boolean> {
    const { to, subject, html, text, from } = options;

    // Fallback to console logging if SMTP not configured
    if (!this.isConfigured || !this.transporter) {
      console.log('\n========================================');
      console.log('📧 EMAIL (Fallback Mode - SMTP Not Configured)');
      console.log('========================================');
      console.log('From:', from || `${this.fromName} <${this.fromEmail}>`);
      console.log('To:', to);
      console.log('Subject:', subject);
      console.log('----------------------------------------');
      console.log('HTML Content:');
      console.log(html);
      console.log('========================================\n');
      return true;
    }

    try {
      const info = await this.transporter.sendMail({
        from: from || `${this.fromName} <${this.fromEmail}>`,
        to,
        subject,
        text: text || '',
        html,
      });

      console.log('✅ Email sent successfully:', info.messageId);
      logInfo('Email sent', { to, subject, messageId: info.messageId });
      return true;
    } catch (error: any) {
      console.error('❌ Error sending email:', error.message);
      logError(error, { to, subject, context: 'Send email failed' });
      
      // Fallback to console log on error
      console.log('\n========================================');
      console.log('📧 EMAIL (Fallback - Send Failed)');
      console.log('========================================');
      console.log('To:', to);
      console.log('Subject:', subject);
      console.log('Error:', error.message);
      console.log('========================================\n');
      
      return false;
    }
  }

  /**
   * Generate email container HTML
   */
  private createEmailContainer(gradient: string, content: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { ${EMAIL_STYLES.BASE} }
          .container {
            background: ${gradient};
            padding: 40px;
            border-radius: 10px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          .content {
            background: white;
            padding: 30px;
            border-radius: 8px;
          }
          h1 { margin-bottom: 20px; }
          .button {
            display: inline-block;
            padding: 12px 30px;
            background: ${gradient};
            color: white;
            text-decoration: none;
            border-radius: 5px;
            margin: 20px 0;
            font-weight: bold;
          }
          .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            font-size: 12px;
            color: #666;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="content">
            ${content}
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Send verification email
   */
  async sendVerificationEmail(email: string, name: string, verificationUrl: string): Promise<boolean> {
    const subject = 'Verify Your Email - PixelPlayground';
    
    const content = `
      <h1 style="color: #667eea;">\ud83c\udf89 Welcome to PixelPlayground!</h1>
      <p>Hi ${name},</p>
      <p>Thank you for registering! We're excited to have you on board.</p>
      <p>Please verify your email address by clicking the button below:</p>
      <a href="${verificationUrl}" class="button">Verify Email Address</a>
      <p>Or copy and paste this link into your browser:</p>
      <p style="word-break: break-all; color: #667eea;">${verificationUrl}</p>
      <p><strong>This link will expire in 24 hours.</strong></p>
      <div class="footer">
        <p>If you didn't create an account, please ignore this email.</p>
        <p>\u00a9 2026 PixelPlayground - KaryaKlik. All rights reserved.</p>
      </div>
    `;

    const html = this.createEmailContainer(EMAIL_STYLES.GRADIENT_PURPLE, content);
    return this.sendEmail({ to: email, subject, html });
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(email: string, name: string, resetUrl: string): Promise<boolean> {
    const subject = 'Reset Your Password - PixelPlayground';
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .container {
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
            padding: 40px;
            border-radius: 10px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          .content {
            background: white;
            padding: 30px;
            border-radius: 8px;
          }
          h1 {
            color: #f5576c;
            margin-bottom: 20px;
          }
          .button {
            display: inline-block;
            padding: 12px 30px;
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
            color: white;
            text-decoration: none;
            border-radius: 5px;
            margin: 20px 0;
            font-weight: bold;
          }
          .warning {
            background: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 10px;
            margin: 20px 0;
          }
          .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            font-size: 12px;
            color: #666;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="content">
            <h1>🔐 Password Reset Request</h1>
            <p>Hi ${name},</p>
            <p>We received a request to reset your password for your PixelPlayground account.</p>
            <p>Click the button below to reset your password:</p>
            <a href="${resetUrl}" class="button">Reset Password</a>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #f5576c;">${resetUrl}</p>
            <div class="warning">
              <strong>⏰ This link will expire in 10 minutes.</strong>
            </div>
            <p><strong>Didn't request this?</strong> You can safely ignore this email. Your password will not be changed.</p>
            <div class="footer">
              <p>For security reasons, this link can only be used once.</p>
              <p>© 2026 PixelPlayground - KaryaKlik. All rights reserved.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({ to: email, subject, html });
  }

  /**
   * Send welcome email after verification
   */
  async sendWelcomeEmail(email: string, name: string): Promise<boolean> {
    const subject = 'Welcome to PixelPlayground! 🎉';
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .container {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 40px;
            border-radius: 10px;
          }
          .content {
            background: white;
            padding: 30px;
            border-radius: 8px;
          }
          h1 { color: #667eea; }
          .feature {
            padding: 15px;
            margin: 10px 0;
            background: #f8f9fa;
            border-radius: 5px;
          }
          .button {
            display: inline-block;
            padding: 12px 30px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            text-decoration: none;
            border-radius: 5px;
            margin: 20px 0;
            font-weight: bold;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="content">
            <h1>🎉 Welcome to PixelPlayground!</h1>
            <p>Hi ${name},</p>
            <p>Your email has been verified! You're all set to start creating amazing photo frames.</p>
            <h3>✨ What you can do:</h3>
            <div class="feature">📸 Create stunning photo booth frames</div>
            <div class="feature">🎨 Use 70+ professional templates</div>
            <div class="feature">🤖 Generate AI-powered frames</div>
            <div class="feature">🖼️ Save and share your creations</div>
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}" class="button">Start Creating Now</a>
            <p>Happy creating! 🚀</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({ to: email, subject, html });
  }

  /**
   * Send payment confirmation email
   */
  async sendPaymentConfirmationEmail(email: string, name: string, plan: string, amount: number): Promise<boolean> {
    const subject = 'Payment Confirmed - Welcome to Pro! 👑';
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .container {
            background: linear-gradient(135deg, #f6d365 0%, #fda085 100%);
            padding: 40px;
            border-radius: 10px;
          }
          .content {
            background: white;
            padding: 30px;
            border-radius: 8px;
          }
          .badge {
            background: linear-gradient(135deg, #f6d365 0%, #fda085 100%);
            color: white;
            padding: 10px 20px;
            border-radius: 20px;
            display: inline-block;
            font-weight: bold;
            margin: 20px 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="content">
            <h1>🎉 Payment Successful!</h1>
            <p>Hi ${name},</p>
            <p>Thank you for upgrading to <strong>${plan}</strong>!</p>
            <div class="badge">👑 PRO CREATOR</div>
            <p><strong>Amount Paid:</strong> ${amount.toLocaleString('id-ID', { style: 'currency', currency: 'IDR' })}</p>
            <p>You now have access to:</p>
            <ul>
              <li>✅ Unlimited AI frame generation</li>
              <li>✅ Priority support</li>
              <li>✅ Premium templates</li>
              <li>✅ No watermarks</li>
            </ul>
            <p>Start creating unlimited frames now!</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({ to: email, subject, html });
  }

  /**
   * Get email service status
   */
  getStatus(): { configured: boolean; provider: string } {
    return {
      configured: this.isConfigured,
      provider: this.config.get('smtp').host || 'Not configured',
    };
  }
}

// Export class for dependency injection
export { EmailService };

// Export singleton instance for backward compatibility
export const emailService = new EmailService();

// Factory function for testing and dependency injection
export const createEmailService = (
  config?: ConfigService,
  transporter?: nodemailer.Transporter
): EmailService => {
  return new EmailService(config, transporter);
};

export default emailService;
