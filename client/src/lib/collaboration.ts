import * as Y from "yjs";
import { io, Socket } from "socket.io-client";

export interface CollaborationUser {
  userId: string;
  userName: string;
  color: string;
}

export interface CursorPosition {
  userId: string;
  userName: string;
  color: string;
  position: {
    line: number;
    column: number;
  };
}

export interface SelectionRange {
  userId: string;
  userName: string;
  color: string;
  selection: {
    start: { line: number; column: number };
    end: { line: number; column: number };
  };
}

export type CollaborationEventHandler = {
  onUserJoined?: (user: CollaborationUser) => void;
  onUserLeft?: (user: { userId: string; userName: string }) => void;
  onUsersList?: (users: CollaborationUser[]) => void;
  onCursorUpdate?: (cursor: CursorPosition) => void;
  onSelectionUpdate?: (selection: SelectionRange) => void;
  onSyncUpdate?: (update: Uint8Array) => void;
  onConnected?: () => void;
  onDisconnected?: () => void;
  onError?: (error: Error) => void;
};

/**
 * CollaborationManager handles real-time collaboration using Y.js CRDT
 * and Socket.IO for communication.
 */
export class CollaborationManager {
  private doc: Y.Doc;
  private socket: Socket | null = null;
  private roomId: string | null = null;
  private user: CollaborationUser | null = null;
  private handlers: CollaborationEventHandler = {};
  private isConnected = false;

  constructor() {
    this.doc = new Y.Doc();
  }

  /**
   * Get the Y.Doc instance for binding to editors
   */
  getDoc(): Y.Doc {
    return this.doc;
  }

  /**
   * Get a Y.Text instance for a specific field
   */
  getText(fieldName: string): Y.Text {
    return this.doc.getText(fieldName);
  }

  /**
   * Get a Y.Map instance for structured data
   */
  getMap(mapName: string): Y.Map<any> {
    return this.doc.getMap(mapName);
  }

  /**
   * Connect to a collaboration room
   */
  connect(
    roomId: string,
    user: CollaborationUser,
    handlers: CollaborationEventHandler = {},
    serverUrl?: string
  ): void {
    if (this.socket) {
      this.disconnect();
    }

    this.roomId = roomId;
    this.user = user;
    this.handlers = handlers;

    // Connect to Socket.IO server
    const url = serverUrl || window.location.origin;
    this.socket = io(url, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    this.setupSocketListeners();

    // Join the room
    this.socket.emit("join-room", { roomId, user });
  }

  /**
   * Disconnect from the collaboration room
   */
  disconnect(): void {
    if (this.socket && this.roomId) {
      this.socket.emit("leave-room", this.roomId);
      this.socket.disconnect();
      this.socket = null;
      this.roomId = null;
      this.isConnected = false;
    }
  }

  /**
   * Send cursor position to other users
   */
  updateCursor(position: { line: number; column: number }): void {
    if (this.socket && this.roomId && this.isConnected) {
      this.socket.emit("cursor-update", {
        roomId: this.roomId,
        position,
      });
    }
  }

  /**
   * Send selection range to other users
   */
  updateSelection(selection: {
    start: { line: number; column: number };
    end: { line: number; column: number };
  }): void {
    if (this.socket && this.roomId && this.isConnected) {
      this.socket.emit("selection-update", {
        roomId: this.roomId,
        selection,
      });
    }
  }

  /**
   * Check if connected to a room
   */
  isActive(): boolean {
    return this.isConnected && !!this.socket && !!this.roomId;
  }

  /**
   * Get current room ID
   */
  getRoomId(): string | null {
    return this.roomId;
  }

  /**
   * Get current user info
   */
  getUser(): CollaborationUser | null {
    return this.user;
  }

  /**
   * Setup Socket.IO event listeners
   */
  private setupSocketListeners(): void {
    if (!this.socket) return;

    // Connection events
    this.socket.on("connect", () => {
      console.log("Connected to collaboration server");
      this.isConnected = true;
      this.handlers.onConnected?.();
    });

    this.socket.on("disconnect", () => {
      console.log("Disconnected from collaboration server");
      this.isConnected = false;
      this.handlers.onDisconnected?.();
    });

    this.socket.on("connect_error", (error) => {
      console.error("Connection error:", error);
      this.handlers.onError?.(error);
    });

    // Sync initial state
    this.socket.on("sync-initial", (state: Uint8Array) => {
      Y.applyUpdate(this.doc, new Uint8Array(state));
      console.log("Initial state synced");
    });

    // Receive updates from other users
    this.socket.on("sync-update", (update: Uint8Array) => {
      Y.applyUpdate(this.doc, new Uint8Array(update));
      this.handlers.onSyncUpdate?.(new Uint8Array(update));
    });

    // User events
    this.socket.on("user-joined", (user: CollaborationUser) => {
      console.log("User joined:", user.userName);
      this.handlers.onUserJoined?.(user);
    });

    this.socket.on("user-left", (user: { userId: string; userName: string }) => {
      console.log("User left:", user.userName);
      this.handlers.onUserLeft?.(user);
    });

    this.socket.on("users-list", (users: CollaborationUser[]) => {
      console.log("Current users:", users.length);
      this.handlers.onUsersList?.(users);
    });

    // Cursor and selection updates
    this.socket.on("cursor-update", (cursor: CursorPosition) => {
      this.handlers.onCursorUpdate?.(cursor);
    });

    this.socket.on("selection-update", (selection: SelectionRange) => {
      this.handlers.onSelectionUpdate?.(selection);
    });

    // Setup Y.js update observer
    this.doc.on("update", (update: Uint8Array) => {
      if (this.socket && this.roomId && this.isConnected) {
        this.socket.emit("sync-update", {
          roomId: this.roomId,
          update: Array.from(update),
        });
      }
    });
  }

  /**
   * Destroy the collaboration manager
   */
  destroy(): void {
    this.disconnect();
    this.doc.destroy();
  }
}

/**
 * Generate a random color for user identification
 */
export function generateUserColor(): string {
  const colors = [
    "#FF6B6B", // Red
    "#4ECDC4", // Teal
    "#45B7D1", // Blue
    "#FFA07A", // Light Salmon
    "#98D8C8", // Mint
    "#F7DC6F", // Yellow
    "#BB8FCE", // Purple
    "#85C1E2", // Sky Blue
    "#F8B88B", // Peach
    "#A2D9CE", // Aqua
  ];

  return colors[Math.floor(Math.random() * colors.length)];
}

/**
 * Generate a random user ID
 */
export function generateUserId(): string {
  return `user-${Math.random().toString(36).substr(2, 9)}-${Date.now()}`;
}
