import { describe, it, expect, beforeAll, afterAll, beforeEach } from "@jest/globals";
import { createServer, Server as HTTPServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import { io as ioClient, Socket as ClientSocket } from "socket.io-client";
import * as Y from "yjs";

/**
 * Integration Tests for WebSocket Collaboration Server
 */

describe("WebSocket Collaboration Server", () => {
  let httpServer: HTTPServer;
  let io: SocketIOServer;
  let serverUrl: string;
  const rooms = new Map<string, Y.Doc>();
  const roomClients = new Map<string, Set<string>>();
  const clients = new Map<string, any>();

  beforeAll((done) => {
    httpServer = createServer();
    io = new SocketIOServer(httpServer, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
      },
    });

    // Setup WebSocket handlers (simplified version for testing)
    io.on("connection", (socket) => {
      socket.on("join-room", (data) => {
        const { roomId, user } = data;
        clients.set(socket.id, user);
        socket.join(roomId);

        if (!rooms.has(roomId)) {
          rooms.set(roomId, new Y.Doc());
          roomClients.set(roomId, new Set());
        }

        const roomClientSet = roomClients.get(roomId)!;
        roomClientSet.add(socket.id);

        const doc = rooms.get(roomId)!;
        const state = Y.encodeStateAsUpdate(doc);
        socket.emit("sync-initial", state);

        socket.to(roomId).emit("user-joined", user);

        const currentUsers = Array.from(roomClientSet)
          .filter((id) => id !== socket.id)
          .map((id) => clients.get(id))
          .filter(Boolean);

        socket.emit("users-list", currentUsers);
      });

      socket.on("sync-update", (data) => {
        const { roomId, update } = data;
        const doc = rooms.get(roomId);
        if (doc) {
          Y.applyUpdate(doc, new Uint8Array(update));
          socket.to(roomId).emit("sync-update", update);
        }
      });

      socket.on("disconnect", () => {
        const user = clients.get(socket.id);
        roomClients.forEach((clientSet, roomId) => {
          if (clientSet.has(socket.id)) {
            clientSet.delete(socket.id);
            if (user) {
              socket.to(roomId).emit("user-left", {
                userId: user.userId,
                userName: user.userName,
              });
            }
          }
        });
        clients.delete(socket.id);
      });
    });

    httpServer.listen(() => {
      const address = httpServer.address();
      if (address && typeof address !== "string") {
        const port = address.port;
        serverUrl = `http://localhost:${port}`;
        done();
      }
    });
  });

  afterAll((done) => {
    io.close();
    httpServer.close(done);
    rooms.forEach((doc) => doc.destroy());
    rooms.clear();
    roomClients.clear();
    clients.clear();
  });

  beforeEach(() => {
    // Clean up rooms before each test
    rooms.forEach((doc) => doc.destroy());
    rooms.clear();
    roomClients.clear();
    clients.clear();
  });

  it("should connect a client to the server", (done) => {
    const client = ioClient(serverUrl, {
      transports: ["websocket"],
    });

    client.on("connect", () => {
      expect(client.connected).toBe(true);
      client.disconnect();
      done();
    });
  });

  it("should allow a client to join a room", (done) => {
    const client = ioClient(serverUrl, {
      transports: ["websocket"],
    });

    client.on("connect", () => {
      const roomId = "test-room-1";
      const user = {
        userId: "user-1",
        userName: "Test User",
        color: "#FF0000",
      };

      client.emit("join-room", { roomId, user });

      client.on("sync-initial", (state) => {
        expect(state).toBeDefined();
        expect(state instanceof Uint8Array || Array.isArray(state)).toBe(true);
        client.disconnect();
        done();
      });
    });
  });

  it("should sync updates between two clients", (done) => {
    const client1 = ioClient(serverUrl, { transports: ["websocket"] });
    const client2 = ioClient(serverUrl, { transports: ["websocket"] });

    const roomId = "test-room-2";
    const doc1 = new Y.Doc();
    const doc2 = new Y.Doc();

    let client1Ready = false;
    let client2Ready = false;

    const checkBothReady = () => {
      if (client1Ready && client2Ready) {
        // Client 1 makes a change
        const text1 = doc1.getText("test");
        text1.insert(0, "Hello from client 1");

        const update = Y.encodeStateAsUpdate(doc1);
        client1.emit("sync-update", {
          roomId,
          update: Array.from(update),
        });
      }
    };

    client1.on("connect", () => {
      client1.emit("join-room", {
        roomId,
        user: { userId: "1", userName: "User 1", color: "#FF0000" },
      });
    });

    client1.on("sync-initial", (state) => {
      Y.applyUpdate(doc1, new Uint8Array(state));
      client1Ready = true;
      checkBothReady();
    });

    client2.on("connect", () => {
      setTimeout(() => {
        client2.emit("join-room", {
          roomId,
          user: { userId: "2", userName: "User 2", color: "#00FF00" },
        });
      }, 100);
    });

    client2.on("sync-initial", (state) => {
      Y.applyUpdate(doc2, new Uint8Array(state));
      client2Ready = true;
      checkBothReady();
    });

    client2.on("sync-update", (update) => {
      Y.applyUpdate(doc2, new Uint8Array(update));

      const text2 = doc2.getText("test");
      expect(text2.toString()).toBe("Hello from client 1");

      client1.disconnect();
      client2.disconnect();
      doc1.destroy();
      doc2.destroy();
      done();
    });
  });

  it("should notify when a user joins", (done) => {
    const client1 = ioClient(serverUrl, { transports: ["websocket"] });
    const client2 = ioClient(serverUrl, { transports: ["websocket"] });

    const roomId = "test-room-3";

    client1.on("connect", () => {
      client1.emit("join-room", {
        roomId,
        user: { userId: "1", userName: "User 1", color: "#FF0000" },
      });

      client1.on("user-joined", (user) => {
        expect(user.userId).toBe("2");
        expect(user.userName).toBe("User 2");
        client1.disconnect();
        client2.disconnect();
        done();
      });
    });

    client1.on("sync-initial", () => {
      setTimeout(() => {
        client2.emit("join-room", {
          roomId,
          user: { userId: "2", userName: "User 2", color: "#00FF00" },
        });
      }, 100);
    });

    client2.on("connect", () => {
      // Wait for client1 to join first
    });
  });

  it("should notify when a user leaves", (done) => {
    const client1 = ioClient(serverUrl, { transports: ["websocket"] });
    const client2 = ioClient(serverUrl, { transports: ["websocket"] });

    const roomId = "test-room-4";

    client1.on("connect", () => {
      client1.emit("join-room", {
        roomId,
        user: { userId: "1", userName: "User 1", color: "#FF0000" },
      });
    });

    client1.on("user-left", (user) => {
      expect(user.userId).toBe("2");
      expect(user.userName).toBe("User 2");
      client1.disconnect();
      done();
    });

    client2.on("connect", () => {
      setTimeout(() => {
        client2.emit("join-room", {
          roomId,
          user: { userId: "2", userName: "User 2", color: "#00FF00" },
        });

        setTimeout(() => {
          client2.disconnect();
        }, 100);
      }, 100);
    });
  });

  it("should handle concurrent edits from multiple clients", (done) => {
    const client1 = ioClient(serverUrl, { transports: ["websocket"] });
    const client2 = ioClient(serverUrl, { transports: ["websocket"] });
    const client3 = ioClient(serverUrl, { transports: ["websocket"] });

    const roomId = "test-room-5";
    const doc1 = new Y.Doc();
    const doc2 = new Y.Doc();
    const doc3 = new Y.Doc();

    let readyCount = 0;
    const updates: any[] = [];

    const checkAllReady = () => {
      readyCount++;
      if (readyCount === 3) {
        // All clients make concurrent changes
        const text1 = doc1.getText("shared");
        const text2 = doc2.getText("shared");
        const text3 = doc3.getText("shared");

        text1.insert(0, "A");
        text2.insert(0, "B");
        text3.insert(0, "C");

        client1.emit("sync-update", {
          roomId,
          update: Array.from(Y.encodeStateAsUpdate(doc1)),
        });

        client2.emit("sync-update", {
          roomId,
          update: Array.from(Y.encodeStateAsUpdate(doc2)),
        });

        client3.emit("sync-update", {
          roomId,
          update: Array.from(Y.encodeStateAsUpdate(doc3)),
        });
      }
    };

    const setupClient = (client: ClientSocket, doc: Y.Doc, userId: string) => {
      client.on("connect", () => {
        client.emit("join-room", {
          roomId,
          user: { userId, userName: `User ${userId}`, color: "#000000" },
        });
      });

      client.on("sync-initial", (state) => {
        Y.applyUpdate(doc, new Uint8Array(state));
        checkAllReady();
      });

      client.on("sync-update", (update) => {
        Y.applyUpdate(doc, new Uint8Array(update));
        updates.push(update);

        // After receiving 6 updates (2 per client), check convergence
        if (updates.length >= 6) {
          const text1 = doc1.getText("shared").toString();
          const text2 = doc2.getText("shared").toString();
          const text3 = doc3.getText("shared").toString();

          // All should have converged to the same state
          expect(text1).toBe(text2);
          expect(text2).toBe(text3);

          client1.disconnect();
          client2.disconnect();
          client3.disconnect();
          doc1.destroy();
          doc2.destroy();
          doc3.destroy();
          done();
        }
      });
    };

    setupClient(client1, doc1, "1");
    setupClient(client2, doc2, "2");
    setupClient(client3, doc3, "3");
  }, 10000); // Increase timeout for this test
});
