import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Clock, Plus, Trash2, MoreVertical, Pencil } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ChatSession {
  id: string;
  title: string;
  timestamp: Date;
  preview: string;
}

interface ChatHistoryProps {
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  onNewChat: () => void;
  onLoadChat: (sessionId: string) => void;
}

const ChatHistory = ({ isOpen = false, onOpenChange, onNewChat, onLoadChat }: ChatHistoryProps) => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);

  useEffect(() => {
    // Load sessions from localStorage
    const savedSessions = localStorage.getItem("chatSessions");
    if (savedSessions) {
      const parsed = JSON.parse(savedSessions);
      setSessions(
        parsed.map((s: any) => ({
          ...s,
          timestamp: new Date(s.timestamp),
        }))
      );
    }
  }, []);

  const handleClearHistory = () => {
    localStorage.removeItem("chatSessions");
    setSessions([]);
  };

  const handleDeleteSession = (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    const updatedSessions = sessions.filter(s => s.id !== sessionId);
    setSessions(updatedSessions);
    localStorage.setItem("chatSessions", JSON.stringify(updatedSessions));
  };

  const handleRenameSession = (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    // Simple prompt for now, ideally a dialog
    const session = sessions.find(s => s.id === sessionId);
    if (!session) return;
    
    const newTitle = prompt("Enter new title:", session.title);
    if (newTitle && newTitle.trim()) {
      const updatedSessions = sessions.map(s => 
        s.id === sessionId ? { ...s, title: newTitle.trim() } : s
      );
      setSessions(updatedSessions);
      localStorage.setItem("chatSessions", JSON.stringify(updatedSessions));
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={onOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="fixed top-4 left-1/2 -translate-x-1/2 z-50"
        >
          <Clock className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80 bg-background border-border z-[100]" align="center">
        <div className="flex items-center justify-between px-2 py-2">
          <h3 className="text-sm font-semibold text-foreground">Chat History</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={onNewChat}
            className="h-8 text-xs hover:bg-accent"
          >
            <Plus className="h-3 w-3 mr-1" />
            New Chat
          </Button>
        </div>
        <DropdownMenuSeparator />
        <div className="max-h-[400px] overflow-y-auto">
          {sessions.length === 0 ? (
            <div className="px-2 py-8 text-center text-sm text-muted-foreground">
              No chat history yet
            </div>
          ) : (
            sessions.map((session) => (
              <div
                key={session.id}
                onClick={() => onLoadChat(session.id)}
                className="group flex flex-col items-start gap-1 p-3 cursor-pointer hover:bg-accent relative"
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-medium text-sm truncate max-w-[180px]">{session.title}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatTime(session.timestamp)}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground truncate w-full pr-8">
                  {session.preview}
                </span>
                
                {/* Kebab Menu */}
                <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => e.stopPropagation()}>
                        <MoreVertical className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-32 z-[110]">
                      <DropdownMenuItem onClick={(e) => handleRenameSession(e, session.id)}>
                        <Pencil className="h-3 w-3 mr-2" /> Rename
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={(e) => handleDeleteSession(e, session.id)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="h-3 w-3 mr-2" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ChatHistory;
