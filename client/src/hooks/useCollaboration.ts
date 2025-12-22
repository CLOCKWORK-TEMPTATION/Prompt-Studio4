import { useEffect, useRef, useState, useCallback } from "react";
import {
  CollaborationManager,
  CollaborationUser,
  CursorPosition,
  SelectionRange,
  generateUserId,
  generateUserColor,
} from "@/lib/collaboration";

export interface UseCollaborationOptions {
  roomId: string;
  userName?: string;
  enabled?: boolean;
  serverUrl?: string;
  onUserJoined?: (user: CollaborationUser) => void;
  onUserLeft?: (user: { userId: string; userName: string }) => void;
  onError?: (error: Error) => void;
}

export interface UseCollaborationReturn {
  manager: CollaborationManager | null;
  isConnected: boolean;
  users: CollaborationUser[];
  cursors: Map<string, CursorPosition>;
  selections: Map<string, SelectionRange>;
  updateCursor: (position: { line: number; column: number }) => void;
  updateSelection: (selection: {
    start: { line: number; column: number };
    end: { line: number; column: number };
  }) => void;
}

/**
 * React hook for managing real-time collaboration
 */
export function useCollaboration(
  options: UseCollaborationOptions
): UseCollaborationReturn {
  const {
    roomId,
    userName = "Anonymous",
    enabled = true,
    serverUrl,
    onUserJoined,
    onUserLeft,
    onError,
  } = options;

  const managerRef = useRef<CollaborationManager | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [users, setUsers] = useState<CollaborationUser[]>([]);
  const cursorsRef = useRef(new Map<string, CursorPosition>());
  const selectionsRef = useRef(new Map<string, SelectionRange>());
  const [, forceUpdate] = useState({});

  // Initialize collaboration manager
  useEffect(() => {
    if (!enabled) return;

    // Create manager if it doesn't exist
    if (!managerRef.current) {
      managerRef.current = new CollaborationManager();
    }

    const manager = managerRef.current;

    // Generate user info
    const user: CollaborationUser = {
      userId: generateUserId(),
      userName,
      color: generateUserColor(),
    };

    // Connect to room
    manager.connect(roomId, user, {
      onConnected: () => {
        console.log("Collaboration connected");
        setIsConnected(true);
      },
      onDisconnected: () => {
        console.log("Collaboration disconnected");
        setIsConnected(false);
      },
      onUserJoined: (joinedUser) => {
        console.log("User joined:", joinedUser.userName);
        setUsers((prev) => [...prev, joinedUser]);
        onUserJoined?.(joinedUser);
      },
      onUserLeft: (leftUser) => {
        console.log("User left:", leftUser.userName);
        setUsers((prev) => prev.filter((u) => u.userId !== leftUser.userId));
        cursorsRef.current.delete(leftUser.userId);
        selectionsRef.current.delete(leftUser.userId);
        forceUpdate({});
        onUserLeft?.(leftUser);
      },
      onUsersList: (usersList) => {
        console.log("Users list received:", usersList.length);
        setUsers(usersList);
      },
      onCursorUpdate: (cursor) => {
        cursorsRef.current.set(cursor.userId, cursor);
        forceUpdate({});
      },
      onSelectionUpdate: (selection) => {
        selectionsRef.current.set(selection.userId, selection);
        forceUpdate({});
      },
      onError: (error) => {
        console.error("Collaboration error:", error);
        onError?.(error);
      },
    }, serverUrl);

    // Cleanup on unmount or when roomId changes
    return () => {
      manager.disconnect();
    };
  }, [roomId, userName, enabled, serverUrl, onUserJoined, onUserLeft, onError]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (managerRef.current) {
        managerRef.current.destroy();
        managerRef.current = null;
      }
    };
  }, []);

  const updateCursor = useCallback(
    (position: { line: number; column: number }) => {
      if (managerRef.current) {
        managerRef.current.updateCursor(position);
      }
    },
    []
  );

  const updateSelection = useCallback(
    (selection: {
      start: { line: number; column: number };
      end: { line: number; column: number };
    }) => {
      if (managerRef.current) {
        managerRef.current.updateSelection(selection);
      }
    },
    []
  );

  return {
    manager: managerRef.current,
    isConnected,
    users,
    cursors: cursorsRef.current,
    selections: selectionsRef.current,
    updateCursor,
    updateSelection,
  };
}
