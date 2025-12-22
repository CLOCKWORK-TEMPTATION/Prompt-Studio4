import { CursorPosition } from "@/lib/collaboration";

interface CollaborationCursorProps {
  cursor: CursorPosition;
  editorRef?: HTMLElement | null;
}

export function CollaborationCursor({
  cursor,
  editorRef,
}: CollaborationCursorProps) {
  if (!editorRef) return null;

  // Calculate cursor position in pixels
  // This is a simplified version - in production, you'd need to
  // calculate based on the actual editor's line height and char width
  const lineHeight = 20; // pixels
  const charWidth = 8; // pixels (approximate)

  const top = cursor.position.line * lineHeight;
  const left = cursor.position.column * charWidth;

  return (
    <>
      {/* Cursor line */}
      <div
        className="absolute pointer-events-none animate-pulse"
        style={{
          top: `${top}px`,
          left: `${left}px`,
          width: "2px",
          height: `${lineHeight}px`,
          backgroundColor: cursor.color,
          zIndex: 1000,
        }}
      />

      {/* User label */}
      <div
        className="absolute pointer-events-none text-xs font-medium px-1.5 py-0.5 rounded shadow-sm whitespace-nowrap"
        style={{
          top: `${top - 20}px`,
          left: `${left}px`,
          backgroundColor: cursor.color,
          color: "white",
          zIndex: 1001,
        }}
      >
        {cursor.userName}
      </div>
    </>
  );
}
