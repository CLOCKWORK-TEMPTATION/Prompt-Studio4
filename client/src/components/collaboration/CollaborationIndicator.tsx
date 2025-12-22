import { useCollaborationContext } from "./CollaborationProvider";
import { Users, Wifi, WifiOff } from "lucide-react";
import { cn } from "@/lib/utils";

export function CollaborationIndicator() {
  const { isConnected, users } = useCollaborationContext();

  const totalUsers = users.length + (isConnected ? 1 : 0); // +1 for current user

  return (
    <div className="flex items-center gap-2 text-sm">
      {/* Connection status */}
      <div
        className={cn(
          "flex items-center gap-1.5 px-2 py-1 rounded-md transition-colors",
          isConnected
            ? "bg-green-500/10 text-green-600 dark:text-green-400"
            : "bg-gray-500/10 text-gray-600 dark:text-gray-400"
        )}
      >
        {isConnected ? (
          <Wifi className="w-3.5 h-3.5" />
        ) : (
          <WifiOff className="w-3.5 h-3.5" />
        )}
        <span className="text-xs font-medium">
          {isConnected ? "متصل" : "غير متصل"}
        </span>
      </div>

      {/* Active users count */}
      {isConnected && (
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400">
          <Users className="w-3.5 h-3.5" />
          <span className="text-xs font-medium">
            {totalUsers} {totalUsers === 1 ? "مستخدم" : "مستخدمون"}
          </span>
        </div>
      )}

      {/* User avatars */}
      {isConnected && users.length > 0 && (
        <div className="flex -space-x-2">
          {users.slice(0, 3).map((user) => (
            <div
              key={user.userId}
              className="w-7 h-7 rounded-full border-2 border-background flex items-center justify-center text-xs font-semibold text-white shadow-sm"
              style={{ backgroundColor: user.color }}
              title={user.userName}
            >
              {user.userName.charAt(0).toUpperCase()}
            </div>
          ))}
          {users.length > 3 && (
            <div className="w-7 h-7 rounded-full border-2 border-background bg-gray-500 flex items-center justify-center text-xs font-semibold text-white shadow-sm">
              +{users.length - 3}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
