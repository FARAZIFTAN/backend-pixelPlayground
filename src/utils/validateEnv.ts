/**
 * Environment Variables Validation Utility
 * 
 * Validates that all required environment variables are present
 * Run this at server startup to catch configuration errors early
 */

interface EnvConfig {
    [key: string]: string | undefined;
}

const requiredEnvVars = [
    'MONGODB_URI',
    'JWT_SECRET',
    'JWT_EXPIRE',
    'FRONTEND_URL',
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
    'GROQ_API_KEY',
] as const;

const optionalEnvVars = [
    'PORT',
    'NODE_ENV',
    'BACKEND_URL',
    'SMTP_HOST',
    'SMTP_PORT',
    'SMTP_USER',
    'SMTP_PASS',
    'CLOUDINARY_CLOUD_NAME',
    'CLOUDINARY_API_KEY',
    'CLOUDINARY_API_SECRET',
    'STRIPE_SECRET_KEY',
    'SENTRY_DSN',
] as const;

export function validateEnvironment(): void {
    console.log('\n🔍 Validating environment variables...\n');

    const missing: string[] = [];
    const found: string[] = [];

    // Check required variables
    requiredEnvVars.forEach((varName) => {
        if (!process.env[varName]) {
            missing.push(varName);
        } else {
            found.push(varName);
        }
    });

    // Display results
    if (found.length > 0) {
        console.log('✅ Found required variables:');
        found.forEach((varName) => {
            const value = process.env[varName] || '';
            const displayValue = varName.includes('SECRET') || varName.includes('KEY')
                ? `${value.substring(0, 10)}...`
                : value;
            console.log(`   • ${varName}: ${displayValue}`);
        });
    }

    // Check optional variables
    const foundOptional: string[] = [];
    optionalEnvVars.forEach((varName) => {
        if (process.env[varName]) {
            foundOptional.push(varName);
        }
    });

    if (foundOptional.length > 0) {
        console.log('\n📋 Found optional variables:');
        foundOptional.forEach((varName) => {
            const value = process.env[varName] || '';
            const displayValue = varName.includes('PASS') || varName.includes('SECRET')
                ? '***'
                : value;
            console.log(`   • ${varName}: ${displayValue}`);
        });
    }

    // Report missing required variables
    if (missing.length > 0) {
        console.error('\n❌ Missing required environment variables:');
        missing.forEach((varName) => {
            console.error(`   • ${varName}`);
        });
        console.error('\n💡 Please check your .env.local file\n');
        process.exit(1);
    }

    // Environment-specific validations
    const nodeEnv = process.env.NODE_ENV || 'development';
    const frontendUrl = process.env.FRONTEND_URL || '';

    if (nodeEnv === 'development') {
        if (!frontendUrl.includes('localhost')) {
            console.warn('\n⚠️  WARNING: Running in development mode but FRONTEND_URL is not localhost');
            console.warn(`   Current value: ${frontendUrl}`);
            console.warn('   Expected: http://localhost:8080\n');
        } else {
            console.log('\n✅ Development mode: CORS configured for localhost');
        }
    } else if (nodeEnv === 'production') {
        if (frontendUrl.includes('localhost')) {
            console.error('\n❌ ERROR: Production mode but FRONTEND_URL is localhost!');
            console.error(`   Current value: ${frontendUrl}`);
            console.error('   This will cause CORS errors in production\n');
            process.exit(1);
        }
    }

    console.log('\n✅ All environment variables validated successfully!\n');
}

// Auto-run validation when imported
if (require.main === module) {
    validateEnvironment();
}
