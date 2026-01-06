import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { verifyToken } from '@/lib/jwt';
import { logInfo, logError } from '@/lib/errorHandler';

/**
 * WebSocket Service using Socket.io
 * Provides real-time updates for notifications, analytics, etc.
 */

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

class WebSocketService {
  private io: SocketIOServer | null = null;
  private isInitialized: boolean = false;

  /**
   * Initialize Socket.IO server
   */
  initialize(httpServer: HTTPServer) {
    if (this.isInitialized) {
      console.warn('WebSocket service already initialized');
      return this.io;
    }

    try {
      this.io = new SocketIOServer(httpServer, {
        cors: {
          origin: process.env.FRONTEND_URL || 'http://localhost:5173',
          credentials: true,
          methods: ['GET', 'POST'],
        },
        path: '/socket.io',
        transports: ['websocket', 'polling'],
      });

      this.setupMiddleware();
      this.setupEventHandlers();

      this.isInitialized = true;
      console.log('✅ WebSocket service initialized successfully');
      logInfo('WebSocket service started');

      return this.io;
    } catch (error: any) {
      console.error('❌ Error initializing WebSocket service:', error.message);
      logError(error, { context: 'WebSocket initialization' });
      return null;
    }
  }

  /**
   * Setup authentication middleware
   */
  private setupMiddleware(): void {
    if (!this.io) return;

    this.io.use(async (socket: AuthenticatedSocket, next) => {
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
  }

  /**
   * Setup event handlers
   */
  private setupEventHandlers(): void {
    if (!this.io) return;

    this.io.on('connection', (socket: AuthenticatedSocket) => {
      console.log(`✅ Client connected: ${socket.id} (User: ${socket.userId})`);
      logInfo('Client connected', { socketId: socket.id, userId: socket.userId });

      this.joinUserRooms(socket);
      this.registerSocketEvents(socket);
    });
  }

  /**
   * Join user to appropriate rooms
   */
  private joinUserRooms(socket: AuthenticatedSocket): void {
    // Join user-specific room
    if (socket.userId) {
      socket.join(ROOMS.getUserRoom(socket.userId));
    }

    // Join role-specific room
    if (socket.userRole === 'admin') {
      socket.join(ROOMS.ADMINS);
    } else {
      socket.join(ROOMS.USERS);
    }
  }

  /**
   * Register all socket event listeners
   */
  private registerSocketEvents(socket: AuthenticatedSocket): void {
    // Handle ping/pong for connection health
    socket.on(SOCKET_EVENTS.PING, () => {
      socket.emit(SOCKET_EVENTS.PONG, { timestamp: Date.now() });
    });

    // Handle notification acknowledgment
    socket.on(SOCKET_EVENTS.NOTIFICATION_READ, (data: NotificationData) => {
      console.log(`Notification read by ${socket.userId}:`, data.notificationId);
      this.io?.to(ROOMS.ADMINS).emit(SOCKET_EVENTS.NOTIFICATION_STATUS, {
        userId: socket.userId,
        notificationId: data.notificationId,
        status: 'read',
      });
    });

    // Handle typing indicators
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

    // Handle disconnection
    socket.on(SOCKET_EVENTS.DISCONNECT, () => {
      console.log(`❌ Client disconnected: ${socket.id} (User: ${socket.userId})`);
      logInfo('Client disconnected', { socketId: socket.id, userId: socket.userId });
    });

    // Handle errors
    socket.on(SOCKET_EVENTS.ERROR, (error: Error) => {
      console.error('Socket error:', error);
      logError(error, { socketId: socket.id, userId: socket.userId });
    });
  }

  /**
   * Send notification to specific user
   */
  sendNotificationToUser(userId: string, notification: any): void {
    if (!this.io) {
      console.warn('WebSocket not initialized');
      return;
    }

    this.io.to(ROOMS.getUserRoom(userId)).emit(SOCKET_EVENTS.NOTIFICATION_NEW, notification);
    console.log(`📧 Notification sent to user ${userId}`);
  }

  /**
   * Send notification to all admins
   */
  sendNotificationToAdmins(notification: any): void {
    if (!this.io) {
      console.warn('WebSocket not initialized');
      return;
    }

    this.io.to(ROOMS.ADMINS).emit(SOCKET_EVENTS.NOTIFICATION_NEW, notification);
    console.log('📧 Notification sent to all admins');
  }

  /**
   * Send notification to all users
   */
  broadcastToAllUsers(event: string, data: any): void {
    if (!this.io) {
      console.warn('WebSocket not initialized');
      return;
    }

    this.io.to(ROOMS.USERS).emit(event, data);
    console.log(`📢 Broadcast to all users: ${event}`);
  }

  /**
   * Send to specific room
   */
  sendToRoom(room: string, event: string, data: any): void {
    if (!this.io) {
      console.warn('WebSocket not initialized');
      return;
    }

    this.io.to(room).emit(event, data);
    console.log(`📢 Sent to room ${room}: ${event}`);
  }

  /**
   * Broadcast to all connected clients
   */
  broadcast(event: string, data: any): void {
    if (!this.io) {
      console.warn('WebSocket not initialized');
      return;
    }

    this.io.emit(event, data);
    console.log(`📢 Broadcast to all: ${event}`);
  }

  /**
   * Get connected clients count
   */
  async getConnectedClientsCount(): Promise<number> {
    if (!this.io) return 0;

    const sockets = await this.io.fetchSockets();
    return sockets.length;
  }

  /**
   * Get user connection status
   */
  async isUserConnected(userId: string): Promise<boolean> {
    if (!this.io) return false;

    const socketsInRoom = await this.io.in(ROOMS.getUserRoom(userId)).fetchSockets();
    return socketsInRoom.length > 0;
  }

  /**
   * Disconnect specific user
   */
  async disconnectUser(userId: string, reason?: string): Promise<void> {
    if (!this.io) return;

    const sockets = await this.io.in(ROOMS.getUserRoom(userId)).fetchSockets();
    for (const socket of sockets) {
      socket.disconnect(true);
      console.log(`Disconnected user ${userId}: ${reason || 'No reason provided'}`);
    }
  }

  /**
   * Get service status
   */
  getStatus(): { initialized: boolean; clients: number } {
    return {
      initialized: this.isInitialized,
      clients: 0, // Will be updated async
    };
  }

  /**
   * Get IO instance
   */
  getIO(): SocketIOServer | null {
    return this.io;
  }
}

// Export singleton instance
export const webSocketService = new WebSocketService();
export default webSocketService;
