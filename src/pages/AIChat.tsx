import { useState, useEffect, useRef, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Brain, ArrowDown, Wrench, Hammer, Copy, RefreshCw, Check, ClipboardCopy } from "lucide-react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ChatInput, Attachment } from "@/components/ChatInput";
import AISettingsPanel from "@/components/AISettingsPanel";
import UserSettingsPanel from "@/components/UserSettingsPanel";
import ChatHistory from "@/components/ChatHistory";
import { OnboardingModal } from "@/components/OnboardingModal";
import { AutomationPlan, PlanStep } from "@/components/AutomationPlan";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

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
  const [showScrollArrow, setShowScrollArrow] = useState(false);
  const [isAutoMode, setIsAutoMode] = useState(false);
  const [isExecutingAutomation, setIsExecutingAutomation] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<PlanStep[] | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [apiConfig, setApiConfig] = useState<{api_key: string, endpoint_url: string, model: string, custom_instructions?: string, personal_instructions?: string} | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const aiTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Memoize individual message components to prevent re-creation on every stream chunk
  const markdownComponents = useMemo(() => ({
    table: ({ node, ...props }: any) => {
      const tableRef = useRef<HTMLTableElement>(null);
      const [isCopied, setIsCopied] = useState(false);

      const handleCopyTable = async () => {
        if (!tableRef.current) return;
        
        let tableText = "";
        const rows = tableRef.current.querySelectorAll("tr");
        
        rows.forEach((row, rowIndex) => {
          const cells = row.querySelectorAll("th, td");
          const cellTexts: string[] = [];
          cells.forEach(cell => {
            cellTexts.push(cell.textContent?.trim() || "");
          });
          tableText += cellTexts.join("\t") + (rowIndex < rows.length - 1 ? "\n" : "");
        });

        try {
          await navigator.clipboard.writeText(tableText);
          setIsCopied(true);
          toast.success("Table copied to clipboard");
          setTimeout(() => setIsCopied(false), 2000);
        } catch (err) {
          toast.error("Failed to copy table");
        }
      };

      return (
        <div className="group relative my-4 overflow-hidden rounded-lg border border-gray-200 shadow-sm bg-white">
          <div className="absolute right-2 top-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="secondary"
              size="icon"
              className="h-8 w-8 bg-white shadow-sm border border-gray-200 hover:bg-gray-50"
              onClick={handleCopyTable}
              title="Copy table to clipboard"
            >
              {isCopied ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <ClipboardCopy className="h-4 w-4 text-gray-500" />
              )}
            </Button>
          </div>
          <div className="overflow-x-auto">
            <table ref={tableRef} className="min-w-full divide-y divide-gray-200" {...props} />
          </div>
        </div>
      );
    },
    thead: ({ node, ...props }: any) => <thead className="bg-gray-50" {...props} />,
    th: ({ node, ...props }: any) => <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-b" {...props} />,
    td: ({ node, ...props }: any) => <td className="px-4 py-2 text-sm text-gray-700 border-b border-gray-100 last:border-b-0" {...props} />,
    p: ({ node, ...props }: any) => <p className="mb-3 last:mb-0" {...props} />,
    strong: ({ node, ...props }: any) => <strong className="font-bold text-black" {...props} />,
    code: ({ node, ...props }: any) => <code className="bg-gray-100 px-1 rounded text-nova-pink" {...props} />,
    ul: ({ node, ...props }: any) => <ul className="list-disc pl-4 mb-3" {...props} />,
    ol: ({ node, ...props }: any) => <ol className="list-decimal pl-4 mb-3" {...props} />,
  }), []);

  // Memoized Message Component for performance
    const ChatMessage = useMemo(() => {
      return ({ msg, isThinking, isAutoMode, isLast, copiedMessageId, handleCopy, handleRegenerate, currentPlan, isExecutingAutomation, setIsExecutingAutomation }: { 
        msg: Message, 
        isThinking: boolean, 
        isAutoMode: boolean, 
        isLast: boolean,
        copiedMessageId: string | null,
        handleCopy: (text: string, id: string) => void,
        handleRegenerate: (id: string) => void,
        currentPlan: PlanStep[] | null,
        isExecutingAutomation: boolean,
        setIsExecutingAutomation: (val: boolean) => void
      }) => (
        <div className={`flex w-full ${msg.isUser ? 'justify-end' : 'justify-start'}`}>
          {msg.isUser ? (
            <div className="max-w-[70%] p-4 rounded-2xl bg-white text-black border border-gray-200 shadow-sm">
              {msg.text && <p className="text-sm leading-relaxed">{msg.text}</p>}
              {msg.attachments && msg.attachments.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {msg.attachments.map((attachment) => (
                    <div key={attachment.id} className="flex items-center gap-2">
                      {attachment.type === 'image' ? (
                        <img src={attachment.preview} alt={attachment.name} className="w-20 h-20 object-cover rounded-lg" />
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
            <div className="w-full flex flex-col gap-2">
              {isThinking && isLast && !msg.text && (
                <div className="flex items-center gap-2 mb-1">
                  {isAutoMode ? (
                    <>
                      <div className="flex items-center justify-center animate-pulse text-base">🛠️</div>
                      <span className="text-sm text-gray-400 thinking-glow font-medium animate-pulse">preparing automation plan...</span>
                    </>
                  ) : (
                    <>
                      <Brain size={16} className="animate-pulse" style={{ color: 'black' }} />
                      <span className="text-sm text-gray-400 thinking-glow font-medium animate-pulse">thinking...</span>
                    </>
                  )}
                </div>
              )}
                {msg.text && (
                  <div className="text-black text-base leading-relaxed max-w-[85%] break-words animate-blur-in">
                    <ReactMarkdown 
                      remarkPlugins={[remarkGfm]}
                      components={markdownComponents}
                    >
                      {msg.text}
                    </ReactMarkdown>
                  </div>
                )}
              
              {isLast && currentPlan && isAutoMode && !isThinking && (
                <AutomationPlan 
                  plan={currentPlan} 
                  isExecuting={isExecutingAutomation}
                  onStart={() => setIsExecutingAutomation(true)}
                  onStop={() => setIsExecutingAutomation(false)}
                  onComplete={() => {
                    setIsExecutingAutomation(false);
                    toast.success("Automation completed successfully!");
                  }}
                />
              )}

              {(!isThinking || !isLast) && msg.text && (

              <div className="flex items-center gap-1 mt-1">
                <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-black hover:bg-gray-100" onClick={() => handleCopy(msg.text, msg.id)}>
                  {copiedMessageId === msg.id ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-black hover:bg-gray-100" onClick={() => handleRegenerate(msg.id)}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }, [markdownComponents]);

  // Check admin status
  const isAdmin = localStorage.getItem("isAdmin") === "true" || localStorage.getItem("userEmail") === "abdisamadbashir14@gmail.com";

  const fetchAiConfig = async () => {
    try {
      const { data: globalData, error: globalError } = await supabase
        .from('ai_config')
        .select('api_key, endpoint_url, model, custom_instructions')
        .eq('id', 'global')
        .single();
      
      if (globalError) throw globalError;
      
      const personalInstructions = localStorage.getItem("nova_personal_instructions") || "";

      if (globalData) {
        setApiConfig({
          ...globalData,
          personal_instructions: personalInstructions
        });
      }
    } catch (error) {
      console.error("Error fetching AI config in chat:", error);
    }
  };

  useEffect(() => {
    fetchAiConfig();

    const handleUpdate = () => fetchAiConfig();
    window.addEventListener('ai-config-update', handleUpdate);
    return () => window.removeEventListener('ai-config-update', handleUpdate);
  }, []);

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
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    if (aiTimeoutRef.current) {
      clearTimeout(aiTimeoutRef.current);
      aiTimeoutRef.current = null;
    }

    setIsThinking(false);

    const lastMessages = contentState[activeTab];
    const lastMsg = lastMessages[lastMessages.length - 1];

    if (lastMsg && !lastMsg.isUser && !lastMsg.text) {
      // If we stop and the AI hasn't sent any text yet, update the empty message to show it was stopped
      setContentState(prev => {
        const activeMessages = prev[activeTab];
        const newMessages = [...activeMessages];
        newMessages[newMessages.length - 1] = { 
          ...newMessages[newMessages.length - 1], 
          text: "The response was stopped." 
        };
        return { ...prev, [activeTab]: newMessages };
      });
    }
    // If text already exists, we just stop right there without adding more text.
  };

  const handleSendMessage = async (messageText: string, attachments: Attachment[]) => {
    if (messageText.trim() || attachments.length > 0) {
      // Abort any existing request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      const newMessage: Message = {
        id: Date.now().toString(),
        text: messageText,
        isUser: true,
        timestamp: new Date(),
        attachments: attachments.length > 0 ? attachments : undefined
      };

      const aiResponseId = (Date.now() + 1).toString();
      
      setIsThinking(true);
      
      // Add user message and initial empty AI message together for immediate visibility
      setContentState(prev => ({
        ...prev,
        [activeTab]: [
          ...prev[activeTab], 
          newMessage,
          {
            id: aiResponseId,
            text: "",
            isUser: false,
            timestamp: new Date()
          }
        ]
      }));

        // If AI config is available, use real API
        if (apiConfig?.api_key && apiConfig?.endpoint_url) {
          try {
              if (isAutoMode) {
                // Mock a plan for demonstration of "thinking vs doing"
                const mockPlan: PlanStep[] = [
                  { id: '1', action: 'Scanning project structure...', status: 'pending' },
                  { id: '2', action: 'Analyzing requirements for automation...', status: 'pending' },
                  { id: '3', action: 'Creating temporary workspace...', status: 'pending' },
                  { id: '4', action: 'Executing secure commands via local agent...', status: 'pending' },
                  { id: '5', action: 'Finalizing and reporting results...', status: 'pending' }
                ];
                setCurrentPlan(mockPlan);
              } else {
                setCurrentPlan(null);
              }

              const cleanUrl = apiConfig.endpoint_url.trim().replace(/\/+$/, '');

            const url = cleanUrl.toLowerCase().includes('/chat/completions') 
              ? cleanUrl 
              : `${cleanUrl}/chat/completions`;
            
            const model = apiConfig.model?.trim() || "gpt-4o";
            
            const systemPrompt = [
              apiConfig.custom_instructions,
              apiConfig.personal_instructions ? `User's Personal Instructions:\n${apiConfig.personal_instructions}` : null
            ].filter(Boolean).join("\n\n");

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${apiConfig.api_key.trim()}`
                },
                  body: JSON.stringify({
                    model,
                          messages: [
                            ...(systemPrompt ? [{ role: "system", content: systemPrompt }] : []),
                            ...contentState[activeTab].slice(-10).map(m => ({
                              role: m.isUser ? "user" : "assistant",
                              content: m.text.substring(0, 4000)
                            })),
                            { role: "user", content: messageText.substring(0, 4000) }
                          ],
                      stream: true
                    }),
                  signal: abortControllerRef.current.signal
                });

              if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error?.message || `API error: ${response.status}`);
              }

              const reader = response.body?.getReader();
              const decoder = new TextDecoder();
              let aiText = "";
              let lastUpdate = Date.now();
              
              if (reader) {
                let buffer = "";
                while (true) {
                  const { done, value } = await reader.read();
                  if (done) break;

                  buffer += decoder.decode(value, { stream: true });
                  const lines = buffer.split("\n");
                  buffer = lines.pop() || "";
                  
                  let chunkText = "";
                  for (const line of lines) {
                    const trimmedLine = line.trim();
                    if (!trimmedLine || !trimmedLine.startsWith("data: ")) continue;
                    
                    const data = trimmedLine.slice(6);
                    if (data === "[DONE]") break;

                    try {
                      const json = JSON.parse(data);
                      const content = json.choices[0]?.delta?.content || "";
                      if (content) {
                        chunkText += content;
                      }
                    } catch (e) {}
                  }

                  if (chunkText) {
                    aiText += chunkText;
                    
                      // Throttled UI updates (every 50ms) to prevent excessive re-renders
                      const now = Date.now();
                      if (now - lastUpdate > 50) {
                        setContentState(prev => {
                          const activeMessages = prev[activeTab];
                          const lastIdx = activeMessages.length - 1;
                          if (lastIdx >= 0 && activeMessages[lastIdx].id === aiResponseId) {
                            const newMessages = [...activeMessages];
                            newMessages[lastIdx] = { ...newMessages[lastIdx], text: aiText };
                            return { ...prev, [activeTab]: newMessages };
                          }
                          return prev;
                        });
                        lastUpdate = now;
                      }
                    }
                  }
                  
                  // Final update to ensure all text is shown
                  setContentState(prev => {
                    const activeMessages = prev[activeTab];
                    const lastIdx = activeMessages.length - 1;
                    if (lastIdx >= 0 && activeMessages[lastIdx].id === aiResponseId) {
                      const newMessages = [...activeMessages];
                      newMessages[lastIdx] = { ...newMessages[lastIdx], text: aiText };
                      return { ...prev, [activeTab]: newMessages };
                    }
                    return prev;
                  });
              }
            } catch (error: any) {
              if (error.name === 'AbortError' || 
                  error.message?.toLowerCase().includes('aborted') || 
                  error.message?.includes('BodyStreamBuffer')) {
                console.log('Fetch aborted');
                return;
              }
              console.error("AI API Error:", error);
          toast.error(`AI Error: ${error.message}`);
          
          const errorResponse: Message = {
            id: (Date.now() + 1).toString(),
            text: `Error: ${error.message}. Please check your AI configuration in settings.`,
            isUser: false,
            timestamp: new Date()
          };
          
          setContentState(prev => ({
            ...prev,
            [activeTab]: [...prev[activeTab], errorResponse]
          }));
        } finally {
          setIsThinking(false);
          abortControllerRef.current = null;
        }
      } else {
        // Fallback to simulation if not configured
        aiTimeoutRef.current = setTimeout(() => {
          setIsThinking(false);
          aiTimeoutRef.current = null;
          const aiResponse: Message = {
            id: (Date.now() + 1).toString(),
            text: `(Simulation) AI response for ${activeTab}: ${messageText || 'Received your attachments'}`,
            isUser: false,
            timestamp: new Date()
          };

          setContentState(prev => ({
            ...prev,
            [activeTab]: [...prev[activeTab], aiResponse]
          }));
        }, 2000);
      }
    }
  };

  const handleCopy = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedMessageId(id);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopiedMessageId(null), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
      toast.error("Failed to copy text");
    }
  };

  const handleRegenerate = async (targetId?: string) => {
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
          const aiResponseId = (Date.now() + 1).toString();

          setIsThinking(true);
          
          // Abort any existing request
          if (abortControllerRef.current) {
            abortControllerRef.current.abort();
          }
          abortControllerRef.current = new AbortController();

          // Remove everything from the target message onwards and add initial empty AI message together
          setContentState(prev => ({
            ...prev,
            [activeTab]: [
              ...prev[activeTab].slice(0, lastUserIndex + 1),
              {
                id: aiResponseId,
                text: "",
                isUser: false,
                timestamp: new Date()
              }
            ]
          }));

          // If AI config is available, use real API
            if (apiConfig?.api_key && apiConfig?.endpoint_url) {
              try {
                  const cleanUrl = apiConfig.endpoint_url.trim().replace(/\/+$/, '');
                  const url = cleanUrl.toLowerCase().includes('/chat/completions') 
                    ? cleanUrl 
                    : `${cleanUrl}/chat/completions`;

                    const model = apiConfig.model?.trim() || "gpt-4o";

                    const systemPrompt = [
                      apiConfig.custom_instructions,
                      apiConfig.personal_instructions ? `User's Personal Instructions:\n${apiConfig.personal_instructions}` : null
                    ].filter(Boolean).join("\n\n");

                    const response = await fetch(url, {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                          'Authorization': `Bearer ${apiConfig.api_key.trim()}`
                        },
                            body: JSON.stringify({
                              model,
                              messages: [
                                ...(systemPrompt ? [{ role: "system", content: systemPrompt }] : []),
                                ...messages.slice(0, lastUserIndex).slice(-10).map(m => ({
                                  role: m.isUser ? "user" : "assistant",
                                  content: m.text.substring(0, 4000)
                                })),
                                { role: "user", content: lastUserMessage.text.substring(0, 4000) }
                              ],
                              stream: true
                            }),
                        signal: abortControllerRef.current.signal
                      });

              if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error?.message || `API error: ${response.status}`);
              }

              const reader = response.body?.getReader();
              const decoder = new TextDecoder();
              let aiText = "";
              let lastUpdate = Date.now();
              
              if (reader) {
                let buffer = "";
                while (true) {
                  const { done, value } = await reader.read();
                  if (done) break;

                  buffer += decoder.decode(value, { stream: true });
                  const lines = buffer.split("\n");
                  buffer = lines.pop() || "";
                  
                  let chunkText = "";
                  for (const line of lines) {
                    const trimmedLine = line.trim();
                    if (!trimmedLine || !trimmedLine.startsWith("data: ")) continue;
                    
                    const data = trimmedLine.slice(6);
                    if (data === "[DONE]") break;

                    try {
                      const json = JSON.parse(data);
                      const content = json.choices[0]?.delta?.content || "";
                      if (content) {
                        chunkText += content;
                      }
                    } catch (e) {}
                  }

                    if (chunkText) {
                      aiText += chunkText;
                      
                        const now = Date.now();
                        if (now - lastUpdate > 50) {
                        setContentState(prev => {
                          const activeMessages = prev[activeTab];
                          const lastIdx = activeMessages.length - 1;
                          if (lastIdx >= 0 && activeMessages[lastIdx].id === aiResponseId) {
                            const newMessages = [...activeMessages];
                            newMessages[lastIdx] = { ...newMessages[lastIdx], text: aiText };
                            return { ...prev, [activeTab]: newMessages };
                          }
                          return prev;
                        });
                        lastUpdate = now;
                      }
                    }
                  }
                  
                  setContentState(prev => {
                    const activeMessages = prev[activeTab];
                    const lastIdx = activeMessages.length - 1;
                    if (lastIdx >= 0 && activeMessages[lastIdx].id === aiResponseId) {
                      const newMessages = [...activeMessages];
                      newMessages[lastIdx] = { ...newMessages[lastIdx], text: aiText };
                      return { ...prev, [activeTab]: newMessages };
                    }
                    return prev;
                  });
                }

            } catch (error: any) {
              if (error.name === 'AbortError' || 
                  error.message?.toLowerCase().includes('aborted') || 
                  error.message?.includes('BodyStreamBuffer')) {
                console.log('Fetch aborted');
                return;
              }
              console.error("AI API Error:", error);
          toast.error(`AI Error: ${error.message}`);
          
          const errorResponse: Message = {
            id: (Date.now() + 1).toString(),
            text: `Error: ${error.message}. Please check your AI configuration in settings.`,
            isUser: false,
            timestamp: new Date()
          };
          
          setContentState(prev => ({
            ...prev,
            [activeTab]: [...prev[activeTab], errorResponse]
          }));
        } finally {
          setIsThinking(false);
          abortControllerRef.current = null;
        }
      } else {
        // Fallback to simulation if not configured
        aiTimeoutRef.current = setTimeout(() => {
          setIsThinking(false);
          aiTimeoutRef.current = null;
          const aiResponse: Message = {
            id: (Date.now() + 1).toString(),
            text: `(Simulation) AI response for ${activeTab}: ${lastUserMessage.text || 'Received your attachments'}`,
            isUser: false,
            timestamp: new Date()
          };

          setContentState(prev => ({
            ...prev,
            [activeTab]: [...prev[activeTab], aiResponse]
          }));
        }, 2000);
      }
    }
  };

  const getPlaceholder = () => {
    return '';
  };

  const currentMessages = contentState[activeTab];

  return (
    <div className="min-h-screen bg-background flex">
      <OnboardingModal onComplete={() => setShowOnboarding(false)} />
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
                {currentMessages.map((msg, index) => (
                  <ChatMessage 
                    key={msg.id}
                    msg={msg}
                    isThinking={isThinking}
                    isAutoMode={isAutoMode}
                    isLast={index === currentMessages.length - 1}
                    copiedMessageId={copiedMessageId}
                    handleCopy={handleCopy}
                    handleRegenerate={handleRegenerate}
                    currentPlan={currentPlan}
                    isExecutingAutomation={isExecutingAutomation}
                    setIsExecutingAutomation={setIsExecutingAutomation}
                  />
                ))}

              
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