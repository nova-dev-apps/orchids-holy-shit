import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Settings, X, LogOut, Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface UserSettingsPanelProps {
  isOpen: boolean;
  onToggle: () => void;
}

const UserSettingsPanel = ({ isOpen, onToggle }: UserSettingsPanelProps) => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  
  // Admin settings
  const [apiType, setApiType] = useState<string>("");
  const [apiKey, setApiKey] = useState("");
  const [selectedModel, setSelectedModel] = useState("");
  const [customModel, setCustomModel] = useState("");
  const [endpoint, setEndpoint] = useState("");
  const [openModelCombobox, setOpenModelCombobox] = useState(false);
  
  // PayPal settings
  const [paypalClientId, setPaypalClientId] = useState("");
  const [paypalSecretKey, setPaypalSecretKey] = useState("");
  
  // Subscription pricing settings
  const [subscriptionPrice, setSubscriptionPrice] = useState("");
  const [subscriptionCurrency, setSubscriptionCurrency] = useState("$");

  // AI API Editor settings
  const [apiEditorFeature, setApiEditorFeature] = useState<string>("chatbot");
  const [apiEditorKey, setApiEditorKey] = useState("");
  const [apiEditorEndpoint, setApiEditorEndpoint] = useState("");

  // Token settings
  const [selectedTokenFeature, setSelectedTokenFeature] = useState<string>("chatbot");
  const [maxTokensDay, setMaxTokensDay] = useState("10000");
  const [maxTokensMonth, setMaxTokensMonth] = useState("50000");
  
  // Client token balance
  const [dailyCredits, setDailyCredits] = useState(5000);
  const [monthlyCredits, setMonthlyCredits] = useState(50000);
  
  // User settings
  const [credentialType, setCredentialType] = useState<string>("");
  const [oldEmail, setOldEmail] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  // Date range for stats
  const [startDate, setStartDate] = useState("2025-11-22");
  const [endDate, setEndDate] = useState("2025-11-29");
  
  // User stats - dynamic data based on date range
  const userStats = [
    { time: "Mon", count: 800 },
    { time: "Tue", count: 950 },
    { time: "Wed", count: 1100 },
    { time: "Thu", count: 1247 },
    { time: "Fri", count: 1180 },
    { time: "Sat", count: 1050 },
    { time: "Sun", count: 1247 }
  ];
  
  const [onlineUsers] = useState(456);
  const [offlineUsers] = useState(791);

  // Check if user is admin
  useEffect(() => {
    const adminEmail = "abdisamadbashir14@gmail.com";
    const storedEmail = localStorage.getItem("userEmail");
    setIsAdmin(storedEmail === adminEmail);

    const storedDay = localStorage.getItem("maxTokensDay");
    const storedMonth = localStorage.getItem("maxTokensMonth");
    if (storedDay) {
      setMaxTokensDay(storedDay);
      setDailyCredits(parseInt(storedDay));
    }
    if (storedMonth) {
      setMaxTokensMonth(storedMonth);
      setMonthlyCredits(parseInt(storedMonth));
    }
  }, []);

  // Listen for token updates from admin
  useEffect(() => {
    const handleTokenUpdate = () => {
      const storedDay = localStorage.getItem("maxTokensDay");
      const storedMonth = localStorage.getItem("maxTokensMonth");
      if (storedDay) {
        setMaxTokensDay(storedDay);
        setDailyCredits(parseInt(storedDay));
      }
      if (storedMonth) {
        setMaxTokensMonth(storedMonth);
        setMonthlyCredits(parseInt(storedMonth));
      }
    };

    window.addEventListener('token-update', handleTokenUpdate);
    return () => window.removeEventListener('token-update', handleTokenUpdate);
  }, []);

  // Comprehensive models list by API type
  const popularModels = {
    chat: [
      // OpenAI GPT Models
      "openai/gpt-5",
      "openai/gpt-5-mini",
      "openai/gpt-5-nano",
      "openai/gpt-4o",
      "openai/gpt-4o-mini",
      "openai/gpt-4-turbo",
      "openai/gpt-4",
      "openai/gpt-3.5-turbo",
      "openai/gpt-3.5-turbo-16k",
      // Google Gemini Models
      "google/gemini-2.5-pro",
      "google/gemini-2.5-flash",
      "google/gemini-2.5-flash-lite",
      "google/gemini-2.0-flash-exp",
      "google/gemini-1.5-pro",
      "google/gemini-1.5-pro-002",
      "google/gemini-1.5-flash",
      "google/gemini-1.5-flash-002",
      "google/gemini-1.5-flash-8b",
      "google/gemini-1.0-pro",
      // Anthropic Claude Models
      "anthropic/claude-sonnet-4-5",
      "anthropic/claude-opus-4-1-20250805",
      "anthropic/claude-sonnet-4-20250514",
      "anthropic/claude-3-7-sonnet-20250219",
      "anthropic/claude-3-5-sonnet-20241022",
      "anthropic/claude-3-5-haiku-20241022",
      "anthropic/claude-3-opus-20240229",
      "anthropic/claude-3-sonnet-20240229",
      "anthropic/claude-3-haiku-20240307",
      // Meta Llama Models
      "meta/llama-3.3-70b",
      "meta/llama-3.2-90b",
      "meta/llama-3.2-11b",
      "meta/llama-3.2-3b",
      "meta/llama-3.2-1b",
      "meta/llama-3.1-405b",
      "meta/llama-3.1-70b",
      "meta/llama-3.1-8b",
      // Mistral Models
      "mistral/mistral-large-latest",
      "mistral/mistral-medium-latest",
      "mistral/mistral-small-latest",
      "mistral/pixtral-12b-2409",
      "mistral/codestral-latest",
      // Cohere Models
      "cohere/command-r-plus",
      "cohere/command-r",
      "cohere/command",
      "cohere/command-light",
      // Perplexity Models
      "perplexity/llama-3.1-sonar-large-128k-online",
      "perplexity/llama-3.1-sonar-small-128k-online",
      // DeepSeek Models
      "deepseek/deepseek-chat",
      "deepseek/deepseek-coder"
    ]
  };

  // Auto-fill endpoint based on model/provider
  const getEndpointForModel = (model: string) => {
    if (model.startsWith("openai/")) {
      return "https://api.openai.com/v1";
    } else if (model.startsWith("google/")) {
      return "https://generativelanguage.googleapis.com/v1beta";
    } else if (model.startsWith("anthropic/")) {
      return "https://api.anthropic.com/v1";
    } else if (model.startsWith("meta/")) {
      return "https://api.together.xyz/v1";
    } else if (model.startsWith("mistral/")) {
      return "https://api.mistral.ai/v1";
    } else if (model.startsWith("cohere/")) {
      return "https://api.cohere.ai/v1";
    } else if (model.startsWith("perplexity/")) {
      return "https://api.perplexity.ai";
    } else if (model.startsWith("deepseek/")) {
      return "https://api.deepseek.com/v1";
    } else if (model.startsWith("stability/")) {
      return "https://api.stability.ai/v1";
    } else if (model.startsWith("black-forest-labs/")) {
      return "https://api.bfl.ml/v1";
    } else if (model.startsWith("ideogram/")) {
      return "https://api.ideogram.ai/v1";
    } else if (model.startsWith("recraft/")) {
      return "https://api.recraft.ai/v1";
    } else if (model.startsWith("runway/")) {
      return "https://api.runwayml.com/v1";
    } else if (model.startsWith("pika/")) {
      return "https://api.pika.art/v1";
    } else if (model.startsWith("luma/")) {
      return "https://api.lumalabs.ai/v1";
    } else if (model.startsWith("kling/")) {
      return "https://api.klingai.com/v1";
    } else if (model.startsWith("haiper/")) {
      return "https://api.haiper.ai/v1";
    } else if (model.startsWith("elevenlabs/")) {
      return "https://api.elevenlabs.io/v1";
    } else if (model.startsWith("playht/")) {
      return "https://api.play.ht/v1";
    } else if (model.startsWith("azure/")) {
      return "https://api.azure.com/cognitiveservices/v1";
    } else if (model.startsWith("aws/")) {
      return "https://polly.amazonaws.com";
    } else if (model.startsWith("midjourney/")) {
      return "https://api.midjourney.com/v1";
    }
    return "";
  };

  // Update endpoint when model changes
  useEffect(() => {
    const model = customModel || selectedModel;
    if (model) {
      const autoEndpoint = getEndpointForModel(model);
      setEndpoint(autoEndpoint);
    }
  }, [selectedModel, customModel]);

  const handleSaveApiSettings = () => {
    const finalModel = customModel || selectedModel;
    console.log("Saving API settings:", {
      apiType,
      apiKey,
      model: finalModel,
      endpoint
    });
  };

  const handleSaveApiEditor = () => {
    console.log("Saving AI API editor settings:", {
      feature: apiEditorFeature,
      key: apiEditorKey ? "***" : "",
      endpoint: apiEditorEndpoint
    });
  };

  const handleSavePayPal = () => {
    console.log("Saving PayPal settings:", { 
      clientId: paypalClientId, 
      secretKey: paypalSecretKey ? "***" : "" 
    });
  };
  
  const handleSavePrice = () => {
    localStorage.setItem("subscriptionPrice", subscriptionPrice);
    localStorage.setItem("subscriptionCurrency", subscriptionCurrency);
    console.log("Saving subscription price:", { price: subscriptionPrice, currency: subscriptionCurrency });
    // Dispatch event for immediate update
    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new Event('price-update'));
  };

  const handleSaveTokenLimits = () => {
    localStorage.setItem("maxTokensDay", maxTokensDay);
    localStorage.setItem("maxTokensMonth", maxTokensMonth);
    console.log("Saving token limits:", { maxTokensDay, maxTokensMonth });
    // Dispatch event for immediate update across platform
    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new Event('token-update'));
  };

  const handleSaveSettings = () => {
    console.log("Saving settings:", {
      credentialType,
      oldEmail,
      newEmail,
      oldPassword: oldPassword ? "***" : "",
      newPassword: newPassword ? "***" : ""
    });
  };

  const handleLogout = () => {
    localStorage.removeItem("userEmail");
    localStorage.removeItem("isAdmin");
    setShowLogoutDialog(false);
    window.location.href = "/";
  };

  return (
    <>
      {/* Settings Toggle Button */}
      <Button
        onClick={onToggle}
        variant="ghost"
        size="icon"
        className={`fixed top-4 left-4 z-50 transition-all duration-300 ${isOpen ? 'rotate-90 scale-110' : 'hover:scale-105'}`}
      >
        <Settings className={`h-5 w-5 transition-transform duration-300 ${isOpen ? 'rotate-45' : ''}`} />
      </Button>

      {/* Settings Panel Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-40 flex">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/50" 
            onClick={onToggle}
          />
          
          {/* Settings Panel */}
          <div className={`fixed left-0 top-0 h-full w-80 bg-background border-r border-border shadow-xl overflow-y-auto z-50 transform transition-transform duration-300 ease-out ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-foreground">
                  {isAdmin ? "Administrator Settings" : "User Settings"}
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

              <div className="space-y-4">
                {isAdmin ? (
                  <>
                    {/* Statistics */}
                    <div className="bg-muted/50 p-3 rounded-lg">
                      <h3 className="text-sm font-medium text-foreground mb-2">User Statistics</h3>
                      
                      {/* Date range selector */}
                      <div className="space-y-2 mb-3">
                        <div>
                          <Label className="text-xs font-medium text-foreground mb-1 block">From Date</Label>
                          <Input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="border-border focus:border-nova-pink text-xs"
                          />
                        </div>
                        <div>
                          <Label className="text-xs font-medium text-foreground mb-1 block">To Date</Label>
                          <Input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="border-border focus:border-nova-pink text-xs"
                          />
                        </div>
                      </div>
                      
                      <div className="mb-3">
                        <ResponsiveContainer width="100%" height={180}>
                          <LineChart data={userStats}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis dataKey="time" tick={{ fontSize: 12 }} stroke="#6b7280" />
                            <YAxis tick={{ fontSize: 12 }} stroke="#6b7280" />
                            <Tooltip 
                              contentStyle={{ 
                                backgroundColor: '#f3f4f6', 
                                border: '1px solid #d1d5db',
                                borderRadius: '6px'
                              }}
                              formatter={(value) => [value, 'Users']}
                            />
                            <Line 
                              type="monotone" 
                              dataKey="count" 
                              stroke="#FF006E" 
                              strokeWidth={2}
                              dot={{ fill: '#FF006E', r: 4 }}
                              activeDot={{ r: 6 }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="space-y-2 pt-3 border-t border-border">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-green-500" />
                            <span className="text-sm text-foreground">Online</span>
                          </div>
                          <span className="text-sm font-medium text-foreground">{onlineUsers}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-gray-400" />
                            <span className="text-sm text-foreground">Offline</span>
                          </div>
                          <span className="text-sm font-medium text-foreground">{offlineUsers}</span>
                        </div>
                      </div>
                    </div>

                    {/* AI API Editor */}
                    <div className="space-y-3">
                      <h3 className="text-sm font-medium text-foreground">AI API Editor</h3>
                      <div className="space-y-3">
                        <div>
                          <Label className="text-sm font-medium text-foreground mb-1 block">
                            Select Feature
                          </Label>
                          <Select value={apiEditorFeature} onValueChange={setApiEditorFeature}>
                            <SelectTrigger className="border-border focus:border-nova-pink bg-background">
                              <SelectValue placeholder="Choose feature..." />
                            </SelectTrigger>
                            <SelectContent className="bg-background border-border z-[100]">
                              <SelectItem value="chatbot">Chatbot</SelectItem>
                              <SelectItem value="automation">Automation</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label htmlFor="ai-api-key" className="text-sm font-medium text-foreground mb-1 block">
                            API Key
                          </Label>
                          <Input
                            id="ai-api-key"
                            type="password"
                            placeholder="Enter API key..."
                            value={apiEditorKey}
                            onChange={(e) => setApiEditorKey(e.target.value)}
                            className="border-border focus:border-nova-pink"
                          />
                        </div>

                        <div>
                          <Label htmlFor="ai-api-endpoint" className="text-sm font-medium text-foreground mb-1 block">
                            API Endpoint
                          </Label>
                          <Input
                            id="ai-api-endpoint"
                            type="text"
                            placeholder="Enter API endpoint URL..."
                            value={apiEditorEndpoint}
                            onChange={(e) => setApiEditorEndpoint(e.target.value)}
                            className="border-border focus:border-nova-pink"
                          />
                        </div>

                        <Button
                          onClick={handleSaveApiEditor}
                          className="w-full bg-nova-pink hover:bg-nova-pink/90"
                        >
                          Save API Configuration
                        </Button>
                      </div>
                    </div>

                    {/* Token Limit Editor */}
                    <div className="space-y-3">
                      <h3 className="text-sm font-medium text-foreground">Token Limits</h3>
                      <div className="grid grid-cols-1 gap-3">
                        <div>
                          <Label className="text-sm font-medium text-foreground mb-1 block">
                            Select Feature to Tokenize
                          </Label>
                          <Select value={selectedTokenFeature} onValueChange={setSelectedTokenFeature}>
                            <SelectTrigger className="border-border focus:border-nova-pink bg-background">
                              <SelectValue placeholder="Choose feature..." />
                            </SelectTrigger>
                            <SelectContent className="bg-background border-border z-[100]">
                              <SelectItem value="chatbot">Chatbot</SelectItem>
                              <SelectItem value="automation">Automation</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-foreground mb-1 block">Max Tokens per Day</Label>
                          <Input 
                            type="number" 
                            value={maxTokensDay} 
                            onChange={(e) => setMaxTokensDay(e.target.value)}
                            className="border-border focus:border-nova-pink"
                          />
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-foreground mb-1 block">Max Tokens per Month</Label>
                          <Input 
                            type="number" 
                            value={maxTokensMonth} 
                            onChange={(e) => setMaxTokensMonth(e.target.value)}
                            className="border-border focus:border-nova-pink"
                          />
                        </div>
                        <Button onClick={handleSaveTokenLimits} className="w-full bg-nova-pink hover:bg-nova-pink/90">
                          Save Token Limits
                        </Button>
                      </div>
                    </div>


                    {/* PayPal API Management */}
                    <div className="space-y-3">
                      <h3 className="text-sm font-medium text-foreground">PayPal API Management</h3>

                      <div>
                        <Label htmlFor="paypal-client-id" className="text-sm font-medium text-foreground mb-1 block">
                          Client ID
                        </Label>
                        <Input
                          id="paypal-client-id"
                          type="text"
                          placeholder="Enter PayPal Client ID"
                          value={paypalClientId}
                          onChange={(e) => setPaypalClientId(e.target.value)}
                          className="border-border focus:border-nova-pink"
                        />
                      </div>

                      <div>
                        <Label htmlFor="paypal-secret-key" className="text-sm font-medium text-foreground mb-1 block">
                          Secret Key
                        </Label>
                        <Input
                          id="paypal-secret-key"
                          type="password"
                          placeholder="Enter PayPal Secret Key"
                          value={paypalSecretKey}
                          onChange={(e) => setPaypalSecretKey(e.target.value)}
                          className="border-border focus:border-nova-pink"
                        />
                      </div>

                      <Button 
                        onClick={handleSavePayPal} 
                        className="w-full bg-nova-pink hover:bg-nova-pink/90"
                      >
                        Save PayPal Settings
                      </Button>
                    </div>

                    {/* Subscription Pricing */}
                    <div className="space-y-3">
                      <h3 className="text-sm font-medium text-foreground">Subscription Pricing</h3>

                      <div className="grid grid-cols-3 gap-2">
                        <div className="col-span-1">
                          <Label htmlFor="subscription-currency" className="text-sm font-medium text-foreground mb-1 block">
                            Currency
                          </Label>
                          <Input
                            id="subscription-currency"
                            type="text"
                            placeholder="$"
                            value={subscriptionCurrency}
                            onChange={(e) => setSubscriptionCurrency(e.target.value)}
                            className="border-border focus:border-nova-pink"
                          />
                        </div>

                        <div className="col-span-2">
                          <Label htmlFor="subscription-price" className="text-sm font-medium text-foreground mb-1 block">
                            Price
                          </Label>
                          <Input
                            id="subscription-price"
                            type="number"
                            step="0.01"
                            placeholder="20.99"
                            value={subscriptionPrice}
                            onChange={(e) => setSubscriptionPrice(e.target.value)}
                            className="border-border focus:border-nova-pink"
                          />
                        </div>
                      </div>

                      <Button 
                        onClick={handleSavePrice} 
                        className="w-full bg-nova-pink hover:bg-nova-pink/90"
                      >
                        Save Price
                      </Button>
                    </div>

                    {/* Email Display */}
                    <div className="bg-muted/50 p-3 rounded-lg space-y-2">
                      <Label className="text-sm font-medium text-foreground">Email Address</Label>
                      <p className="text-sm text-foreground break-all">{localStorage.getItem("userEmail") || "Not set"}</p>
                    </div>

                    {/* Logout */}
                    <div className="pt-3 border-t border-border">
                      <Button
                        onClick={() => setShowLogoutDialog(true)}
                        variant="destructive"
                        className="w-full flex items-center gap-2"
                      >
                        <LogOut className="h-4 w-4" />
                        Log Out
                      </Button>
                    </div>

                    {/* Admin Footer */}
                    <div className="mt-4 pt-4 border-t border-border">
                      <p className="text-xs text-foreground leading-relaxed">
                        Nova is owned and operated by Abdisamad, 15 years old. By using Nova, you agree to follow its rules, respect its services, and understand that all rights to the platform belong to Abdisamad.
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Subscription Info */}
                    <div className="bg-muted/50 p-3 rounded-lg">
                      <h3 className="text-sm font-medium text-foreground mb-1">Subscription Status</h3>
                      <p className="text-lg font-semibold text-nova-pink">30 days</p>
                      <p className="text-xs text-muted-foreground">until subscription ends</p>
                    </div>

                    {/* Token Balance */}
                    <div className="bg-muted/50 p-3 rounded-lg">
                      <h3 className="text-sm font-medium text-foreground mb-3">Token Balance</h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-2 bg-background rounded border border-border">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-nova-pink" />
                            <div>
                              <p className="text-xs text-gray-500">Daily Credits</p>
                              <p className="text-sm font-semibold text-foreground">{dailyCredits.toLocaleString()}</p>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between p-2 bg-background rounded border border-border">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-nova-coral" />
                            <div>
                              <p className="text-xs text-gray-500">Monthly Credits</p>
                              <p className="text-sm font-semibold text-foreground">{monthlyCredits.toLocaleString()}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Email Display */}
                    <div className="bg-muted/50 p-3 rounded-lg space-y-2">
                      <Label className="text-sm font-medium text-foreground">Email Address</Label>
                      <p className="text-sm text-foreground break-all">{localStorage.getItem("userEmail") || "Not set"}</p>
                    </div>

                    {/* Logout Section */}
                    <div className="pt-3 border-t border-border">
                      <Button
                        onClick={() => setShowLogoutDialog(true)}
                        variant="destructive"
                        className="w-full flex items-center gap-2"
                      >
                        <LogOut className="h-4 w-4" />
                        Log Out
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Logout Confirmation Dialog */}
      <Dialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Logout</DialogTitle>
            <DialogDescription>
              Are you sure you want to log out? You will need to sign in again to access your account.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowLogoutDialog(false)}
            >
              No
            </Button>
            <Button
              variant="destructive"
              onClick={handleLogout}
            >
              Yes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default UserSettingsPanel;
