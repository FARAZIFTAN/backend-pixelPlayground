/** @type {import('next').NextConfig} */

// Support untuk local dan production environment
// Local: akan baca dari .env.local (http://localhost:8080)
// Production: fallback ke production URL
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://karyaklik.netlify.app';

const nextConfig = {
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: FRONTEND_URL }, // Sekarang ini pasti nilainya Netlify
          { key: 'Access-Control-Allow-Methods', value: 'GET,DELETE,PATCH,POST,PUT,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;