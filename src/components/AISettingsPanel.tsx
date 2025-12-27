import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Menu, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

type ContentType = 'chat';

interface AISettingsPanelProps {
  activeTab: ContentType;
  isOpen: boolean;
  onToggle: () => void;
  strictMode: boolean;
  onToggleStrictMode: () => void;
  isAdmin?: boolean;
}

export interface ChatSettings {
  customInstructions: string;
}

interface TokenLimits {
  chatTokensPerDay: number;
  automationTokensPerDay: number;
  chatTokensPerSession: number;
}

const AISettingsPanel = ({ activeTab, isOpen, onToggle, strictMode, onToggleStrictMode, isAdmin }: AISettingsPanelProps) => {
  const [chatSettings, setChatSettings] = useState<ChatSettings>({
    customInstructions: ""
  });

  const [tokenLimits, setTokenLimits] = useState<TokenLimits>({
    chatTokensPerDay: 10000,
    automationTokensPerDay: 5000,
    chatTokensPerSession: 2000
  });

  useEffect(() => {
    const savedTokens = localStorage.getItem('tokenLimits');
    if (savedTokens) {
      setTokenLimits(JSON.parse(savedTokens));
    }
  }, []);

  useEffect(() => {
    if (isAdmin) {
      const loadCustomInstructions = async () => {
        const { data } = await supabase
          .from('ai_config')
          .select('custom_instructions')
          .eq('id', 'global')
          .single();
        
        if (data?.custom_instructions) {
          setChatSettings(prev => ({ ...prev, customInstructions: data.custom_instructions }));
        }
      };
      loadCustomInstructions();
    }
  }, [isAdmin]);

  const handleSaveTokenLimits = () => {
    localStorage.setItem('tokenLimits', JSON.stringify(tokenLimits));
    toast.success("Token limits saved");
  };

  const handleSaveChatSettings = async () => {
    if (isAdmin) {
      const { error } = await supabase
        .from('ai_config')
        .update({ custom_instructions: chatSettings.customInstructions })
        .eq('id', 'global');
      
      if (error) {
        toast.error("Failed to save instructions");
      } else {
        toast.success("Custom instructions saved");
        window.dispatchEvent(new CustomEvent('ai-config-update'));
      }
    }
  };

  const renderChatSettings = () => (
    <div className="space-y-6">
      {isAdmin && (
        <div>
          <Label htmlFor="instructions" className="text-sm font-medium text-foreground mb-1 block">
            Custom Instructions
          </Label>
          <Textarea
            id="instructions"
            placeholder="Write specific guidance for the AI (tone, style, context)..."
            value={chatSettings.customInstructions}
            onChange={(e) => setChatSettings(prev => ({ ...prev, customInstructions: e.target.value }))}
            className="min-h-[100px] resize-none border-border focus:border-nova-pink"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Controls AI behavior silently across the platform. Users will not see these instructions.
          </p>
          <Button 
            onClick={handleSaveChatSettings} 
            className="mt-2 w-full bg-nova-pink hover:bg-nova-pink/90 text-white"
          >
            Save Instructions
          </Button>
        </div>
      )}

      {isAdmin && (
        <div className="border-t border-border pt-6">
          <h3 className="text-sm font-semibold text-foreground mb-4">Chat Token Limits</h3>
          <div className="space-y-4">
            <div>
              <Label htmlFor="chatPerDay" className="text-xs font-medium text-foreground mb-1 block">
                Tokens Per Day
              </Label>
              <Input
                id="chatPerDay"
                type="number"
                value={tokenLimits.chatTokensPerDay}
                onChange={(e) => setTokenLimits(prev => ({ ...prev, chatTokensPerDay: parseInt(e.target.value) || 0 }))}
                className="h-9 border-border focus:border-nova-pink"
              />
            </div>
            <div>
              <Label htmlFor="chatPerSession" className="text-xs font-medium text-foreground mb-1 block">
                Tokens Per Session
              </Label>
              <Input
                id="chatPerSession"
                type="number"
                value={tokenLimits.chatTokensPerSession}
                onChange={(e) => setTokenLimits(prev => ({ ...prev, chatTokensPerSession: parseInt(e.target.value) || 0 }))}
                className="h-9 border-border focus:border-nova-pink"
              />
            </div>
            <Button 
              onClick={handleSaveTokenLimits} 
              className="w-full bg-nova-pink hover:bg-nova-pink/90 text-white text-xs"
            >
              Save Chat Tokens
            </Button>
          </div>
        </div>
      )}
    </div>
  );

  const renderAutomationSettings = () => (
    isAdmin && (
      <div className="space-y-6">
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-4">Automation Token Limits</h3>
          <div className="space-y-4">
            <div>
              <Label htmlFor="autoPerDay" className="text-xs font-medium text-foreground mb-1 block">
                Tokens Per Day
              </Label>
              <Input
                id="autoPerDay"
                type="number"
                value={tokenLimits.automationTokensPerDay}
                onChange={(e) => setTokenLimits(prev => ({ ...prev, automationTokensPerDay: parseInt(e.target.value) || 0 }))}
                className="h-9 border-border focus:border-nova-pink"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Uses the same session limits as chat (per session limit is shared).
              </p>
            </div>
            <Button 
              onClick={handleSaveTokenLimits} 
              className="w-full bg-nova-pink hover:bg-nova-pink/90 text-white text-xs"
            >
              Save Automation Tokens
            </Button>
          </div>
        </div>
      </div>
    )
  );

  return (
    <>
      <Button
        onClick={onToggle}
        variant="ghost"
        size="icon"
        className={`fixed top-4 right-4 z-50 transition-all duration-300 ${isOpen ? 'rotate-90 scale-110' : 'hover:scale-105'}`}
      >
        <Menu className={`h-5 w-5 transition-transform duration-300 ${isOpen ? 'rotate-45' : ''}`} />
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-40 flex">
          <div 
            className="fixed inset-0 bg-black/50" 
            onClick={onToggle}
          />
          
          <div className={`fixed right-0 top-0 h-full w-80 bg-background border-l border-border shadow-xl overflow-y-auto z-50 transform transition-transform duration-300 ease-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-foreground">
                  Chatbot Settings
                </h2>
                <Button
                  onClick={onToggle}
                  variant="ghost"
                  size="icon"
                  className="hover:bg-accent"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-8">
                {renderChatSettings()}
                {renderAutomationSettings()}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AISettingsPanel;

