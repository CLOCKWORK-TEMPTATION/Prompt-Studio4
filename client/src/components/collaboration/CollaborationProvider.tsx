import { createContext, useContext, ReactNode } from "react";
import { useCollaboration, UseCollaborationReturn } from "@/hooks/useCollaboration";

interface CollaborationProviderProps {
  roomId: string;
  userName?: string;
  enabled?: boolean;
  children: ReactNode;
}

const CollaborationContext = createContext<UseCollaborationReturn | null>(null);

export function CollaborationProvider({
  roomId,
  userName,
  enabled = true,
  children,
}: CollaborationProviderProps) {
  const collaboration = useCollaboration({
    roomId,
    userName,
    enabled,
  });

  return (
    <CollaborationContext.Provider value={collaboration}>
      {children}
    </CollaborationContext.Provider>
  );
}

export function useCollaborationContext() {
  const context = useContext(CollaborationContext);
  if (!context) {
    throw new Error(
      "useCollaborationContext must be used within CollaborationProvider"
    );
  }
  return context;
}
