import { Server as HTTPServer } from "http";
import { Server as SocketIOServer, Socket } from "socket.io";
import * as Y from "yjs";

// Store Y.Doc instances for each room (template/prompt)
const rooms = new Map<string, Y.Doc>();

// Store connected clients per room
const roomClients = new Map<string, Set<string>>();

interface ClientInfo {
  userId: string;
  userName: string;
  color: string;
}

// Store client information
const clients = new Map<string, ClientInfo>();

export function setupWebSocket(httpServer: HTTPServer): SocketIOServer {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:5173",
      methods: ["GET", "POST"],
      credentials: true,
    },
    transports: ["websocket", "polling"],
  });

  io.on("connection", (socket: Socket) => {
    console.log(`Client connected: ${socket.id}`);

    // Join a collaboration room
    socket.on("join-room", (data: { roomId: string; user: ClientInfo }) => {
      const { roomId, user } = data;

      // Store client info
      clients.set(socket.id, user);

      // Join the room
      socket.join(roomId);

      // Initialize room if it doesn't exist
      if (!rooms.has(roomId)) {
        rooms.set(roomId, new Y.Doc());
        roomClients.set(roomId, new Set());
      }

      // Add client to room
      const roomClientSet = roomClients.get(roomId)!;
      roomClientSet.add(socket.id);

      console.log(`Client ${socket.id} joined room ${roomId}`);

      // Get the Y.Doc for this room
      const doc = rooms.get(roomId)!;

      // Send current state to the new client
      const state = Y.encodeStateAsUpdate(doc);
      socket.emit("sync-initial", state);

      // Notify other clients in the room about the new user
      socket.to(roomId).emit("user-joined", {
        userId: user.userId,
        userName: user.userName,
        color: user.color,
      });

      // Send list of current users to the new client
      const currentUsers = Array.from(roomClientSet)
        .filter(id => id !== socket.id)
        .map(id => clients.get(id))
        .filter(Boolean);

      socket.emit("users-list", currentUsers);
    });

    // Handle Y.js updates
    socket.on("sync-update", (data: { roomId: string; update: Uint8Array }) => {
      const { roomId, update } = data;

      const doc = rooms.get(roomId);
      if (!doc) {
        console.error(`Room ${roomId} not found`);
        return;
      }

      // Apply the update to the Y.Doc
      Y.applyUpdate(doc, new Uint8Array(update));

      // Broadcast the update to all other clients in the room
      socket.to(roomId).emit("sync-update", update);
    });

    // Handle cursor position updates
    socket.on("cursor-update", (data: { roomId: string; position: any }) => {
      const { roomId, position } = data;
      const user = clients.get(socket.id);

      if (user) {
        socket.to(roomId).emit("cursor-update", {
          userId: user.userId,
          userName: user.userName,
          color: user.color,
          position,
        });
      }
    });

    // Handle selection updates
    socket.on("selection-update", (data: { roomId: string; selection: any }) => {
      const { roomId, selection } = data;
      const user = clients.get(socket.id);

      if (user) {
        socket.to(roomId).emit("selection-update", {
          userId: user.userId,
          userName: user.userName,
          color: user.color,
          selection,
        });
      }
    });

    // Handle client disconnect
    socket.on("disconnect", () => {
      console.log(`Client disconnected: ${socket.id}`);

      const user = clients.get(socket.id);

      // Remove client from all rooms
      roomClients.forEach((clientSet, roomId) => {
        if (clientSet.has(socket.id)) {
          clientSet.delete(socket.id);

          // Notify other clients in the room
          if (user) {
            socket.to(roomId).emit("user-left", {
              userId: user.userId,
              userName: user.userName,
            });
          }

          // Clean up empty rooms
          if (clientSet.size === 0) {
            rooms.delete(roomId);
            roomClients.delete(roomId);
            console.log(`Room ${roomId} cleaned up (empty)`);
          }
        }
      });

      // Remove client info
      clients.delete(socket.id);
    });

    // Handle explicit leave room
    socket.on("leave-room", (roomId: string) => {
      const user = clients.get(socket.id);

      socket.leave(roomId);

      const roomClientSet = roomClients.get(roomId);
      if (roomClientSet) {
        roomClientSet.delete(socket.id);

        if (user) {
          socket.to(roomId).emit("user-left", {
            userId: user.userId,
            userName: user.userName,
          });
        }

        // Clean up empty rooms
        if (roomClientSet.size === 0) {
          rooms.delete(roomId);
          roomClients.delete(roomId);
          console.log(`Room ${roomId} cleaned up (empty)`);
        }
      }
    });

    // Health check / ping-pong
    socket.on("ping", () => {
      socket.emit("pong");
    });
  });

  // Periodic cleanup of stale rooms (every 5 minutes)
  setInterval(() => {
    const now = Date.now();
    roomClients.forEach((clientSet, roomId) => {
      if (clientSet.size === 0) {
        rooms.delete(roomId);
        roomClients.delete(roomId);
        console.log(`Cleaned up stale room: ${roomId}`);
      }
    });
  }, 5 * 60 * 1000);

  return io;
}
