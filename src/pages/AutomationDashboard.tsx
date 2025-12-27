import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { 
  Play, 
  Square, 
  History, 
  Settings, 
  Sparkles, 
  ChevronLeft,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Trash2
} from "lucide-react";
import { Link } from "react-router-dom";
import { NovaLogoSvg } from "@/components/NovaLogoSvg";
import { TaskChecklist } from "@/components/TaskChecklist";
import { AgentStatusCard } from "@/components/AgentStatusCard";
import { WelcomeOnboarding } from "@/components/WelcomeOnboarding";
import { useAutomation, AutomationPlan, AutomationTask } from "@/lib/automation";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const samplePlans: Omit<AutomationPlan, 'id' | 'createdAt'>[] = [
  {
    title: "Organize Project Files",
    description: "Scan and organize files in the project directory",
    status: 'ready',
    tasks: [
      { id: '1', action: 'Scanning project structure', status: 'pending' },
      { id: '2', action: 'Identifying file types', status: 'pending' },
      { id: '3', action: 'Creating folder structure', status: 'pending' },
      { id: '4', action: 'Moving files to categories', status: 'pending' },
      { id: '5', action: 'Generating summary report', status: 'pending' },
    ],
  },
  {
    title: "Setup Development Environment",
    description: "Configure local development tools and dependencies",
    status: 'ready',
    tasks: [
      { id: '1', action: 'Checking Node.js version', status: 'pending' },
      { id: '2', action: 'Installing dependencies', status: 'pending' },
      { id: '3', action: 'Configuring environment variables', status: 'pending' },
      { id: '4', action: 'Setting up database connection', status: 'pending' },
      { id: '5', action: 'Running initial migrations', status: 'pending' },
      { id: '6', action: 'Verifying setup complete', status: 'pending' },
    ],
  },
  {
    title: "Generate Documentation",
    description: "Create documentation from code comments and structure",
    status: 'ready',
    tasks: [
      { id: '1', action: 'Parsing source files', status: 'pending' },
      { id: '2', action: 'Extracting JSDoc comments', status: 'pending' },
      { id: '3', action: 'Building component tree', status: 'pending' },
      { id: '4', action: 'Generating markdown files', status: 'pending' },
    ],
  },
];

export default function AutomationDashboard() {
  const {
    isEnabled,
    hasConsent,
    agentStatus,
    currentPlan,
    executionHistory,
    enableAutomation,
    disableAutomation,
    setPlan,
    executePlan,
    stopExecution,
    clearHistory,
  } = useAutomation();

  const [showOnboarding, setShowOnboarding] = useState(!hasConsent);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    if (!hasConsent) {
      setShowOnboarding(true);
    }
  }, [hasConsent]);

  const handleToggleAutomation = (enabled: boolean) => {
    if (enabled) {
      enableAutomation();
      toast.success("Automation mode enabled");
    } else {
      disableAutomation();
      toast.info("Automation mode disabled");
    }
  };

  const handleSelectPlan = (plan: typeof samplePlans[0]) => {
    const newPlan: AutomationPlan = {
      ...plan,
      id: Date.now().toString(),
      createdAt: new Date(),
      tasks: plan.tasks.map(t => ({ ...t, status: 'pending' as const })),
    };
    setPlan(newPlan);
  };

  const handleStartExecution = () => {
    if (!isEnabled) {
      toast.error("Enable automation mode first");
      return;
    }
    executePlan();
    toast.success("Execution started");
  };

  const handleStopExecution = () => {
    stopExecution();
    toast.info("Execution stopped");
  };

  const isExecuting = currentPlan?.status === 'executing';

  return (
    <div className="min-h-screen bg-background">
      <WelcomeOnboarding open={showOnboarding} onOpenChange={setShowOnboarding} />
      
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/" className="flex items-center gap-2 text-gray-500 hover:text-gray-700 transition-colors">
                <ChevronLeft className="w-4 h-4" />
                <span className="text-sm">Back</span>
              </Link>
              <div className="w-px h-6 bg-gray-200" />
              <NovaLogoSvg className="h-8 w-auto" />
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3 bg-gray-50 rounded-full px-4 py-2">
                <span className="text-sm text-gray-600">Automation</span>
                <Switch
                  checked={isEnabled}
                  onCheckedChange={handleToggleAutomation}
                  disabled={!hasConsent}
                  className="data-[state=checked]:bg-nova-pink"
                />
              </div>
              
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowHistory(!showHistory)}
                className="relative"
              >
                <History className="w-5 h-5" />
                {executionHistory.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-nova-pink text-white text-[10px] rounded-full flex items-center justify-center">
                    {executionHistory.length}
                  </span>
                )}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Automation Dashboard</h1>
              <p className="text-gray-500">Select a plan and watch the local agent execute it in real-time.</p>
            </div>

            {!currentPlan ? (
              <div className="space-y-4">
                <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Available Plans</h2>
                <div className="grid gap-4">
                  {samplePlans.map((plan, index) => (
                    <motion.button
                      key={index}
                      onClick={() => handleSelectPlan(plan)}
                      className="w-full text-left bg-white rounded-2xl border border-gray-200 p-5 hover:border-nova-pink/50 hover:shadow-md transition-all group"
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-gray-900 group-hover:text-nova-pink transition-colors">
                            {plan.title}
                          </h3>
                          <p className="text-sm text-gray-500 mt-1">{plan.description}</p>
                          <div className="flex items-center gap-2 mt-3">
                            <span className="px-2 py-1 bg-gray-100 rounded-full text-xs text-gray-600">
                              {plan.tasks.length} steps
                            </span>
                          </div>
                        </div>
                        <Sparkles className="w-5 h-5 text-gray-300 group-hover:text-nova-pink transition-colors" />
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">{currentPlan.title}</h2>
                    <p className="text-sm text-gray-500">{currentPlan.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {!isExecuting && currentPlan.status !== 'completed' && (
                      <Button
                        variant="ghost"
                        onClick={() => setPlan(null)}
                        className="text-gray-500"
                      >
                        Cancel
                      </Button>
                    )}
                    {isExecuting ? (
                      <Button
                        onClick={handleStopExecution}
                        className="bg-red-500 hover:bg-red-600 text-white rounded-full px-6"
                      >
                        <Square className="w-4 h-4 mr-2 fill-current" />
                        Stop
                      </Button>
                    ) : currentPlan.status !== 'completed' ? (
                      <Button
                        onClick={handleStartExecution}
                        disabled={!isEnabled}
                        className="bg-gradient-to-r from-nova-pink to-nova-coral hover:opacity-90 text-white rounded-full px-6 disabled:opacity-50"
                      >
                        <Play className="w-4 h-4 mr-2 fill-current" />
                        Run Plan
                      </Button>
                    ) : (
                      <Button
                        onClick={() => setPlan(null)}
                        className="bg-black hover:bg-gray-800 text-white rounded-full px-6"
                      >
                        New Plan
                      </Button>
                    )}
                  </div>
                </div>

                <TaskChecklist tasks={currentPlan.tasks} />
              </div>
            )}
          </div>

          <div className="space-y-6">
            <AgentStatusCard status={agentStatus} isEnabled={isEnabled} />

            <AnimatePresence>
              {showHistory && executionHistory.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden"
                >
                  <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900 text-sm">Execution History</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearHistory}
                      className="text-gray-400 hover:text-red-500 h-8 px-2"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="divide-y divide-gray-50 max-h-80 overflow-y-auto">
                    {executionHistory.map((log) => (
                      <div key={log.id} className="px-5 py-3 flex items-center gap-3">
                        {log.status === 'completed' && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                        {log.status === 'failed' && <XCircle className="w-4 h-4 text-red-500" />}
                        {log.status === 'cancelled' && <AlertTriangle className="w-4 h-4 text-amber-500" />}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-700 truncate">{log.planTitle}</p>
                          <p className="text-xs text-gray-400">
                            {log.tasksCompleted}/{log.totalTasks} tasks • {new Date(log.executedAt).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {!isEnabled && hasConsent && (
              <div className="bg-amber-50 rounded-2xl p-4 border border-amber-100">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-amber-800">Automation is off</p>
                    <p className="text-xs text-amber-600 mt-0.5">
                      Enable automation mode to run plans
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
