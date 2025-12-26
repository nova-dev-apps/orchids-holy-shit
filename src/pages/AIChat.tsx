import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Brain, ArrowDown, Wrench, Copy, RefreshCw, Check } from "lucide-react";
import { ChatInput, Attachment } from "@/components/ChatInput";
import AISettingsPanel from "@/components/AISettingsPanel";
import UserSettingsPanel from "@/components/UserSettingsPanel";
import ChatHistory from "@/components/ChatHistory";
import { toast } from "sonner";

type ContentType = 'chat';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  attachments?: Attachment[];
}

interface ContentState {
  chat: Message[];
}

const AIChat = () => {
  const [message, setMessage] = useState("");
  const [activeTab, setActiveTab] = useState<ContentType>('chat');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isUserSettingsOpen, setIsUserSettingsOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string>("");
  const [contentState, setContentState] = useState<ContentState>({
    chat: []
  });
  const [isThinking, setIsThinking] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [strictMode, setStrictMode] = useState(false);
  const [showScrollArrow, setShowScrollArrow] = useState(false);
  const [isAutoMode, setIsAutoMode] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const aiTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Check admin status
  const isAdmin = localStorage.getItem("isAdmin") === "true";

  // Load last session on mount
  useEffect(() => {
    const lastSessionId = localStorage.getItem("lastChatSession");
    if (lastSessionId) {
      loadChatSession(lastSessionId);
    } else {
      // Create new session
      const newSessionId = Date.now().toString();
      setCurrentSessionId(newSessionId);
      localStorage.setItem("lastChatSession", newSessionId);
    }
  }, []);

  // Save session whenever messages change
  useEffect(() => {
    if (currentSessionId) {
      saveChatSession();
    }
    scrollToBottom();
  }, [contentState, currentSessionId, isThinking]);

  // Handle scroll logic
  useEffect(() => {
    const container = chatContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      if (!container) return;
      
      // Show arrow if not at bottom
      const isAtBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;
      setShowScrollArrow(!isAtBottom);

      // Clear existing timeout
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }

      // Hide arrow after 5 seconds of inactivity
      if (!isAtBottom) {
        scrollTimeoutRef.current = setTimeout(() => {
          setShowScrollArrow(false);
        }, 5000);
      }
    };

    container.addEventListener('scroll', handleScroll);
    return () => {
      container.removeEventListener('scroll', handleScroll);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const saveChatSession = () => {
    const sessions = JSON.parse(localStorage.getItem("chatSessions") || "[]");
    const sessionIndex = sessions.findIndex((s: any) => s.id === currentSessionId);
    
    const firstMessage = contentState[activeTab][0]?.text || "New conversation";
    const sessionData = {
      id: currentSessionId,
      title: firstMessage.substring(0, 30) + (firstMessage.length > 30 ? "..." : ""),
      timestamp: new Date().toISOString(),
      preview: firstMessage.substring(0, 50),
      contentState,
      activeTab
    };

    if (sessionIndex >= 0) {
      sessions[sessionIndex] = sessionData;
    } else {
      sessions.unshift(sessionData);
    }

    // Keep only last 50 sessions
    if (sessions.length > 50) sessions.pop();
    
    localStorage.setItem("chatSessions", JSON.stringify(sessions));
  };

  const loadChatSession = (sessionId: string) => {
    const sessions = JSON.parse(localStorage.getItem("chatSessions") || "[]");
    const session = sessions.find((s: any) => s.id === sessionId);
    
    if (session) {
      setCurrentSessionId(sessionId);
      setContentState(session.contentState);
      setActiveTab(session.activeTab);
      localStorage.setItem("lastChatSession", sessionId);
    }
  };

  const handleNewChat = () => {
    const newSessionId = Date.now().toString();
    setCurrentSessionId(newSessionId);
    setContentState({
      chat: []
    });
    setActiveTab('chat');
    localStorage.setItem("lastChatSession", newSessionId);
  };

  const handleStop = () => {
    if (aiTimeoutRef.current) {
      clearTimeout(aiTimeoutRef.current);
      aiTimeoutRef.current = null;
      setIsThinking(false);

      const stoppedMessage: Message = {
        id: (Date.now() + 2).toString(),
        text: "the response was stopped",
        isUser: false,
        timestamp: new Date()
      };

      setContentState(prev => ({
        ...prev,
        [activeTab]: [...prev[activeTab], stoppedMessage]
      }));
    }
  };

  const handleSendMessage = (messageText: string, attachments: Attachment[]) => {
    if (messageText.trim() || attachments.length > 0) {
      const newMessage: Message = {
        id: Date.now().toString(),
        text: messageText,
        isUser: true,
        timestamp: new Date(),
        attachments: attachments.length > 0 ? attachments : undefined
      };

      setContentState(prev => ({
        ...prev,
        [activeTab]: [...prev[activeTab], newMessage]
      }));
      
      setIsThinking(true);

      // Simulate AI response after a delay
      aiTimeoutRef.current = setTimeout(() => {
        setIsThinking(false);
        aiTimeoutRef.current = null;
        const aiResponse: Message = {
          id: (Date.now() + 1).toString(),
          text: `AI response for ${activeTab}: ${messageText || 'Received your attachments'}`,
          isUser: false,
          timestamp: new Date()
        };

        setContentState(prev => ({
          ...prev,
          [activeTab]: [...prev[activeTab], aiResponse]
        }));
      }, 2000);
    }
  };

  const handleCopy = (text: string, id: string) => {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    
    try {
      document.execCommand('copy');
      setCopiedMessageId(id);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopiedMessageId(null), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
      toast.error("Failed to copy text");
    }
    document.body.removeChild(textArea);
  };

  const handleRegenerate = (targetId?: string) => {
    const messages = contentState[activeTab];
    let targetMsgId = targetId;
    
    // If no targetId, use the last AI message
    if (!targetMsgId) {
      const lastAI = [...messages].reverse().find(m => !m.isUser);
      if (lastAI) targetMsgId = lastAI.id;
    }

    if (!targetMsgId) return;

    const targetIndex = messages.findIndex(m => m.id === targetMsgId);
    if (targetIndex === -1) return;

    // Find the user message that preceded this AI message
    let lastUserIndex = -1;
    for (let i = targetIndex - 1; i >= 0; i--) {
      if (messages[i].isUser) {
        lastUserIndex = i;
        break;
      }
    }
    
    if (lastUserIndex !== -1) {
      const lastUserMessage = messages[lastUserIndex];
      
      // Remove everything from the target message onwards
      setContentState(prev => ({
        ...prev,
        [activeTab]: prev[activeTab].slice(0, lastUserIndex + 1)
      }));
      
      setIsThinking(true);

      // Simulate AI response after a delay
      aiTimeoutRef.current = setTimeout(() => {
        setIsThinking(false);
        aiTimeoutRef.current = null;
        const aiResponse: Message = {
          id: (Date.now() + 1).toString(),
          text: `AI response for ${activeTab}: ${lastUserMessage.text || 'Received your attachments'}`,
          isUser: false,
          timestamp: new Date()
        };

        setContentState(prev => ({
          ...prev,
          [activeTab]: [...prev[activeTab], aiResponse]
        }));
      }, 2000);
    }
  };

  const getPlaceholder = () => {
    return '';
  };

  const currentMessages = contentState[activeTab];

  return (
    <div className="min-h-screen bg-background flex">
      {/* Main chat area */}
      <div className="flex-1 flex flex-col relative">
        {/* Messages area */}
        <div 
          ref={chatContainerRef}
          className="flex-1 p-4 pb-32 overflow-y-auto scroll-smooth"
        >
          {currentMessages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-400">
              <p>Start a conversation with NOVA</p>
            </div>
          ) : (
            <div className="space-y-6 max-w-4xl mx-auto">
              {currentMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex w-full ${msg.isUser ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.isUser ? (
                    // User Message
                    <div className="max-w-[70%] p-4 rounded-2xl bg-white text-black border border-gray-200 shadow-sm">
                      {msg.text && <p className="text-sm leading-relaxed">{msg.text}</p>}
                      {msg.attachments && msg.attachments.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {msg.attachments.map((attachment) => (
                            <div key={attachment.id} className="flex items-center gap-2">
                              {attachment.type === 'image' ? (
                                <img
                                  src={attachment.preview}
                                  alt={attachment.name}
                                  className="w-20 h-20 object-cover rounded-lg"
                                />
                              ) : (
                                <div className="flex items-center gap-2 bg-gray-100 rounded-lg px-2 py-1">
                                  <span className="text-xs">{attachment.name}</span>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    ) : (
                      // AI Message
                      <div className="w-full animate-blur-in flex flex-col gap-2">
                        <div className="text-black text-base leading-relaxed max-w-full bg-transparent border-none shadow-none p-0">
                          {msg.text}
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-gray-400 hover:text-black hover:bg-gray-100"
                            onClick={() => handleCopy(msg.text, msg.id)}
                          >
                            {copiedMessageId === msg.id ? (
                              <Check className="h-4 w-4 text-green-500" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-gray-400 hover:text-black hover:bg-gray-100"
                              onClick={handleRegenerate}
                            >
                              <RefreshCw className="h-4 w-4" />
                            </Button>
                        </div>
                      </div>
                    )}

                </div>
              ))}
              
              {/* Thinking Indicator */}
              {isThinking && !isAutoMode && (
                <div className="flex items-center gap-2 animate-pulse pl-0">
                  <Brain size={16} className="text-gray-400" />
                  <span className="text-sm text-gray-400 thinking-glow font-medium">thinking...</span>
                </div>
              )}

              {/* Automation Indicator */}
              {isThinking && isAutoMode && (
                <div className="flex items-center gap-2 animate-pulse pl-0">
                  <span className="text-lg" style={{ filter: 'grayscale(100%)' }}>🛠️</span>
                  <span className="text-sm text-gray-400 thinking-glow font-medium">automating...</span>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Scroll Down Arrow */}
        {showScrollArrow && (
          <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-10">
            <Button
              onClick={scrollToBottom}
              variant="outline"
              size="icon"
              className="rounded-full bg-white/80 backdrop-blur-sm shadow-md hover:bg-white transition-all duration-300 animate-in fade-in slide-in-from-bottom-2"
            >
              <ArrowDown className="h-4 w-4 text-gray-600" />
            </Button>
          </div>
        )}

        {/* Fixed bottom input area */}
        <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-gray-100 z-20">
          {/* Message input */}
          <div className="relative">
            <ChatInput
              message={message}
              setMessage={setMessage}
              onSend={handleSendMessage}
              placeholder={getPlaceholder()}
              hideAttachments={false}
              activeTab={activeTab}
              strictMode={strictMode}
                onToggleStrictMode={() => setStrictMode(!strictMode)}
                  isAdmin={isAdmin}
                  onAutoModeToggle={setIsAutoMode}
                  isGenerating={isThinking}
                  onStop={handleStop}
                />
          </div>
        </div>
      </div>

      {/* Settings panels */}
      {!isUserSettingsOpen && !isHistoryOpen && (
        <AISettingsPanel 
          activeTab={activeTab} 
          isOpen={isSettingsOpen}
          onToggle={() => setIsSettingsOpen(!isSettingsOpen)}
          strictMode={strictMode}
          onToggleStrictMode={() => setStrictMode(!strictMode)}
          isAdmin={isAdmin}
        />
      )}
      {!isSettingsOpen && !isHistoryOpen && (
        <UserSettingsPanel 
          isOpen={isUserSettingsOpen}
          onToggle={() => setIsUserSettingsOpen(!isUserSettingsOpen)}
        />
      )}
      
      {/* Chat History */}
      {!isSettingsOpen && !isUserSettingsOpen && (
        <ChatHistory 
          isOpen={isHistoryOpen}
          onOpenChange={setIsHistoryOpen}
          onNewChat={handleNewChat}
          onLoadChat={loadChatSession}
        />
      )}
    </div>
  );
};

export default AIChat;