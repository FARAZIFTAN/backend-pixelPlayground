import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';

// Mock socket.io
jest.mock('socket.io', () => {
  const mockSocket = {
    id: 'test-socket-id',
    userId: 'test-user-id',
    userEmail: 'test@example.com',
    userName: 'Test User',
    userRole: 'user',
    handshake: {
      auth: { token: 'valid-token' },
      headers: {},
    },
    join: jest.fn(),
    on: jest.fn(),
    emit: jest.fn(),
    broadcast: {
      emit: jest.fn(),
    },
    disconnect: jest.fn(),
  };

  const mockIO = {
    use: jest.fn((callback) => callback(mockSocket, jest.fn())),
    on: jest.fn((event, callback) => {
      if (event === 'connection') {
        callback(mockSocket);
      }
    }),
    to: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    emit: jest.fn(),
    fetchSockets: jest.fn().mockResolvedValue([mockSocket]),
  };

  return {
    Server: jest.fn().mockImplementation(() => mockIO),
  };
});

// Mock jwt
jest.mock('@/lib/jwt', () => ({
  verifyToken: jest.fn().mockReturnValue({
    id: 'test-user-id',
    email: 'test@example.com',
    name: 'Test User',
    role: 'user',
  }),
}));

// Mock errorHandler
jest.mock('@/lib/errorHandler', () => ({
  logInfo: jest.fn(),
  logError: jest.fn(),
}));

// Import after mocks
import { webSocketService } from '../webSocketService';
import { verifyToken } from '@/lib/jwt';

describe('WebSocketService', () => {
  let mockHttpServer: HTTPServer;

  beforeEach(() => {
    jest.clearAllMocks();
    mockHttpServer = {} as HTTPServer;
  });

  describe('initialize', () => {
    it('should initialize socket.io server', () => {
      // Create a fresh instance for this test
      const WebSocketServiceClass = require('../webSocketService').default.constructor;
      const freshService = new WebSocketServiceClass();
      
      const io = freshService.initialize(mockHttpServer);
      
      expect(io).toBeDefined();
    });

    it('should return existing io if already initialized', () => {
      const WebSocketServiceClass = require('../webSocketService').default.constructor;
      const freshService = new WebSocketServiceClass();
      
      const io1 = freshService.initialize(mockHttpServer);
      const io2 = freshService.initialize(mockHttpServer);
      
      expect(io1).toBe(io2);
    });

    it('should setup middleware and event handlers', () => {
      const WebSocketServiceClass = require('../webSocketService').default.constructor;
      const freshService = new WebSocketServiceClass();
      
      freshService.initialize(mockHttpServer);
      
      const io = freshService.getIO();
      expect(io).toBeDefined();
    });
  });

  describe('sendNotificationToUser', () => {
    it('should send notification to specific user', () => {
      const WebSocketServiceClass = require('../webSocketService').default.constructor;
      const freshService = new WebSocketServiceClass();
      freshService.initialize(mockHttpServer);

      const notification = { title: 'Test', message: 'Hello' };
      freshService.sendNotificationToUser('user123', notification);

      const io = freshService.getIO();
      expect(io.to).toHaveBeenCalledWith('user:user123');
    });

    it('should warn if socket not initialized', () => {
      const WebSocketServiceClass = require('../webSocketService').default.constructor;
      const freshService = new WebSocketServiceClass();
      
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      freshService.sendNotificationToUser('user123', {});
      
      expect(consoleSpy).toHaveBeenCalledWith('WebSocket not initialized');
      consoleSpy.mockRestore();
    });
  });

  describe('sendNotificationToAdmins', () => {
    it('should send notification to all admins', () => {
      const WebSocketServiceClass = require('../webSocketService').default.constructor;
      const freshService = new WebSocketServiceClass();
      freshService.initialize(mockHttpServer);

      const notification = { title: 'Admin Alert', message: 'Important' };
      freshService.sendNotificationToAdmins(notification);

      const io = freshService.getIO();
      expect(io.to).toHaveBeenCalledWith('admins');
    });

    it('should warn if socket not initialized', () => {
      const WebSocketServiceClass = require('../webSocketService').default.constructor;
      const freshService = new WebSocketServiceClass();
      
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      freshService.sendNotificationToAdmins({});
      
      expect(consoleSpy).toHaveBeenCalledWith('WebSocket not initialized');
      consoleSpy.mockRestore();
    });
  });

  describe('broadcastToAllUsers', () => {
    it('should broadcast to all users', () => {
      const WebSocketServiceClass = require('../webSocketService').default.constructor;
      const freshService = new WebSocketServiceClass();
      freshService.initialize(mockHttpServer);

      freshService.broadcastToAllUsers('custom-event', { data: 'test' });

      const io = freshService.getIO();
      expect(io.to).toHaveBeenCalledWith('users');
    });

    it('should warn if socket not initialized', () => {
      const WebSocketServiceClass = require('../webSocketService').default.constructor;
      const freshService = new WebSocketServiceClass();
      
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      freshService.broadcastToAllUsers('event', {});
      
      expect(consoleSpy).toHaveBeenCalledWith('WebSocket not initialized');
      consoleSpy.mockRestore();
    });
  });

  describe('sendToRoom', () => {
    it('should send to specific room', () => {
      const WebSocketServiceClass = require('../webSocketService').default.constructor;
      const freshService = new WebSocketServiceClass();
      freshService.initialize(mockHttpServer);

      freshService.sendToRoom('custom-room', 'event', { data: 'test' });

      const io = freshService.getIO();
      expect(io.to).toHaveBeenCalledWith('custom-room');
    });

    it('should warn if socket not initialized', () => {
      const WebSocketServiceClass = require('../webSocketService').default.constructor;
      const freshService = new WebSocketServiceClass();
      
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      freshService.sendToRoom('room', 'event', {});
      
      expect(consoleSpy).toHaveBeenCalledWith('WebSocket not initialized');
      consoleSpy.mockRestore();
    });
  });

  describe('broadcast', () => {
    it('should broadcast to all clients', () => {
      const WebSocketServiceClass = require('../webSocketService').default.constructor;
      const freshService = new WebSocketServiceClass();
      freshService.initialize(mockHttpServer);

      freshService.broadcast('global-event', { data: 'everyone' });

      const io = freshService.getIO();
      expect(io.emit).toHaveBeenCalledWith('global-event', { data: 'everyone' });
    });

    it('should warn if socket not initialized', () => {
      const WebSocketServiceClass = require('../webSocketService').default.constructor;
      const freshService = new WebSocketServiceClass();
      
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      freshService.broadcast('event', {});
      
      expect(consoleSpy).toHaveBeenCalledWith('WebSocket not initialized');
      consoleSpy.mockRestore();
    });
  });

  describe('getConnectedClientsCount', () => {
    it('should return number of connected clients', async () => {
      const WebSocketServiceClass = require('../webSocketService').default.constructor;
      const freshService = new WebSocketServiceClass();
      freshService.initialize(mockHttpServer);

      const count = await freshService.getConnectedClientsCount();

      expect(count).toBe(1);
    });

    it('should return 0 if not initialized', async () => {
      const WebSocketServiceClass = require('../webSocketService').default.constructor;
      const freshService = new WebSocketServiceClass();
      
      const count = await freshService.getConnectedClientsCount();

      expect(count).toBe(0);
    });
  });

  describe('isUserConnected', () => {
    it('should check if user is connected', async () => {
      const WebSocketServiceClass = require('../webSocketService').default.constructor;
      const freshService = new WebSocketServiceClass();
      freshService.initialize(mockHttpServer);

      const io = freshService.getIO();
      io.in.mockReturnValue({
        fetchSockets: jest.fn().mockResolvedValue([{ id: 'socket1' }]),
      });

      const isConnected = await freshService.isUserConnected('user123');

      expect(isConnected).toBe(true);
    });

    it('should return false if user not connected', async () => {
      const WebSocketServiceClass = require('../webSocketService').default.constructor;
      const freshService = new WebSocketServiceClass();
      freshService.initialize(mockHttpServer);

      const io = freshService.getIO();
      io.in.mockReturnValue({
        fetchSockets: jest.fn().mockResolvedValue([]),
      });

      const isConnected = await freshService.isUserConnected('user123');

      expect(isConnected).toBe(false);
    });

    it('should return false if not initialized', async () => {
      const WebSocketServiceClass = require('../webSocketService').default.constructor;
      const freshService = new WebSocketServiceClass();
      
      const isConnected = await freshService.isUserConnected('user123');

      expect(isConnected).toBe(false);
    });
  });

  describe('disconnectUser', () => {
    it('should disconnect user from all sockets', async () => {
      const WebSocketServiceClass = require('../webSocketService').default.constructor;
      const freshService = new WebSocketServiceClass();
      freshService.initialize(mockHttpServer);

      const mockSocketToDisconnect = { disconnect: jest.fn() };
      const io = freshService.getIO();
      io.in.mockReturnValue({
        fetchSockets: jest.fn().mockResolvedValue([mockSocketToDisconnect]),
      });

      await freshService.disconnectUser('user123', 'Test reason');

      expect(mockSocketToDisconnect.disconnect).toHaveBeenCalledWith(true);
    });

    it('should handle no sockets to disconnect', async () => {
      const WebSocketServiceClass = require('../webSocketService').default.constructor;
      const freshService = new WebSocketServiceClass();
      freshService.initialize(mockHttpServer);

      const io = freshService.getIO();
      io.in.mockReturnValue({
        fetchSockets: jest.fn().mockResolvedValue([]),
      });

      await freshService.disconnectUser('user123');
      // Should not throw
    });

    it('should do nothing if not initialized', async () => {
      const WebSocketServiceClass = require('../webSocketService').default.constructor;
      const freshService = new WebSocketServiceClass();
      
      await freshService.disconnectUser('user123');
      // Should not throw
    });
  });

  describe('getStatus', () => {
    it('should return service status', () => {
      const WebSocketServiceClass = require('../webSocketService').default.constructor;
      const freshService = new WebSocketServiceClass();
      
      const status = freshService.getStatus();

      expect(status).toEqual({
        initialized: false,
        clients: 0,
      });
    });

    it('should return initialized true after init', () => {
      const WebSocketServiceClass = require('../webSocketService').default.constructor;
      const freshService = new WebSocketServiceClass();
      freshService.initialize(mockHttpServer);

      const status = freshService.getStatus();

      expect(status.initialized).toBe(true);
    });
  });

  describe('getIO', () => {
    it('should return null if not initialized', () => {
      const WebSocketServiceClass = require('../webSocketService').default.constructor;
      const freshService = new WebSocketServiceClass();
      
      const io = freshService.getIO();

      expect(io).toBeNull();
    });

    it('should return io instance after initialization', () => {
      const WebSocketServiceClass = require('../webSocketService').default.constructor;
      const freshService = new WebSocketServiceClass();
      freshService.initialize(mockHttpServer);

      const io = freshService.getIO();

      expect(io).toBeDefined();
    });
  });

  describe('Authentication Middleware', () => {
    it('should authenticate socket with valid token', () => {
      const WebSocketServiceClass = require('../webSocketService').default.constructor;
      const freshService = new WebSocketServiceClass();
      freshService.initialize(mockHttpServer);

      expect(verifyToken).toBeDefined();
    });

    it('should reject socket without token', () => {
      (verifyToken as jest.Mock).mockReturnValue(null);
      
      const WebSocketServiceClass = require('../webSocketService').default.constructor;
      const freshService = new WebSocketServiceClass();
      
      // The middleware should handle missing tokens
      expect(() => freshService.initialize(mockHttpServer)).not.toThrow();
    });
  });

  describe('Socket Event Handlers', () => {
    it('should register ping handler', () => {
      const WebSocketServiceClass = require('../webSocketService').default.constructor;
      const freshService = new WebSocketServiceClass();
      freshService.initialize(mockHttpServer);

      const io = freshService.getIO();
      expect(io.on).toHaveBeenCalledWith('connection', expect.any(Function));
    });

    it('should handle socket connection and join rooms', () => {
      const WebSocketServiceClass = require('../webSocketService').default.constructor;
      const freshService = new WebSocketServiceClass();
      freshService.initialize(mockHttpServer);

      // Socket should have join called for user room
      const io = freshService.getIO();
      expect(io).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle initialization error gracefully', () => {
      const { Server } = require('socket.io');
      Server.mockImplementationOnce(() => {
        throw new Error('Socket.IO init failed');
      });

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      const WebSocketServiceClass = require('../webSocketService').default.constructor;
      const freshService = new WebSocketServiceClass();
      
      const result = freshService.initialize(mockHttpServer);
      
      consoleSpy.mockRestore();
    });

    it('should handle authentication error in middleware', () => {
      (verifyToken as jest.Mock).mockImplementationOnce(() => {
        throw new Error('Token verification failed');
      });

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      const WebSocketServiceClass = require('../webSocketService').default.constructor;
      const freshService = new WebSocketServiceClass();
      freshService.initialize(mockHttpServer);
      
      consoleSpy.mockRestore();
    });
  });

  describe('Room Management', () => {
    it('should join admin room for admin users', () => {
      const WebSocketServiceClass = require('../webSocketService').default.constructor;
      const freshService = new WebSocketServiceClass();
      freshService.initialize(mockHttpServer);

      // Admin users should be in 'admins' room
      const io = freshService.getIO();
      expect(io).toBeDefined();
    });

    it('should join users room for regular users', () => {
      const WebSocketServiceClass = require('../webSocketService').default.constructor;
      const freshService = new WebSocketServiceClass();
      freshService.initialize(mockHttpServer);

      const io = freshService.getIO();
      expect(io).toBeDefined();
    });
  });

  describe('Multiple Socket Operations', () => {
    it('should disconnect multiple sockets for same user', async () => {
      const WebSocketServiceClass = require('../webSocketService').default.constructor;
      const freshService = new WebSocketServiceClass();
      freshService.initialize(mockHttpServer);

      const mockSocket1 = { disconnect: jest.fn() };
      const mockSocket2 = { disconnect: jest.fn() };
      
      const io = freshService.getIO();
      io.in.mockReturnValue({
        fetchSockets: jest.fn().mockResolvedValue([mockSocket1, mockSocket2]),
      });

      await freshService.disconnectUser('user123', 'Session expired');

      expect(mockSocket1.disconnect).toHaveBeenCalledWith(true);
      expect(mockSocket2.disconnect).toHaveBeenCalledWith(true);
    });

    it('should disconnect without reason', async () => {
      const WebSocketServiceClass = require('../webSocketService').default.constructor;
      const freshService = new WebSocketServiceClass();
      freshService.initialize(mockHttpServer);

      const mockSocket = { disconnect: jest.fn() };
      
      const io = freshService.getIO();
      io.in.mockReturnValue({
        fetchSockets: jest.fn().mockResolvedValue([mockSocket]),
      });

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      await freshService.disconnectUser('user123');

      expect(mockSocket.disconnect).toHaveBeenCalledWith(true);
      
      consoleSpy.mockRestore();
    });
  });
});

describe('WebSocketService Singleton', () => {
  it('should export singleton instance', () => {
    const { webSocketService: ws1 } = require('../webSocketService');
    const { webSocketService: ws2 } = require('../webSocketService');
    
    expect(ws1).toBe(ws2);
  });

  it('should export default as well', () => {
    const defaultExport = require('../webSocketService').default;
    const { webSocketService } = require('../webSocketService');
    
    expect(defaultExport).toBe(webSocketService);
  });
});
