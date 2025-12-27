import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Menu, X, ShieldAlert } from "lucide-react";
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

const AISettingsPanel = ({ 
  isOpen, 
  onToggle, 
  isAdmin: propIsAdmin 
}: AISettingsPanelProps) => {
  const isAdmin = propIsAdmin || localStorage.getItem("isAdmin") === "true";
  console.log("AISettingsPanel: isAdmin =", isAdmin, "propIsAdmin =", propIsAdmin);
  
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
    if (isAdmin && isOpen) {
      const loadCustomInstructions = async () => {
        try {
          const { data, error } = await supabase
            .from('ai_config')
            .select('custom_instructions')
            .eq('id', 'global')
            .maybeSingle();
          
          if (error) throw error;
          if (data?.custom_instructions) {
            setChatSettings(prev => ({ ...prev, customInstructions: data.custom_instructions }));
          }
        } catch (err) {
          console.error("Error loading instructions:", err);
        }
      };
      loadCustomInstructions();
    }
  }, [isAdmin, isOpen]);

  const handleSaveTokenLimits = () => {
    localStorage.setItem('tokenLimits', JSON.stringify(tokenLimits));
    toast.success("Token limits saved");
  };

  const handleSaveChatSettings = async () => {
    if (!isAdmin) return;
    
    try {
      const { error } = await supabase
        .from('ai_config')
        .update({ custom_instructions: chatSettings.customInstructions })
        .eq('id', 'global');
      
      if (error) throw error;
      
      toast.success("Custom instructions saved");
      window.dispatchEvent(new CustomEvent('ai-config-update'));
    } catch (error: any) {
      toast.error(`Failed to save: ${error.message}`);
    }
  };

  const renderAdminSettings = () => (
    <div className="space-y-8">
      <section>
        <Label htmlFor="instructions" className="text-sm font-semibold text-foreground mb-3 block">
          Global Custom Instructions
        </Label>
        <Textarea
          id="instructions"
          placeholder="Write specific guidance for the AI (tone, style, context)..."
          value={chatSettings.customInstructions}
          onChange={(e) => setChatSettings(prev => ({ ...prev, customInstructions: e.target.value }))}
          className="min-h-[150px] resize-none border-border focus:ring-1 focus:ring-nova-pink bg-background/50"
        />
        <p className="text-[11px] text-muted-foreground mt-2 leading-relaxed italic">
          These instructions control the AI behavior silently across the entire platform. Users will not see these settings.
        </p>
        <Button 
          onClick={handleSaveChatSettings} 
          className="mt-4 w-full bg-nova-pink hover:bg-nova-pink/90 text-white font-medium shadow-sm transition-all"
        >
          Save Global Instructions
        </Button>
      </section>

      <div className="border-t border-border pt-6">
        <h3 className="text-sm font-semibold text-foreground mb-4">Token Management</h3>
        <div className="space-y-4">
          <div>
            <Label htmlFor="chatPerDay" className="text-xs font-medium text-muted-foreground mb-1.5 block">
              Daily Chat Tokens
            </Label>
            <Input
              id="chatPerDay"
              type="number"
              value={tokenLimits.chatTokensPerDay}
              onChange={(e) => setTokenLimits(prev => ({ ...prev, chatTokensPerDay: parseInt(e.target.value) || 0 }))}
              className="h-9 bg-background/50 border-border"
            />
          </div>
          <div>
            <Label htmlFor="chatPerSession" className="text-xs font-medium text-muted-foreground mb-1.5 block">
              Tokens Per Session
            </Label>
            <Input
              id="chatPerSession"
              type="number"
              value={tokenLimits.chatTokensPerSession}
              onChange={(e) => setTokenLimits(prev => ({ ...prev, chatTokensPerSession: parseInt(e.target.value) || 0 }))}
              className="h-9 bg-background/50 border-border"
            />
          </div>
          <Button 
            onClick={handleSaveTokenLimits} 
            variant="outline"
            className="w-full text-xs font-medium"
          >
            Save Token Limits
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <Button
        onClick={onToggle}
        variant="ghost"
        size="icon"
        className={`fixed top-4 right-4 z-50 transition-all duration-300 ${isOpen ? 'rotate-90' : ''}`}
      >
        <Menu className="h-5 w-5" />
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-40 flex justify-end">
          <div 
            className="fixed inset-0 bg-black/20 backdrop-blur-[2px]" 
            onClick={onToggle}
          />
          
          <div className="relative h-full w-80 bg-background border-l border-border shadow-2xl overflow-y-auto z-50 flex flex-col">
            <div className="p-5 border-b border-border flex items-center justify-between bg-background sticky top-0 z-10">
              <h2 className="text-lg font-bold text-foreground">
                AI Settings
              </h2>
              <Button
                onClick={onToggle}
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="p-6 flex-1">
              {isAdmin ? (
                renderAdminSettings()
              ) : (
                <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
                  <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-6">
                    <ShieldAlert className="h-8 w-8 text-red-500" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-2">Admin Access Only</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    You do not have permission to modify global AI configurations. 
                    Please contact an administrator if you believe this is an error.
                  </p>
                </div>
              )}
            </div>
            
            <div className="p-4 border-t border-border bg-muted/30">
              <p className="text-[10px] text-center text-muted-foreground uppercase tracking-wider font-semibold">
                Platform Configuration v2.0
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AISettingsPanel;
