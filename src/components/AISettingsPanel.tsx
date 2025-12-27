import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
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
  personalInstructions: string;
}

const AISettingsPanel = ({ 
  isOpen, 
  onToggle, 
  isAdmin: propIsAdmin 
}: AISettingsPanelProps) => {
  const isAdmin = propIsAdmin || localStorage.getItem("isAdmin") === "true";
  
  const [chatSettings, setChatSettings] = useState<ChatSettings>({
    customInstructions: "",
    personalInstructions: ""
  });

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const loadSettings = async () => {
        setIsLoading(true);
        try {
          const { data: { user } } = await supabase.auth.getUser();
          
          // Load Global Instructions (Admin Only)
          if (isAdmin) {
            const { data: globalData } = await supabase
              .from('ai_config')
              .select('custom_instructions')
              .eq('id', 'global')
              .maybeSingle();
            
            if (globalData?.custom_instructions) {
              setChatSettings(prev => ({ ...prev, customInstructions: globalData.custom_instructions }));
            }
          }

          // Load Personal Instructions
          if (user) {
            const { data: userData } = await supabase
              .from('ai_config')
              .select('custom_instructions')
              .eq('id', user.id)
              .maybeSingle();
            
            if (userData?.custom_instructions) {
              setChatSettings(prev => ({ ...prev, personalInstructions: userData.custom_instructions }));
            }
          }
        } catch (err) {
          console.error("Error loading settings:", err);
        } finally {
          setIsLoading(false);
        }
      };
      loadSettings();
    }
  }, [isAdmin, isOpen]);

  const handleSaveGlobalSettings = async () => {
    if (!isAdmin) return;
    
    try {
      const { error } = await supabase
        .from('ai_config')
        .upsert({ 
          id: 'global',
          custom_instructions: chatSettings.customInstructions,
          updated_at: new Date().toISOString()
        });
      
      if (error) throw error;
      
      toast.success("Global instructions saved");
      window.dispatchEvent(new CustomEvent('ai-config-update'));
    } catch (error: any) {
      toast.error(`Failed to save: ${error.message}`);
    }
  };

  const handleSavePersonalSettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from('ai_config')
        .upsert({ 
          id: user.id,
          custom_instructions: chatSettings.personalInstructions,
          updated_at: new Date().toISOString()
        });
      
      if (error) throw error;
      
      toast.success("Personal instructions saved");
      window.dispatchEvent(new CustomEvent('ai-config-update'));
    } catch (error: any) {
      toast.error(`Failed to save: ${error.message}`);
    }
  };

  const renderAdminSettings = () => (
    <section className="mb-8 pb-8 border-b border-border">
      <Label htmlFor="global-instructions" className="text-sm font-semibold text-foreground mb-3 block flex items-center gap-2">
        <ShieldAlert className="h-4 w-4 text-nova-pink" />
        Global Custom Instructions (Admin)
      </Label>
      <Textarea
        id="global-instructions"
        placeholder="Write specific guidance for the AI behavior across the entire platform..."
        value={chatSettings.customInstructions}
        onChange={(e) => setChatSettings(prev => ({ ...prev, customInstructions: e.target.value }))}
        className="min-h-[120px] resize-none border-border focus:ring-1 focus:ring-nova-pink bg-background/50 text-sm"
      />
      <p className="text-[11px] text-muted-foreground mt-2 leading-relaxed italic">
        These instructions control the AI behavior silently across the entire platform. Users will not see these settings.
      </p>
      <Button 
        onClick={handleSaveGlobalSettings} 
        className="mt-4 w-full bg-nova-pink hover:bg-nova-pink/90 text-white font-medium shadow-sm transition-all h-9"
      >
        Save Global Instructions
      </Button>
    </section>
  );

  const renderUserSettings = () => (
    <section>
      <Label htmlFor="personal-instructions" className="text-sm font-semibold text-foreground mb-3 block">
        Personal AI Instructions
      </Label>
      <Textarea
        id="personal-instructions"
        placeholder="How do you want the AI to behave for YOU? (e.g. 'Always answer in bullet points', 'Keep it professional')..."
        value={chatSettings.personalInstructions}
        onChange={(e) => setChatSettings(prev => ({ ...prev, personalInstructions: e.target.value }))}
        className="min-h-[150px] resize-none border-border focus:ring-1 focus:ring-nova-pink bg-background/50 text-sm"
      />
      <p className="text-[11px] text-muted-foreground mt-2 leading-relaxed italic">
        Your personal instructions are combined with the platform global rules to customize your AI experience.
      </p>
      <Button 
        onClick={handleSavePersonalSettings} 
        variant="outline"
        className="mt-4 w-full border-border hover:bg-muted font-medium transition-all h-9"
      >
        Save Personal Instructions
      </Button>
    </section>
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
                AI Customization
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
              {isLoading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-nova-pink"></div>
                </div>
              ) : (
                <>
                  {isAdmin && renderAdminSettings()}
                  {renderUserSettings()}
                </>
              )}
            </div>
            
            <div className="p-4 border-t border-border bg-muted/30">
              <p className="text-[10px] text-center text-muted-foreground uppercase tracking-wider font-semibold">
                Intelligence Engine v2.0
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AISettingsPanel;
