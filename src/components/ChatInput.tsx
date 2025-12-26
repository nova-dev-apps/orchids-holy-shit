import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ArrowUp, Paperclip, Plus, Wrench, Hammer, Square } from "lucide-react";
import { AttachmentPreview } from "./AttachmentPreview";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface Attachment {
  id: string;
  file: File;
  type: 'image' | 'video' | 'audio' | 'document';
  preview: string;
  name: string;
  size: number;
}

interface ChatInputProps {
  message: string;
  setMessage: (message: string) => void;
  onSend: (message: string, attachments: Attachment[]) => void;
  placeholder: string;
  disabled?: boolean;
  hideAttachments?: boolean;
  activeTab?: string;
  strictMode?: boolean;
  onToggleStrictMode?: () => void;
  isAdmin?: boolean;
  onAutoModeToggle?: (isActive: boolean) => void;
  isGenerating?: boolean;
  onStop?: () => void;
}

export const ChatInput = ({ message, setMessage, onSend, placeholder, disabled, hideAttachments, activeTab, strictMode, onToggleStrictMode, isAdmin, onAutoModeToggle, isGenerating, onStop }: ChatInputProps) => {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isAutoActive, setIsAutoActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const isMobileDevice = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
           window.innerWidth < 768;
  };

  const getFileType = (file: File): Attachment['type'] => {
    if (file.type.startsWith('image/')) return 'image';
    if (file.type.startsWith('video/')) return 'video';
    if (file.type.startsWith('audio/')) return 'audio';
    return 'document';
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    const newAttachments: Attachment[] = [];

    for (const file of files) {
      if (file.size > 20 * 1024 * 1024) { // 20MB limit
        toast({
          title: "File too large",
          description: `${file.name} is too large. Maximum size is 20MB.`,
          variant: "destructive"
        });
        continue;
      }

      const fileType = getFileType(file);
      let preview = '';

      try {
        if (fileType === 'image' || fileType === 'video') {
          preview = URL.createObjectURL(file);
        }

        newAttachments.push({
          id: Date.now().toString() + Math.random(),
          file,
          type: fileType,
          preview,
          name: file.name,
          size: file.size
        });
      } catch (error) {
        toast({
          title: "Error processing file",
          description: `Could not process ${file.name}`,
          variant: "destructive"
        });
      }
    }

    setAttachments(prev => [...prev, ...newAttachments]);
    
    // Clear the input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (id: string) => {
    setAttachments(prev => {
      const attachment = prev.find(a => a.id === id);
      if (attachment?.preview && (attachment.type === 'image' || attachment.type === 'video')) {
        URL.revokeObjectURL(attachment.preview);
      }
      return prev.filter(a => a.id !== id);
    });
  };

  const handleSend = () => {
    if (message.trim() || attachments.length > 0) {
      onSend(message, attachments);
      setMessage("");
      // Clean up blob URLs
      attachments.forEach(attachment => {
        if (attachment.preview && (attachment.type === 'image' || attachment.type === 'video')) {
          URL.revokeObjectURL(attachment.preview);
        }
      });
      setAttachments([]);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="px-4 py-0.5">
      {/* Attachment previews */}
      {attachments.length > 0 && !hideAttachments && (
        <div className="mb-3">
          <AttachmentPreview
            attachments={attachments}
            onRemove={removeAttachment}
          />
        </div>
      )}


      {/* Input area */}
      <div className="flex items-center gap-3">
        {!hideAttachments && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="p-2 hover:bg-gray-100 rounded-full"
                aria-label="More options"
              >
                <Plus className="w-5 h-5 text-gray-600" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-40">
              <DropdownMenuItem
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 cursor-pointer"
              >
                <Paperclip className="w-4 h-4" />
                <span>Attachment</span>
              </DropdownMenuItem>
              {activeTab === 'chat' && (
                <DropdownMenuItem
                  onClick={() => {
                    if (isMobileDevice()) {
                      toast({
                        title: "Not available for phones",
                        description: "",
                        variant: "default",
                        duration: 3000,
                      });
                      return;
                    }
                    const newState = !isAutoActive;
                    setIsAutoActive(newState);
                    onAutoModeToggle?.(newState);
                  }}
                  className="flex items-center gap-2 cursor-pointer"
                  data-testid="menu-item-auto-mode"
                >
                  <div className={`w-2 h-2 rounded-full ${isAutoActive ? 'bg-nova-pink' : 'bg-gray-400'}`} />
                  <span>Auto Mode</span>
                  {isAutoActive && <span className="ml-auto text-xs text-nova-pink">On</span>}
                </DropdownMenuItem>
              )}
              {isAdmin && onToggleStrictMode && (
                <DropdownMenuItem
                  onClick={onToggleStrictMode}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <div className={`w-2 h-2 rounded-full ${strictMode ? 'bg-nova-pink' : 'bg-gray-400'}`} />
                  <span>Strict Mode</span>
                  {strictMode && <span className="ml-auto text-xs text-nova-pink">On</span>}
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        <div className={`flex-1 relative ${isAutoActive ? 'auto-mode-glow' : ''}`}>
          <textarea
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              e.target.style.height = 'auto';
              e.target.style.height = Math.min(e.target.scrollHeight, 200) + 'px';
            }}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            disabled={disabled}
            rows={1}
            className={`w-full min-h-[48px] max-h-[200px] py-3 px-4 pr-12 rounded-3xl border focus:outline-none text-sm resize-none overflow-y-auto ${!isAutoActive ? 'border-gray-200 focus:border-gray-300' : ''}`}
            style={{ height: 'auto' }}
            data-testid={isAutoActive ? 'textarea-auto-mode' : 'textarea-normal'}
          />
            <button
              onClick={handleSend}
              disabled={(!message.trim() && attachments.length === 0) || disabled}
              className="absolute right-4 p-0 flex items-center justify-center hover:opacity-70 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ top: 'calc(33.333% - 4px)' }}
              aria-label={isGenerating ? "Stop generation" : "Send message"}
            >
              {isGenerating ? (
                <Square className="w-5 h-5 text-red-600 fill-red-600" />
              ) : (
                <ArrowUp className="w-5 h-5 text-black" />
              )}
            </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileSelect}
          multiple
          className="hidden"
          aria-label="File input"
        />
      </div>
    </div>
  );
};