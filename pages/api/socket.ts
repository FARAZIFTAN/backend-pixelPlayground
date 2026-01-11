import { Server as SocketIOServer, Socket } from 'socket.io';
import { verifyToken } from '@/lib/jwt';
import { logInfo, logError } from '@/lib/errorHandler';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userEmail?: string;
  userName?: string;
  userRole?: string;
}

interface NotificationData {
  notificationId: string;
}

// Event constants
const SOCKET_EVENTS = {
  PING: 'ping',
  PONG: 'pong',
  NOTIFICATION_READ: 'notification:read',
  NOTIFICATION_NEW: 'notification:new',
  NOTIFICATION_STATUS: 'notification:status',
  TYPING_START: 'typing:start',
  TYPING_STOP: 'typing:stop',
  USER_TYPING: 'user:typing',
  USER_STOPPED_TYPING: 'user:stopped-typing',
  DISCONNECT: 'disconnect',
  ERROR: 'error',
} as const;

// Room constants
const ROOMS = {
  ADMINS: 'admins',
  USERS: 'users',
  getUserRoom: (userId: string) => `user:${userId}`,
} as const;

export default function handler(req, res) {
  if (!res.socket.server.io) {
    const io = new SocketIOServer(res.socket.server, {
      path: '/api/socket',
      addTrailingSlash: false,
      cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:5173',
        credentials: true,
        methods: ['GET', 'POST'],
      },
      transports: ['websocket', 'polling'],
    });

    res.socket.server.io = io;

    // Setup authentication middleware
    io.use(async (socket: AuthenticatedSocket, next) => {
      try {
        const token = socket.handshake.auth.token ||
                     socket.handshake.headers.authorization?.replace('Bearer ', '');

        if (!token) {
          return next(new Error('Authentication required'));
        }

        // Verify JWT token
        const decoded = verifyToken(token);
        if (!decoded) {
          return next(new Error('Invalid token'));
        }

        // Type-safe property access
        const decodedData = decoded as Record<string, any>;
        socket.userId = decodedData.id || decodedData.userId;
        socket.userEmail = decodedData.email;
        socket.userName = decodedData.name;
        socket.userRole = decodedData.role;

        next();
      } catch (error) {
        console.error('Socket authentication error:', (error as Error).message);
        next(new Error('Authentication failed'));
      }
    });

    // Setup event handlers
    io.on('connection', (socket: AuthenticatedSocket) => {
      console.log(`✅ Client connected: ${socket.id} (User: ${socket.userId})`);
      logInfo('Client connected', { socketId: socket.id, userId: socket.userId });

      // Join user to appropriate rooms
      if (socket.userId) {
        socket.join(ROOMS.getUserRoom(socket.userId));
      }

      if (socket.userRole === 'admin') {
        socket.join(ROOMS.ADMINS);
      } else {
        socket.join(ROOMS.USERS);
      }

      // Register all socket event listeners
      socket.on(SOCKET_EVENTS.PING, () => {
        socket.emit(SOCKET_EVENTS.PONG, { timestamp: Date.now() });
      });

      socket.on(SOCKET_EVENTS.NOTIFICATION_READ, (data: NotificationData) => {
        console.log(`Notification read by ${socket.userId}:`, data.notificationId);
        io.to(ROOMS.ADMINS).emit(SOCKET_EVENTS.NOTIFICATION_STATUS, {
          userId: socket.userId,
          notificationId: data.notificationId,
          status: 'read',
        });
      });

      socket.on(SOCKET_EVENTS.TYPING_START, () => {
        socket.broadcast.emit(SOCKET_EVENTS.USER_TYPING, {
          userId: socket.userId,
          userName: socket.userName,
        });
      });

      socket.on(SOCKET_EVENTS.TYPING_STOP, () => {
        socket.broadcast.emit(SOCKET_EVENTS.USER_STOPPED_TYPING, {
          userId: socket.userId,
        });
      });

      socket.on(SOCKET_EVENTS.DISCONNECT, () => {
        console.log(`❌ Client disconnected: ${socket.id} (User: ${socket.userId})`);
        logInfo('Client disconnected', { socketId: socket.id, userId: socket.userId });
      });

      socket.on(SOCKET_EVENTS.ERROR, (error: Error) => {
        console.error('Socket error:', error);
        logError(error, { socketId: socket.id, userId: socket.userId });
      });
    });

    console.log('✅ WebSocket service initialized successfully');
    logInfo('WebSocket service started');
  }

  res.end();
}