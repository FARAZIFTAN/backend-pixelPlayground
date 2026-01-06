/**
 * Custom Next.js Server with Socket.IO Support
 * Run this server instead of `next dev` to enable WebSocket features
 */

import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { webSocketService } from './src/lib/webSocketService';

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = parseInt(process.env.PORT || '3001', 10);

const createServerBanner = (host: string, portNum: number, isDev: boolean): string => `
╔═══════════════════════════════════════════════════════╗
║                                                       ║
║   🚀 PixelPlayground Backend Server                  ║
║                                                       ║
║   📡 HTTP Server: http://${host}:${portNum.toString().padEnd(4)}          ║
║   🔌 WebSocket: ws://${host}:${portNum}/socket.io   ║
║   🌍 Environment: ${(isDev ? 'Development' : 'Production').padEnd(11)}                         ║
║                                                       ║
║   ✅ Ready to accept connections!                    ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
`;

const gracefulShutdown = (httpServer: ReturnType<typeof createServer>, signal: string): void => {
  console.log(`${signal} signal received: closing HTTP server`);
  httpServer.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
};

// Initialize Next.js app
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  // Create HTTP server
  const httpServer = createServer((req, res) => {
    try {
      const parsedUrl = parse(req.url!, true);
      handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error handling request:', err);
      res.statusCode = 500;
      res.end('Internal server error');
    }
  });

  // Initialize WebSocket service
  webSocketService.initialize(httpServer);

  // Start listening
  httpServer.listen(port, () => {
    console.log(createServerBanner(hostname, port, dev));
  });

  // Graceful shutdown handlers
  process.on('SIGTERM', () => gracefulShutdown(httpServer, 'SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown(httpServer, 'SIGINT'));
});
