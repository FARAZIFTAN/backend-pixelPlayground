// Sentry Configuration for Next.js Backend
// This file configures error tracking and performance monitoring

import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;
const SENTRY_ENVIRONMENT = process.env.NODE_ENV || 'development';

Sentry.init({
  // Sentry DSN - get this from your Sentry project settings
  dsn: SENTRY_DSN,

  // Environment name
  environment: SENTRY_ENVIRONMENT,

  // Set tracesSampleRate to 1.0 to capture 100% of transactions for performance monitoring.
  // We recommend adjusting this value in production
  tracesSampleRate: SENTRY_ENVIRONMENT === 'production' ? 0.1 : 1.0,

  // Sample rate for capturing errors (1.0 = 100%)
  sampleRate: 1.0,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: SENTRY_ENVIRONMENT === 'development',

  // Disable Sentry in development if no DSN is provided
  enabled: SENTRY_ENVIRONMENT === 'production' || !!SENTRY_DSN,

  // Integrations
  integrations: [
    // HTTP integration for tracking fetch/axios requests
    Sentry.httpIntegration(),
    
    // MongoDB integration if available
    // Uncomment if you want to track MongoDB queries
    // Sentry.mongoIntegration({ useMongoose: true }),
  ],

  // BeforeSend hook - modify events before sending to Sentry
  beforeSend(event, hint) {
    // Filter out sensitive data
    if (event.request) {
      // Remove authorization headers
      if (event.request.headers) {
        delete event.request.headers['authorization'];
        delete event.request.headers['cookie'];
      }

      // Remove sensitive query parameters
      if (event.request.query_string) {
        if (typeof event.request.query_string === 'string') {
          event.request.query_string = event.request.query_string
            .replace(/password=[^&]*/gi, 'password=[FILTERED]')
            .replace(/token=[^&]*/gi, 'token=[FILTERED]');
        } else if (Array.isArray(event.request.query_string)) {
          event.request.query_string = event.request.query_string.map(([key, value]) => {
            if (key === 'password' || key === 'token') {
              return [key, '[FILTERED]'];
            }
            return [key, value];
          }) as [string, string][];
        } else {
          Object.keys(event.request.query_string).forEach(key => {
            if (key === 'password' || key === 'token') {
              event.request.query_string[key] = '[FILTERED]';
            }
          });
        }
      }
    }

    // Filter out password from request body
    if (event.extra && event.extra.body) {
      const body = event.extra.body as any;
      if (body.password) body.password = '[FILTERED]';
      if (body.newPassword) body.newPassword = '[FILTERED]';
      if (body.confirmPassword) body.confirmPassword = '[FILTERED]';
    }

    return event;
  },

  // Ignore certain errors
  ignoreErrors: [
    // Browser extensions
    'top.GLOBALS',
    // Random plugins/extensions
    'originalCreateNotification',
    'canvas.contentDocument',
    'MyApp_RemoveAllHighlights',
    // Facebook borked
    'fb_xd_fragment',
    // Network errors
    'NetworkError',
    'Network request failed',
    // Common user errors
    'ResizeObserver loop limit exceeded',
    'Non-Error promise rejection captured',
  ],
});

export default Sentry;
